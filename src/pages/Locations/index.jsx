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
import Grid from '@mui/material/Grid';
import PlaceIcon from '@mui/icons-material/Place';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', phone: '', is_default: false });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = async () => {
    try {
      const res = await api.get('/locations');
      setLocations(res.data);
    } catch { toast.error('Gagal memuat data lokasi'); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', address: '', phone: '', is_default: false });
    setDialogOpen(true);
  };

  const openEdit = (loc) => {
    setEditItem(loc);
    setForm({ name: loc.name, address: loc.address || '', phone: loc.phone || '', is_default: loc.is_default });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        await api.put(`/locations/${editItem.id}`, form);
        toast.success('Lokasi diperbarui');
      } else {
        await api.post('/locations', form);
        toast.success('Lokasi ditambahkan');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/locations/${id}`);
      toast.success('Lokasi dihapus');
      setDeleteConfirm(null);
      fetchData();
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <PlaceIcon color="primary" />
          <Typography variant="h5" fontWeight={700}>Manajemen Lokasi</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Tambah Lokasi</Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Alamat</TableCell>
              <TableCell>Telepon</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>
                  {loc.name}
                  {loc.is_default && <Chip label="Default" size="small" color="primary" sx={{ ml: 1 }} />}
                </TableCell>
                <TableCell>{loc.address || '-'}</TableCell>
                <TableCell>{loc.phone || '-'}</TableCell>
                <TableCell>
                  <Chip label={loc.is_active ? 'Aktif' : 'Nonaktif'} size="small" color={loc.is_active ? 'success' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(loc)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Hapus"><IconButton size="small" color="error" onClick={() => setDeleteConfirm(loc.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {locations.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>Belum ada lokasi</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editItem ? 'Edit Lokasi' : 'Tambah Lokasi'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField label="Nama Lokasi" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </Grid>
            <Grid size={12}>
              <TextField label="Alamat" fullWidth value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <TextField label="Telepon" fullWidth value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
        title="Hapus Lokasi"
        message="Yakin hapus lokasi ini?"
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={() => handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
}
