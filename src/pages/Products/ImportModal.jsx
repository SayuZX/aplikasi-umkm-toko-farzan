import { useState, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function ImportModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const handleDrop = (e) => { e.preventDefault(); const f = e.dataTransfer?.files?.[0]; if (f) setFile(f); };

  const handleUpload = async () => {
    if (!file) { toast.error('Pilih file terlebih dahulu'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
      toast.success(res.data.message);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal import file'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open onClose={result ? onSuccess : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Import Data Barang</DialogTitle>
      <DialogContent>
        <Paper
          variant="outlined"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          sx={{
            p: 4, textAlign: 'center', cursor: 'pointer', borderStyle: 'dashed', borderWidth: 2, borderRadius: 3, mb: 2,
            '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            transition: 'all 0.2s',
          }}
        >
          <InsertDriveFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          {file ? (
            <Typography variant="body2" color="primary" fontWeight={600}>{file.name}</Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">Drag & drop file atau klik untuk memilih</Typography>
              <Typography variant="caption" color="text.disabled">Format: CSV, XLS, XLSX</Typography>
            </>
          )}
          <input ref={fileRef} type="file" accept=".csv,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0])} hidden />
        </Paper>

        <Alert severity="info" variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
          <Typography variant="caption">
            <strong>Format kolom:</strong> Nama Barang, Kode Barang/Barcode, Harga Jual, Harga Modal, Stok, Satuan, Kategori
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: 'text.disabled' }}>
            Alias: nama/name, barcode/kode, harga/price, modal/cost, stok/stock, satuan/unit, kategori/category
          </Typography>
        </Alert>

        {result && (
          <Alert severity={result.imported > 0 ? 'success' : 'warning'} sx={{ borderRadius: 3 }}>
            <Typography variant="body2" fontWeight={600}>Hasil Import:</Typography>
            <Typography variant="body2">Total baris: {result.total ?? (result.imported + result.skipped)}</Typography>
            <Typography variant="body2">Berhasil: {result.imported} produk</Typography>
            <Typography variant="body2">Dilewati: {result.skipped} produk</Typography>
            {result.errors?.length > 0 && (
              <Box sx={{ mt: 1, maxHeight: 160, overflow: 'auto' }}>
                {result.errors.map((err, i) => <Typography key={i} variant="caption" color="error" display="block">• {err}</Typography>)}
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={result ? onSuccess : onClose}>{result ? 'Selesai' : 'Batal'}</Button>
        {!result && (
          <Button variant="contained" onClick={handleUpload} disabled={!file || loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileUploadIcon />}>
            {loading ? 'Mengimport...' : 'Import'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
