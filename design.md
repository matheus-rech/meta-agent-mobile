# Meta Agent Mobile - Design Document

## Overview

A mobile CLI terminal-like agent SDK that brings the power of the NeuroResearch Agent pattern to mobile devices. The app features a command-line interface for interacting with AI agents, executing commands, and managing research workflows.

---

## Screen List

### 1. Terminal Screen (Main/Home)
The primary interface featuring a CLI-style terminal with:
- Command output display area (scrollable)
- Command input field at bottom
- Status bar showing connection state

### 2. History Screen
Browse and search through command history:
- List of previous commands with timestamps
- Quick re-execute functionality
- Search/filter capabilities

### 3. Settings Screen
Configure agent behavior and preferences:
- AI model selection
- Theme preferences (dark/light terminal)
- API connection settings
- Clear history option

---

## Primary Content and Functionality

### Terminal Screen
- **Output Area**: Monospace font display showing:
  - ASCII art banner on startup
  - User commands (prefixed with `>`)
  - Agent responses (with syntax highlighting for code)
  - Tool execution results
  - Error messages (red text)
  - Progress indicators (animated dots)
  
- **Input Area**: 
  - Single-line text input with monospace font
  - Send button (or keyboard submit)
  - Slash command autocomplete (`/help`, `/clear`, `/history`)

- **Status Bar**:
  - Connection indicator (green/red dot)
  - Current session info
  - Thinking indicator when agent is processing

### History Screen
- FlatList of command entries
- Each entry shows: command text, timestamp, truncated response
- Tap to view full details
- Long-press to copy or re-run

### Settings Screen
- Toggle switches for preferences
- Dropdown for model selection
- Buttons for actions (clear history, reset)

---

## Key User Flows

### Flow 1: Execute Command
1. User types command in input field
2. User taps send or presses Enter
3. Command appears in output with `>` prefix
4. "Thinking..." indicator shows
5. Agent response streams into output
6. Command saved to history

### Flow 2: Use Slash Command
1. User types `/` in input
2. Autocomplete suggestions appear
3. User selects command (e.g., `/help`)
4. Help text displays in output

### Flow 3: Re-run from History
1. User navigates to History tab
2. User taps on previous command
3. Command details modal appears
4. User taps "Run Again"
5. Returns to Terminal with command executed

### Flow 4: Chat with AI Agent
1. User types natural language query
2. Agent plans task decomposition
3. Agent executes steps (shown in output)
4. Final response displayed
5. User can follow up in context

---

## Color Choices

### Terminal Theme (Dark Mode Default)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Deep Black | `#0D1117` |
| Surface/Cards | Dark Gray | `#161B22` |
| Primary/Accent | Cyan | `#58A6FF` |
| Text (Primary) | Light Gray | `#C9D1D9` |
| Text (Muted) | Gray | `#8B949E` |
| Success | Green | `#3FB950` |
| Warning | Yellow | `#D29922` |
| Error | Red | `#F85149` |
| User Input | White | `#FFFFFF` |
| Code/Mono | Purple | `#A371F7` |

### Light Mode (Alternative)
| Element | Color | Hex |
|---------|-------|-----|
| Background | Off White | `#F6F8FA` |
| Surface/Cards | White | `#FFFFFF` |
| Primary/Accent | Blue | `#0969DA` |
| Text (Primary) | Dark Gray | `#24292F` |
| Text (Muted) | Gray | `#57606A` |

---

## Typography

- **Terminal Output**: `SF Mono` / `Menlo` / `Courier New` (monospace)
- **UI Elements**: System default (SF Pro on iOS)
- **Font Sizes**:
  - Terminal text: 14px
  - Command input: 16px
  - Headers: 18px
  - Status text: 12px

---

## Component Specifications

### Terminal Output Line
```
┌─────────────────────────────────────┐
│ > user command here                 │  ← Cyan prefix, white text
│                                     │
│ Agent response text appears here    │  ← Light gray text
│ with proper line wrapping and       │
│ support for multiple lines.         │
│                                     │
│ ```javascript                       │  ← Code block with
│ const x = 1;                        │    syntax highlighting
│ ```                                 │
└─────────────────────────────────────┘
```

### Command Input Bar
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────┐ ┌────┐ │
│ │ Type a command...       │ │ ➤  │ │  ← Input + Send button
│ └─────────────────────────┘ └────┘ │
└─────────────────────────────────────┘
```

### Status Bar
```
┌─────────────────────────────────────┐
│ ● Connected │ Session: abc123      │  ← Green dot = connected
└─────────────────────────────────────┘
```

---

## Interaction Patterns

### Haptic Feedback
- Command send: Light impact
- Error: Error notification
- Success (task complete): Success notification
- Tab switch: Selection changed

### Animations
- Output text: Fade in line by line (subtle)
- Thinking indicator: Pulsing dots
- Send button: Scale on press (0.95)

---

## Tab Bar Configuration

| Tab | Icon | Label |
|-----|------|-------|
| Terminal | `terminal` | Terminal |
| History | `clock` | History |
| Settings | `gear` | Settings |

---

## Accessibility

- VoiceOver labels for all interactive elements
- Minimum touch target: 44x44pt
- High contrast text (WCAG AA compliant)
- Keyboard navigation support on iPad

---

## Platform Considerations

### iOS
- Respect safe areas (notch, home indicator)
- Native keyboard handling with input accessory view
- Haptic feedback via expo-haptics

### Android
- Edge-to-edge display support
- Material-style ripple effects
- Back button handling for modals

### Web
- Responsive layout
- Keyboard shortcuts (Ctrl+Enter to send)
- Copy/paste support

---

## Data Persistence

- **Command History**: AsyncStorage (local)
- **Settings**: AsyncStorage (local)
- **Session State**: In-memory (React state)
- **AI Conversations**: Server-side via tRPC (for context continuity)
