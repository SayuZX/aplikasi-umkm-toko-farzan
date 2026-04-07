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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState({
    code: '', name: '', type: 'fixed', value: '', min_order: '0',
    max_discount: '', usage_limit: '', valid_from: '', valid_to: '',
  });

  const fetchData = async () => {
    try {
      const res = await api.get('/vouchers');
      setVouchers(res.data);
    } catch { toast.error('Gagal memuat data voucher'); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ code: '', name: '', type: 'fixed', value: '', min_order: '0', max_discount: '', usage_limit: '', valid_from: '', valid_to: '' });
    setDialogOpen(true);
  };

  const openEdit = (v) => {
    setEditItem(v);
    setForm({
      code: v.code, name: v.name, type: v.type, value: String(v.value),
      min_order: String(v.min_order || 0), max_discount: v.max_discount ? String(v.max_discount) : '',
      usage_limit: v.usage_limit ? String(v.usage_limit) : '',
      valid_from: v.valid_from || '', valid_to: v.valid_to || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      value: parseFloat(form.value) || 0,
      min_order: parseFloat(form.min_order) || 0,
      max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      valid_from: form.valid_from || null,
      valid_to: form.valid_to || null,
    };
    try {
      if (editItem) {
        await api.put(`/vouchers/${editItem.id}`, payload);
        toast.success('Voucher diperbarui');
      } else {
        await api.post('/vouchers', payload);
        toast.success('Voucher ditambahkan');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/vouchers/${id}`);
      toast.success('Voucher dihapus');
      setDeleteConfirm(null);
      fetchData();
    } catch { toast.error('Gagal menghapus'); }
  };

  const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <LocalOfferIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Manajemen Voucher</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Tambah Voucher</Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Kode</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>Tipe</TableCell>
              <TableCell>Nilai</TableCell>
              <TableCell>Min Order</TableCell>
              <TableCell>Penggunaan</TableCell>
              <TableCell>Berlaku</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vouchers.map((v) => (
              <TableRow key={v.id}>
                <TableCell><Chip label={v.code} size="small" variant="outlined" /></TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell><Chip label={v.type === 'fixed' ? 'Nominal' : 'Persen'} size="small" color={v.type === 'fixed' ? 'info' : 'secondary'} /></TableCell>
                <TableCell>{v.type === 'fixed' ? formatRp(v.value) : `${v.value}%`}</TableCell>
                <TableCell>{formatRp(v.min_order)}</TableCell>
                <TableCell>{v.used_count}{v.usage_limit ? ` / ${v.usage_limit}` : ' / ∞'}</TableCell>
                <TableCell>{v.valid_from || '-'} s/d {v.valid_to || '-'}</TableCell>
                <TableCell><Chip label={v.is_active ? 'Aktif' : 'Nonaktif'} size="small" color={v.is_active ? 'success' : 'default'} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(v)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Hapus"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(v.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {vouchers.length === 0 && (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>Belum ada voucher</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Voucher' : 'Tambah Voucher'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 6 }}>
              <TextField label="Kode" fullWidth value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Nama" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Tipe" select fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <MenuItem value="fixed">Nominal (Rp)</MenuItem>
                <MenuItem value="percent">Persen (%)</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Nilai" type="number" fullWidth value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Min Order" type="number" fullWidth value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Maks Diskon" type="number" fullWidth value={form.max_discount} onChange={(e) => setForm({ ...form, max_discount: e.target.value })} helperText="Kosongkan jika tidak ada batas" />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Batas Penggunaan" type="number" fullWidth value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} helperText="Kosongkan untuk unlimited" />
            </Grid>
            <Grid size={{ xs: 6 }} />
            <Grid size={{ xs: 6 }}>
              <TextField label="Berlaku Dari" type="date" fullWidth value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField label="Berlaku Sampai" type="date" fullWidth value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Batal</Button>
          <Button variant="contained" onClick={handleSave}>Simpan</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Hapus Voucher"
        message="Yakin hapus voucher ini?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
