import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0A66C2', // LinkedIn's professional blue
      light: '#378FE9', // Lighter LinkedIn blue
      dark: '#004182', // Darker LinkedIn blue
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1DA1F2', // Twitter blue for accent
      light: '#71C9F8',
      dark: '#0D8ECF',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D92D20',
    },
    warning: {
      main: '#FDB022',
    },
    info: {
      main: '#1570EF',
    },
    success: {
      main: '#12B76A',
    },
    background: {
      default: '#F9FAFB', // Very light gray
      paper: '#FFFFFF',
    },
    text: {
      primary: '#101828', // Dark gray for high contrast
      secondary: '#475467',
      disabled: '#D0D5DD',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#0A66C2',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#0A66C2',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0A66C2',
          color: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(16, 24, 40, 0.1)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #0A66C2 0%, #378FE9 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #004182 0%, #0A66C2 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#EAECF0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0A66C2',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
            borderColor: '#0A66C2',
          },
        },
        input: {
          padding: '12px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#0A66C2',
            fontWeight: 600,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#0A66C2',
          fontWeight: 600,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: '#004182',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #EAECF0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderColor: '#D0D5DD',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#EAECF0',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#378FE9', // Lighter LinkedIn blue for dark mode
      light: '#6AB3F7',
      dark: '#0A66C2',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#71C9F8', // Lighter Twitter blue
      light: '#A6DCFA',
      dark: '#1DA1F2',
      contrastText: '#0F172A',
    },
    error: {
      main: '#F97066',
    },
    warning: {
      main: '#FDB022',
    },
    info: {
      main: '#53B1FD',
    },
    success: {
      main: '#32D583',
    },
    background: {
      default: '#0F172A', // Deep navy blue
      paper: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
      disabled: '#64748B',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      color: '#378FE9',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
      color: '#378FE9',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          color: '#FFFFFF',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        contained: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #378FE9 0%, #6AB3F7 100%)',
          '&:hover': {
            background: 'linear-gradient(90deg, #0A66C2 0%, #378FE9 100%)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#334155',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#378FE9',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1.5px',
            borderColor: '#378FE9',
          },
        },
        input: {
          padding: '12px 14px',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: '#378FE9',
            fontWeight: 600,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#6AB3F7',
          fontWeight: 600,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: '#378FE9',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#1E293B',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
          border: '1px solid #334155',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            borderColor: '#475569',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: '#334155',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E293B',
          backgroundImage: 'none',
        },
      },
    },
  },
});