import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Pagination from '@mui/material/Pagination';
import Tooltip from '@mui/material/Tooltip';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import WifiIcon from '@mui/icons-material/Wifi';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import RouterIcon from '@mui/icons-material/Router';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HomeIcon from '@mui/icons-material/Home';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';

const formatRp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const formatDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const ICON_MAP = {
  PhoneAndroid: <PhoneAndroidIcon sx={{ fontSize: 32 }} />,
  Wifi: <WifiIcon sx={{ fontSize: 32 }} />,
  AccountBalanceWallet: <AccountBalanceWalletIcon sx={{ fontSize: 32 }} />,
  ElectricBolt: <ElectricBoltIcon sx={{ fontSize: 32 }} />,
  Receipt: <ReceiptIcon sx={{ fontSize: 32 }} />,
  Water: <WaterDropIcon sx={{ fontSize: 32 }} />,
  Router: <RouterIcon sx={{ fontSize: 32 }} />,
  HealthAndSafety: <HealthAndSafetyIcon sx={{ fontSize: 32 }} />,
  CreditCard: <CreditCardIcon sx={{ fontSize: 32 }} />,
  Home: <HomeIcon sx={{ fontSize: 32 }} />,
};

export default function LayananDigital() {
  const [tab, setTab] = useState(0); // 0=layanan, 1=riwayat
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [customerInput, setCustomerInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [serviceFeeConfig, setServiceFeeConfig] = useState({ type: 'fixed', value: 0, active: false });
  // History
  const [transactions, setTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const calcServiceFee = useCallback((price, adminFee) => {
    if (!serviceFeeConfig.active) return 0;
    const base = Number(price || 0) + Number(adminFee || 0);
    if (serviceFeeConfig.type === 'percentage') return Math.round(base * serviceFeeConfig.value / 100);
    return Number(serviceFeeConfig.value || 0);
  }, [serviceFeeConfig]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/digital-services/categories');
      setCategories(res.data?.data || res.data || []);
    } catch {
      toast.error('Gagal memuat kategori layanan');
    }
    setLoading(false);
  }, []);

  // Fetch products for selected category
  const fetchProducts = useCallback(async (catId) => {
    setProductsLoading(true);
    try {
      const res = await api.get('/digital-services/products', { params: { category_id: catId } });
      setProducts(res.data?.data || res.data || []);
    } catch {
      toast.error('Gagal memuat produk');
    }
    setProductsLoading(false);
  }, []);

  // Fetch transaction history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get('/digital-services/transactions', {
        params: { page: historyPage, limit: 20, search: historySearch || undefined, _t: Date.now() },
      });
      const d = res.data || {};
      setTransactions(d.data || []);
      setHistoryTotal(d.totalPages || 1);
    } catch {
      toast.error('Gagal memuat riwayat transaksi');
    }
    setHistoryLoading(false);
  }, [historyPage, historySearch, historyRefresh]);

  useEffect(() => {
    fetchCategories();
    api.get('/settings').then(res => {
      const d = res.data || {};
      setServiceFeeConfig({
        type: d.digital_service_fee_type || 'fixed',
        value: Number(d.digital_service_fee_value) || 0,
        active: d.digital_service_fee_active === 'true',
      });
    }).catch(() => {});
  }, [fetchCategories]);
  useEffect(() => { if (selectedCategory) fetchProducts(selectedCategory.id); }, [selectedCategory, fetchProducts]);
  useEffect(() => { if (tab === 1) fetchHistory(); }, [tab, fetchHistory]);

  // Group products by provider
  const groupedProducts = useMemo(() => {
    const map = {};
    products.forEach(p => {
      if (!map[p.provider]) map[p.provider] = [];
      map[p.provider].push(p);
    });
    return map;
  }, [products]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setSelectedProduct(null);
    setCustomerInput('');
    setCustomerName('');
    setReceipt(null);
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSelectedProduct(null);
    setProducts([]);
    setCustomerInput('');
    setCustomerName('');
    setReceipt(null);
  };

  const handleSelectProduct = (product) => {
    if (!customerInput.trim()) {
      toast.error(`Masukkan ${selectedCategory?.input_label || 'nomor tujuan'} terlebih dahulu`);
      return;
    }
    setSelectedProduct(product);
    setPaymentMethod('cash');
    setConfirmDialog(true);
  };

  const handleConfirmTransaction = async () => {
    setProcessing(true);
    try {
      const res = await api.post('/digital-services/transactions', {
        product_id: selectedProduct.id,
        customer_identifier: customerInput.trim(),
        customer_name: customerName.trim() || undefined,
        payment_method: paymentMethod,
      });
      const trx = res.data?.data || res.data;
      setReceipt(trx);
      setConfirmDialog(false);
      setSelectedProduct(null);
      setHistoryRefresh((c) => c + 1);
      toast.success('Transaksi berhasil!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaksi gagal');
    }
    setProcessing(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Disalin ke clipboard');
  };

  const handlePrintReceipt = () => {
    if (!receipt) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    const total = Number(receipt.price || 0) + Number(receipt.admin_fee || 0) + Number(receipt.service_fee || 0);
    win.document.write(`<html><head><title>Struk Layanan Digital</title>
      <style>body{font-family:monospace;padding:20px;max-width:350px;margin:0 auto}
      .c{text-align:center}.hr{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between;margin:4px 0}
      .b{font-weight:bold}.big{font-size:18px}</style></head><body>
      <div class="c b big">LAYANAN DIGITAL</div>
      <div class="hr"></div>
      <div class="row"><span>No. Trx</span><span class="b">${receipt.trx_no}</span></div>
      <div class="row"><span>Waktu</span><span>${formatDate(receipt.created_at)}</span></div>
      <div class="hr"></div>
      <div class="row"><span>Produk</span><span>${receipt.product_name}</span></div>
      <div class="row"><span>Provider</span><span>${receipt.provider}</span></div>
      <div class="row"><span>Tujuan</span><span class="b">${receipt.customer_identifier}</span></div>
      ${receipt.nominal > 0 ? `<div class="row"><span>Nominal</span><span>${formatRp(receipt.nominal)}</span></div>` : ''}
      <div class="row"><span>Harga</span><span>${formatRp(receipt.price)}</span></div>
      ${receipt.admin_fee > 0 ? `<div class="row"><span>Admin</span><span>${formatRp(receipt.admin_fee)}</span></div>` : ''}
      ${receipt.service_fee > 0 ? `<div class="row"><span>Biaya Layanan</span><span>${formatRp(receipt.service_fee)}</span></div>` : ''}
      <div class="hr"></div>
      <div class="row b"><span>TOTAL</span><span class="big">${formatRp(total)}</span></div>
      <div class="row"><span>Metode</span><span>${receipt.payment_method === 'qris' ? 'QRIS' : receipt.payment_method === 'transfer' ? 'Transfer' : 'Tunai'}</span></div>
      ${receipt.serial_number ? `<div class="hr"></div><div class="c b">TOKEN / SN</div><div class="c big b">${receipt.serial_number}</div>` : ''}
      <div class="hr"></div>
      <div class="c" style="margin-top:12px;font-size:12px">
        Status: ${receipt.status === 'success' ? 'BERHASIL' : 'GAGAL'}<br/>
        ${receipt.reference_id ? `Ref: ${receipt.reference_id}` : ''}
      </div>
      <div class="c" style="margin-top:16px;font-size:11px;color:#666">Terima kasih</div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  // ─── Render Category Grid ───
  const renderCategoryGrid = () => (
    <Grid container spacing={2}>
      {categories.map((cat) => (
        <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={cat.id}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', boxShadow: 2, transform: 'translateY(-2px)' },
            }}
          >
            <CardActionArea onClick={() => handleSelectCategory(cat)} sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                {ICON_MAP[cat.icon] || <PhonelinkIcon sx={{ fontSize: 32 }} />}
              </Box>
              <Typography variant="subtitle2" fontWeight={600} noWrap>
                {cat.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }} noWrap>
                {cat.description}
              </Typography>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // ─── Render Product Selection ───
  const renderProductView = () => (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={handleBack} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ color: 'primary.main' }}>
          {ICON_MAP[selectedCategory?.icon] || <PhonelinkIcon />}
        </Box>
        <Typography variant="h6" fontWeight={600}>
          {selectedCategory?.name}
        </Typography>
      </Stack>

      {/* Customer Input */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label={selectedCategory?.input_label || 'Nomor Tujuan'}
            placeholder={selectedCategory?.input_placeholder || ''}
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {selectedCategory?.input_type === 'phone' ? <PhoneAndroidIcon color="action" /> : <SearchIcon color="action" />}
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Nama Pelanggan (opsional)"
            placeholder="Masukkan nama pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            size="small"
          />
        </Stack>
      </Paper>

      {/* Products */}
      {productsLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
      ) : products.length === 0 ? (
        <Alert severity="info">Tidak ada produk tersedia untuk kategori ini</Alert>
      ) : (
        Object.entries(groupedProducts).map(([provider, items]) => (
          <Box key={provider} sx={{ mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {provider}
            </Typography>
            <Grid container spacing={1.5}>
              {items.map((product) => {
                const sf = calcServiceFee(product.price, product.admin_fee);
                const total = Number(product.price) + Number(product.admin_fee) + sf;
                return (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={product.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      }}
                      onClick={() => handleSelectProduct(product)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mt: 0.5 }}>
                          {formatRp(total)}
                        </Typography>
                        {(product.admin_fee > 0 || sf > 0) && (
                          <Typography variant="caption" color="text.secondary">
                            {product.admin_fee > 0 ? `Admin ${formatRp(product.admin_fee)}` : ''}
                            {product.admin_fee > 0 && sf > 0 ? ' + ' : ''}
                            {sf > 0 ? `Layanan ${formatRp(sf)}` : ''}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))
      )}
    </Box>
  );

  // ─── Render Receipt ───
  const renderReceipt = () => {
    if (!receipt) return null;
    const total = Number(receipt.price || 0) + Number(receipt.admin_fee || 0) + Number(receipt.service_fee || 0);
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, maxWidth: 440, mx: 'auto', mt: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {receipt.status === 'success' ? (
            <CheckCircleIcon sx={{ fontSize: 56, color: 'success.main' }} />
          ) : (
            <ErrorIcon sx={{ fontSize: 56, color: 'error.main' }} />
          )}
          <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
            {receipt.status === 'success' ? 'Transaksi Berhasil' : 'Transaksi Gagal'}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1}>
          <Row label="No. Transaksi" value={receipt.trx_no} mono copy onCopy={() => handleCopy(receipt.trx_no)} />
          <Row label="Waktu" value={formatDate(receipt.created_at)} />
          <Row label="Produk" value={receipt.product_name} />
          <Row label="Provider" value={receipt.provider} />
          <Row label="Tujuan" value={receipt.customer_identifier} bold />
          {receipt.nominal > 0 && <Row label="Nominal" value={formatRp(receipt.nominal)} />}
          <Row label="Harga" value={formatRp(receipt.price)} />
          {receipt.admin_fee > 0 && <Row label="Admin" value={formatRp(receipt.admin_fee)} />}
          {receipt.service_fee > 0 && <Row label="Biaya Layanan" value={formatRp(receipt.service_fee)} />}
          <Divider />
          <Row label="TOTAL" value={formatRp(total)} bold big />
          <Row label="Metode" value={receipt.payment_method === 'qris' ? 'QRIS' : receipt.payment_method === 'transfer' ? 'Transfer' : 'Tunai'} />
        </Stack>

        {receipt.serial_number && (
          <Paper
            elevation={0}
            sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center', border: '2px dashed', borderColor: 'success.main' }}
          >
            <Typography variant="caption" color="success.main" fontWeight={600}>TOKEN / SN</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace', letterSpacing: 2 }}>
              {receipt.serial_number}
            </Typography>
            <Tooltip title="Salin SN">
              <IconButton size="small" onClick={() => handleCopy(receipt.serial_number)} sx={{ mt: 0.5 }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Paper>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 3, justifyContent: 'center' }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintReceipt}>
            Cetak Struk
          </Button>
          <Button variant="contained" onClick={() => { setReceipt(null); setCustomerInput(''); setCustomerName(''); }}>
            Transaksi Baru
          </Button>
        </Stack>
      </Paper>
    );
  };

  // ─── Render History ───
  const renderHistory = () => (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Cari no. transaksi, tujuan, produk..."
          value={historySearch}
          onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
          sx={{ flex: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          }}
        />
      </Stack>

      {historyLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
      ) : transactions.length === 0 ? (
        <Alert severity="info">Belum ada riwayat transaksi digital</Alert>
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>No. Trx</TableCell>
                  <TableCell>Produk</TableCell>
                  <TableCell>Tujuan</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Metode</TableCell>
                  <TableCell>SN/Token</TableCell>
                  <TableCell>Waktu</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((t) => {
                  const total = Number(t.price || 0) + Number(t.admin_fee || 0) + Number(t.service_fee || 0);
                  return (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{t.trx_no}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{t.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{t.provider}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{t.customer_identifier}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatRp(total)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={t.status === 'success' ? 'Berhasil' : t.status === 'pending' ? 'Proses' : 'Gagal'}
                          color={t.status === 'success' ? 'success' : t.status === 'pending' ? 'warning' : 'error'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {t.payment_method === 'qris' ? 'QRIS' : t.payment_method === 'transfer' ? 'Transfer' : 'Tunai'}
                      </TableCell>
                      <TableCell>
                        {t.serial_number ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{t.serial_number}</Typography>
                            <IconButton size="small" onClick={() => handleCopy(t.serial_number)}>
                              <ContentCopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>
                        ) : '-'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(t.created_at)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {historyTotal > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={historyTotal} page={historyPage} onChange={(_, p) => setHistoryPage(p)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PhonelinkIcon /> Layanan Digital
      </Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); if (v === 0) { handleBack(); } }} sx={{ mb: 3 }}>
        <Tab icon={<PhonelinkIcon />} label="Layanan" iconPosition="start" />
        <Tab icon={<HistoryIcon />} label="Riwayat" iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : receipt ? (
            renderReceipt()
          ) : selectedCategory ? (
            renderProductView()
          ) : (
            renderCategoryGrid()
          )}
        </>
      )}

      {tab === 1 && renderHistory()}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog} onClose={() => !processing && setConfirmDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Konfirmasi Transaksi</DialogTitle>
        <DialogContent>
          {selectedProduct && (() => {
            const sf = calcServiceFee(selectedProduct.price, selectedProduct.admin_fee);
            const totalBayar = Number(selectedProduct.price) + Number(selectedProduct.admin_fee) + sf;
            return (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <Row label="Produk" value={selectedProduct.name} />
              <Row label="Provider" value={selectedProduct.provider} />
              <Row label={selectedCategory?.input_label || 'Tujuan'} value={customerInput} bold />
              {customerName && <Row label="Nama" value={customerName} />}
              {selectedProduct.nominal > 0 && <Row label="Nominal" value={formatRp(selectedProduct.nominal)} />}
              <Row label="Harga" value={formatRp(selectedProduct.price)} />
              {selectedProduct.admin_fee > 0 && <Row label="Admin" value={formatRp(selectedProduct.admin_fee)} />}
              {sf > 0 && <Row label="Biaya Layanan" value={formatRp(sf)} />}
              <Divider />
              <Row label="TOTAL BAYAR" value={formatRp(totalBayar)} bold big />
              <Divider />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Metode Pembayaran</Typography>
                <ToggleButtonGroup
                  value={paymentMethod}
                  exclusive
                  onChange={(e, v) => v && setPaymentMethod(v)}
                  fullWidth
                  size="small"
                >
                  <ToggleButton value="cash">Tunai</ToggleButton>
                  <ToggleButton value="qris">QRIS</ToggleButton>
                  <ToggleButton value="transfer">Transfer</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDialog(false)} disabled={processing}>Batal</Button>
          <Button variant="contained" onClick={handleConfirmTransaction} disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Bayar Sekarang'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper row component for receipt/confirmation
function Row({ label, value, bold, mono, big, copy, onCopy }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography
          variant={big ? 'h6' : 'body2'}
          fontWeight={bold ? 700 : 400}
          sx={mono ? { fontFamily: 'monospace' } : undefined}
        >
          {value}
        </Typography>
        {copy && (
          <IconButton size="small" onClick={onCopy}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );
}
