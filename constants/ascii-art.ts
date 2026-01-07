/**
 * ASCII Art for Glass Agent branding
 * TUI-inspired design elements throughout the app
 * 
 * Glass 🦊 - Named after Gene Glass, who coined "meta-analysis" in 1976
 * Inspired by Zenko (善狐), the benevolent fox from Japanese mythology
 */

// Main Glass logo - large version for splash/home
export const GLASS_LOGO_LARGE = `
 ██████╗ ██╗      █████╗ ███████╗███████╗
██╔════╝ ██║     ██╔══██╗██╔════╝██╔════╝
██║  ███╗██║     ███████║███████╗███████╗
██║   ██║██║     ██╔══██║╚════██║╚════██║
╚██████╔╝███████╗██║  ██║███████║███████║
 ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝`;

// Compact Glass logo for headers
export const GLASS_LOGO_COMPACT = `
╔═╗╦  ╔═╗╔═╗╔═╗
║ ╦║  ╠═╣╚═╗╚═╗
╚═╝╩═╝╩ ╩╚═╝╚═╝`;

// Minimal Glass logo for small spaces
export const GLASS_LOGO_MINI = `[GLASS]`;

// Fox mascot ASCII art - cute raposa 🦊
export const GLASS_FOX_AVATAR = `
     /\\___/\\
    (  o o  )
    (  =^=  )
     (  🦊  )
      \\___/`;

// Simplified fox for inline use
export const GLASS_FOX_SMALL = `
   /\\   /\\
  (  o.o  )
   > ^ <`;

// Agent avatar ASCII art - fox face
export const GLASS_AGENT_AVATAR = `
    ╭─────────╮
    │ /\\   /\\ │
    │(  o.o  )│
    │  > ^ <  │
    ╰─────────╯`;

// Welcome banner for onboarding
export const WELCOME_BANNER = `
╔══════════════════════════════════════╗
║                                      ║
║   Welcome to Glass 🦊                ║
║   Your meta-analysis learning guide  ║
║                                      ║
╚══════════════════════════════════════╝`;

// Terminal-style decorators
export const TERMINAL_HEADER = `┌──────────────────────────────────────┐`;
export const TERMINAL_FOOTER = `└──────────────────────────────────────┘`;
export const TERMINAL_DIVIDER = `├──────────────────────────────────────┤`;

// Progress indicators
export const PROGRESS_EMPTY = `░`;
export const PROGRESS_FILLED = `█`;
export const PROGRESS_PARTIAL = `▓`;

// Status indicators
export const STATUS_SUCCESS = `[✓]`;
export const STATUS_ERROR = `[✗]`;
export const STATUS_PENDING = `[○]`;
export const STATUS_ACTIVE = `[●]`;

// Box drawing characters for TUI elements
export const BOX = {
  topLeft: '╭',
  topRight: '╮',
  bottomLeft: '╰',
  bottomRight: '╯',
  horizontal: '─',
  vertical: '│',
  cross: '┼',
  teeRight: '├',
  teeLeft: '┤',
  teeDown: '┬',
  teeUp: '┴',
};

// Double-line box for emphasis
export const BOX_DOUBLE = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
};

// Arrows and pointers
export const ARROWS = {
  right: '→',
  left: '←',
  up: '↑',
  down: '↓',
  pointer: '▶',
  bullet: '•',
};

// Glass Agent personality phrases - multilingual
export const GLASS_GREETINGS = [
  "Olá! Sou a Glass 🦊, sua guia de meta-análise.",
  "Bem-vindo! Estou aqui para ajudar você a dominar a síntese de evidências.",
  "Oi! Pronta para aprender meta-análise de forma interativa?",
  "Hello! I'm Glass 🦊, your evidence synthesis companion.",
  "¡Hola! Soy Glass 🦊, tu guía de meta-análisis.",
];

