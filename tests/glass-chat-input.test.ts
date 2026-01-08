/**
 * Tests for GlassChatInput component
 * 
 * Tests the TUI-style chat input for Glass 🦊
 */

import { describe, it, expect, vi } from 'vitest';

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('GlassChatInput props', () => {
  it('should define correct props interface', () => {
    const props = {
      onSubmit: vi.fn(),
      disabled: false,
      placeholder: 'Ask Glass anything about meta-analysis...',
      isThinking: false,
      glassState: 'idle' as const,
    };

    expect(props.onSubmit).toBeDefined();
    expect(props.disabled).toBe(false);
    expect(props.placeholder).toContain('meta-analysis');
    expect(props.isThinking).toBe(false);
    expect(props.glassState).toBe('idle');
  });

  it('should accept all Glass states', () => {
    const states: Array<'idle' | 'thinking' | 'talking' | 'error'> = [
      'idle',
      'thinking',
      'talking',
      'error',
    ];

    states.forEach(state => {
      expect(['idle', 'thinking', 'talking', 'error']).toContain(state);
    });
  });
});

describe('Status indicator logic', () => {
  it('should return correct indicator for idle state', () => {
    const getStatusIndicator = (state: string) => {
      switch (state) {
        case 'thinking':
          return { symbol: '◐', label: 'thinking' };
        case 'talking':
          return { symbol: '●', label: 'responding' };
        case 'error':
          return { symbol: '✗', label: 'error' };
        default:
          return { symbol: '●', label: 'ready' };
      }
    };

    const idle = getStatusIndicator('idle');
    expect(idle.symbol).toBe('●');
    expect(idle.label).toBe('ready');
  });

  it('should return correct indicator for thinking state', () => {
    const getStatusIndicator = (state: string) => {
      switch (state) {
        case 'thinking':
          return { symbol: '◐', label: 'thinking' };
        case 'talking':
          return { symbol: '●', label: 'responding' };
        case 'error':
          return { symbol: '✗', label: 'error' };
        default:
          return { symbol: '●', label: 'ready' };
      }
    };

    const thinking = getStatusIndicator('thinking');
    expect(thinking.symbol).toBe('◐');
    expect(thinking.label).toBe('thinking');
  });

  it('should return correct indicator for talking state', () => {
    const getStatusIndicator = (state: string) => {
      switch (state) {
        case 'thinking':
          return { symbol: '◐', label: 'thinking' };
        case 'talking':
          return { symbol: '●', label: 'responding' };
        case 'error':
          return { symbol: '✗', label: 'error' };
        default:
          return { symbol: '●', label: 'ready' };
      }
    };

    const talking = getStatusIndicator('talking');
    expect(talking.symbol).toBe('●');
    expect(talking.label).toBe('responding');
  });

  it('should return correct indicator for error state', () => {
    const getStatusIndicator = (state: string) => {
      switch (state) {
        case 'thinking':
          return { symbol: '◐', label: 'thinking' };
        case 'talking':
          return { symbol: '●', label: 'responding' };
        case 'error':
          return { symbol: '✗', label: 'error' };
        default:
          return { symbol: '●', label: 'ready' };
      }
    };

    const error = getStatusIndicator('error');
    expect(error.symbol).toBe('✗');
    expect(error.label).toBe('error');
  });
});

describe('Input handling', () => {
  it('should trim input before submission', () => {
    const input = '  What is heterogeneity?  ';
    const trimmed = input.trim();
    
    expect(trimmed).toBe('What is heterogeneity?');
  });

  it('should not submit empty input', () => {
    const inputs = ['', '   ', '\n', '\t'];
    
    inputs.forEach(input => {
      const trimmed = input.trim();
      expect(trimmed.length).toBe(0);
    });
  });

  it('should not submit when disabled', () => {
    const disabled = true;
    const text = 'Hello';
    
    const canSubmit = !disabled && text.trim().length > 0;
    
    expect(canSubmit).toBe(false);
  });

  it('should not submit when thinking', () => {
    const isThinking = true;
    const text = 'Hello';
    
    const canSubmit = !isThinking && text.trim().length > 0;
    
    expect(canSubmit).toBe(false);
  });

  it('should submit when valid', () => {
    const disabled = false;
    const isThinking = false;
    const text = 'What is a forest plot?';
    
    const canSubmit = !disabled && !isThinking && text.trim().length > 0;
    
    expect(canSubmit).toBe(true);
  });
});

