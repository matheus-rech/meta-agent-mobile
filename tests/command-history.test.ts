/**
 * Tests for Command History Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandHistoryService } from '../lib/history/command-history';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('CommandHistoryService', () => {
  let service: CommandHistoryService;

  beforeEach(() => {
    vi.clearAllMocks();
    (AsyncStorage.getItem as any).mockResolvedValue(null);
    (AsyncStorage.setItem as any).mockResolvedValue(undefined);
    service = new CommandHistoryService();
  });

  describe('Initialization', () => {
    it('should initialize with empty history when no stored data', async () => {
      await service.initialize();
      expect(service.size).toBe(0);
      expect(service.getAll()).toEqual([]);
    });

    it('should load history from AsyncStorage', async () => {
      const storedHistory = [
        { command: 'test command', timestamp: Date.now() },
      ];
      (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(storedHistory));
      
      await service.initialize();
      
      expect(service.size).toBe(1);
      expect(service.getAll()[0].command).toBe('test command');
    });

    it('should handle corrupted storage gracefully', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue('invalid json');
      
      await service.initialize();
      
      expect(service.size).toBe(0);
    });
  });

  describe('Adding Commands', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should add a command to history', async () => {
      await service.addCommand('test command');
      
      expect(service.size).toBe(1);
      expect(service.getAll()[0].command).toBe('test command');
    });

    it('should add commands to the front (most recent first)', async () => {
      await service.addCommand('first');
      await service.addCommand('second');
      
      const history = service.getAll();
      expect(history[0].command).toBe('second');
      expect(history[1].command).toBe('first');
    });

    it('should not add empty commands', async () => {
      await service.addCommand('');
      await service.addCommand('   ');
      
      expect(service.size).toBe(0);
    });

    it('should deduplicate consecutive identical commands', async () => {
      await service.addCommand('same command');
      await service.addCommand('same command');
      
      expect(service.size).toBe(1);
    });

    it('should allow same command after different command', async () => {
      await service.addCommand('first');
      await service.addCommand('second');
      await service.addCommand('first');
      
      expect(service.size).toBe(3);
    });

    it('should persist to AsyncStorage', async () => {
      await service.addCommand('test');
      
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should trim history to max size', async () => {
      // Add 105 commands
      for (let i = 0; i < 105; i++) {
        await service.addCommand(`command ${i}`);
      }
      
      expect(service.size).toBe(100);
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.addCommand('first');
      await service.addCommand('second');
      await service.addCommand('third');
    });

    it('should navigate to previous command', () => {
      const result = service.navigatePrevious('current input');
      
      expect(result).toBe('third'); // Most recent
    });

    it('should navigate through history sequentially', () => {
      service.navigatePrevious('');
      const result = service.navigatePrevious('');
      
      expect(result).toBe('second');
    });

    it('should return null at oldest command', () => {
      service.navigatePrevious('');
      service.navigatePrevious('');
      service.navigatePrevious('');
      const result = service.navigatePrevious('');
      
      expect(result).toBeNull();
    });

    it('should navigate forward to newer commands', () => {
      service.navigatePrevious('');
      service.navigatePrevious('');
      const result = service.navigateNext();
      
      expect(result).toBe('third');
    });

    it('should return pending command when navigating past newest', () => {
      service.navigatePrevious('my pending input');
      const result = service.navigateNext();
      
      expect(result).toBe('my pending input');
    });

    it('should reset navigation state', () => {
      service.navigatePrevious('');
      service.navigatePrevious('');
      service.resetNavigation();
      
      expect(service.isNavigating).toBe(false);
    });
  });

  describe('Search', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.addCommand('/help');
      await service.addCommand('/run meta-analysis');
      await service.addCommand('explain heterogeneity');
      await service.addCommand('/forest plot');
    });

    it('should search commands by query', () => {
      const results = service.search('meta');
      
      expect(results.length).toBe(1);
      expect(results[0].command).toBe('/run meta-analysis');
    });

    it('should be case insensitive', () => {
      const results = service.search('HELP');
      
      expect(results.length).toBe(1);
      expect(results[0].command).toBe('/help');
    });

    it('should limit search results', () => {
      const results = service.search('/', 2);
      
      expect(results.length).toBe(2);
    });
  });

  describe('Recent Commands', () => {
    beforeEach(async () => {
      await service.initialize();
      for (let i = 1; i <= 25; i++) {
        await service.addCommand(`command ${i}`);
      }
    });

    it('should get recent commands with default limit', () => {
      const recent = service.getRecent();
      
      expect(recent.length).toBe(20);
      expect(recent[0].command).toBe('command 25');
    });

    it('should get recent commands with custom limit', () => {
      const recent = service.getRecent(5);
      
      expect(recent.length).toBe(5);
    });
  });

  describe('Clear History', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.addCommand('test');
    });

    it('should clear all history', async () => {
      await service.clearHistory();
      
      expect(service.size).toBe(0);
    });

    it('should persist cleared state', async () => {
      await service.clearHistory();
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@meta_agent/command_history',
        '[]'
      );
    });
  });

  describe('Subscriptions', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should notify subscribers on command add', async () => {
      const listener = vi.fn();
      service.subscribe(listener);
      
      await service.addCommand('test');
      
      expect(listener).toHaveBeenCalled();
    });

    it('should notify subscribers on navigation', async () => {
      // Need to add a command first so navigation has something to navigate to
      await service.addCommand('test command');
      const listener = vi.fn();
      service.subscribe(listener);
      
      service.navigatePrevious('');
      
      expect(listener).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', async () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);
      
      unsubscribe();
      await service.addCommand('test');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('State', () => {
    beforeEach(async () => {
      await service.initialize();
      await service.addCommand('test');
    });

    it('should return current state', () => {
      const state = service.getState();
      
      expect(state.entries.length).toBe(1);
      expect(state.currentIndex).toBe(-1);
    });

    it('should track navigation index in state', () => {
      service.navigatePrevious('');
      const state = service.getState();
      
      expect(state.currentIndex).toBe(0);
    });
  });
});
