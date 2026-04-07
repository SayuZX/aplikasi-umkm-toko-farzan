import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import NewReleasesIcon from '@mui/icons-material/NewReleases';

export default function UpdateDialog({ forceOpen = false, info: infoProp = null, onClose }) {
  const [open, setOpen] = useState(forceOpen);
  const [info, setInfo] = useState(infoProp);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setInfo(infoProp);
    }
  }, [forceOpen, infoProp]);

  useEffect(() => {
    if (forceOpen) return; // managed externally
    if (!window.electronAPI?.onUpdateAvailable) return;
    window.electronAPI.onUpdateAvailable((data) => {
      setInfo(data);
      setOpen(true);
    });
  }, [forceOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open || !info) return null;

  const isMandatory = info.mandatory;

  return (
    <Dialog
      open={open}
      onClose={isMandatory ? undefined : handleClose}
      PaperProps={{
        sx: {
          borderRadius: '28px',
          maxWidth: 420,
          width: '100%',
          bgcolor: 'var(--bg-surface)',
          backgroundImage: 'none',
        },
      }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' },
        },
      }}
    >
      {/* Icon */}
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: isMandatory ? '#FEE2E2' : 'var(--bg-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMandatory ? (
            <NewReleasesIcon sx={{ fontSize: 28, color: '#DC2626' }} />
          ) : (
            <SystemUpdateIcon sx={{ fontSize: 28, color: 'var(--on-primary-container)' }} />
          )}
        </Box>
      </Box>

      <DialogTitle
        sx={{
          textAlign: 'center',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: 'var(--text-primary)',
          pb: 0.5,
        }}
      >
        {isMandatory ? 'Pembaruan Diperlukan' : 'Pembaruan Tersedia'}
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', px: 4 }}>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
          Versi <strong>{info.version}</strong> tersedia untuk diunduh.
        </Typography>
        {info.releaseNotes && (
          <Typography variant="body2" sx={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            {info.releaseNotes}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1, px: 3 }}>
        {!isMandatory && (
          <Button
            onClick={handleClose}
            sx={{
              textTransform: 'none',
              color: 'var(--text-secondary)',
              borderRadius: '12px',
              px: 3,
            }}
          >
            Nanti Saja
          </Button>
        )}
        <Button
          variant="contained"
          disableElevation
          onClick={() => {
            if (info.downloadUrl) {
              window.open(info.downloadUrl, '_blank');
            }
            if (!isMandatory) handleClose();
          }}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            px: 3,
          }}
        >
          Unduh Sekarang
        </Button>
      </DialogActions>
    </Dialog>
  );
}
