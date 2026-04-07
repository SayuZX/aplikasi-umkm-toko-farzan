import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';
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
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuthStore } from '../../store/authStore';

const PROTECTED_ROLES = ['admin', 'developer'];
const MANAGER_ROLES = ['admin', 'developer', 'owner'];

const canManage = (currentRole, targetRole) => {
  if (PROTECTED_ROLES.includes(targetRole)) return PROTECTED_ROLES.includes(currentRole);
  return MANAGER_ROLES.includes(currentRole);
};

const assignableRoles = (currentRole) => {
  if (PROTECTED_ROLES.includes(currentRole)) return ['admin', 'owner', 'kasir', 'staff', 'developer'];
  if (currentRole === 'owner') return ['owner', 'kasir', 'staff'];
  return ['kasir', 'staff'];
};

const roleLabels = { admin: 'Admin', owner: 'Owner', kasir: 'Kasir', staff: 'Staf', developer: 'Developer' };
const roleColors = { admin: 'error', owner: 'secondary', kasir: 'primary', staff: 'warning', developer: 'info' };

export default function Karyawan() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [confirm, setConfirm] = useState({ open: false });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { user: currentUser } = useAuthStore();

  const fetchUsers = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch {
      toast.error('Gagal memuat data karyawan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, roleFilter]);

  const handleAdd = () => { setEditUser(null); setFormOpen(true); };
  const handleEdit = (user) => { setEditUser(user); setFormOpen(true); };

  const handleToggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}/toggle-active`);
      toast.success(`Akun ${user.full_name} berhasil di${user.is_active ? 'nonaktif' : 'aktif'}kan`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = (user) => {
    setConfirm({
      open: true,
      title: 'Nonaktifkan Karyawan',
      message: `Yakin ingin menonaktifkan akun "${user.full_name}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/users/${user.id}`);
          toast.success('Akun berhasil dinonaktifkan');
          fetchUsers();
        } catch (err) {
          toast.error(err.response?.data?.message || 'Gagal menghapus');
        }
        setConfirm({ open: false });
      },
    });
  };

  const handleFormSuccess = () => { setFormOpen(false); fetchUsers(); };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon /> Manajemen Karyawan
        </Typography>
        {MANAGER_ROLES.includes(currentUser?.role) && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>Tambah Karyawan</Button>
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small" placeholder="Cari nama/username/email..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 250 }}
        />
        <TextField size="small" select label="Role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">Semua Role</MenuItem>
          {Object.entries(roleLabels).map(([k, v]) => (
            <MenuItem key={k} value={k}>{v}</MenuItem>
          ))}
        </TextField>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama Lengkap</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Memuat...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>Belum ada data karyawan</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id} hover sx={{ opacity: u.is_active ? 1 : 0.5 }}>
                  <TableCell sx={{ fontWeight: 600 }}>{u.full_name}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip label={roleLabels[u.role] || u.role} size="small" color={roleColors[u.role] || 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={u.is_active ? 'Aktif' : 'Nonaktif'}
                      size="small"
                      color={u.is_active ? 'success' : 'default'}
                      variant={u.is_active ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {canManage(currentUser?.role, u.role) && u.id !== currentUser?.id ? (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(u)}><EditIcon fontSize="small" /></IconButton>
                        </Tooltip>
                        <Tooltip title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          <IconButton size="small" color={u.is_active ? 'warning' : 'success'} onClick={() => handleToggleActive(u)}>
                            {u.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Hapus">
                          <IconButton size="small" color="error" onClick={() => handleDelete(u)}><DeleteIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {formOpen && (
        <UserFormDialog user={editUser} onClose={() => setFormOpen(false)} onSuccess={handleFormSuccess} currentUserRole={currentUser?.role} />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />
    </Box>
  );
}

function UserFormDialog({ user, onClose, onSuccess, currentUserRole }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: '', password: '', full_name: '', email: '', role: 'kasir',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ username: user.username, password: '', full_name: user.full_name, email: user.email || '', role: user.role });
    }
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.full_name) {
      toast.error('Username dan nama lengkap wajib diisi');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password wajib diisi untuk karyawan baru');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await api.put(`/users/${user.id}`, payload);
        toast.success('Karyawan berhasil diperbarui');
      } else {
        await api.post('/users', payload);
        toast.success('Karyawan berhasil ditambahkan');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>{isEdit ? 'Edit Karyawan' : 'Tambah Karyawan Baru'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={6}>
              <TextField label="Username *" name="username" value={form.username} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid size={6}>
              <TextField
                label={isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password *'}
                name="password" type="password" value={form.password} onChange={handleChange}
                fullWidth required={!isEdit}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="Nama Lengkap *" name="full_name" value={form.full_name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid size={6}>
              <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth />
            </Grid>
            <Grid size={12}>
              <TextField label="Role" name="role" value={form.role} onChange={handleChange} fullWidth select>
                {assignableRoles(currentUserRole).includes('admin') && (
                  <MenuItem value="admin">Admin — Full akses</MenuItem>
                )}
                {assignableRoles(currentUserRole).includes('owner') && (
                  <MenuItem value="owner">Owner — Pemilik usaha</MenuItem>
                )}
                {assignableRoles(currentUserRole).includes('kasir') && (
                  <MenuItem value="kasir">Kasir — Transaksi + Laporan</MenuItem>
                )}
                {assignableRoles(currentUserRole).includes('staff') && (
                  <MenuItem value="staff">Staf — Produk + Laporan</MenuItem>
                )}
                {assignableRoles(currentUserRole).includes('developer') && (
                  <MenuItem value="developer">Developer — Akses teknis</MenuItem>
                )}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Menyimpan...' : isEdit ? 'Perbarui' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
