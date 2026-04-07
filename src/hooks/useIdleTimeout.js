import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Session logout after 30 minutes
const SESSION_TIMEOUT_MINUTES = 30;
// Idle screensaver after 3 minutes (overridable via localStorage key 'idle_screen_minutes')
const DEFAULT_IDLE_SCREEN_MINUTES = 3;

function getIdleScreenMs() {
  const stored = localStorage.getItem('idle_screen_minutes');
  const minutes = stored === 'off' ? null : (parseInt(stored) || DEFAULT_IDLE_SCREEN_MINUTES);
  return minutes ? minutes * 60 * 1000 : null;
}

// Exported so App.jsx can read the idle state reactively
export { getIdleScreenMs };

/**
 * useIdleTimeout
 *
 * - After `idleScreenMs`: enter idle clock screen (does NOT log out)
 * - After 30 min: log out and redirect to /login
 *
 * Returns { idleScreen, wakeUp } for the consumer to show/hide IdleScreen.
 */
export default function useIdleTimeout() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const sessionTimerRef = useRef(null);
  const idleTimerRef = useRef(null);
  const [idleScreen, setIdleScreen] = useState(false);

  const sessionTimeoutMs = SESSION_TIMEOUT_MINUTES * 60 * 1000;

  const wakeUp = useCallback(() => {
    setIdleScreen(false);
  }, []);

  const handleSessionExpired = useCallback(() => {
    if (!token) return;
    setIdleScreen(false);
    logout();
    toast('Sesi berakhir karena tidak aktif', { icon: '⏰', duration: 5000 });
    navigate('/login');
  }, [token, logout, navigate]);

  const resetTimers = useCallback(() => {
    // Hide idle screen on any activity
    setIdleScreen(false);

    // Restart session logout timer
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (token) {
      sessionTimerRef.current = setTimeout(handleSessionExpired, sessionTimeoutMs);
    }

    // Restart idle screen timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const idleMs = getIdleScreenMs();
    if (token && idleMs) {
      idleTimerRef.current = setTimeout(() => setIdleScreen(true), idleMs);
    }
  }, [token, sessionTimeoutMs, handleSessionExpired]);

  useEffect(() => {
    if (!token) return;

    const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, resetTimers, true));
    resetTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, resetTimers, true));
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [token, resetTimers]);

  return { idleScreen, wakeUp };
}
