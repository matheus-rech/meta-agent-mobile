/** @type {const} */
const themeColors = {
  // Core TUI colors - Black background with Glass blue accents
  primary: { light: '#00BFFF', dark: '#00BFFF' },      // Glass blue (cyan)
  background: { light: '#000000', dark: '#000000' },   // Pure black
  surface: { light: '#0A0A0A', dark: '#0A0A0A' },      // Slightly lighter black
  foreground: { light: '#00BFFF', dark: '#00BFFF' },   // Glass blue text
  muted: { light: '#006080', dark: '#006080' },        // Darker glass blue
  border: { light: '#00BFFF', dark: '#00BFFF' },       // Glass blue borders
  
  // Status colors
  success: { light: '#00FF7F', dark: '#00FF7F' },      // Bright green
  warning: { light: '#FFD700', dark: '#FFD700' },      // Gold
  error: { light: '#FF4444', dark: '#FF4444' },        // Bright red
  
  // Terminal-specific colors
  terminal: { light: '#000000', dark: '#000000' },     // Black terminal bg
  code: { light: '#00FFFF', dark: '#00FFFF' },         // Cyan code
  input: { light: '#FFFFFF', dark: '#FFFFFF' },        // White input text
  prompt: { light: '#00BFFF', dark: '#00BFFF' },       // Glass blue prompt
  
  // Glass fox mascot colors
  foxOrange: { light: '#FF8C00', dark: '#FF8C00' },    // Fox fur orange
  foxLight: { light: '#FFB347', dark: '#FFB347' },     // Light fox fur
  foxDark: { light: '#CC5500', dark: '#CC5500' },      // Dark fox fur
  foxNose: { light: '#1A1A1A', dark: '#1A1A1A' },      // Fox nose black
  foxEyes: { light: '#00BFFF', dark: '#00BFFF' },      // Glass blue eyes
  
  // ASCII art colors
  asciiBlue: { light: '#00BFFF', dark: '#00BFFF' },    // Primary ASCII color
  asciiGlow: { light: '#40E0D0', dark: '#40E0D0' },    // Glowing effect
  asciiDim: { light: '#004060', dark: '#004060' },     // Dimmed ASCII
};

module.exports = { themeColors };
