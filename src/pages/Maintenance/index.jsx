import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import BuildIcon from '@mui/icons-material/Build';

export default function Maintenance() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.');
  const [retryAfter, setRetryAfter] = useState(null);

  useEffect(() => {
    // Dev bypass via URL param
    const devToken = searchParams.get('dev');
    if (devToken) {
      localStorage.setItem('devBypassToken', devToken);
      window.location.href = '/';
      return;
    }

    // Try to get maintenance info from stored response
    const storedMsg = sessionStorage.getItem('maintenance_message');
    const storedRetry = sessionStorage.getItem('maintenance_retry_after');
    if (storedMsg) setMessage(storedMsg);
    if (storedRetry) setRetryAfter(parseInt(storedRetry));
  }, [searchParams]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
      <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 500, borderRadius: 4 }}>
        <BuildIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Sedang Pemeliharaan
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {message}
        </Typography>
        {retryAfter && (
          <Typography variant="caption" color="text.secondary">
            Estimasi: {Math.ceil(retryAfter / 60)} menit lagi
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
