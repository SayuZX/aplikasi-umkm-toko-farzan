import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import MinimizeIcon from '@mui/icons-material/Remove';
import MaximizeIcon from '@mui/icons-material/CropSquare';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import UpdateDialog from './UpdateDialog';

const isElectron = !!window.electronAPI?.isElectron;

export default function CustomTitleBar({ transparent = false }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    if (!isElectron || !window.electronAPI?.onUpdateAvailable) return;
    window.electronAPI.onUpdateAvailable((data) => setUpdateInfo(data));
  }, []);

  if (!isElectron) return null;
  return (
    <>
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
        WebkitAppRegion: 'drag',
        bgcolor: transparent ? 'transparent' : 'var(--bg-surface)',
        borderBottom: transparent ? 'none' : '1px solid var(--border-subtle)',
        userSelect: 'none',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          pl: 1.5,
          fontWeight: 600,
          fontSize: '0.7rem',
          color: transparent ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)',
          letterSpacing: 0.5,
        }}
      >
        TOKO FARZAN
      </Typography>
      <Box sx={{ WebkitAppRegion: 'no-drag', display: 'flex', alignItems: 'center' }}>
        {/* Update indicator */}
        <Tooltip title={updateInfo ? `Versi baru: v${updateInfo.version} — Klik untuk memperbarui` : 'Aplikasi sudah versi terbaru'}>
          <IconButton
            size="small"
            onClick={() => updateInfo && setShowUpdateDialog(true)}
            sx={{
              borderRadius: 0,
              width: 36,
              height: 36,
              color: updateInfo ? '#60a5fa' : (transparent ? 'rgba(255,255,255,0.3)' : 'var(--text-muted)'),
              opacity: updateInfo ? 1 : 0.35,
              '&:hover': { bgcolor: 'rgba(128,128,128,0.15)', opacity: 1 },
            }}
          >
            <Badge color="info" variant="dot" invisible={!updateInfo}>
              <SystemUpdateIcon sx={{ fontSize: 14 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        <IconButton
          size="small"
          onClick={() => window.electronAPI.winMinimize()}
          sx={{
            borderRadius: 0,
            width: 40,
            height: 36,
            color: transparent ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
            '&:hover': { bgcolor: 'rgba(128,128,128,0.2)' },
          }}
        >
          <MinimizeIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => window.electronAPI.winMaximize()}
          sx={{
            borderRadius: 0,
            width: 40,
            height: 36,
            color: transparent ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
            '&:hover': { bgcolor: 'rgba(128,128,128,0.2)' },
          }}
        >
          <MaximizeIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => window.electronAPI.winClose()}
          sx={{
            borderRadius: 0,
            width: 40,
            height: 36,
            color: transparent ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
            '&:hover': { bgcolor: '#e81123', color: '#fff' },
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    </Box>

    {showUpdateDialog && updateInfo && (
      <UpdateDialog forceOpen info={updateInfo} onClose={() => setShowUpdateDialog(false)} />
    )}
    </>
  );
}
