import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Autocomplete from '@mui/material/Autocomplete';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import MoneyIcon from '@mui/icons-material/Money';
import BankSelector, { BANKS } from './BankSelector';

const METHODS = ['cash', 'qris', 'transfer', 'kasbon'];
const METHOD_LABELS = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', kasbon: 'Kasbon' };
const METHOD_ICONS = { cash: <MoneyIcon />, qris: <QrCode2Icon />, transfer: <AccountBalanceIcon />, kasbon: <CreditScoreIcon /> };

export default function PaymentModal({ total, items, customerName, notes, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherResult, setVoucherResult] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [zeroTotalConfirm, setZeroTotalConfirm] = useState(false);
  const idempotencyKeyRef = useRef(uuidv4());

  // QRIS/Transfer settings
  const [paymentSettings, setPaymentSettings] = useState({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [bankError, setBankError] = useState('');

  // Kasbon customer
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [kasbonDueDate, setKasbonDueDate] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const voucherDiscount = voucherResult?.discount || 0;
  const effectiveTotal = total - voucherDiscount;
  const numPayment = parseFloat(paymentAmount) || 0;
  const change = numPayment - effectiveTotal;

  const canPay = (() => {
    if (loading) return false;
    if (paymentMethod === 'cash') return numPayment >= effectiveTotal && numPayment > 0;
    if (paymentMethod === 'qris') return true;
    if (paymentMethod === 'transfer') return !!selectedBank;
    if (paymentMethod === 'kasbon') return !!selectedCustomer;
    return false;
  })();

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  const quickAmounts = [
    effectiveTotal,
    Math.ceil(effectiveTotal / 1000) * 1000,
    Math.ceil(effectiveTotal / 5000) * 5000,
    Math.ceil(effectiveTotal / 10000) * 10000,
    Math.ceil(effectiveTotal / 50000) * 50000,
    Math.ceil(effectiveTotal / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= effectiveTotal).slice(0, 6);

  // Load payment settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setSettingsLoading(true);
      try {
        const res = await api.get('/settings');
        setPaymentSettings(res.data);
      } catch { /* ignore */ }
      setSettingsLoading(false);
    };
    fetchSettings();
  }, []);

  // Search customers for kasbon
  useEffect(() => {
    if (paymentMethod !== 'kasbon') return;
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers', { params: { search: customerSearch, limit: 20 } });
        setCustomers(res.data?.data || res.data || []);
      } catch { /* ignore */ }
    };
    fetchCustomers();
  }, [paymentMethod, customerSearch]);

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await api.post('/vouchers/validate', { code: voucherCode, order_total: total });
      setVoucherResult(res.data);
      toast.success('Voucher valid!');
    } catch (err) {
      setVoucherResult(null);
      const errData = err.response?.data;
      const minPurchase = errData?.min_purchase || errData?.minPurchase;
      if (minPurchase && minPurchase > total) {
        const shortage = minPurchase - total;
        setVoucherError(`Tambah belanja ${formatRp(shortage)} lagi untuk menggunakan voucher ini`);
      } else {
        toast.error(errData?.message || 'Voucher tidak valid');
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  const handlePay = async (confirmed = false) => {
    if (!canPay) return;
    if (effectiveTotal <= 0 && !confirmed) {
      setZeroTotalConfirm(true);
      return;
    }
    if (paymentMethod === 'transfer' && !selectedBank) {
      setBankError('Silakan pilih bank terlebih dahulu');
      return;
    }
    setBankError('');
    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          discount_percent: i.discount_percent || 0,
        })),
        customer_name: customerName || null,
        payment_amount: paymentMethod === 'cash' ? numPayment : effectiveTotal,
        payment_method: paymentMethod,
        notes: notes || null,
        idempotency_key: idempotencyKeyRef.current,
      };
      if (paymentRef) payload.payment_ref = paymentRef;
      if (paymentMethod === 'transfer' && selectedBank) {
        payload.transfer_bank = selectedBank;
      }
      if (paymentMethod === 'kasbon' && selectedCustomer) {
        payload.kasbon_customer_id = selectedCustomer.id;
        if (kasbonDueDate) payload.kasbon_due_date = kasbonDueDate;
      }
      if (voucherResult) {
        payload.voucher_code = voucherCode;
      }
      const res = await api.post('/transactions', payload);
      const msg = paymentMethod === 'cash' ? 'Transaksi berhasil!' :
        paymentMethod === 'kasbon' ? 'Kasbon berhasil dicatat!' :
          'Transaksi tercatat, menunggu verifikasi pembayaran';
      toast.success(msg);
      onSuccess(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan transaksi');
      idempotencyKeyRef.current = uuidv4();
    } finally {
      setLoading(false);
    }
  };

  const transferBanks = (() => {
    try { return JSON.parse(paymentSettings.transfer_banks || '[]'); } catch { return []; }
  })();

  return (
    <>
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Pembayaran</DialogTitle>
      <DialogContent>
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2, borderRadius: 3, bgcolor: 'primary.50', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">Total Belanja</Typography>
          <Typography variant="h4" fontWeight={800} color="primary.main">{formatRp(total)}</Typography>
        </Paper>

        {/* Voucher */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            label="Kode Voucher"
            value={voucherCode}
            onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); setVoucherResult(null); }}
            sx={{ flex: 1 }}
            slotProps={{ input: { startAdornment: <LocalOfferIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} /> } }}
          />
          <Button variant="outlined" onClick={handleValidateVoucher} disabled={voucherLoading || !voucherCode.trim()}>
            {voucherLoading ? <CircularProgress size={20} /> : 'Pakai'}
          </Button>
        </Box>

        {voucherError && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            {voucherError}
          </Alert>
        )}

        {voucherResult && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            <Typography variant="body2">
              Voucher <strong>{voucherResult.voucher_name}</strong>: diskon {formatRp(voucherDiscount)}
            </Typography>
            {voucherResult.min_purchase > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
                Min. belanja: {formatRp(voucherResult.min_purchase)}
                {voucherResult.valid_until && ` · Berlaku s/d: ${new Date(voucherResult.valid_until).toLocaleDateString('id-ID')}`}
              </Typography>
            )}
          </Alert>
        )}

        {voucherDiscount > 0 && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Setelah Diskon</Typography>
            <Typography variant="h5" fontWeight={800} color="success.main">{formatRp(effectiveTotal)}</Typography>
          </Paper>
        )}

        {/* Payment Method Tabs */}
        <Tabs
          value={METHODS.indexOf(paymentMethod)}
          onChange={(_, idx) => setPaymentMethod(METHODS[idx])}
          variant="fullWidth"
          sx={{ mb: 2, '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 } }}
        >
          {METHODS.map((m) => (
            <Tab key={m} icon={METHOD_ICONS[m]} label={METHOD_LABELS[m]} iconPosition="start" />
          ))}
        </Tabs>

        {/* Cash */}
        {paymentMethod === 'cash' && (
          <>
            <TextField
              label="Jumlah Bayar"
              type="number"
              fullWidth
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && canPay && handlePay()}
              sx={{ mb: 2 }}
              slotProps={{ input: { sx: { fontSize: '1.3rem', fontWeight: 700 } } }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {quickAmounts.map((amt) => (
                <Chip key={amt} label={formatRp(amt)} onClick={() => setPaymentAmount(String(amt))} variant={paymentAmount === String(amt) ? 'filled' : 'outlined'} color="primary" clickable />
              ))}
            </Box>
            {numPayment > 0 && (
              <Alert severity={change >= 0 ? 'success' : 'error'} sx={{ borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Typography variant="body2">Kembalian:</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {change >= 0 ? formatRp(change) : `Kurang ${formatRp(Math.abs(change))}`}
                  </Typography>
                </Box>
              </Alert>
            )}
          </>
        )}

        {/* QRIS */}
        {paymentMethod === 'qris' && (
          <Box sx={{ textAlign: 'center' }}>
            {paymentSettings.qris_image ? (
              <Box sx={{ mb: 2 }}>
                <img src={paymentSettings.qris_image} alt="QRIS" style={{ maxWidth: 240, borderRadius: 12, border: '1px solid #ddd' }} />
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>QRIS belum dikonfigurasi. Silakan atur di menu Pengaturan.</Alert>
            )}
            <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 2 }}>
              {formatRp(effectiveTotal)}
            </Typography>
            <TextField
              label="Referensi / No. Transaksi (opsional)"
              size="small"
              fullWidth
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Alert severity="warning" variant="outlined" sx={{ textAlign: 'left' }}>
              Transaksi akan tercatat sebagai <strong>pending</strong> sampai admin memverifikasi.
            </Alert>
          </Box>
        )}

        {/* Transfer */}
        {paymentMethod === 'transfer' && (
          <Box>
            <BankSelector
              value={selectedBank}
              onChange={(bankId) => { setSelectedBank(bankId); setBankError(''); }}
              error={bankError}
            />

            <Divider sx={{ my: 2 }} />

            {transferBanks.length > 0 && (
              <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Rekening Tujuan:</Typography>
                {transferBanks.map((bank, idx) => (
                  <Box key={idx} sx={{ mb: idx < transferBanks.length - 1 ? 1.5 : 0 }}>
                    <Typography variant="body2" fontWeight={600}>{bank.bank_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{bank.account_number} — {bank.account_name}</Typography>
                  </Box>
                ))}
              </Paper>
            )}
            <Typography variant="h5" fontWeight={800} color="primary.main" sx={{ mb: 2, textAlign: 'center' }}>
              {formatRp(effectiveTotal)}
            </Typography>
            <TextField
              label="Referensi / No. Transfer (opsional)"
              size="small"
              fullWidth
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Alert severity="warning" variant="outlined">
              Transaksi akan tercatat sebagai <strong>pending</strong> sampai admin memverifikasi.
            </Alert>
          </Box>
        )}

        {/* Kasbon */}
        {paymentMethod === 'kasbon' && (
          <Box>
            <Autocomplete
              options={customers}
              getOptionLabel={(opt) => `${opt.name}${opt.phone ? ` (${opt.phone})` : ''}`}
              value={selectedCustomer}
              onChange={(_, v) => setSelectedCustomer(v)}
              onInputChange={(_, v) => setCustomerSearch(v)}
              renderInput={(params) => <TextField {...params} label="Pilih Pelanggan" size="small" />}
              sx={{ mb: 2 }}
              noOptionsText="Tidak ditemukan"
            />
            {selectedCustomer && selectedCustomer.total_kasbon > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Kasbon aktif: <strong>{formatRp(selectedCustomer.total_kasbon)}</strong>
              </Alert>
            )}
            <TextField
              label="Jatuh Tempo (opsional)"
              type="date"
              size="small"
              fullWidth
              value={kasbonDueDate}
              onChange={(e) => setKasbonDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ mb: 2 }}
            />
            <Typography variant="h5" fontWeight={800} color="warning.main" sx={{ mb: 1, textAlign: 'center' }}>
              Kasbon: {formatRp(effectiveTotal)}
            </Typography>
            <Alert severity="warning" variant="outlined">
              Pelanggan belum membayar. Kasbon dapat dilunasi dari menu Kasbon.
            </Alert>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} size="large" sx={{ flex: 1 }}>Batal</Button>
        <Button
          variant="contained"
          onClick={handlePay}
          disabled={!canPay || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : METHOD_ICONS[paymentMethod]}
          size="large"
          color={paymentMethod === 'kasbon' ? 'warning' : 'primary'}
          sx={{ flex: 1 }}
        >
          {loading ? 'Memproses...' : paymentMethod === 'cash' ? 'Bayar' : paymentMethod === 'kasbon' ? 'Catat Kasbon' : 'Konfirmasi'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Zero-total confirm dialog */}
    <Dialog open={zeroTotalConfirm} onClose={() => setZeroTotalConfirm(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Konfirmasi Pembayaran</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Total setelah diskon voucher adalah <strong>{formatRp(effectiveTotal)}</strong>. Lanjutkan transaksi gratis ini?
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="outlined" onClick={() => setZeroTotalConfirm(false)}>Batal</Button>
        <Button variant="contained" color="success" onClick={() => { setZeroTotalConfirm(false); handlePay(true); }}>
          Ya, Lanjutkan
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}
