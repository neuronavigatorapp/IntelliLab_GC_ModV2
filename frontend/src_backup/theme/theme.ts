import { createTheme } from '@mui/material/styles';

// CORRECTED IntelliLab GC logo colors (darker blues)
const logoColors = {
  darkBlue: '#1e3a8a',        // Much darker blue for column coil
  mediumBlue: '#1d4ed8',      // Darker medium blue
  lightBlue: '#3b82f6',       // Adjusted light blue
  teal: '#14b8a6',            // Teal for peaks
  orange: '#f59e0b',          // Orange for main peak
  darkBackground: '#1e293b',   // Dark background
  white: '#ffffff'
};

declare module '@mui/material/styles' {
  interface Palette {
    logo: {
      darkBlue: string;
      mediumBlue: string;
      lightBlue: string;
      teal: string;
      orange: string;
    };
  }

  interface PaletteOptions {
    logo?: {
      darkBlue: string;
      mediumBlue: string;
      lightBlue: string;
      teal: string;
      orange: string;
    };
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: logoColors.mediumBlue,    // #1d4ed8
      dark: logoColors.darkBlue,      // #1e3a8a  
      light: logoColors.lightBlue,    // #3b82f6
    },
    secondary: {
      main: logoColors.orange,        // #f59e0b
      dark: '#d97706',
      light: '#fbbf24',
    },
    success: {
      main: logoColors.teal,          // #14b8a6
    },
    background: {
      default: '#f8fafc',
      paper: logoColors.white,
    },
    logo: {
      darkBlue: logoColors.darkBlue,
      mediumBlue: logoColors.mediumBlue,
      lightBlue: logoColors.lightBlue,
      teal: logoColors.teal,
      orange: logoColors.orange,
    }
  },
  
  // Enhanced mobile breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      color: logoColors.darkBlue,
    },
    h2: {
      fontWeight: 600,
      color: logoColors.darkBlue,
    },
    h3: {
      fontWeight: 500,
      color: logoColors.mediumBlue,
    }
  },
  
  // Mobile-optimized components
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${logoColors.darkBlue} 0%, ${logoColors.mediumBlue} 100%)`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Touch-friendly height
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          // Larger text on mobile
          '@media (max-width:600px)': {
            fontSize: '1rem',
            minHeight: 52,
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${logoColors.mediumBlue} 0%, ${logoColors.lightBlue} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${logoColors.darkBlue} 0%, ${logoColors.mediumBlue} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(30, 58, 138, 0.1)',
          // Better mobile spacing
          '@media (max-width:600px)': {
            margin: 8,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        thumb: {
          width: 28, // Larger thumb for mobile
          height: 28,
          '@media (max-width:600px)': {
            width: 32,
            height: 32,
          },
        },
        track: {
          height: 6, // Thicker track for mobile
          '@media (max-width:600px)': {
            height: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          // Larger chips on mobile
          '@media (max-width:600px)': {
            fontSize: '0.875rem',
            height: 32,
          },
        },
        colorSuccess: {
          backgroundColor: logoColors.teal,
          color: 'white',
        },
        colorPrimary: {
          backgroundColor: logoColors.mediumBlue,
          color: 'white',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardInfo: {
          backgroundColor: `rgba(29, 78, 216, 0.1)`,
          color: logoColors.darkBlue,
          '& .MuiAlert-icon': {
            color: logoColors.mediumBlue,
          },
        },
        standardSuccess: {
          backgroundColor: `rgba(20, 184, 166, 0.1)`,
          color: logoColors.darkBlue,
          '& .MuiAlert-icon': {
            color: logoColors.teal,
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          // Better mobile form controls
          '@media (max-width:600px)': {
            marginBottom: 16,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          // Larger select on mobile
          '@media (max-width:600px)': {
            fontSize: '1rem',
            minHeight: 48,
          },
        },
      },
    },
  },
});
