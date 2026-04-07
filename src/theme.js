import { createTheme } from '@mui/material/styles';

// ── Brand primary: Blue ──
const BRAND = {
  main:      '#2563EB',
  light:     '#60A5FA',
  dark:      '#1D4ED8',
  contrastText: '#FFFFFF',
};

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  defaultColorScheme: 'light',
  colorSchemes: {
    light: {
      palette: {
        primary:    { ...BRAND },
        secondary:  { main: '#64748B', light: '#94A3B8', dark: '#475569' },
        background: { default: '#FFFFFF', paper: '#FFFFFF' },
        text:       { primary: '#111111', secondary: '#6B7280' },
        divider:    '#E5E7EB',
        error:      { main: '#DC2626' },
        warning:    { main: '#F59E0B' },
        info:       { main: '#3B82F6' },
        success:    { main: '#2563EB' },
      },
    },
    dark: {
      palette: {
        primary:    { main: '#60A5FA', light: '#93C5FD', dark: '#2563EB', contrastText: '#0D0D0D' },
        secondary:  { main: '#94A3B8', light: '#CBD5E1', dark: '#64748B' },
        background: { default: '#0D0D0D', paper: '#1A1A1A' },
        text:       { primary: '#FFFFFF', secondary: '#A1A1AA' },
        divider:    '#2E2E2E',
        error:      { main: '#F87171' },
        warning:    { main: '#FBBF24' },
        info:       { main: '#60A5FA' },
        success:    { main: '#60A5FA' },
      },
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*, *::before, *::after': {
          transition: 'background-color 200ms ease, border-color 200ms ease, color 120ms ease',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 24, padding: '8px 24px' },
        sizeSmall: { borderRadius: 20, padding: '4px 16px' },
        sizeLarge: { borderRadius: 28, padding: '12px 32px', fontSize: '1rem' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid', borderColor: 'var(--mui-palette-divider)' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--mui-palette-primary-main)',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, whiteSpace: 'nowrap' },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': { color: 'var(--mui-palette-primary-main)' },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--mui-palette-primary-main)' },
        },
      },
    },
  },
});

export default theme;
