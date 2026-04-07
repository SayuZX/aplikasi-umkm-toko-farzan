import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Stack from '@mui/material/Stack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

export default function StockAdjustModal({ product, onClose, onSuccess }) {
  const [type, setType] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (type === 'out' && qty > product.stock) {
      toast.error(`Stok tidak cukup (sisa: ${product.stock})`);
      return;
    }

    setLoading(true);
    try {
      await api.post(`/products/${product.id}/stock`, { type, quantity: qty, note });
      toast.success(`Stok berhasil di${type === 'in' ? 'tambah' : 'kurangi'}`);
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah stok');
    } finally {
      setLoading(false);
    }
  };

  const newStock = type === 'in'
    ? product.stock + (parseInt(quantity) || 0)
    : product.stock - (parseInt(quantity) || 0);

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Atur Stok Manual
          <Typography variant="body2" color="text.secondary">
            {product.name} — Stok saat ini: <strong>{product.stock}</strong> {product.unit}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <div>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Tipe</Typography>
              <ToggleButtonGroup
                value={type}
                exclusive
                onChange={(_, v) => v && setType(v)}
                fullWidth
                color={type === 'in' ? 'success' : 'error'}
              >
                <ToggleButton value="in" sx={{ py: 1.5, gap: 1 }}>
                  <ArrowDownwardIcon fontSize="small" /> Stok Masuk
                </ToggleButton>
                <ToggleButton value="out" sx={{ py: 1.5, gap: 1 }}>
                  <ArrowUpwardIcon fontSize="small" /> Stok Keluar
                </ToggleButton>
              </ToggleButtonGroup>
            </div>

            <TextField
              label="Jumlah"
              type="number"
              inputProps={{ min: 1 }}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              autoFocus
              fullWidth
              sx={{ '& input': { fontSize: '1.2rem' } }}
            />

            {quantity && parseInt(quantity) > 0 && (
              <Alert severity={type === 'in' ? 'success' : 'error'} variant="filled" sx={{ fontWeight: 500 }}>
                Stok baru: {product.stock} → <strong style={{ fontSize: '1.1rem' }}>{newStock}</strong> {product.unit}
              </Alert>
            )}

            <TextField
              label="Keterangan (opsional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Misal: Restok dari supplier"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={onClose}>Batal</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !quantity || parseInt(quantity) <= 0}
            color={type === 'in' ? 'success' : 'error'}
          >
            {loading ? 'Memproses...' : type === 'in' ? 'Tambah Stok' : 'Kurangi Stok'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
