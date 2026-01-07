/**
 * Vitest Setup File
 * 
 * Defines globals needed for Expo/React Native testing
 */

// Define __DEV__ global for expo-modules-core
(globalThis as any).__DEV__ = false;

import { vi } from 'vitest';

// Mock expo-modules-core to avoid native module issues
vi.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  EventEmitter: vi.fn(),
  Platform: { OS: 'ios' },
  requireNativeModule: vi.fn(() => ({})),
  requireOptionalNativeModule: vi.fn(() => null),
}));

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

// Mock expo-device
vi.mock('expo-device', () => ({
  totalMemory: 8 * 1024 * 1024 * 1024, // 8GB
  modelName: 'iPhone 15 Pro',
  osName: 'iOS',
  osVersion: '17.0',
  deviceYearClass: 2023,
}));
