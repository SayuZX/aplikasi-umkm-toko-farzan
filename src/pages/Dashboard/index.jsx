import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InventoryIcon from '@mui/icons-material/Inventory';
import CalculateIcon from '@mui/icons-material/Calculate';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ─── Color tokens ─── */
const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-surface)', elevated: 'var(--bg-elevated)',
  border: 'var(--border-subtle)', borderEmph: 'var(--border-emph)',
  brand: '#2563EB', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
  purple: '#A855F7', cyan: '#06B6D4',
  textPri: 'var(--text-primary)', textSec: 'var(--text-secondary)', textMut: 'var(--text-muted)',
};
const tabNums = { fontVariantNumeric: 'tabular-nums' };
const DONUT_COLORS = [C.brand, C.blue, C.purple, C.amber, C.cyan, C.red];

const formatRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const formatRpShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

/* ─── Count-up hook ─── */
function useCountUp(target, duration = 600, enabled = true) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);
  useEffect(() => {
    if (!enabled) { setValue(target); return; }
    const start = prevTarget.current;
    prevTarget.current = target;
    const diff = target - start;
    if (diff === 0) { setValue(target); return; }
    const t0 = performance.now();
    let raf;
    const tick = (now) => {
      const progress = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

/* ─── Metric Card ─── */
function MetricCard({ label = '', value, icon, color, trend, sparkData, sub, loading: isLoading }) {
  const animVal = useCountUp(typeof value === 'number' ? value : 0, 600, !isLoading);
  const isRp = label.includes('Penjualan') || label.includes('Keuntungan') || label.includes('Rata');
  const displayVal = isRp ? formatRp(animVal) : animVal.toLocaleString('id-ID');
  const sparkColor = (trend == null || trend >= 0) ? C.brand : C.red;
  const sparkId = `spark-${label.replace(/\s+/g, '-')}`;

  if (isLoading) {
    return (
      <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, p: 2.5, height: 148 }}>
        <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: C.elevated }} />
        <Skeleton variant="text" width="80%" height={36} sx={{ bgcolor: C.elevated, mt: 1 }} />
        <Skeleton variant="rectangular" width={80} height={20} sx={{ bgcolor: C.elevated, mt: 1, borderRadius: 10 }} />
      </Card>
    );
  }

  return (
    <Card sx={{
      bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, p: 2.5, height: 148,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      transition: 'box-shadow 0.2s, border-color 0.15s',
      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)', borderColor: color },
    }}>
      {/* Header: icon + label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${color}18`, color,
        }}>
          <Box sx={{ display: 'flex', fontSize: 20 }}>{icon}</Box>
        </Box>
        <Typography sx={{ fontSize: 12, color: C.textMut, fontWeight: 600, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
          {label}
        </Typography>
      </Box>

      {/* Value */}
      <Box>
        <Typography sx={{ fontSize: 22, fontWeight: 700, color: C.textPri, lineHeight: 1.1, ...tabNums }}>
          {displayVal}
        </Typography>
        {sub && (
          <Typography sx={{ fontSize: 11, color: C.textMut, mt: 0.25 }}>{sub}</Typography>
        )}
      </Box>

      {/* Trend pill + sparkline */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {trend !== null && trend !== undefined ? (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1, py: 0.25, borderRadius: '20px',
            bgcolor: trend >= 0 ? 'rgba(22,163,74,0.10)' : 'rgba(225,29,72,0.10)',
            color: trend >= 0 ? '#16A34A' : '#E11D48',
            fontSize: 12, fontWeight: 600, ...tabNums,
          }}>
            {trend >= 0
              ? <TrendingUpIcon sx={{ fontSize: 14 }} />
              : <TrendingDownIcon sx={{ fontSize: 14 }} />}
            {trend >= 0 ? '+' : ''}{trend % 1 === 0 ? Math.round(trend) : trend.toFixed(1)}% vs kemarin
          </Box>
        ) : (
          <Box sx={{
            display: 'inline-flex', alignItems: 'center',
            px: 1, py: 0.25, borderRadius: '20px',
            bgcolor: 'rgba(107,114,128,0.10)', color: '#6B7280',
            fontSize: 12, fontWeight: 500,
          }}>—</Box>
        )}
        {sparkData && sparkData.length > 1 && (
          <Box sx={{ width: 72, height: 32, flexShrink: 0, overflow: 'hidden' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
                <defs>
                  <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={sparkColor} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5}
                  fill={`url(#${sparkId})`} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Box>
    </Card>
  );
}

/* ─── Custom Chart Tooltip ─── */
function ChartTooltipContent({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: C.elevated, border: `1px solid ${C.borderEmph}`, borderRadius: 1, p: 1.5, minWidth: 160 }}>
      <Typography sx={{ fontSize: 12, color: C.textMut, mb: 0.5 }}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography sx={{ fontSize: 12, color: p.color }}>{p.name}</Typography>
          <Typography sx={{ fontSize: 12, color: C.textPri, fontWeight: 600, ...tabNums }}>{formatRp(p.value)}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('daily');
  const [chartLoading, setChartLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const [txLoading, setTxLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setSummary(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchChartData = useCallback(async (period) => {
    setChartLoading(true);
    try {
      const res = await api.get('/reports/profit', { params: { period } });
      setChartData(res.data?.daily || []);
    } catch {} finally { setChartLoading(false); }
  }, []);

  const fetchTransactions = useCallback(async (page) => {
    setTxLoading(true);
    try {
      const res = await api.get('/transactions', { params: { limit: 10, page: page + 1 } });
      const d = res.data;
      setTransactions(d?.data || []);
      setTxTotal(d?.total || 0);
    } catch {} finally { setTxLoading(false); }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchChartData('daily');
    fetchTransactions(0);

    const socket = getSocket();
    if (socket) {
      const handler = () => { fetchDashboard(); fetchChartData(chartPeriod); fetchTransactions(txPage); };
      socket.on('transaction:created', handler);
      return () => socket.off('transaction:created', handler);
    }
  }, []);

  useEffect(() => { fetchChartData(chartPeriod); }, [chartPeriod]);
  useEffect(() => { fetchTransactions(txPage); }, [txPage]);

  const calcTrend = (today, yesterday) => {
    if (!yesterday || yesterday === 0) return today > 0 ? 100 : 0;
    return ((today - yesterday) / yesterday) * 100;
  };

  const revenueTrend = summary ? calcTrend(summary.revenue, summary.yesterdayRevenue) : null;
  const txTrend = summary ? calcTrend(summary.totalTransactions, summary.yesterdayTransactions) : null;
  const sparkData = (summary?.weeklyRevenue || []).map((d) => ({ v: d.revenue }));
  const sparkTx = (summary?.weeklyRevenue || []).map((d) => ({ v: d.transactions }));

  const metricCards = summary ? [
    { label: 'Total Penjualan', value: summary.revenue, icon: <StorefrontIcon />, color: C.brand, trend: revenueTrend, sparkData },
    { label: 'Total Transaksi', value: summary.totalTransactions, icon: <ShoppingCartIcon />, color: C.blue, trend: txTrend, sparkData: sparkTx },
    { label: 'Produk Terjual', value: summary.totalItemsSold, icon: <InventoryIcon />, color: C.purple, trend: null, sparkData: null },
    { label: 'Rata-rata Order', value: summary.avgOrderValue, icon: <CalculateIcon />, color: C.cyan, trend: null, sparkData: null, sub: 'per transaksi' },
    { label: 'Keuntungan Bersih', value: summary.profit, icon: summary.profit >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />, color: summary.profit >= 0 ? '#16A34A' : C.red, trend: revenueTrend, sparkData },
  ] : [];

  const statusColor = (status, type) => {
    if (type === 'refund') return 'error';
    if (status === 'paid') return 'success';
    if (status === 'cancelled') return 'warning';
    return 'default';
  };
  const statusLabel = (status, type) => {
    if (type === 'refund') return 'Refund';
    if (status === 'paid') return 'Selesai';
    if (status === 'cancelled') return 'Void';
    return status;
  };

  // Donut data from topProducts
  const donutData = (summary?.topProducts || []).map((p) => ({ name: p.name, value: Math.round(p.revenue) }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: C.bg, p: 3 }}>
      {/* ─── Page Header ─── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <DashboardIcon sx={{ color: C.brand, fontSize: 28 }} />
        <Box>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: C.textPri }}>Dashboard</Typography>
          <Typography sx={{ fontSize: 13, color: C.textMut }}>{today}</Typography>
        </Box>
      </Box>

      {/* ─── Alert Banners ─── */}
      {summary?.criticalStockCount > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, mb: 2.5, borderRadius: 2,
          bgcolor: '#FFF8E1', borderLeft: '4px solid #F59E0B',
        }}>
          <WarningAmberIcon sx={{ color: '#F59E0B', fontSize: 20, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 13, color: '#78350F', flexGrow: 1 }}>
            <strong>{summary.criticalStockCount} produk</strong> memiliki stok kritis
            <Box component="span" sx={{ color: '#92400E', opacity: 0.8 }}> (di bawah 10 unit)</Box>
          </Typography>
          <Button size="small" onClick={() => navigate('/products')}
            sx={{ color: '#B45309', fontSize: 12, fontWeight: 600, textTransform: 'none', flexShrink: 0, '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' } }}>
            Lihat →
          </Button>
        </Box>
      )}

      {/* ─── Metric Cards ─── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {loading
          ? [0, 1, 2, 3, 4].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <MetricCard loading />
              </Grid>
            ))
          : metricCards.map((c) => (
              <Grid key={c.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
                <MetricCard {...c} />
              </Grid>
            ))
        }
      </Grid>

      {/* ─── Chart + Top Products ─── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Sales Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.textPri }}>Grafik Penjualan</Typography>
              <ButtonGroup size="small" sx={{ '& .MuiButton-root': { fontSize: 11, textTransform: 'none', borderColor: C.borderEmph, color: C.textSec } }}>
                {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                  <Button key={p} onClick={() => setChartPeriod(p)}
                    sx={chartPeriod === p ? { bgcolor: `${C.brand}20`, color: `${C.brand} !important`, borderColor: `${C.brand}44 !important` } : {}}>
                    {{ daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' }[p]}
                  </Button>
                ))}
              </ButtonGroup>
            </Box>
            {chartLoading ? (
              <Skeleton variant="rectangular" height={280} sx={{ bgcolor: C.elevated, borderRadius: 1 }} />
            ) : chartData.length === 0 ? (
              <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: C.textMut, fontSize: 14 }}>Belum ada data untuk periode ini</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.textMut }}
                    tickFormatter={(d) => { const p = d.split('-'); return `${p[2]}/${p[1]}`; }} stroke={C.border} />
                  <YAxis tick={{ fontSize: 11, fill: C.textMut }} tickFormatter={(v) => formatRpShort(v)} stroke={C.border} width={72} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" name="Pendapatan" fill={C.brand} radius={[3, 3, 0, 0]} barSize={24} />
                  <Line dataKey="profit" name="Keuntungan" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmojiEventsIcon sx={{ color: C.amber, fontSize: 20 }} />
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.textPri }}>Top 5 Produk Hari Ini</Typography>
            </Box>
            {loading ? (
              [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} height={44} sx={{ bgcolor: C.elevated, mb: 0.5 }} />)
            ) : (summary?.topProducts || []).length === 0 ? (
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: C.textMut, fontSize: 13 }}>Belum ada penjualan hari ini</Typography>
              </Box>
            ) : (
              <Box sx={{ flex: 1 }}>
                {summary.topProducts.map((p, i) => {
                  const maxQty = summary.topProducts[0].quantity;
                  return (
                    <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Typography sx={{
                        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, bgcolor: i === 0 ? C.amber : C.elevated, color: i === 0 ? '#000' : C.textSec,
                      }}>
                        {i + 1}
                      </Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: C.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </Typography>
                          <Typography sx={{ fontSize: 12, color: C.textSec, flexShrink: 0, ml: 1, ...tabNums }}>
                            {p.quantity} pcs
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(p.quantity / maxQty) * 100}
                          sx={{
                            height: 4, borderRadius: 2, bgcolor: C.elevated,
                            '& .MuiLinearProgress-bar': { bgcolor: i === 0 ? C.brand : C.blue, borderRadius: 2 },
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ─── Transactions + Donut ─── */}
      <Grid container spacing={2}>
        {/* Recent Transactions Table */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2.5, pb: 1.5 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.textPri }}>Transaksi Terakhir</Typography>
              <Button size="small" endIcon={<OpenInNewIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => navigate('/reports')}
                sx={{ color: C.textSec, fontSize: 12, textTransform: 'none' }}>
                Lihat Semua
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['No. Transaksi', 'Kasir', 'Waktu', 'Items', 'Total', 'Status', ''].map((h) => (
                      <TableCell key={h} sx={{ borderColor: C.border, color: C.textMut, fontSize: 12, fontWeight: 600, py: 1 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {txLoading ? (
                    [0, 1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        {[0, 1, 2, 3, 4, 5, 6].map((j) => (
                          <TableCell key={j} sx={{ borderColor: C.border }}>
                            <Skeleton width={j === 0 ? 100 : 60} height={16} sx={{ bgcolor: C.elevated }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ borderColor: C.border, color: C.textMut, py: 4 }}>
                        Belum ada transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${C.brand}06` } }}
                        onClick={() => setSelectedTx(tx)}>
                        <TableCell sx={{ borderColor: C.border, color: C.textPri, fontSize: 13, ...tabNums }}>
                          {tx.transaction_no}
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border, color: C.textSec, fontSize: 13 }}>
                          {tx.user?.full_name || '-'}
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border, color: C.textMut, fontSize: 12, ...tabNums }}>
                          {new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border, color: C.textSec, fontSize: 13, ...tabNums }}>
                          {tx.items?.length || 0}
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border, color: C.textPri, fontSize: 13, fontWeight: 600, ...tabNums }}>
                          {formatRp(tx.total)}
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border }}>
                          <Chip label={statusLabel(tx.status, tx.transaction_type)} size="small"
                            color={statusColor(tx.status, tx.transaction_type)}
                            sx={{ height: 22, fontSize: 11, fontWeight: 600 }} />
                        </TableCell>
                        <TableCell sx={{ borderColor: C.border }}>
                          <IconButton size="small" sx={{ color: C.textMut }}>
                            <VisibilityIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {!txLoading && txTotal > 0 && (
              <TablePagination
                component="div"
                count={txTotal}
                page={txPage}
                onPageChange={(_, p) => setTxPage(p)}
                rowsPerPage={10}
                rowsPerPageOptions={[10]}
                sx={{
                  borderTop: `1px solid ${C.border}`,
                  '.MuiTablePagination-displayedRows': { color: C.textMut, fontSize: 12 },
                  '.MuiTablePagination-actions button': { color: C.textSec },
                }}
              />
            )}
          </Card>
        </Grid>

        {/* Category Donut Chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 2, p: 2.5, height: '100%' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: C.textPri, mb: 2 }}>
              Distribusi Penjualan
            </Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <Skeleton variant="circular" width={160} height={160} sx={{ bgcolor: C.elevated }} />
              </Box>
            ) : donutData.length === 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Typography sx={{ color: C.textMut, fontSize: 13 }}>Belum ada data</Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={donutData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <Box sx={{ bgcolor: C.elevated, border: `1px solid ${C.borderEmph}`, borderRadius: 1, p: 1 }}>
                              <Typography sx={{ fontSize: 12, color: C.textPri }}>{payload[0].name}: {formatRp(payload[0].value)}</Typography>
                            </Box>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {donutData.map((d, i) => (
                    <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                      <Typography sx={{ fontSize: 12, color: C.textSec, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.name}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: C.textMut, ...tabNums }}>
                        {donutTotal > 0 ? ((d.value / donutTotal) * 100).toFixed(0) : 0}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ─── Transaction Detail Modal ─── */}
      <Dialog open={!!selectedTx} onClose={() => setSelectedTx(null)} maxWidth="sm" fullWidth>
        {selectedTx && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Detail Transaksi</Typography>
              <IconButton size="small" onClick={() => setSelectedTx(null)}><CloseIcon fontSize="small" /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">No. Transaksi</Typography>
                  <Typography sx={{ fontWeight: 600, ...tabNums }}>{selectedTx.transaction_no}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Tanggal</Typography>
                  <Typography sx={tabNums}>{selectedTx.date}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Kasir</Typography>
                  <Typography>{selectedTx.user?.full_name || '-'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box>
                    <Chip label={statusLabel(selectedTx.status, selectedTx.transaction_type)} size="small"
                      color={statusColor(selectedTx.status, selectedTx.transaction_type)} sx={{ mt: 0.25 }} />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Produk</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: 12 }}>Qty</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Harga</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selectedTx.items || []).map((item, i) => (
                    <TableRow key={i}>
                      <TableCell sx={{ fontSize: 13 }}>{item.product_name}</TableCell>
                      <TableCell align="center" sx={{ fontSize: 13, ...tabNums }}>{item.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, ...tabNums }}>{formatRp(item.unit_price)}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, ...tabNums }}>{formatRp(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                {selectedTx.discount_item_total > 0 && (
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Diskon</Typography>
                    <Typography sx={{ fontSize: 13, ...tabNums }}>- {formatRp(selectedTx.discount_item_total)}</Typography>
                  </Box>
                )}
                {selectedTx.tax_amount > 0 && (
                  <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Pajak</Typography>
                    <Typography sx={{ fontSize: 13, ...tabNums }}>{formatRp(selectedTx.tax_amount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Total</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, ...tabNums }}>{formatRp(selectedTx.total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Dibayar</Typography>
                  <Typography sx={{ fontSize: 13, ...tabNums }}>{formatRp(selectedTx.payment_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Kembalian</Typography>
                  <Typography sx={{ fontSize: 13, ...tabNums }}>{formatRp(selectedTx.change_amount)}</Typography>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
