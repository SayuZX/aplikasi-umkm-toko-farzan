import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useSidebarStore } from '../store/sidebarStore';
import { colors } from '../theme/colors';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import UpdateDialog from './UpdateDialog';

export default function Navbar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { user, logout } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const { setMobileOpen } = useSidebarStore();
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateAvailable) return;
    window.electronAPI.onUpdateAvailable((data) => {
      setUpdateInfo(data);
    });
  }, []);

  if (isDesktop) return null;

  return (
    <>
      <AppBar position="static" sx={{ bgcolor: colors.sidebarBg, mt: window.electronAPI?.isElectron ? '36px' : 0 }}>
        <Toolbar variant="dense" sx={{ gap: 0.5 }}>
          <IconButton color="inherit" onClick={() => setMobileOpen(true)} size="small" sx={{ color: colors.sidebarIconInactive }}>
            <MenuIcon />
          </IconButton>
          <StorefrontIcon sx={{ color: colors.sidebarLabelActive, mx: 1 }} />
          <Typography variant="subtitle1" sx={{ color: colors.sidebarLabelActive, fontWeight: 700, flexGrow: 1 }}>
            TOKO FARZAN
          </Typography>

          <Tooltip title={mode === 'light' ? 'Mode Gelap' : 'Mode Terang'}>
            <IconButton onClick={toggleMode} size="small" sx={{ color: colors.sidebarIconInactive }}>
              {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          {window.electronAPI?.isElectron && (
            <Tooltip title={updateInfo ? `Versi baru tersedia: v${updateInfo.version}` : 'Aplikasi sudah versi terbaru'}>
              <IconButton size="small" onClick={() => updateInfo && setShowUpdateDialog(true)} sx={{ color: updateInfo ? '#60a5fa' : colors.sidebarIconInactive, opacity: updateInfo ? 1 : 0.4 }}>
                <Badge color="info" variant="dot" invisible={!updateInfo}>
                  <SystemUpdateIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <Chip
            icon={<PersonIcon />}
            label={`${user?.full_name} (${user?.role})`}
            size="small"
            sx={{ color: colors.sidebarLabelInactive, bgcolor: 'var(--bg-elevated)', mx: 1, '& .MuiChip-icon': { color: colors.sidebarLabelInactive } }}
          />

          <Tooltip title="Keluar">
            <IconButton onClick={logout} size="small" sx={{ color: colors.sidebarIconInactive }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {showUpdateDialog && updateInfo && (
        <UpdateDialog forceOpen info={updateInfo} onClose={() => setShowUpdateDialog(false)} />
      )}
    </>
  );
}
