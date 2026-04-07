import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';

export default function ShiftPanel({ compact = false }) {
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [locations, setLocations] = useState([]);
  const [openForm, setOpenForm] = useState({ shift_name: 'pagi', cash_opening: '', location_id: '' });
  const [closeForm, setCloseForm] = useState({ cash_closing: '', notes: '' });

  const fetchActive = async () => {
    try {
      const res = await api.get('/shifts/active');
      setActiveShift(res.data);
    } catch {} finally { setLoading(false); }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch {}
  };

  useEffect(() => { fetchActive(); fetchLocations(); }, []);

  const handleOpen = async () => {
    try {
      const res = await api.post('/shifts/open', {
        shift_name: openForm.shift_name,
        cash_opening: parseFloat(openForm.cash_opening) || 0,
        location_id: openForm.location_id || null,
      });
      setActiveShift(res.data);
      setOpenDialog(false);
      toast.success('Shift berhasil dibuka');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuka shift');
    }
  };

  const handleClose = async () => {
    if (!activeShift) return;
    try {
      await api.post(`/shifts/${activeShift.id}/close`, {
        cash_closing: parseFloat(closeForm.cash_closing) || 0,
        notes: closeForm.notes || null,
      });
      setActiveShift(null);
      setCloseDialog(false);
      toast.success('Shift berhasil ditutup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menutup shift');
    }
  };

  const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: compact ? 0.5 : 1 }}><CircularProgress size={compact ? 16 : 20} /></Box>;

  const shiftBar = compact ? (
      <Box
        sx={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          bgcolor: activeShift ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.12)',
          borderLeft: `3px solid ${activeShift ? '#2563EB' : '#F59E0B'}`,
        }}
      >
        <AccessTimeIcon sx={{ fontSize: 18, color: activeShift ? '#2563EB' : '#F59E0B' }} />
        {activeShift ? (
          <>
            <Typography variant="caption" sx={{ color: '#2563EB', fontWeight: 600 }}>
              Shift Aktif
            </Typography>
            <Typography variant="caption" sx={{ color: '#A1A1AA' }}>
              {activeShift.shift_name} · Kas: {formatRp(activeShift.cash_opening)}
              {activeShift.location ? ` · ${activeShift.location.name}` : ''}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              variant="text"
              sx={{ color: '#EF4444', fontSize: 12, minWidth: 0, textTransform: 'none' }}
              startIcon={<LockIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => { setCloseForm({ cash_closing: '', notes: '' }); setCloseDialog(true); }}
            >
              Tutup Shift
            </Button>
          </>
        ) : (
          <>
            <Typography variant="caption" sx={{ color: '#F59E0B', fontWeight: 600, flexGrow: 1 }}>
              Shift belum dibuka — buka shift untuk mulai transaksi
            </Typography>
            <Button
              size="small"
              variant="text"
              sx={{ color: '#F59E0B', fontSize: 12, minWidth: 0, fontWeight: 600, textTransform: 'none' }}
              startIcon={<LockOpenIcon sx={{ fontSize: '14px !important' }} />}
              onClick={() => { setOpenForm({ shift_name: 'pagi', cash_opening: '', location_id: '' }); setOpenDialog(true); }}
            >
              Buka Shift
            </Button>
          </>
        )}
      </Box>
  ) : (
      <Paper
        variant="outlined"
        sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, borderRadius: 2 }}
      >
        <AccessTimeIcon fontSize="small" color={activeShift ? 'success' : 'disabled'} />
        {activeShift ? (
          <>
            <Chip label={`Shift: ${activeShift.shift_name}`} size="small" color="success" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              Kas: {formatRp(activeShift.cash_opening)}
            </Typography>
            {activeShift.location && (
              <Chip label={activeShift.location.name} size="small" variant="outlined" />
            )}
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<LockIcon />}
              onClick={() => { setCloseForm({ cash_closing: '', notes: '' }); setCloseDialog(true); }}
            >
              Tutup Shift
            </Button>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary">Shift belum dibuka</Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<LockOpenIcon />}
              onClick={() => {
                setOpenForm({ shift_name: 'pagi', cash_opening: '', location_id: '' });
                setOpenDialog(true);
              }}
            >
              Buka Shift
            </Button>
          </>
        )}
      </Paper>
  );

  return (
    <>
      {shiftBar}

      {/* Open Shift Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Buka Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField label="Nama Shift" select fullWidth value={openForm.shift_name}
                onChange={(e) => setOpenForm({ ...openForm, shift_name: e.target.value })}>
                <MenuItem value="pagi">Pagi</MenuItem>
                <MenuItem value="siang">Siang</MenuItem>
                <MenuItem value="malam">Malam</MenuItem>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField label="Kas Awal (Rp)" type="number" fullWidth value={openForm.cash_opening}
                onChange={(e) => setOpenForm({ ...openForm, cash_opening: e.target.value })} />
            </Grid>
            {locations.length > 0 && (
              <Grid size={12}>
                <TextField label="Lokasi" select fullWidth value={openForm.location_id}
                  onChange={(e) => setOpenForm({ ...openForm, location_id: e.target.value })}>
                  <MenuItem value="">Tidak ada lokasi</MenuItem>
                  {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
                </TextField>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleOpen}>Buka Shift</Button>
        </DialogActions>
      </Dialog>

      {/* Close Shift Dialog */}
      <Dialog open={closeDialog} onClose={() => setCloseDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Tutup Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField label="Kas Akhir (Rp)" type="number" fullWidth value={closeForm.cash_closing}
                onChange={(e) => setCloseForm({ ...closeForm, cash_closing: e.target.value })} autoFocus />
            </Grid>
            <Grid size={12}>
              <TextField label="Catatan" fullWidth multiline rows={2} value={closeForm.notes}
                onChange={(e) => setCloseForm({ ...closeForm, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCloseDialog(false)}>Batal</Button>
          <Button variant="contained" color="error" onClick={handleClose}>Tutup Shift</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
