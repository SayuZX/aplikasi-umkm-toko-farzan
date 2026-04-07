import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTime(d) {
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');
}

function formatDate(d) {
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export default function IdleScreen({ active, onWake, storeName = 'TOKO FARZAN', idleMinutes = 3 }) {
  const [now, setNow] = useState(new Date());
  const [visible, setVisible] = useState(false);

  // clock tick
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [active]);

  // fade in/out
  useEffect(() => {
    if (active) {
      setNow(new Date());
      // slight delay so transition is visible
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [active]);

  const handleWake = useCallback(
    (e) => {
      // prevent the wake interaction from propagating as a real click
      e.stopPropagation();
      onWake?.();
    },
    [onWake],
  );

  if (!active && !visible) return null;

  return (
    <Box
      onClick={handleWake}
      onMouseMove={handleWake}
      onKeyDown={handleWake}
      tabIndex={-1}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        cursor: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 60% 40%, #0f1a2e 0%, #050a12 100%)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        userSelect: 'none',
      }}
    >
      {/* Subtle animated glow */}
      <Box
        sx={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          animation: 'pulse 6s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)', opacity: 0.5 },
            '50%': { transform: 'scale(1.15)', opacity: 1 },
          },
        }}
      />

      {/* Clock */}
      <Typography
        sx={{
          fontFamily: '"Inter", "Roboto", sans-serif',
          fontSize: { xs: '4rem', sm: '7rem', md: '9rem' },
          fontWeight: 200,
          color: '#ffffff',
          letterSpacing: { xs: 4, md: 8 },
          lineHeight: 1,
          mb: 3,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {formatTime(now)}
      </Typography>

      {/* Date */}
      <Typography
        sx={{
          fontSize: { xs: '0.95rem', sm: '1.25rem', md: '1.5rem' },
          color: 'rgba(255,255,255,0.55)',
          letterSpacing: 1,
          mb: 1.5,
        }}
      >
        {formatDate(now)}
      </Typography>

      {/* Store name */}
      <Typography
        sx={{
          fontSize: { xs: '0.7rem', sm: '0.85rem' },
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: { xs: 3, md: 6 },
          textTransform: 'uppercase',
          mt: 1,
        }}
      >
        {storeName}
      </Typography>

      {/* Hint */}
      <Typography
        sx={{
          position: 'absolute',
          bottom: 32,
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.15)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          animation: 'blink 3s ease-in-out infinite',
          '@keyframes blink': {
            '0%, 100%': { opacity: 0.15 },
            '50%': { opacity: 0.45 },
          },
        }}
      >
        Sentuh atau tekan tombol apa saja untuk melanjutkan
      </Typography>
    </Box>
  );
}
