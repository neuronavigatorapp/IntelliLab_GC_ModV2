import { createTheme, Theme } from '@mui/material/styles';

// 🚀 INTELLILAB GC - WORLD-CLASS ENTERPRISE THEME
// Designed to rival Agilent, Thermo Fisher, and other billion-dollar companies
// Color palette inspired by the premium IntelliLab GC logo
export const professionalTheme: Theme = createTheme({
  palette: {
    mode: 'dark', // Premium dark mode matching logo
    primary: {
      main: '#4A90E2',      // Logo blue gradient start
      dark: '#2C5282',      // Deep logo blue
      light: '#63B3ED',     // Light blue accent
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF8C42',      // Logo orange gradient
      dark: '#E07628',      // Deep orange
      light: '#FFB366',     // Light orange accent
      contrastText: '#ffffff',
    },
    background: {
      default: '#0F1419',   // Logo dark background
      paper: '#1A202C',     // Elevated surface color
    },
    text: {
      primary: '#FFFFFF',   // Pure white text like logo
      secondary: '#A0AEC0', // Muted text
    },
    success: {
      main: '#48BB78',      // Professional green
      light: '#68D391',
      dark: '#38A169',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ED8936',      // Matches logo orange family
      light: '#F6AD55',
      dark: '#C05621',
    },
    error: {
      main: '#F56565',      // Professional red
      light: '#FC8181',
      dark: '#C53030',
    },
    info: {
      main: '#4299E1',      // Matches logo blue family
      light: '#63B3ED',
      dark: '#3182CE',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: 1.1,
      letterSpacing: '-0.04em',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#FFFFFF',
      marginBottom: '1rem',
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#FFFFFF',
      marginBottom: '0.75rem',
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#4A90E2',
      marginBottom: '0.5rem',
    },
    subtitle1: {
      fontSize: '1.125rem',
      fontWeight: 400,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 600,
      color: '#A0AEC0',
      textTransform: 'uppercase',
      letterSpacing: '1px',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#FFFFFF',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#A0AEC0',
    },
    button: {
      fontSize: '0.95rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.5px',
    },
    caption: {
      fontSize: '0.75rem',
      color: '#A0AEC0',
      letterSpacing: '0.5px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 2px 12px rgba(0,0,0,0.1)',
    '0 4px 20px rgba(0,0,0,0.15)',
    '0 2px 8px rgba(25, 118, 210, 0.3)',
    '0 4px 16px rgba(25, 118, 210, 0.4)',
    '0 1px 4px rgba(0,0,0,0.1)',
    '0 2px 8px rgba(0,0,0,0.12)',
    '0 4px 12px rgba(0,0,0,0.15)',
    '0 6px 16px rgba(0,0,0,0.18)',
    '0 8px 20px rgba(0,0,0,0.20)',
    '0 10px 24px rgba(0,0,0,0.22)',
    '0 12px 28px rgba(0,0,0,0.24)',
    '0 14px 32px rgba(0,0,0,0.26)',
    '0 16px 36px rgba(0,0,0,0.28)',
    '0 18px 40px rgba(0,0,0,0.30)',
    '0 20px 44px rgba(0,0,0,0.32)',
    '0 22px 48px rgba(0,0,0,0.34)',
    '0 24px 52px rgba(0,0,0,0.36)',
    '0 26px 56px rgba(0,0,0,0.38)',
    '0 28px 60px rgba(0,0,0,0.40)',
    '0 30px 64px rgba(0,0,0,0.42)',
    '0 32px 68px rgba(0,0,0,0.44)',
    '0 34px 72px rgba(0,0,0,0.46)',
    '0 36px 76px rgba(0,0,0,0.48)',
    '0 38px 80px rgba(0,0,0,0.50)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        body: {
          background: `
            linear-gradient(135deg, #0F1419 0%, #1A202C 25%, #2D3748 50%, #1A202C 75%, #0F1419 100%),
            radial-gradient(circle at 20% 20%, rgba(74, 144, 226, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 140, 66, 0.1) 0%, transparent 50%)
          `,
          minHeight: '100vh',
          fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", sans-serif',
          lineHeight: 1.6,
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `
              radial-gradient(circle at 30% 40%, rgba(74, 144, 226, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 70% 60%, rgba(255, 140, 66, 0.05) 0%, transparent 50%)
            `,
            zIndex: -1,
            animation: 'backgroundPulse 20s ease-in-out infinite alternate',
          },
        },
        '@keyframes backgroundPulse': {
          '0%': {
            opacity: 0.3,
          },
          '100%': {
            opacity: 0.7,
          },
        },
        '@keyframes shimmer': {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: '200px 0',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `
            linear-gradient(135deg, #0F1419 0%, #2D3748 50%, #0F1419 100%),
            linear-gradient(45deg, rgba(74, 144, 226, 0.1) 0%, rgba(255, 140, 66, 0.1) 100%)
          `,
          backdropFilter: 'blur(20px)',
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.3),
            0 0 0 1px rgba(74, 144, 226, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.1)
          `,
          position: 'relative',
          borderBottom: '1px solid rgba(74, 144, 226, 0.3)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(74, 144, 226, 0.1) 30%, 
                rgba(255, 140, 66, 0.1) 70%, 
                transparent 100%
              )
            `,
            animation: 'shimmer 3s ease-in-out infinite',
            zIndex: 1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #4A90E2 0%, #FF8C42 100%)',
            zIndex: 2,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          position: 'relative',
          zIndex: 2,
          padding: '1rem 2rem !important',
          minHeight: '80px !important',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          padding: '0.875rem 2.5rem',
          fontSize: '0.95rem',
          fontWeight: 600,
          letterSpacing: '0.5px',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: '160px',
          textTransform: 'none',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.6s ease',
          },
          '&:hover::before': {
            left: '100%',
          },
        },
        containedPrimary: {
          background: `
            linear-gradient(135deg, #4A90E2 0%, #63B3ED 100%),
            linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)
          `,
          boxShadow: `
            0 4px 20px rgba(74, 144, 226, 0.4),
            0 0 0 1px rgba(74, 144, 226, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2)
          `,
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: `
              0 8px 30px rgba(74, 144, 226, 0.5),
              0 0 0 1px rgba(74, 144, 226, 0.3),
              inset 0 1px 0 rgba(255,255,255,0.3)
            `,
            background: `
              linear-gradient(135deg, #63B3ED 0%, #4A90E2 100%),
              linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)
            `,
          },
          '&:active': {
            transform: 'translateY(-1px) scale(0.98)',
          },
        },
        containedSecondary: {
          background: `
            linear-gradient(135deg, #FF8C42 0%, #FFB366 100%),
            linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)
          `,
          boxShadow: `
            0 4px 20px rgba(255, 140, 66, 0.4),
            0 0 0 1px rgba(255, 140, 66, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2)
          `,
          '&:hover': {
            transform: 'translateY(-3px) scale(1.02)',
            boxShadow: `
              0 8px 30px rgba(255, 140, 66, 0.5),
              0 0 0 1px rgba(255, 140, 66, 0.3),
              inset 0 1px 0 rgba(255,255,255,0.3)
            `,
          },
        },
        outlined: {
          borderColor: 'rgba(74, 144, 226, 0.5)',
          borderWidth: '2px',
          color: '#4A90E2',
          background: 'rgba(74, 144, 226, 0.05)',
          backdropFilter: 'blur(10px)',
          '&:hover': {
            backgroundColor: 'rgba(74, 144, 226, 0.15)',
            borderColor: '#4A90E2',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(74, 144, 226, 0.3)',
          },
        },
        text: {
          color: '#4A90E2',
          '&:hover': {
            backgroundColor: 'rgba(74, 144, 226, 0.1)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          background: `
            linear-gradient(135deg, 
              rgba(26, 32, 44, 0.9) 0%, 
              rgba(45, 55, 72, 0.8) 50%, 
              rgba(26, 32, 44, 0.9) 100%
            )
          `,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(74, 144, 226, 0.2)',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(74, 144, 226, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #4A90E2 0%, #FF8C42 100%)',
            opacity: 0.7,
          },
          '&:hover': {
            transform: 'translateY(-4px) scale(1.01)',
            boxShadow: `
              0 16px 48px rgba(0, 0, 0, 0.4),
              0 0 0 1px rgba(74, 144, 226, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.2)
            `,
            '&::before': {
              opacity: 1,
            },
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '2rem',
          '&:last-child': {
            paddingBottom: '2rem',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            '& fieldset': {
              borderColor: '#e0e0e0',
              borderWidth: '2px',
            },
            '&:hover fieldset': {
              borderColor: '#1976d2',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1976d2',
              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
            },
          },
          '& .MuiInputLabel-root': {
            fontWeight: 500,
            color: '#333333',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e0e0e0',
            borderWidth: '2px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1976d2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1976d2',
            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          padding: '0.5rem 1rem',
        },
        colorSuccess: {
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          color: '#4caf50',
          border: '1px solid rgba(76, 175, 80, 0.3)',
        },
        colorWarning: {
          backgroundColor: 'rgba(255, 152, 0, 0.2)',
          color: '#ff9800',
          border: '1px solid rgba(255, 152, 0, 0.3)',
        },
        colorError: {
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          color: '#f44336',
          border: '1px solid rgba(244, 67, 54, 0.3)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          padding: '1rem',
          alignItems: 'center',
          marginBottom: '1rem',
        },
        standardSuccess: {
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          border: '1px solid #c8e6c9',
        },
        standardWarning: {
          backgroundColor: '#fff8e1',
          color: '#f57c00',
          border: '1px solid #ffecb3',
        },
        standardError: {
          backgroundColor: '#ffebee',
          color: '#c62828',
          border: '1px solid #ffcdd2',
        },
        standardInfo: {
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          border: '1px solid #bbdefb',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        },
        indicator: {
          height: '3px',
          backgroundColor: '#1976d2',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 500,
          textTransform: 'none',
          color: '#666666',
          padding: '1rem 1.5rem',
          minHeight: 'auto',
          '&:hover': {
            backgroundColor: '#f5f5f5',
            color: '#1976d2',
          },
          '&.Mui-selected': {
            color: '#1976d2',
            backgroundColor: '#f8f9ff',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: '1200px !important',
          padding: '2rem !important',
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          '&.form-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          },
          '&.results-grid': {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          },
        },
      },
    },
  },
});

// Professional status chip styles
export const statusChipStyles = {
  online: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.3)',
  },
  warning: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    color: '#ff9800',
    border: '1px solid rgba(255, 152, 0, 0.3)',
  },
  offline: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    color: '#f44336',
    border: '1px solid rgba(244, 67, 54, 0.3)',
  },
};

// Professional result value styles
export const resultValueStyles = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: '#1976d2',
  marginBottom: '0.5rem',
};

// Professional result label styles  
export const resultLabelStyles = {
  fontSize: '0.875rem',
  color: '#666666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

export default professionalTheme;
