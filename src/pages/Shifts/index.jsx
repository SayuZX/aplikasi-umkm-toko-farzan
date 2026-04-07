import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ConfirmDialog from '../../components/ConfirmDialog';

const statusColors = { open: 'success', closed: 'default', cancelled: 'error' };
const statusLabels = { open: 'Buka', closed: 'Tutup', cancelled: 'Batal' };

export default function Shifts() {
  const [shifts, setShifts] = useState([]);
  const [filters, setFilters] = useState({ date: '', status: '', location_id: '' });
  const [locations, setLocations] = useState([]);
  const [reportDialog, setReportDialog] = useState(null);
  const [shiftReport, setShiftReport] = useState(null);
  const [forceCloseConfirm, setForceCloseConfirm] = useState(null);

  const fetchShifts = async () => {
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      if (filters.location_id) params.location_id = filters.location_id;
      const res = await api.get('/shifts', { params });
      setShifts(res.data.data || []);
    } catch { toast.error('Gagal memuat data shift'); }
  };

  const fetchLocations = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch {}
  };

  useEffect(() => { fetchLocations(); fetchShifts(); }, []);

  const handleFilter = () => fetchShifts();

  const viewReport = async (id) => {
    try {
      const res = await api.get(`/shifts/${id}/report`);
      setShiftReport(res.data);
      setReportDialog(id);
    } catch { toast.error('Gagal memuat laporan shift'); }
  };

  const forceClose = async (id) => {
    try {
      await api.post(`/shifts/${id}/close`, { cash_closing: 0, notes: 'Force closed by admin' });
      toast.success('Shift ditutup');
      setForceCloseConfirm(null);
      fetchShifts();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menutup shift'); }
  };

  const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AccessTimeIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Manajemen Shift</Typography>
        </Stack>
      </Stack>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Tanggal" type="date" fullWidth size="small" value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Status" select fullWidth size="small" value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <MenuItem value="">Semua</MenuItem>
              <MenuItem value="open">Buka</MenuItem>
              <MenuItem value="closed">Tutup</MenuItem>
              <MenuItem value="cancelled">Batal</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField label="Lokasi" select fullWidth size="small" value={filters.location_id}
              onChange={(e) => setFilters({ ...filters, location_id: e.target.value })}>
              <MenuItem value="">Semua</MenuItem>
              {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button variant="contained" fullWidth onClick={handleFilter}>Filter</Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tanggal</TableCell>
              <TableCell>Shift</TableCell>
              <TableCell>Kasir</TableCell>
              <TableCell>Lokasi</TableCell>
              <TableCell>Kas Awal</TableCell>
              <TableCell>Kas Akhir</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.date}</TableCell>
                <TableCell>{s.shift_name}</TableCell>
                <TableCell>{s.kasir?.full_name || '-'}</TableCell>
                <TableCell>{s.location?.name || '-'}</TableCell>
                <TableCell>{formatRp(s.cash_opening)}</TableCell>
                <TableCell>{s.cash_closing != null ? formatRp(s.cash_closing) : '-'}</TableCell>
                <TableCell><Chip label={statusLabels[s.status] || s.status} size="small" color={statusColors[s.status] || 'default'} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Laporan"><IconButton size="small" onClick={() => viewReport(s.id)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                  {s.status === 'open' && (
                    <Button size="small" color="error" onClick={() => setForceCloseConfirm(s.id)}>Tutup Paksa</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {shifts.length === 0 && (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>Belum ada shift</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Shift Report Dialog */}
      <Dialog open={!!reportDialog} onClose={() => setReportDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Laporan Shift</DialogTitle>
        <DialogContent>
          {shiftReport && (
            <Box>
              <Typography variant="body2">Kasir: <strong>{shiftReport.shift?.kasir?.full_name}</strong></Typography>
              <Typography variant="body2">Tanggal: <strong>{shiftReport.shift?.date}</strong></Typography>
              <Typography variant="body2">Shift: <strong>{shiftReport.shift?.shift_name}</strong></Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>Total Transaksi: <strong>{shiftReport.totalTransactions}</strong></Typography>
              <Typography variant="body2">Total Item: <strong>{shiftReport.totalItems}</strong></Typography>
              <Typography variant="body2">Total Pendapatan: <strong>{formatRp(shiftReport.totalRevenue)}</strong></Typography>
              <Typography variant="body2">Kas Awal: <strong>{formatRp(shiftReport.shift?.cash_opening)}</strong></Typography>
              <Typography variant="body2">Kas Diharapkan: <strong>{formatRp(shiftReport.cashExpected)}</strong></Typography>
              {shiftReport.cashDiff !== null && (
                <Typography variant="body2" color={shiftReport.cashDiff >= 0 ? 'success.main' : 'error.main'}>
                  Selisih Kas: <strong>{formatRp(shiftReport.cashDiff)}</strong>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(null)}>Tutup</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!forceCloseConfirm}
        title="Force Close Shift"
        message="Yakin force close shift ini?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={() => forceClose(forceCloseConfirm)}
        onCancel={() => setForceCloseConfirm(null)}
      />
    </Box>
  );
}
