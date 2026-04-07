import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CustomTitleBar from '../components/CustomTitleBar';

export default function LockScreen({ onUnlock }) {
  const [time, setTime] = useState(new Date());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleUnlock = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onUnlock, 600);
  }, [leaving, onUnlock]);

  useEffect(() => {
    const onKey = () => handleUnlock();
    window.addEventListener('keydown', onKey, { once: true });
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUnlock]);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Box
      onClick={handleUnlock}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 8000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'linear-gradient(160deg, #0a0e1a 0%, #111827 50%, #1e293b 100%)',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 0.6s ease',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <CustomTitleBar transparent />

      {/* Ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Clock */}
      <Box
        sx={{
          textAlign: 'center',
          transform: leaving ? 'translateY(-60px)' : 'translateY(0)',
          opacity: leaving ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
          animation: 'lockFadeIn 0.6s ease forwards',
          '@keyframes lockFadeIn': {
            from: { opacity: 0, transform: 'translateY(20px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <Typography
          sx={{
            fontSize: 'clamp(72px, 12vw, 120px)',
            fontWeight: 200,
            color: '#fff',
            letterSpacing: '-2px',
            lineHeight: 1,
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            textShadow: '0 0 60px rgba(37,99,235,0.15)',
          }}
        >
          {hours}:{minutes}
        </Typography>

        <Typography
          sx={{
            fontSize: 'clamp(14px, 2vw, 18px)',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 400,
            mt: 1,
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
          }}
        >
          {dateStr}
        </Typography>
      </Box>

      {/* Slide up hint */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 48,
          textAlign: 'center',
          animation: 'lockBounce 2s ease-in-out infinite',
          opacity: leaving ? 0 : 1,
          transition: 'opacity 0.3s',
          '@keyframes lockBounce': {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-8px)' },
          },
        }}
      >
        <KeyboardArrowUpIcon sx={{ fontSize: 28, color: 'rgba(255,255,255,0.4)' }} />
        <Typography
          variant="caption"
          display="block"
          sx={{
            color: 'rgba(255,255,255,0.35)',
            fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
            fontSize: '0.7rem',
            letterSpacing: 1,
          }}
        >
          KLIK UNTUK MASUK
        </Typography>
      </Box>
    </Box>
  );
}
