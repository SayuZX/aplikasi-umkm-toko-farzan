import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CustomTitleBar from '../components/CustomTitleBar';

export default function WelcomeScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  const handleStart = async () => {
    setLeaving(true);
    try { await window.electronAPI?.setFirstLaunchDone(); } catch { /* ignore */ }
    setTimeout(onDone, 600);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 8000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #2563EB 100%)',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}
    >
      <CustomTitleBar transparent />

      {/* Animated content */}
      <Box
        sx={{
          textAlign: 'center',
          transform: leaving ? 'translateY(-30px)' : 'translateY(0)',
          opacity: leaving ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
          animation: 'welcomeFadeIn 0.8s ease forwards',
          '@keyframes welcomeFadeIn': {
            from: { opacity: 0, transform: 'translateY(30px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Logo */}
        <Box
          sx={{
            width: 88,
            height: 88,
            borderRadius: '24px',
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <StorefrontIcon sx={{ fontSize: 44, color: '#fff' }} />
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#fff',
            mb: 1,
            letterSpacing: '-0.02em',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          }}
        >
          TOKO FARZAN
        </Typography>

        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.65)',
            fontWeight: 400,
            mb: 5,
            maxWidth: 380,
            lineHeight: 1.5,
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          }}
        >
          Sistem kasir modern untuk usaha Anda
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleStart}
          disableElevation
          sx={{
            px: 5,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: '14px',
            textTransform: 'none',
            bgcolor: '#fff',
            color: '#1e3a5f',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 6px 28px rgba(0,0,0,0.2)',
            },
          }}
        >
          Mulai Sekarang
        </Button>
      </Box>

      {/* Bottom credit */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 24,
          color: 'rgba(255,255,255,0.35)',
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        }}
      >
        © 2025 RAYH4ZE
      </Typography>
    </Box>
  );
}
