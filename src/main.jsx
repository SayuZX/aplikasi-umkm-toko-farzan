import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import '@fontsource/inter/300.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/plus-jakarta-sans/200.css'
import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import '@fontsource/plus-jakarta-sans/800.css'
import './index.css'
import App from './App.jsx'
import theme from './theme'
import { connectSocket } from './services/socket'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'

// Auto-connect socket if already authenticated
if (useAuthStore.getState().token) {
  connectSocket();
}

// Sync server URL to Electron main process on startup
const storedUrl = useAuthStore.getState().serverUrl;
if (storedUrl && window.electronAPI?.setServerUrl) {
  window.electronAPI.setServerUrl(storedUrl);
}

// Apply theme mode class to document
const applyThemeClass = () => {
  const mode = useThemeStore.getState().mode;
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(mode);
};
applyThemeClass();
useThemeStore.subscribe(applyThemeClass);

createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
)