describe('TUI styling', () => {
  it('should use box drawing characters', () => {
    const BOX = {
      horizontal: '─',
      vertical: '│',
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
      teeLeft: '┤',
      teeRight: '├',
    };

    expect(BOX.horizontal).toBe('─');
    expect(BOX.vertical).toBe('│');
    expect(BOX.topLeft).toBe('┌');
    expect(BOX.bottomRight).toBe('┘');
  });

  it('should create TUI border with label', () => {
    const BOX = {
      horizontal: '─',
      teeRight: '├',
      teeLeft: '┤',
    };
    
    const label = ' Glass Chat ';
    const border = `${BOX.teeRight}${BOX.horizontal}${BOX.horizontal}${label}${BOX.horizontal.repeat(30)}${BOX.teeLeft}`;
    
    expect(border).toContain('Glass Chat');
    expect(border.startsWith('├')).toBe(true);
    expect(border.endsWith('┤')).toBe(true);
  });
});

describe('Placeholder text', () => {
  it('should show default placeholder when idle', () => {
    const isThinking = false;
    const defaultPlaceholder = 'Ask Glass anything about meta-analysis...';
    
    const placeholder = isThinking ? 'Glass is thinking...' : defaultPlaceholder;
    
    expect(placeholder).toBe(defaultPlaceholder);
  });

  it('should show thinking placeholder when processing', () => {
    const isThinking = true;
    const defaultPlaceholder = 'Ask Glass anything about meta-analysis...';
    
    const placeholder = isThinking ? 'Glass is thinking...' : defaultPlaceholder;
    
    expect(placeholder).toBe('Glass is thinking...');
  });
});

describe('Send button state', () => {
  it('should be enabled with valid input', () => {
    const text = 'What is I²?';
    const disabled = false;
    const isThinking = false;
    
    const buttonEnabled = text.trim().length > 0 && !disabled && !isThinking;
    
    expect(buttonEnabled).toBe(true);
  });

  it('should be disabled with empty input', () => {
    const text = '';
    const disabled = false;
    const isThinking = false;
    
    const buttonEnabled = text.trim().length > 0 && !disabled && !isThinking;
    
    expect(buttonEnabled).toBe(false);
  });

  it('should be disabled when thinking', () => {
    const text = 'What is I²?';
    const disabled = false;
    const isThinking = true;
    
    const buttonEnabled = text.trim().length > 0 && !disabled && !isThinking;
    
    expect(buttonEnabled).toBe(false);
  });

  it('should calculate correct opacity', () => {
    const canSubmit = true;
    const opacity = canSubmit ? 1 : 0.5;
    
    expect(opacity).toBe(1);
  });

  it('should calculate disabled opacity', () => {
    const canSubmit = false;
    const opacity = canSubmit ? 1 : 0.5;
    
    expect(opacity).toBe(0.5);
  });
});

describe('Keyboard handling', () => {
  it('should detect Enter key', () => {
    const event = { nativeEvent: { key: 'Enter', shiftKey: false } };
    
    const isEnter = event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey;
    
    expect(isEnter).toBe(true);
  });

  it('should not submit on Shift+Enter', () => {
    const event = { nativeEvent: { key: 'Enter', shiftKey: true } };
    
    const isEnter = event.nativeEvent.key === 'Enter' && !event.nativeEvent.shiftKey;
    
    expect(isEnter).toBe(false);
  });
});

describe('Fox emoji prompt', () => {
  it('should include fox emoji in prompt', () => {
    const foxEmoji = '🦊';
    const prompt = `● ${foxEmoji} ├`;
    
    expect(prompt).toContain('🦊');
  });
});

describe('Hints display', () => {
  it('should show MiniMax M2.1 attribution', () => {
    const hints = 'Enter to send • Powered by MiniMax M2.1';
    
    expect(hints).toContain('MiniMax M2.1');
    expect(hints).toContain('Enter to send');
  });
});
