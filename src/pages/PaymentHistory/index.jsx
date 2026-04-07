import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

// MUI Core
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Fade from '@mui/material/Fade';
import Collapse from '@mui/material/Collapse';
import Alert from '@mui/material/Alert';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentsIcon from '@mui/icons-material/Payments';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ImageIcon from '@mui/icons-material/Image';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LinearProgress from '@mui/material/LinearProgress';
import ConfirmDialog from '../../components/ConfirmDialog';

// ─── Helpers ───
const formatRp = (n) => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
const formatDate = (s) => {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatDateTime = (s) => {
  if (!s) return '-';
  return new Date(s).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const formatTime = (s) => {
  if (!s) return '';
  return new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

// ─── Constants ───
const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', kasbon: 'Kasbon' };
const METHOD_COLORS = { cash: 'success', qris: 'info', transfer: 'primary', kasbon: 'warning' };
const METHOD_ICONS = {
  cash: <PaymentsIcon fontSize="small" />,
  qris: <QrCodeIcon fontSize="small" />,
  transfer: <AccountBalanceIcon fontSize="small" />,
  kasbon: <CreditCardIcon fontSize="small" />,
};
const METHOD_ICONS_LG = {
  cash: <LocalAtmIcon />,
  qris: <QrCodeIcon />,
  transfer: <AccountBalanceIcon />,
  kasbon: <CreditCardIcon />,
};
const STATUS_COLORS = { paid: 'success', pending: 'warning', cancelled: 'error' };
const STATUS_LABELS = { paid: 'Lunas', pending: 'Menunggu', cancelled: 'Dibatalkan' };

// ─── Summary Card ───
function SummaryCard({ method, count, total_paid, isLoading }) {
  const theme = useTheme();
  const colorKey = METHOD_COLORS[method] || 'primary';
  const mainColor = theme.palette[colorKey]?.main || theme.palette.primary.main;

  if (isLoading) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1.5 }} />
          <Skeleton width="60%" height={18} sx={{ mb: 0.5 }} />
          <Skeleton width="80%" height={28} sx={{ mb: 0.5 }} />
          <Skeleton width="40%" height={14} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        position: 'relative',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: mainColor,
          boxShadow: `0 0 0 1px ${alpha(mainColor, 0.2)}`,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <Box sx={{ height: 3, bgcolor: mainColor }} />
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(mainColor, 0.1),
            color: mainColor,
            mb: 1.5,
          }}
        >
          {METHOD_ICONS_LG[method] || <PaymentsIcon />}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ mb: 0.25 }}>
          {METHOD_LABELS[method] || method}
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.5, letterSpacing: '-0.02em' }}>
          {formatRp(total_paid)}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TrendingUpIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {count} transaksi
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Detail Modal ───
function DetailModal({ open, onClose, id, onStatusChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [proofPreview, setProofPreview] = useState(false);
  const [confirmLunas, setConfirmLunas] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore.getState();
  const isAdmin = ['admin', 'owner', 'developer'].includes(user?.role);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!open || !id) return;
    setLoading(true);
    setModalError('');
    setData(null);
    api.get(`/payments/${id}`)
      .then((r) => setData(r.data))
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setModalError('Data pembayaran tidak ditemukan');
        } else if (status === 400) {
          setModalError('ID pembayaran tidak valid');
        } else {
          setModalError('Terjadi kesalahan server, silakan coba lagi');
          toast.error('Gagal memuat detail pembayaran');
        }
      })
      .finally(() => setLoading(false));
    return () => { setData(null); setModalError(''); setProofPreview(false); };
  }, [open, id]);

  const handleUploadProof = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 10 MB max, only images
    if (file.size > 10 * 1024 * 1024) { toast.error('Ukuran file maksimal 10 MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Hanya JPG, PNG, atau WebP yang diizinkan'); return; }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('proof', file);
      const res = await api.put(`/transactions/${id}/proof`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setData((d) => ({ ...d, payment_proof: res.data?.payment_proof || res.data }));
      toast.success('Bukti pembayaran berhasil diunggah');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleConfirmPayment = async () => {
    setConfirmLunas(false);
    setConfirming(true);
    try {
      await api.put(`/transactions/${id}/verify`);
      setData((d) => ({ ...d, status: 'paid' }));
      toast.success('Pembayaran berhasil dikonfirmasi sebagai Lunas');
      if (onStatusChange) onStatusChange(id, 'paid');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi pembayaran');
    } finally {
      setConfirming(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const kasirName = typeof data.kasir === 'object' ? data.kasir?.name : data.kasir;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>Struk ${data.reference_number}</title>
    <style>
      body{font-family:'Courier New',monospace;width:58mm;margin:0 auto;padding:8px;font-size:12px}
      .c{text-align:center}.b{font-weight:bold}.hr{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between;padding:2px 0}
      .big{font-size:16px}
      @media print{@page{margin:0}body{margin:0}}
    </style></head><body>
    <div class="c b">STRUK PEMBAYARAN</div>
    <div class="hr"></div>
    <div class="row"><span>No. Trx</span><span class="b">${data.reference_number}</span></div>
    <div class="row"><span>Waktu</span><span>${formatDateTime(data.paid_at)}</span></div>
    <div class="row"><span>Kasir</span><span>${kasirName}</span></div>
    ${data.customer_name && data.customer_name !== '-' ? `<div class="row"><span>Pelanggan</span><span>${data.customer_name}</span></div>` : ''}
    <div class="hr"></div>
    ${data.items?.map(i => `<div class="row"><span>${i.name} x${i.qty}</span><span>${formatRp(i.subtotal)}</span></div>`).join('') || ''}
    <div class="hr"></div>
    <div class="row"><span>Subtotal</span><span>${formatRp(data.amount)}</span></div>
    ${data.admin_fee > 0 ? `<div class="row"><span>Pajak/Admin</span><span>${formatRp(data.admin_fee)}</span></div>` : ''}
    <div class="hr"></div>
    <div class="row b"><span>TOTAL</span><span class="big">${formatRp(data.total_paid)}</span></div>
    <div class="row"><span>Metode</span><span>${METHOD_LABELS[data.method] || data.method}</span></div>
    ${data.change_amount > 0 ? `<div class="row"><span>Kembalian</span><span>${formatRp(data.change_amount)}</span></div>` : ''}
    <div class="hr"></div>
    <div class="c" style="margin-top:8px;font-size:11px;color:#666">Terima kasih atas kunjungan Anda</div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  const methodColor = data ? (theme.palette[METHOD_COLORS[data.method]]?.main || theme.palette.primary.main) : theme.palette.primary.main;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isSmall}
      TransitionComponent={Fade}
      PaperProps={{
        sx: { borderRadius: isSmall ? 0 : 5, overflow: 'hidden' },
      }}
    >
      {data && <Box sx={{ height: 4, bgcolor: methodColor }} />}

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2, px: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(methodColor, 0.1),
              color: methodColor,
            }}
          >
            <ReceiptLongIcon />
          </Box>
          <Box>
            <Typography fontWeight={700} variant="subtitle1" lineHeight={1.2}>Detail Pembayaran</Typography>
            {data && (
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {data.reference_number}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 0 }}>
        {loading && (
          <Stack spacing={2} sx={{ py: 4 }}>
            <Skeleton variant="rounded" height={48} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={80} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={60} sx={{ borderRadius: 3 }} />
          </Stack>
        )}
        {!loading && modalError && (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
              {modalError}
            </Typography>
            <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: 2.5 }}>
              Tutup
            </Button>
          </Box>
        )}
        {!loading && data && (
          <Stack spacing={2.5} sx={{ pb: 2 }}>
            {/* Status & Method Banner */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(methodColor, 0.06),
                border: '1px solid',
                borderColor: alpha(methodColor, 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Chip
                  icon={METHOD_ICONS[data.method]}
                  label={METHOD_LABELS[data.method] || data.method}
                  color={METHOD_COLORS[data.method] || 'default'}
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                {data.transfer_bank && (
                  <Typography variant="body2" color="text.secondary">• {data.transfer_bank}</Typography>
                )}
              </Stack>
              <Chip
                label={STATUS_LABELS[data.status] || data.status}
                color={STATUS_COLORS[data.status] || 'default'}
                size="small"
                sx={{ fontWeight: 600 }}
              />
            </Paper>

            {/* Info Grid */}
            <Grid container spacing={2}>
              {[
                { icon: <AccessTimeIcon sx={{ fontSize: 18 }} />, label: 'Waktu Bayar', value: formatDateTime(data.paid_at) },
                { icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />, label: 'Kasir', value: typeof data.kasir === 'object' ? data.kasir?.name : data.kasir },
                { icon: <StorefrontIcon sx={{ fontSize: 18 }} />, label: 'Lokasi', value: (typeof data.location === 'object' ? data.location?.name : data.location) || '-' },
                { icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />, label: 'Pelanggan', value: data.customer_name || '-' },
              ].map((item, i) => (
                <Grid key={i} size={{ xs: 6 }}>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <Box sx={{ color: 'text.secondary', mt: 0.2 }}>{item.icon}</Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" lineHeight={1.2}>{item.label}</Typography>
                      <Typography variant="body2" fontWeight={600} lineHeight={1.3}>{item.value}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>

            {data.payment_ref && (
              <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                  Ref: <strong style={{ fontFamily: 'monospace' }}>{data.payment_ref}</strong>
                </Typography>
              </Paper>
            )}

            {/* Items List */}
            {data.items && data.items.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Item Belanja
                </Typography>
                <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  {data.items.map((item, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 2,
                        py: 1.25,
                        borderBottom: i < data.items.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.qty} × {formatRp(item.price)}
                          {item.discount > 0 && <span style={{ color: '#EF4444' }}> (-{formatRp(item.discount)})</span>}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600} sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                        {formatRp(item.subtotal)}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}

            {/* Payment Summary */}
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <SummaryRow label="Subtotal" value={formatRp(data.amount)} />
                {data.admin_fee > 0 && <SummaryRow label="Pajak / Admin" value={formatRp(data.admin_fee)} secondary />}
              </Box>
              <Divider />
              <Box sx={{ px: 2, py: 1.5, bgcolor: alpha(methodColor, 0.04) }}>
                <SummaryRow label="Total Dibayar" value={formatRp(data.total_paid)} bold color={methodColor} />
                {data.change_amount > 0 && <SummaryRow label="Kembalian" value={formatRp(data.change_amount)} success />}
              </Box>
            </Paper>

            {data.notes && (
              <Paper elevation={0} sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>Catatan</Typography>
                <Typography variant="body2">{data.notes}</Typography>
              </Paper>
            )}

            {/* Payment Proof Section — only for QRIS/Transfer */}
            {(data.method === 'qris' || data.method === 'transfer') && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Bukti Pembayaran
                </Typography>
                {data.payment_proof ? (
                  <Paper
                    variant="outlined"
                    sx={{ borderRadius: 3, overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => setProofPreview(true)}
                  >
                    <Box sx={{ position: 'relative', bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 2, gap: 1 }}>
                      <ImageIcon sx={{ fontSize: 32, color: 'success.main' }} />
                      <Typography variant="caption" color="success.main" fontWeight={600}>Bukti sudah diunggah — klik untuk lihat</Typography>
                      {data.status === 'paid' && (
                        <Chip icon={<CheckCircleIcon />} label="Sudah Dikonfirmasi" color="success" size="small" sx={{ mt: 0.5 }} />
                      )}
                    </Box>
                  </Paper>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{ borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                      borderStyle: 'dashed', cursor: data.status === 'pending' ? 'pointer' : 'default',
                      '&:hover': data.status === 'pending' ? { bgcolor: 'action.hover' } : {},
                    }}
                    onClick={() => data.status === 'pending' && fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <Typography variant="caption" color="text.secondary">Mengunggah...</Typography>
                        <LinearProgress sx={{ width: '100%', borderRadius: 1 }} />
                      </>
                    ) : (
                      <>
                        <HourglassEmptyIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                        <Typography variant="caption" color="text.secondary" textAlign="center">
                          {data.status === 'pending' ? 'Belum ada bukti — klik untuk unggah foto' : 'Belum ada bukti pembayaran'}
                        </Typography>
                      </>
                    )}
                  </Paper>
                )}
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleUploadProof} />
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handlePrint}
          variant="outlined"
          size="small"
          startIcon={<PrintIcon />}
          disabled={!data}
          sx={{ borderRadius: 2.5 }}
        >
          Cetak
        </Button>
        {/* Upload proof button for non-admin on pending */}
        {data && data.status === 'pending' && (data.method === 'qris' || data.method === 'transfer') && (
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<UploadFileIcon />}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: 2.5 }}
          >
            {uploading ? 'Mengunggah...' : 'Unggah Bukti'}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {/* Confirm button for admin on pending */}
        {data && data.status === 'pending' && isAdmin && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={confirming ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
            disabled={confirming}
            onClick={() => setConfirmLunas(true)}
            sx={{ borderRadius: 2.5 }}
          >
            {confirming ? 'Memproses...' : 'Konfirmasi Lunas'}
          </Button>
        )}
        <Button onClick={onClose} variant={data?.status === 'pending' ? 'outlined' : 'contained'} size="small" sx={{ borderRadius: 2.5, px: 3 }}>
          Tutup
        </Button>
      </DialogActions>

      {/* Proof Image Preview Dialog */}
      <Dialog open={proofPreview} onClose={() => setProofPreview(false)} maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, px: 2 }}>
          <Typography fontWeight={600}>Bukti Pembayaran</Typography>
          <IconButton size="small" onClick={() => setProofPreview(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1 }}>
          {data?.payment_proof && (
            <Box
              component="img"
              src={`${useAuthStore.getState().serverUrl}/uploads${data.payment_proof}`}
              alt="Bukti Pembayaran"
              sx={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', borderRadius: 2 }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmLunas}
        title="Konfirmasi Pembayaran"
        message="Konfirmasi pembayaran sebagai LUNAS?"
        confirmText="OK"
        cancelText="Cancel"
        loading={confirming}
        onConfirm={handleConfirmPayment}
        onCancel={() => setConfirmLunas(false)}
      />
    </Dialog>
  );
}

// ─── Summary Row helper ───
function SummaryRow({ label, value, bold, secondary, success, color }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.4 }}>
      <Typography
        variant="body2"
        color={bold ? 'text.primary' : 'text.secondary'}
        fontWeight={bold ? 700 : 400}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        fontWeight={bold ? 800 : 600}
        color={bold && color ? color : success ? 'success.main' : secondary ? 'warning.main' : 'text.primary'}
        sx={bold ? { fontSize: '1rem' } : {}}
      >
        {value}
      </Typography>
    </Box>
  );
}

// ─── Table Skeleton ───
function TableSkeleton({ columns = 9, rows = 8 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: columns }).map((_, j) => (
        <TableCell key={j}>
          <Skeleton variant="text" width={j === 0 ? 80 : j === 4 || j === 6 ? 90 : 70} height={20} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ─── Export CSV ───
function exportCSV(data) {
  const headers = ['Tanggal', 'No Transaksi', 'Pelanggan', 'Kasir', 'Metode', 'Total Transaksi', 'Admin', 'Total Dibayar', 'Status'];
  const csvRows = [
    headers.join(','),
    ...data.map(r => [
      formatDate(r.date),
      r.reference_number,
      `"${(r.customer_name || '-').replace(/"/g, '""')}"`,
      `"${(r.kasir || '-').replace(/"/g, '""')}"`,
      METHOD_LABELS[r.method] || r.method,
      r.amount,
      r.admin_fee,
      r.total_paid,
      STATUS_LABELS[r.status] || r.status,
    ].join(',')),
  ];
  const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `riwayat-pembayaran-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════ MAIN COMPONENT ═══════════════════════
export default function PaymentHistory() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Sort
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Filters
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);

  const searchTimer = useRef(null);

  const fetchPayments = useCallback(async (pg = 0) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page: pg + 1,
        limit: rowsPerPage,
        ...(search && { search }),
        ...(method && { method }),
        ...(status && { status }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };
      const res = await api.get('/payments', { params });
      setRows(res.data.data);
      setTotal(res.data.total);
    } catch {
      setErrorMsg('Gagal memuat data, silakan coba lagi');
      toast.error('Gagal memuat riwayat pembayaran');
    } finally {
      setLoading(false);
    }
  }, [rowsPerPage, search, method, status, dateFrom, dateTo]);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const params = {
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo }),
      };
      const res = await api.get('/payments/summary', { params });
      setSummary(res.data || []);
    } catch { /* silent */ }
    finally { setSummaryLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments(0);
    fetchSummary();
    setPage(0);
  }, [method, status, dateFrom, dateTo]);

  useEffect(() => {
    fetchPayments(page);
  }, [page, rowsPerPage]);

  // Debounced search
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(0);
      fetchPayments(0);
    }, 400);
  };

  const handleReset = () => {
    setSearch('');
    setMethod('');
    setStatus('');
    setDateFrom(firstOfMonth);
    setDateTo(today);
    setSortField('date');
    setSortDir('desc');
    setPage(0);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Client-side sort for current page
  const sortedRows = [...rows].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'date') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalSummary = summary.reduce((acc, s) => acc + (s.total_paid || 0), 0);
  const totalCount = summary.reduce((acc, s) => acc + (s.count || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, height: '100%', overflow: 'auto' }}>
      {/* ─── Page Header ─── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
            }}
          >
            <ReceiptLongIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2} sx={{ letterSpacing: '-0.02em' }}>
              Riwayat Pembayaran
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Export CSV">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportCSV(rows)}
                disabled={rows.length === 0}
                sx={{ borderRadius: 2.5, textTransform: 'none' }}
              >
                {isDesktop && 'Export'}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={() => { fetchPayments(page); fetchSummary(); }}
              disabled={loading}
              sx={{
                bgcolor: 'action.hover',
                borderRadius: 2.5,
                transition: 'transform 0.3s',
                '&:hover': { transform: 'rotate(90deg)' },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      

      {/* ─── Filter Section ─── */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          onClick={() => setFilterOpen(!filterOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2.5,
            py: 1.5,
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover': { bgcolor: 'action.hover' },
            transition: 'background 0.15s',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterListIcon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              Filter & Pencarian
            </Typography>
            {(method || status || search) && (
              <Chip
                label={[method && METHOD_LABELS[method], status && STATUS_LABELS[status], search && `"${search}"`].filter(Boolean).join(', ')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 22, fontSize: 11 }}
              />
            )}
          </Stack>
          {filterOpen ? <ExpandLessIcon fontSize="small" color="action" /> : <ExpandMoreIcon fontSize="small" color="action" />}
        </Box>

        <Collapse in={filterOpen}>
          <Divider />
          <Box sx={{ p: 2.5 }}>
            <Grid container spacing={2} alignItems="flex-end">
              {/* Search */}
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Cari No. Transaksi / Nama"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Ketik untuk mencari..."
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* Method */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  select
                  label="Metode Bayar"
                  value={method}
                  onChange={(e) => { setMethod(e.target.value); setPage(0); }}
                >
                  <MenuItem value="">Semua Metode</MenuItem>
                  <MenuItem value="cash">
                    <Stack direction="row" alignItems="center" spacing={1}><PaymentsIcon sx={{ fontSize: 16 }} /><span>Tunai</span></Stack>
                  </MenuItem>
                  <MenuItem value="qris">
                    <Stack direction="row" alignItems="center" spacing={1}><QrCodeIcon sx={{ fontSize: 16 }} /><span>QRIS</span></Stack>
                  </MenuItem>
                  <MenuItem value="transfer">
                    <Stack direction="row" alignItems="center" spacing={1}><AccountBalanceIcon sx={{ fontSize: 16 }} /><span>Transfer</span></Stack>
                  </MenuItem>
                  <MenuItem value="kasbon">
                    <Stack direction="row" alignItems="center" spacing={1}><CreditCardIcon sx={{ fontSize: 16 }} /><span>Kasbon</span></Stack>
                  </MenuItem>
                </TextField>
              </Grid>

              {/* Status */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  select
                  label="Status"
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setPage(0); }}
                >
                  <MenuItem value="">Semua Status</MenuItem>
                  <MenuItem value="paid">Lunas</MenuItem>
                  <MenuItem value="pending">Menunggu</MenuItem>
                  <MenuItem value="cancelled">Dibatalkan</MenuItem>
                </TextField>
              </Grid>

              {/* Date From */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  label="Dari Tanggal"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon sx={{ fontSize: 16 }} color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* Date To */}
              <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  type="date"
                  label="Sampai Tanggal"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarMonthIcon sx={{ fontSize: 16 }} color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* Reset */}
              <Grid size={{ xs: 12, sm: 4, md: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleReset}
                  fullWidth
                  sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600 }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* ─── Error State ─── */}
      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => { fetchPayments(page); setErrorMsg(''); }}>
              Coba Lagi
            </Button>
          }
        >
          {errorMsg}
        </Alert>
      )}

      {/* ─── Data Table ─── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    fontWeight: 700,
                    bgcolor: 'background.paper',
                    py: 1.75,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: 'text.secondary',
                    borderBottom: '2px solid',
                    borderColor: 'divider',
                  },
                }}
              >
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'date'}
                    direction={sortField === 'date' ? sortDir : 'desc'}
                    onClick={() => handleSort('date')}
                  >
                    Tanggal
                  </TableSortLabel>
                </TableCell>
                <TableCell>No. Transaksi</TableCell>
                <TableCell>Pelanggan</TableCell>
                <TableCell>Metode</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'amount'}
                    direction={sortField === 'amount' ? sortDir : 'desc'}
                    onClick={() => handleSort('amount')}
                  >
                    Total
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">Admin</TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={sortField === 'total_paid'}
                    direction={sortField === 'total_paid' ? sortDir : 'desc'}
                    onClick={() => handleSort('total_paid')}
                  >
                    Dibayar
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center" sx={{ width: 60 }}>Aksi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Loading skeleton */}
              {loading && <TableSkeleton />}

              {/* Empty state */}
              {!loading && rows.length === 0 && !errorMsg && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Fade in>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: 'action.hover',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 1,
                          }}
                        >
                          <ReceiptLongIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                        </Box>
                        <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                          Belum ada riwayat pembayaran
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 300 }}>
                          Transaksi pembayaran yang telah dilakukan akan tampil di sini
                        </Typography>
                      </Box>
                    </Fade>
                  </TableCell>
                </TableRow>
              )}

              {/* Data rows */}
              {!loading && sortedRows.map((row) => {
                const isRecent = Date.now() - new Date(row.paid_at).getTime() < 3600000;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => setDetailId(row.id)}
                    sx={{
                      cursor: 'pointer',
                      '& td': { py: 1.5 },
                      ...(isRecent && {
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.07) },
                      }),
                      transition: 'background 0.15s',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
                        {formatDate(row.date)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(row.paid_at)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem' }}>
                        {row.reference_number}
                      </Typography>
                      {row.transfer_bank && (
                        <Typography variant="caption" color="text.secondary">{row.transfer_bank}</Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 140 }}>
                        {row.customer_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{row.kasir}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        icon={METHOD_ICONS[row.method]}
                        label={METHOD_LABELS[row.method] || row.method}
                        color={METHOD_COLORS[row.method] || 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{formatRp(row.amount)}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" color={row.admin_fee > 0 ? 'warning.main' : 'text.disabled'}>
                        {row.admin_fee > 0 ? formatRp(row.admin_fee) : '—'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {formatRp(row.total_paid)}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={STATUS_LABELS[row.status] || row.status}
                        color={STATUS_COLORS[row.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', minWidth: 70 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Tooltip title="Lihat Detail">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setDetailId(row.id); }}
                          sx={{
                            bgcolor: 'action.hover',
                            borderRadius: 2,
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' },
                          }}
                        >
                          <InfoOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage="Baris per halaman:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} dari ${count}`}
          sx={{ '& .MuiTablePagination-toolbar': { px: 2 } }}
        />
      </Paper>

      {/* Detail Modal */}
      <DetailModal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        id={detailId}
        onStatusChange={(id, newStatus) => {
          setRows((prev) => prev.map((r) => r.id === id ? { ...r, status: newStatus } : r));
        }}
      />
    </Box>
  );
}
