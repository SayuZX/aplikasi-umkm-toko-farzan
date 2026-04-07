import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Tooltip from '@mui/material/Tooltip';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

export default function StockHistoryModal({ product, onClose }) {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock-logs', { params: { product_id: product.id, page, limit: 20 } });
      setLogs(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) { toast.error('Gagal memuat riwayat stok'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page]);

  const refLabels = { transaction: 'Penjualan', cancel: 'Batal Transaksi', manual: 'Manual', import: 'Import' };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Riwayat Stok
        <Typography variant="body2" color="text.secondary">
          {product.name} ({product.barcode || 'Tanpa barcode'}) — Stok saat ini: <strong>{product.stock}</strong>
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {loading && logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>Memuat...</Box>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>Belum ada riwayat perubahan stok</Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tanggal</TableCell>
                  <TableCell align="center">Tipe</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Sebelum</TableCell>
                  <TableCell align="right">Sesudah</TableCell>
                  <TableCell>Referensi</TableCell>
                  <TableCell>Keterangan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ fontSize: '0.75rem' }}>
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={log.type === 'in' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                        label={log.type === 'in' ? 'Masuk' : 'Keluar'}
                        size="small"
                        color={log.type === 'in' ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{log.quantity}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>{log.stock_before}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{log.stock_after}</TableCell>
                    <TableCell>
                      <Chip label={refLabels[log.reference_type] || log.reference_type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.note || '-'}>
                        <Typography variant="caption" noWrap sx={{ maxWidth: 120, display: 'block' }}>{log.note || '-'}</Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
        )}
        <Button variant="outlined" onClick={onClose}>Tutup</Button>
      </DialogActions>
    </Dialog>
  );
}
