export const themeColors: {
  primary: { light: string; dark: string };
  background: { light: string; dark: string };
  surface: { light: string; dark: string };
  foreground: { light: string; dark: string };
  muted: { light: string; dark: string };
  border: { light: string; dark: string };
  success: { light: string; dark: string };
  warning: { light: string; dark: string };
  error: { light: string; dark: string };
  terminal: { light: string; dark: string };
  code: { light: string; dark: string };
  input: { light: string; dark: string };
  prompt: { light: string; dark: string };
  // Glass fox mascot colors
  foxOrange: { light: string; dark: string };
  foxLight: { light: string; dark: string };
  foxDark: { light: string; dark: string };
  foxNose: { light: string; dark: string };
  foxEyes: { light: string; dark: string };
  // ASCII art colors
  asciiBlue: { light: string; dark: string };
  asciiGlow: { light: string; dark: string };
  asciiDim: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;
