import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ProductForm from './ProductForm';
import ImportModal from './ImportModal';
import StockHistoryModal from './StockHistoryModal';
import StockAdjustModal from './StockAdjustModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import InventoryIcon from '@mui/icons-material/Inventory';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stockHistoryProduct, setStockHistoryProduct] = useState(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { search, page, limit: 20 } });
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      toast.error('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/products/${deleteConfirm.id}`);
      toast.success('Produk berhasil dihapus');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus produk');
    }
    setDeleteConfirm(null);
  };

  const handleFormSuccess = () => { setShowForm(false); setEditProduct(null); fetchProducts(); };
  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Master Data Barang</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => setShowImport(true)}>
            Import
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditProduct(null); setShowForm(true); }}>
            Tambah Barang
          </Button>
        </Box>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Cari nama barang atau kode barcode..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        sx={{ mb: 2 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> } }}
      />

      {/* Table */}
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Barcode</TableCell>
              <TableCell>Nama Barang</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Harga</TableCell>
              <TableCell align="center">Stok</TableCell>
              <TableCell align="center">Satuan</TableCell>
              <TableCell align="center">Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, idx) => (
              <TableRow key={product.id} hover>
                <TableCell>{(page - 1) * 20 + idx + 1}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{product.barcode || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{product.category || '-'}</TableCell>
                <TableCell align="right">{formatRp(product.price)}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={product.stock}
                    size="small"
                    color={product.stock <= 5 ? 'error' : 'success'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center">{product.unit}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Tooltip title="Atur Stok">
                      <IconButton size="small" color="success" onClick={() => setStockAdjustProduct(product)}>
                        <InventoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Riwayat Stok">
                      <IconButton size="small" color="secondary" onClick={() => setStockHistoryProduct(product)}>
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="primary" onClick={() => { setEditProduct(product); setShowForm(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Hapus">
                      <IconButton size="small" color="error" onClick={() => setDeleteConfirm(product)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  {search ? 'Tidak ada produk yang cocok' : 'Belum ada data barang'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}

      {showForm && <ProductForm product={editProduct} onClose={() => { setShowForm(false); setEditProduct(null); }} onSuccess={handleFormSuccess} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onSuccess={() => { setShowImport(false); fetchProducts(); }} />}
      <ConfirmDialog open={!!deleteConfirm} title="Hapus Produk" message={`Yakin ingin menghapus "${deleteConfirm?.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} />
      {stockHistoryProduct && <StockHistoryModal product={stockHistoryProduct} onClose={() => setStockHistoryProduct(null)} />}
      {stockAdjustProduct && <StockAdjustModal product={stockAdjustProduct} onClose={() => setStockAdjustProduct(null)} onSuccess={() => { setStockAdjustProduct(null); fetchProducts(); }} />}
    </Box>
  );
}
