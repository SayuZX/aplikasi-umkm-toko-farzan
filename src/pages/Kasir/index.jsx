import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useProductStore } from '../../store/productStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import CancelIcon from '@mui/icons-material/Cancel';
import PrintIcon from '@mui/icons-material/Print';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import BarcodeScanner from '../../components/BarcodeScanner';

/* ─── Color tokens ─── */
const C = {
  bg: 'var(--bg-primary)',
  surface: 'var(--bg-surface)',
  elevated: 'var(--bg-elevated)',
  card: 'var(--bg-card)',
  border: 'var(--border-subtle)',
  borderEmph: 'var(--border-emph)',
  brand: '#2563EB',
  amber: '#F59E0B',
  red: '#EF4444',
  textPri: 'var(--text-primary)',
  textSec: 'var(--text-secondary)',
  textMut: 'var(--text-muted)',
};

const tabNums = { fontVariantNumeric: 'tabular-nums' };

export default function Kasir() {
  const { user } = useAuthStore();
  const { items, addItem, updateQuantity, removeItem, clear, getTotal, getTotalItems, getItemCount, customerName, setCustomerName, notes, setNotes } = useCartStore();
  const { products, setProducts, setLoading } = useProductStore();
  const [showPayment, setShowPayment] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [editingQtyId, setEditingQtyId] = useState(null);
  const [editingQtyVal, setEditingQtyVal] = useState('');
  const [flashProductId, setFlashProductId] = useState(null);
  const [showShortcutLegend, setShowShortcutLegend] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const searchRef = useRef(null);
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await api.get('/products', { params: { limit: 1000 } });
        setProducts(res.data.data);
      } catch (err) {
        toast.error('Gagal memuat data produk');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, [items]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F1') { e.preventDefault(); searchRef.current?.focus(); }
      else if (e.key === 'F2') { e.preventDefault(); setShowScanner(true); }
      else if (e.key === 'F4') { e.preventDefault(); if (items.length > 0) setShowPayment(true); }
      else if (e.key === 'F5') { e.preventDefault(); clear(); toast('Transaksi dibatalkan', { icon: '🗑️' }); }
      else if (e.key === 'F6') { e.preventDefault(); toast('Fitur suspend belum tersedia', { icon: 'ℹ️' }); }
      else if (e.key === 'F9') { e.preventDefault(); lastTransaction ? setShowReceipt(true) : toast.error('Tidak ada transaksi terakhir'); }
      else if (e.key === 'F12') { e.preventDefault(); setShowShortcutLegend((v) => !v); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, lastTransaction]);

  const handleSearchKeyDown = async (e) => {
    if (e.key !== 'Enter') return;
    const code = e.target.value.trim();
    if (!code) return;
    await lookupAndAdd(code);
    e.target.value = '';
    setProductSearch('');
  };

  const lookupAndAdd = async (code) => {
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(code)}`, { _silent404: true });
      handleAddProduct(res.data);
      return true;
    } catch {
      toast.error(`Produk dengan barcode "${code}" tidak ditemukan`);
      return false;
    }
  };

  const handleCameraScan = async (code) => {
    const found = await lookupAndAdd(code);
    if (found) setShowScanner(false);
    // If not found, keep scanner open for retry
  };

  const handleAddProduct = (product) => {
    if (product.stock === 0) { toast.error('Stok habis'); return; }
    addItem(product);
    toast.success(`${product.name} ditambahkan`, { duration: 1500 });
    setFlashProductId(product.id);
    setTimeout(() => setFlashProductId(null), 350);
    searchRef.current?.focus();
  };

  const handlePaymentSuccess = (transaction) => {
    setLastTransaction(transaction);
    setShowPayment(false);
    setShowReceipt(true);
    clear();
  };

  const commitQtyEdit = (productId) => {
    const val = parseInt(editingQtyVal) || 1;
    updateQuantity(productId, Math.max(1, val));
    setEditingQtyId(null);
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const formatRp = (n) => 'Rp ' + Number(n).toLocaleString('id-ID');

  const subtotal = getTotal();
  const taxRate = 0.11;
  const taxAmount = Math.round(subtotal * taxRate);
  const grandTotal = subtotal + taxAmount;

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: C.bg }}>
      {/* ════════ CART COLUMN (340px) ════════ */}
      <Box
        sx={{
          width: 340, minWidth: 340, display: 'flex', flexDirection: 'column',
          bgcolor: C.surface, borderRight: `1px solid ${C.border}`,
        }}
      >
        {/* Cart Header */}
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px solid ${C.border}` }}>
          <ShoppingCartIcon sx={{ color: C.brand, fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: C.textPri, flexGrow: 1 }}>
            Keranjang
          </Typography>
          <Box
            sx={{
              bgcolor: C.brand, color: '#000', px: 1, py: 0.25, borderRadius: 1,
              fontSize: 13, fontWeight: 700, fontFamily: 'monospace', minWidth: 28, textAlign: 'center',
            }}
          >
            {getItemCount()}
          </Box>
          <Tooltip title="Pelanggan & Catatan">
            <IconButton size="small" onClick={() => setShowCustomerModal(true)} sx={{ color: C.textSec }}>
              <EditNoteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Cart Items */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'thin' }}>
          {items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10, px: 3 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: C.borderEmph, mb: 2 }} />
              <Typography sx={{ fontSize: 16, color: C.textSec, mb: 1 }}>
                Keranjang kosong
              </Typography>
              <Typography sx={{ fontSize: 13, color: C.textMut }}>
                <strong>F1</strong> scan barcode · klik produk untuk tambah
              </Typography>
            </Box>
          ) : (
            /* Table header */
            <>
              <Box sx={{ display: 'flex', px: 1.5, py: 0.75, borderBottom: `1px solid ${C.border}`, gap: 0.5 }}>
                <Typography sx={{ width: 28, fontSize: 10, color: C.textMut, fontWeight: 600, textAlign: 'center' }}>#</Typography>
                <Typography sx={{ flex: 1, fontSize: 10, color: C.textMut, fontWeight: 600 }}>PRODUK</Typography>
                <Typography sx={{ width: 40, fontSize: 10, color: C.textMut, fontWeight: 600, textAlign: 'center' }}>QTY</Typography>
                <Typography sx={{ width: 80, fontSize: 10, color: C.textMut, fontWeight: 600, textAlign: 'right' }}>SUBTOTAL</Typography>
                <Box sx={{ width: 28 }} />
              </Box>
              {items.map((item, idx) => (
                <Box
                  key={item.product_id}
                  sx={{
                    display: 'flex', alignItems: 'center', px: 1.5, py: 1, gap: 0.5,
                    bgcolor: idx % 2 === 0 ? C.surface : C.elevated,
                    borderBottom: `1px solid ${C.border}`,
                    '&:hover': { bgcolor: 'rgba(34,197,94,0.06)' },
                  }}
                >
                  <Typography sx={{ width: 28, fontSize: 12, color: C.textMut, textAlign: 'center', ...tabNums }}>
                    {idx + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product_name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.textMut, ...tabNums }}>
                      {formatRp(item.unit_price)}/{item.unit}
                    </Typography>
                  </Box>
                  {/* Qty - click to edit */}
                  {editingQtyId === item.product_id ? (
                    <TextField
                      value={editingQtyVal}
                      onChange={(e) => setEditingQtyVal(e.target.value)}
                      onBlur={() => commitQtyEdit(item.product_id)}
                      onKeyDown={(e) => e.key === 'Enter' && commitQtyEdit(item.product_id)}
                      autoFocus
                      size="small"
                      type="number"
                      sx={{
                        width: 44,
                        '& .MuiInputBase-input': { textAlign: 'center', fontSize: 13, fontWeight: 700, p: '4px', color: C.textPri },
                        '& .MuiOutlinedInput-root': { bgcolor: C.bg },
                      }}
                    />
                  ) : (
                    <Typography
                      onClick={() => { setEditingQtyId(item.product_id); setEditingQtyVal(String(item.quantity)); }}
                      sx={{
                        width: 40, textAlign: 'center', fontSize: 14, fontWeight: 700,
                        color: C.brand, cursor: 'pointer', borderRadius: 1, ...tabNums,
                        '&:hover': { bgcolor: 'rgba(34,197,94,0.12)' },
                      }}
                    >
                      {item.quantity}
                    </Typography>
                  )}
                  <Typography sx={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: C.textPri, ...tabNums }}>
                    {formatRp(item.subtotal)}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeItem(item.product_id)}
                    sx={{ width: 28, height: 28, color: C.textMut, '&:hover': { color: C.red } }}
                  >
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
            </>
          )}
        </Box>

        {/* Total breakdown */}
        <Box sx={{ borderTop: `1px solid ${C.borderEmph}`, bgcolor: C.elevated, px: 2, pt: 1.5, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: C.textSec }}>Subtotal</Typography>
            <Typography sx={{ fontSize: 13, color: C.textPri, ...tabNums }}>{formatRp(subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: C.textSec }}>Diskon</Typography>
            <Typography sx={{ fontSize: 13, color: C.textMut, ...tabNums }}>- Rp 0</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: 13, color: C.textSec }}>Pajak (PPN 11%)</Typography>
            <Typography sx={{ fontSize: 13, color: C.textPri, ...tabNums }}>{formatRp(taxAmount)}</Typography>
          </Box>
          <Divider sx={{ borderColor: C.borderEmph, mb: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.textSec }}>TOTAL</Typography>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: C.brand, ...tabNums }}>
              {formatRp(grandTotal)}
            </Typography>
          </Box>
        </Box>

        {/* Action buttons */}
        <Box sx={{ p: 1.5, pt: 1, display: 'flex', flexDirection: 'column', gap: 1, borderTop: `1px solid ${C.border}` }}>
          <Button
            variant="contained"
            fullWidth
            disabled={items.length === 0}
            onClick={() => setShowPayment(true)}
            startIcon={<PaymentIcon />}
            sx={{
              height: 56, fontSize: 18, fontWeight: 700, borderRadius: 2,
              bgcolor: C.brand, color: '#000',
              '&:hover': { bgcolor: '#1D4ED8' },
              '&.Mui-disabled': { bgcolor: 'rgba(34,197,94,0.15)', color: 'rgba(244,244,245,0.3)' },
            }}
          >
            BAYAR
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined" size="small" fullWidth
              startIcon={<CancelIcon sx={{ fontSize: '16px !important' }} />}
              disabled={items.length === 0}
              onClick={() => { clear(); toast('Transaksi dibatalkan'); }}
              sx={{ color: C.textSec, borderColor: C.borderEmph, fontSize: 12, '&:hover': { borderColor: C.red, color: C.red } }}
            >
              Hapus
            </Button>
            <Button
              variant="outlined" size="small" fullWidth
              startIcon={<PrintIcon sx={{ fontSize: '16px !important' }} />}
              onClick={() => lastTransaction ? setShowReceipt(true) : toast.error('Tidak ada transaksi terakhir')}
              sx={{ color: C.textSec, borderColor: C.borderEmph, fontSize: 12, '&:hover': { borderColor: C.textSec } }}
            >
              Cetak
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ════════ PRODUCT AREA ════════ */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Topbar Row 1: info */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 0.75, gap: 1, borderBottom: `1px solid ${C.border}`, minHeight: 40 }}>
          <Typography sx={{ fontSize: 13, color: C.textMut }}>{today}</Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Chip
            label={`${user?.full_name} · ${user?.role}`}
            size="small"
            sx={{ bgcolor: C.elevated, color: C.textSec, fontSize: 12, height: 26, border: `1px solid ${C.border}` }}
          />
        </Box>

        {/* Topbar Row 2: search+barcode */}
        <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            inputRef={searchRef}
            fullWidth
            size="small"
            placeholder="Cari produk / scan barcode (Enter)..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <QrCodeScannerIcon sx={{ color: C.textMut, fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Chip label="F1" size="small" sx={{ height: 20, fontSize: 10, bgcolor: C.elevated, color: C.textMut, border: `1px solid ${C.border}` }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: C.bg, borderRadius: 2, height: 44,
                '& fieldset': { borderColor: C.borderEmph },
                '&:hover fieldset': { borderColor: C.textMut },
                '&.Mui-focused fieldset': { borderColor: C.brand },
              },
              '& .MuiInputBase-input': { color: C.textPri, fontSize: 15 },
              '& .MuiInputBase-input::placeholder': { color: C.textMut, opacity: 1 },
            }}
          />
          <Tooltip title="Scan barcode via kamera (F2)">
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowScanner(true)}
              startIcon={<CameraAltIcon />}
              sx={{
                height: 44, whiteSpace: 'nowrap', minWidth: 120,
                borderColor: C.borderEmph, color: C.textSec,
                '&:hover': { borderColor: C.brand, color: C.brand, bgcolor: 'rgba(37,99,235,0.06)' },
              }}
            >
              Kamera
            </Button>
          </Tooltip>
        </Box>

        {/* Product grid */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1.5, scrollbarWidth: 'thin' }}>
          <Grid container spacing={1.25}>
            {filteredProducts.map((product) => {
              const outOfStock = product.stock === 0;
              const isFlashing = flashProductId === product.id;
              const stockBadgeColor = product.stock === 0
                ? C.red
                : product.stock < 10
                  ? C.red
                  : product.stock <= 50
                    ? C.amber
                    : C.brand;
              return (
                <Grid key={product.id} size={{ xs: 6, sm: 4, md: 3, lg: 2.4 }}>
                  <Card
                    sx={{
                      position: 'relative', height: 130, bgcolor: C.card,
                      border: `1px solid ${C.border}`, borderRadius: 2,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      '&:hover': outOfStock ? {} : { borderColor: C.brand, boxShadow: `0 0 0 1px ${C.brand}` },
                      ...(isFlashing && {
                        animation: 'flashBrand 250ms ease',
                        '@keyframes flashBrand': {
                          '0%': { bgcolor: 'rgba(34,197,94,0.25)' },
                          '100%': { bgcolor: C.card },
                        },
                      }),
                    }}
                  >
                    <CardActionArea
                      disabled={outOfStock}
                      onClick={() => handleAddProduct(product)}
                      sx={{ height: '100%', p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'space-between', borderRadius: 2 }}
                    >
                      {/* Product name */}
                      <Typography sx={{
                        fontSize: 13, fontWeight: 700, color: C.textPri, lineHeight: 1.3,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {product.name}
                      </Typography>

                      {/* Price */}
                      <Typography sx={{ fontSize: 18, fontWeight: 700, color: C.brand, lineHeight: 1.2, ...tabNums }}>
                        {formatRp(product.price)}
                      </Typography>

                      {/* Bottom row: code + stock badge */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: 10, color: C.textMut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.code || product.barcode || '-'}
                        </Typography>
                        <Box sx={{
                          display: 'inline-flex', alignItems: 'center',
                          border: `1px solid ${stockBadgeColor}`,
                          borderRadius: '999px',
                          px: 0.75, py: 0.1,
                          flexShrink: 0,
                        }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 600, color: stockBadgeColor, ...tabNums, lineHeight: 1.6 }}>
                            {product.stock} {product.unit || 'pcs'}
                          </Typography>
                        </Box>
                      </Box>
                    </CardActionArea>

                    {/* Out of stock overlay */}
                    {outOfStock && (
                      <Box sx={{
                        position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 2, pointerEvents: 'none',
                      }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                          STOK HABIS
                        </Typography>
                      </Box>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Box>

      {/* ════════ Customer/Notes Modal ════════ */}
      <Dialog open={showCustomerModal} onClose={() => setShowCustomerModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Pelanggan & Catatan</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Nama Pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Umum"
            size="small"
            fullWidth
          />
          <TextField
            label="Catatan Transaksi"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline rows={2}
            size="small"
            fullWidth
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowCustomerModal(false)} variant="contained" size="small">Selesai</Button>
        </DialogActions>
      </Dialog>

      {/* ════════ Shortcut Legend ════════ */}
      {showShortcutLegend && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed', bottom: 24, right: 24, width: 260, p: 2, borderRadius: 2,
            bgcolor: C.elevated, border: `1px solid ${C.borderEmph}`, zIndex: 1500,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
            <KeyboardIcon sx={{ fontSize: 18, color: C.brand }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.textPri, flexGrow: 1 }}>Keyboard Shortcuts</Typography>
            <IconButton size="small" onClick={() => setShowShortcutLegend(false)} sx={{ color: C.textMut }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
          {[
            ['F1', 'Fokus cari / scan barcode'],
            ['F2', 'Buka kamera scan'],
            ['F4', 'Bayar'],
            ['F5', 'Hapus transaksi'],
            ['F6', 'Tahan / suspend'],
            ['F9', 'Cetak struk terakhir'],
            ['F12', 'Toggle shortcut'],
          ].map(([key, desc]) => (
            <Box key={key} sx={{ display: 'flex', gap: 1.5, mb: 0.75 }}>
              <Chip label={key} size="small" sx={{ height: 20, minWidth: 36, fontSize: 10, fontWeight: 700, bgcolor: C.bg, color: C.textSec, border: `1px solid ${C.border}` }} />
              <Typography sx={{ fontSize: 12, color: C.textSec }}>{desc}</Typography>
            </Box>
          ))}
        </Paper>
      )}

      {showPayment && (
        <PaymentModal
          total={getTotal()}
          items={items}
          customerName={customerName}
          notes={notes}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {showReceipt && lastTransaction && (
        <Receipt transaction={lastTransaction} onClose={() => setShowReceipt(false)} />
      )}

      <BarcodeScanner
        open={showScanner}
        onClose={() => { setShowScanner(false); searchRef.current?.focus(); }}
        onScan={handleCameraScan}
        title="Scan Barcode Produk"
        mode="kasir"
      />
    </Box>
  );
}
