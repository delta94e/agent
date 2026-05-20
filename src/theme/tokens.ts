// MAOP Design Tokens — JavaScript Constants
// Use these when CSS custom properties aren't available (e.g. Three.js materials)

export const tokens = {
  colors: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgElevated: '#1a1a2e',
    surface: '#16213e',

    accentCyan: '#00f5ff',
    accentMagenta: '#ff006e',
    accentViolet: '#8b5cf6',
    accentEmerald: '#10b981',
    accentAmber: '#f59e0b',
    accentBlue: '#3b82f6',

    textPrimary: '#e2e8f0',
    textSecondary: '#94a3b8',
    textMuted: '#475569',
  },

  fonts: {
    display: "'Orbitron', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },

  radius: {
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
  },
} as const;

// Three.js-ready hex values (0x prefix)
export const threeColors = {
  bgPrimary: 0x0a0a0f,
  accentCyan: 0x00f5ff,
  accentMagenta: 0xff006e,
  accentViolet: 0x8b5cf6,
  accentEmerald: 0x10b981,
  accentAmber: 0xf59e0b,
  surface: 0x16213e,
  elevated: 0x1a1a2e,
} as const;

// Agent status → color mapping
export const statusColors: Record<string, string> = {
  idle: tokens.colors.textMuted,
  processing: tokens.colors.accentCyan,
  active: tokens.colors.accentEmerald,
  error: tokens.colors.accentMagenta,
};
