import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Drawer from '@mui/material/Drawer';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import BarcodeScanner from '../../components/BarcodeScanner';

const units = ['pcs', 'kg', 'liter', 'karung', 'box', 'lusin', 'pack'];

export default function ProductForm({ product, onClose, onSuccess }) {
  const [form, setForm] = useState({ barcode: '', name: '', price: '', cost_price: '', stock: '', unit: 'pcs', category: '' });
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const isEdit = !!product;

  useEffect(() => {
    if (product) {
      setForm({ barcode: product.barcode || '', name: product.name, price: product.price, cost_price: product.cost_price || '', stock: product.stock, unit: product.unit, category: product.category || '' });
    }
  }, [product]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleBarcodeScanned = async (code) => {
    setShowScanner(false);
    // Check if barcode already exists
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`, { _silent404: true });
      const existing = res.data;
      if (existing && (!isEdit || existing.id !== product?.id)) {
        toast(`Barcode ini sudah dipakai: "${existing.name}"`, { icon: '⚠️' });
      }
    } catch { /* not found = OK */ }
    setForm((prev) => ({ ...prev, barcode: code }));
    toast.success(`Barcode terisi: ${code}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { toast.error('Nama dan harga wajib diisi'); return; }
    setLoading(true);
    try {
      if (isEdit) { await api.put(`/products/${product.id}`, form); toast.success('Produk berhasil diperbarui'); }
      else { await api.post('/products', form); toast.success('Produk berhasil ditambahkan'); }
      onSuccess();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan produk'); }
    finally { setLoading(false); }
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 420 },
            borderRadius: '16px 0 0 16px',
            top: window.electronAPI?.isElectron ? '36px' : 0,
            height: window.electronAPI?.isElectron ? 'calc(100vh - 36px)' : '100vh',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{isEdit ? 'Edit Barang' : 'Tambah Barang Baru'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid size={6}>
              <TextField
                label="Kode/Barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                fullWidth
                placeholder="Scan atau ketik"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Scan barcode via kamera">
                          <IconButton size="small" edge="end" onClick={() => setShowScanner(true)}>
                            <QrCodeScannerIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={6}>
              <TextField label="Kategori" name="category" value={form.category} onChange={handleChange} fullWidth placeholder="Misal: Sembako" />
            </Grid>
            <Grid size={12}>
              <TextField label="Nama Barang *" name="name" value={form.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid size={4}>
              <TextField label="Harga Jual *" name="price" type="number" value={form.price} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid size={4}>
              <TextField label="Harga Modal" name="cost_price" type="number" value={form.cost_price} onChange={handleChange} fullWidth placeholder="HPP" />
            </Grid>
            <Grid size={4}>
              <TextField label="Stok" name="stock" type="number" value={form.stock} onChange={handleChange} fullWidth />
            </Grid>
            <Grid size={4}>
              <TextField label="Satuan" name="unit" value={form.unit} onChange={handleChange} fullWidth select>
                {units.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={onClose}>Batal</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Perbarui' : 'Simpan'}
          </Button>
        </DialogActions>
      </form>

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Scan Barcode Barang"
        mode="product"
      />
    </Drawer>
  );
}
