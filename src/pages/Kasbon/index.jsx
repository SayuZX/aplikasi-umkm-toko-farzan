import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

export default function Kasbon() {
  const [tab, setTab] = useState(0); // 0=kasbons, 1=customers
  const [kasbons, setKasbons] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('unpaid');
  const [search, setSearch] = useState('');
  const [payDialog, setPayDialog] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [addCustomerDialog, setAddCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });

  const fetchKasbons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/kasbons', { params: { status: statusFilter } });
      setKasbons(res.data?.data || res.data || []);
    } catch {
      toast.error('Gagal memuat data kasbon');
    }
    setLoading(false);
  }, [statusFilter]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { params: { search } });
      setCustomers(res.data?.data || res.data || []);
    } catch {
      toast.error('Gagal memuat data pelanggan');
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { if (tab === 0) fetchKasbons(); }, [tab, fetchKasbons]);
  useEffect(() => { if (tab === 1) fetchCustomers(); }, [tab, fetchCustomers]);

  const handleMarkPaid = async () => {
    if (!payDialog) return;
    setPayLoading(true);
    try {
      await api.put(`/kasbons/${payDialog.id}/pay`);
      toast.success('Kasbon berhasil dilunasi');
      setPayDialog(null);
      fetchKasbons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal melunasi kasbon');
    }
    setPayLoading(false);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return toast.error('Nama wajib diisi');
    try {
      await api.post('/customers', newCustomer);
      toast.success('Pelanggan berhasil ditambahkan');
      setAddCustomerDialog(false);
      setNewCustomer({ name: '', phone: '' });
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan pelanggan');
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CreditScoreIcon /> Kasbon
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<CreditScoreIcon />} label="Daftar Kasbon" iconPosition="start" />
        <Tab icon={<PeopleIcon />} label="Pelanggan" iconPosition="start" />
      </Tabs>

      {/* Kasbon List */}
      {tab === 0 && (
        <>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              select size="small" value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="unpaid">Belum Lunas</MenuItem>
              <MenuItem value="paid">Sudah Lunas</MenuItem>
              <MenuItem value="">Semua</MenuItem>
            </TextField>
          </Stack>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : kasbons.length === 0 ? (
            <Alert severity="info">Tidak ada data kasbon</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pelanggan</TableCell>
                    <TableCell>No. Transaksi</TableCell>
                    <TableCell align="right">Jumlah</TableCell>
                    <TableCell>Jatuh Tempo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tanggal</TableCell>
                    <TableCell align="center">Aksi</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {kasbons.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell>{k.customer?.name || '-'}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{k.transaction?.transaction_no || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatRp(k.amount)}</TableCell>
                      <TableCell>{formatDate(k.due_date)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={k.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                          color={k.status === 'paid' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(k.created_at)}</TableCell>
                      <TableCell align="center">
                        {k.status === 'unpaid' && (
                          <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => setPayDialog(k)}>
                            Lunasi
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Customers List */}
      {tab === 1 && (
        <>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small" placeholder="Cari pelanggan..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, maxWidth: 300 }}
            />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddCustomerDialog(true)}>
              Tambah
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : customers.length === 0 ? (
            <Alert severity="info">Tidak ada pelanggan</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nama</TableCell>
                    <TableCell>Telepon</TableCell>
                    <TableCell align="right">Total Kasbon</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                      <TableCell>{c.phone || '-'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: c.total_kasbon > 0 ? 'warning.main' : 'success.main' }}>
                        {formatRp(c.total_kasbon)}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={c.is_active ? 'Aktif' : 'Nonaktif'} color={c.is_active ? 'success' : 'default'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Pay Confirmation Dialog */}
      <Dialog open={!!payDialog} onClose={() => setPayDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Konfirmasi Pelunasan</DialogTitle>
        <DialogContent>
          {payDialog && (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>Pelanggan: <strong>{payDialog.customer?.name}</strong></Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>No. Transaksi: <strong>{payDialog.transaction?.transaction_no}</strong></Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mt: 2, textAlign: 'center' }}>
                {formatRp(payDialog.amount)}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(null)}>Batal</Button>
          <Button variant="contained" color="success" onClick={handleMarkPaid} disabled={payLoading} startIcon={payLoading ? <CircularProgress size={18} /> : <CheckCircleIcon />}>
            {payLoading ? 'Memproses...' : 'Lunasi'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addCustomerDialog} onClose={() => setAddCustomerDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Tambah Pelanggan</DialogTitle>
        <DialogContent>
          <TextField label="Nama" fullWidth value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} sx={{ mt: 1, mb: 2 }} />
          <TextField label="No. Telepon (opsional)" fullWidth value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCustomerDialog(false)}>Batal</Button>
          <Button variant="contained" onClick={handleAddCustomer}>Simpan</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
