import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useThemeStore } from '../store/themeStore';

const BREAKPOINT = 1024;

export default function MobileBlocker({ children }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < BREAKPOINT);
  const { mode, toggleMode } = useThemeStore();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isMobile) return children;

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'var(--bg-primary)',
      px: 3,
      position: 'relative',
    }}>
      <IconButton
        onClick={toggleMode}
        size="small"
        sx={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }}
      >
        {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      </IconButton>

      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        {/* Icon cluster */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 4 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            bgcolor: 'var(--bg-active)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PhoneAndroidIcon sx={{ fontSize: 28, color: 'var(--text-muted)' }} />
          </Box>
          <Typography sx={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 300 }}>→</Typography>
          <Box sx={{
            width: 56, height: 56, borderRadius: '16px',
            bgcolor: 'var(--bg-active)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <DesktopWindowsOutlinedIcon sx={{ fontSize: 28, color: 'var(--on-primary-container)' }} />
          </Box>
        </Box>

        <Typography variant="h5" fontWeight={700} sx={{ color: 'var(--text-primary)', mb: 1.5 }}>
          Segera Hadir di Mobile 🚧
        </Typography>

        <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 1, lineHeight: 1.7 }}>
          Aplikasi ini saat ini hanya dapat digunakan melalui versi desktop.
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 4, lineHeight: 1.7 }}>
          Silakan akses menggunakan laptop atau komputer untuk pengalaman terbaik.
        </Typography>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => window.location.reload()}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
            '&:hover': { bgcolor: 'var(--bg-elevated)', borderColor: 'var(--border-emph)' },
          }}
        >
          Refresh
        </Button>
      </Box>
    </Box>
  );
}
