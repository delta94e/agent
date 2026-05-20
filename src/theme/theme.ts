'use client';

import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00f5ff',
      contrastText: '#0a0a0f',
    },
    secondary: {
      main: '#8b5cf6',
    },
    error: {
      main: '#ff006e',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#0a0a0f',
      paper: '#1a1a2e',
    },
    text: {
      primary: '#e2e8f0',
      secondary: '#94a3b8',
      disabled: '#475569',
    },
    divider: 'rgba(0, 245, 255, 0.12)',
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: { fontFamily: "'Orbitron', sans-serif", fontWeight: 900 },
    h2: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Orbitron', sans-serif", fontWeight: 700 },
    h4: { fontFamily: "'Orbitron', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Orbitron', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Orbitron', sans-serif", fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 10,
          letterSpacing: '0.5px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 245, 255, 0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            '&:hover fieldset': {
              borderColor: 'rgba(0, 245, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00f5ff',
              boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1a1a2e',
          border: '1px solid rgba(0, 245, 255, 0.2)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
        },
      },
    },
  },
});