export const GLASS_ENCOURAGEMENTS = [
  "Excelente progresso! Continue assim. 🦊",
  "Você está no caminho certo!",
  "Ótima pergunta! Vamos explorar isso juntos.",
  "Great work! You're making real progress. 🦊",
  "¡Buen trabajo! Estás progresando mucho.",
];

export const GLASS_SOCRATIC = [
  "O que você acha que aconteceria se...?",
  "Por que você acha que isso é importante?",
  "Como você explicaria isso para um colega?",
  "What do you think would happen if...?",
  "Why do you think this matters?",
];

// Skill badges ASCII
export const SKILL_BADGES = {
  beginner: `[★☆☆]`,
  intermediate: `[★★☆]`,
  advanced: `[★★★]`,
  master: `[★★★+]`,
};

// Module completion ASCII
export const MODULE_COMPLETE = `
╔═══════════════════════════════════╗
║     🦊 MODULE COMPLETE 🦊         ║
╚═══════════════════════════════════╝`;

// Certificate ASCII frame
export const CERTIFICATE_FRAME = `
╔════════════════════════════════════════════════════════╗
║                                                        ║
║              CERTIFICATE OF COMPLETION                 ║
║                       🦊                               ║
║  ────────────────────────────────────────────────────  ║
║                                                        ║
║                    This certifies that                 ║
║                                                        ║
║                      {{NAME}}                          ║
║                                                        ║
║         has successfully completed the course          ║
║                                                        ║
║              META-ANALYSIS FUNDAMENTALS                ║
║                                                        ║
║                    with Glass 🦊                       ║
║  ────────────────────────────────────────────────────  ║
║                                                        ║
║                    {{DATE}}                            ║
║                                                        ║
╚════════════════════════════════════════════════════════╝`;

// Helper function to create a progress bar
export function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round(progress * width);
  const empty = width - filled;
  return `[${PROGRESS_FILLED.repeat(filled)}${PROGRESS_EMPTY.repeat(empty)}] ${Math.round(progress * 100)}%`;
}

// Helper function to create a boxed message
export function createBox(message: string, style: 'single' | 'double' = 'single'): string {
  const box = style === 'double' ? BOX_DOUBLE : BOX;
  const lines = message.split('\n');
  const maxLength = Math.max(...lines.map(l => l.length));
  
  const top = box.topLeft + box.horizontal.repeat(maxLength + 2) + box.topRight;
  const bottom = box.bottomLeft + box.horizontal.repeat(maxLength + 2) + box.bottomRight;
  const content = lines.map(line => 
    box.vertical + ' ' + line.padEnd(maxLength) + ' ' + box.vertical
  ).join('\n');
  
  return `${top}\n${content}\n${bottom}`;
}

// Helper to format Glass's speech
export function glassSays(message: string): string {
  return `🦊 ${message}`;
}

// Legacy exports for backward compatibility
export const META_LOGO_LARGE = GLASS_LOGO_LARGE;
export const META_LOGO_COMPACT = GLASS_LOGO_COMPACT;
export const META_LOGO_MINI = GLASS_LOGO_MINI;
export const META_AGENT_AVATAR = GLASS_AGENT_AVATAR;
export const META_GREETINGS = GLASS_GREETINGS;
export const META_ENCOURAGEMENTS = GLASS_ENCOURAGEMENTS;
export const metaSays = glassSays;


// Fox animation frames for GlassMascot component
export const ASCII_FOX = `
   /\\   /\\
  (  o.o  )
   > ^ <`;

export const ASCII_FOX_BLINK = `
   /\\   /\\
  (  -.-  )
   > ^ <`;

export const ASCII_FOX_TALK = `
   /\\   /\\
  (  o.o  )
   > o <`;

export const ASCII_FOX_HAPPY = `
   /\\   /\\
  (  ^.^  )
   > w <`;

export const ASCII_FOX_THINK = `
   /\\   /\\
  (  o.o  ) ?
   > ~ <`;

export const ASCII_FOX_SLEEP = `
   /\\   /\\
  (  -.-  ) z
   > ~ <  Z`;
