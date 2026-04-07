import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import BuildIcon from '@mui/icons-material/Build';

export default function MaintenanceGuard({ children }) {
  const [popup, setPopup] = useState({ open: false, message: '', retryAfter: null });
  const navigate = useNavigate();
  const location = useLocation();

  const showPopupThenRedirect = useCallback((message, retryAfter) => {
    setPopup({ open: true, message, retryAfter });
    // Redirect after 3 seconds automatically
    setTimeout(() => {
      setPopup((p) => ({ ...p, open: false }));
      navigate('/maintenance');
    }, 3000);
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/maintenance' || location.pathname === '/login') return;

    const checkHealth = async () => {
      try {
        await api.get('/health');
      } catch (err) {
        if (err.response?.status === 503) {
          const data = err.response?.data;
          const message = data?.message || 'Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.';
          const retryAfter = data?.retry_after || null;
          if (data?.message) sessionStorage.setItem('maintenance_message', data.message);
          if (data?.retry_after) sessionStorage.setItem('maintenance_retry_after', String(data.retry_after));
          showPopupThenRedirect(message, retryAfter);
        }
      }
    };

    checkHealth();
  }, [location.pathname, showPopupThenRedirect]);

  useEffect(() => {
    const handleMaintenance = (e) => {
      const message = sessionStorage.getItem('maintenance_message') || 'Sistem sedang dalam pemeliharaan.';
      const retryRaw = sessionStorage.getItem('maintenance_retry_after');
      const retryAfter = retryRaw ? parseInt(retryRaw) : null;
      showPopupThenRedirect(message, retryAfter);
    };
    window.addEventListener('maintenance:enabled', handleMaintenance);
    return () => window.removeEventListener('maintenance:enabled', handleMaintenance);
  }, [showPopupThenRedirect]);

  const handleGoNow = () => {
    setPopup((p) => ({ ...p, open: false }));
    navigate('/maintenance');
  };

  return (
    <>
      {children}
      <Dialog
        open={popup.open}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', p: 1 } }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, pt: 1 }}>
            <Box sx={{ bgcolor: 'warning.light', borderRadius: '50%', p: 1.5, display: 'inline-flex' }}>
              <BuildIcon sx={{ fontSize: 36, color: 'warning.dark' }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>Sedang Pemeliharaan</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {popup.message}
          </Typography>
          {popup.retryAfter && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
              Estimasi selesai: {Math.ceil(popup.retryAfter / 60)} menit lagi
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
            Anda akan dialihkan secara otomatis…
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button variant="contained" color="warning" onClick={handleGoNow} sx={{ borderRadius: 2.5, textTransform: 'none' }}>
            Lihat Halaman Pemeliharaan
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
