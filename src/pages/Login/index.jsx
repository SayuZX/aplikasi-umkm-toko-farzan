import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { connectSocket } from '../../services/socket';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';
import StorefrontIcon from '@mui/icons-material/Storefront';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

import CustomTitleBar from '../../components/CustomTitleBar';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [errors, setErrors] = useState({});
  const { setAuth, serverUrl, setServerUrl } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = 'Username wajib diisi';
    if (!password) e.password = 'Password wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      setAuth(res.data.token, res.data.user);
      connectSocket();
      toast.success(`Selamat datang, ${res.data.user.full_name}!`);
      navigate('/kasir');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal login. Periksa koneksi server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'var(--bg-primary)',
      position: 'relative',
      pt: window.electronAPI?.isElectron ? '36px' : 0,
    }}>
      <CustomTitleBar />
      {/* Theme toggle — top right */}
      <IconButton
        onClick={toggleMode}
        size="small"
        sx={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }}
      >
        {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
      </IconButton>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 400,
          mx: 2,
          p: { xs: 3, sm: 4.5 },
          borderRadius: '24px',
          bgcolor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Brand */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '16px',
            bgcolor: 'var(--bg-active)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}>
            <StorefrontIcon sx={{ fontSize: 28, color: 'var(--on-primary-container)' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: 'var(--text-primary)', mb: 0.5 }}>
            Masuk
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Aplikasi Kasir Toko Farzan
          </Typography>
        </Box>

        {/* Form */}
        <form onSubmit={handleLogin} noValidate>
          <TextField
            label="Username"
            fullWidth
            variant="outlined"
            value={username}
            onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors({ ...errors, username: '' }); }}
            error={!!errors.username}
            helperText={errors.username}
            autoFocus
            autoComplete="username"
            sx={{ mb: 2.5 }}
          />
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
            error={!!errors.password}
            helperText={errors.password}
            autoComplete="current-password"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      tabIndex={-1}
                    >
                      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 3.5 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            disableElevation
            sx={{
              py: 1.5,
              fontSize: '0.95rem',
              fontWeight: 600,
              borderRadius: '12px',
              textTransform: 'none',
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Masuk'}
          </Button>
        </form>

        {/* Server config toggle */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            size="small"
            startIcon={<SettingsOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={() => setShowServer(!showServer)}
            sx={{
              textTransform: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              fontWeight: 500,
              '&:hover': { bgcolor: 'var(--bg-elevated)' },
            }}
          >
            Konfigurasi Server
          </Button>
          <Collapse in={showServer}>
            <TextField
              fullWidth
              size="small"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:3000"
              helperText="URL server backend (IP:Port)"
              sx={{ mt: 1.5 }}
            />
          </Collapse>
        </Box>
      </Paper>
    </Box>
  );
}
