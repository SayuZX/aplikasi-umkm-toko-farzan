import { useState, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Pagination from '@mui/material/Pagination';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ComposedChart, Bar, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

/* ─── Color tokens ─── */
const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-surface)', elevated: 'var(--bg-elevated)',
  card: 'var(--bg-card)', border: 'var(--border-subtle)', borderEmph: 'var(--border-emph)',
  brand: '#2563EB', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', cyan: '#06B6D4', purple: '#A855F7',
  textPri: 'var(--text-primary)', textSec: 'var(--text-secondary)', textMut: 'var(--text-muted)',
};
const PIE_COLORS = [C.blue, C.brand, C.amber, C.red, C.cyan, C.purple, '#EC4899', '#8B5CF6'];
const formatRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
const formatRpShort = (n) => {
  const v = Number(n) || 0;
  if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1)}M`;
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v}`;
};

/* ─── Custom chart tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: C.elevated, border: `1px solid ${C.border}`, borderRadius: 2, p: 1.5, minWidth: 160 }}>
      <Typography variant="caption" sx={{ color: C.textMut, mb: 0.5, display: 'block' }}>{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" sx={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {formatRp(p.value)}
        </Typography>
      ))}
    </Box>
  );
};

/* ─── Card wrapper ─── */
const DashCard = ({ children, sx, ...props }) => (
  <Card
    variant="outlined"
    sx={{
      bgcolor: C.surface, borderColor: C.border, borderRadius: 3,
      transition: 'box-shadow .2s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,.08)' },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Card>
);

/* ─── Summary card ─── */
const SummaryCard = ({ icon: Icon, label, value, color, sub }) => (
  <DashCard>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: `${color}18`,
        }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
        <Typography variant="body2" sx={{ color: C.textSec, fontWeight: 500 }}>{label}</Typography>
      </Stack>
      <Typography variant="h5" sx={{ fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" sx={{ color: C.textMut }}>{sub}</Typography>}
    </CardContent>
  </DashCard>
);

/* ─── Section title ─── */
const SectionTitle = ({ icon: Icon, children }) => (
  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: C.textPri, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
    <Icon sx={{ fontSize: 20, color: C.brand }} /> {children}
  </Typography>
);

/* ─── Skeleton loaders ─── */
const SkeletonCards = () => (
  <Grid container spacing={2} sx={{ mb: 3 }}>
    {[0, 1, 2].map((i) => (
      <Grid key={i} size={{ xs: 12, md: 4 }}>
        <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />
      </Grid>
    ))}
  </Grid>
);
const SkeletonChart = ({ height = 300 }) => <Skeleton variant="rounded" height={height} sx={{ borderRadius: 3, mb: 3 }} />;

/* ─── Main component ─── */
export default function ProfitDashboard({ locationId }) {
  const [period, setPeriod] = useState('monthly');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 5);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [txPage, setTxPage] = useState(1);
  const [txType, setTxType] = useState('');

  const buildParams = useCallback((extra = {}) => {
    const p = { period };
    if (period === 'custom') { p.from = from; p.to = to; }
    if (locationId) p.location_id = locationId;
    return { ...p, ...extra };
  }, [period, from, to, locationId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, compRes, txRes] = await Promise.all([
        api.get('/reports/profit', { params: buildParams() }),
        api.get('/reports/profit/categories', { params: buildParams() }),
        api.get('/reports/profit/comparison', { params: buildParams() }),
        api.get('/reports/profit/transactions', { params: buildParams({ page: 1, limit: 10 }) }),
      ]);
      setSummary(sumRes.data);
      setCategories(catRes.data);
      setComparison(compRes.data);
      setTransactions(txRes.data);
      setTxPage(1);
      setTxType('');
    } catch {
      toast.error('Gagal memuat data laba rugi');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchTx = useCallback(async (page, type) => {
    try {
      const extra = { page, limit: 10 };
      if (type) extra.type = type;
      const res = await api.get('/reports/profit/transactions', { params: buildParams(extra) });
      setTransactions(res.data);
    } catch {
      toast.error('Gagal memuat transaksi');
    }
  }, [buildParams]);

  const handleTxPage = (_, page) => { setTxPage(page); fetchTx(page, txType); };
  const handleTxType = (_, v) => { setTxType(v); setTxPage(1); fetchTx(1, v); };

  const exportCSV = () => {
    const params = new URLSearchParams({ period });
    if (period === 'custom') { params.set('from', from); params.set('to', to); }
    if (locationId) params.set('location_id', locationId);
    const baseURL = useAuthStore.getState().serverUrl + '/api';
    const a = document.createElement('a');
    a.href = `${baseURL}/exports/profit-loss/csv?${params}`;
    a.download = 'Laporan_LabaRugi.csv';
    document.body.appendChild(a); a.click(); a.remove();
  };

  const exportPDF = () => {
    const params = new URLSearchParams({ period });
    if (period === 'custom') { params.set('from', from); params.set('to', to); }
    if (locationId) params.set('location_id', locationId);
    const baseURL = useAuthStore.getState().serverUrl + '/api';
    window.open(`${baseURL}/exports/profit-loss/pdf?${params}`, '_blank');
  };

  const profitColor = summary?.isLoss ? C.red : C.brand;
  const trendData = summary?.trend || [];
  const catData = categories?.data || [];
  const compData = comparison?.data || [];
  const txData = transactions?.data || [];
  const txPagination = transactions?.pagination;

  // Donut data: proportion of HPP by category
  const donutData = catData.filter((c) => c.cogs > 0).map((c) => ({ name: c.category, value: c.cogs }));
  const totalDonut = donutData.reduce((s, d) => s + d.value, 0);

  return (
    <Box>
      {/* ─── Filter Bar ─── */}
      <DashCard sx={{ mb: 3, p: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ p: 2 }}>
          <TextField select size="small" value={period} onChange={(e) => setPeriod(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="daily">Hari Ini</MenuItem>
            <MenuItem value="weekly">Minggu Ini</MenuItem>
            <MenuItem value="monthly">Bulan Ini</MenuItem>
            <MenuItem value="yearly">Tahun Ini</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </TextField>
          {period === 'custom' && (
            <>
              <TextField type="date" size="small" label="Dari" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField type="date" size="small" label="Sampai" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </>
          )}
          <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchAll} disabled={loading} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            {loading ? 'Memuat...' : 'Tampilkan'}
          </Button>
          {summary && (
            <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCSV} sx={{ borderRadius: 2, textTransform: 'none' }}>CSV</Button>
              <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={exportPDF} sx={{ borderRadius: 2, textTransform: 'none' }}>PDF</Button>
            </Stack>
          )}
        </Stack>
      </DashCard>

      {/* ─── Loading skeletons ─── */}
      {loading && (
        <>
          <SkeletonCards />
          <SkeletonChart />
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}><SkeletonChart height={320} /></Grid>
            <Grid size={{ xs: 12, md: 5 }}><SkeletonChart height={320} /></Grid>
          </Grid>
          <SkeletonChart />
          <SkeletonChart height={200} />
        </>
      )}

      {/* ─── Empty state ─── */}
      {!loading && !summary && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <BarChartIcon sx={{ fontSize: 64, color: C.textMut, mb: 2 }} />
          <Typography variant="h6" sx={{ color: C.textSec, mb: 1 }}>Belum Ada Data</Typography>
          <Typography variant="body2" sx={{ color: C.textMut }}>Pilih periode lalu klik "Tampilkan" untuk melihat statistik laba rugi</Typography>
        </Box>
      )}

      {/* ─── Dashboard content ─── */}
      {!loading && summary && (
        <>
          {/* ── 1. Summary Cards ── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                icon={TrendingUpIcon}
                label="Total Pendapatan"
                value={formatRp(summary.totalRevenue)}
                color={C.brand}
                sub={`${summary.totalTransactions} transaksi`}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                icon={ReceiptLongIcon}
                label="Total HPP"
                value={formatRp(summary.totalCogs)}
                color={C.amber}
                sub="Harga Pokok Penjualan"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SummaryCard
                icon={summary.isLoss ? TrendingDownIcon : AccountBalanceWalletIcon}
                label={summary.isLoss ? 'Total Rugi' : 'Laba Bersih'}
                value={`${summary.isLoss ? '-' : ''}${formatRp(Math.abs(summary.totalProfit))}`}
                color={profitColor}
                sub={`Margin: ${summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(1) : '0'}%`}
              />
            </Grid>
          </Grid>

          {/* ── 2. Trend Area Chart ── */}
          {trendData.length > 0 && (
            <DashCard sx={{ mb: 3, p: 2.5 }}>
              <SectionTitle icon={TrendingUpIcon}>Trend Laba Rugi</SectionTitle>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.brand} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.brand} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCogs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.amber} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tickFormatter={formatRpShort} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={80} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="income" name="Pendapatan" stroke={C.brand} fill="url(#gradIncome)" strokeWidth={2} />
                  <Area type="monotone" dataKey="cogs" name="HPP" stroke={C.amber} fill="url(#gradCogs)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" name="Laba" stroke={C.blue} fill="url(#gradProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </DashCard>
          )}

          {/* ── 3. Category Bar + Donut ── */}
          {catData.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <DashCard sx={{ p: 2.5, height: '100%' }}>
                  <SectionTitle icon={BarChartIcon}>HPP per Kategori</SectionTitle>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={catData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis tickFormatter={formatRpShort} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={80} />
                      <RechartsTooltip content={<ChartTooltip />} />
                      <Bar dataKey="income" name="Pendapatan" fill={C.brand} radius={[4, 4, 0, 0]} barSize={24} />
                      <Bar dataKey="cogs" name="HPP" fill={C.amber} radius={[4, 4, 0, 0]} barSize={24} />
                      <Line type="monotone" dataKey="profit" name="Laba" stroke={C.blue} strokeWidth={2} dot={{ r: 4, fill: C.blue }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </DashCard>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <DashCard sx={{ p: 2.5, height: '100%' }}>
                  <SectionTitle icon={ReceiptLongIcon}>Proporsi HPP</SectionTitle>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        dataKey="value"
                        paddingAngle={2}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {donutData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v) => formatRp(v)} />
                      <Legend
                        formatter={(value, entry) => {
                          const pct = totalDonut > 0 ? ((entry.payload.value / totalDonut) * 100).toFixed(1) : 0;
                          return `${value} (${pct}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </DashCard>
              </Grid>
            </Grid>
          )}

          {/* ── 4. Monthly Comparison Chart ── */}
          {compData.length > 0 && (
            <DashCard sx={{ mb: 3, p: 2.5 }}>
              <SectionTitle icon={BarChartIcon}>Perbandingan Pendapatan vs HPP</SectionTitle>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={compData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month_label" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tickFormatter={formatRpShort} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={80} />
                  <RechartsTooltip content={<ChartTooltip />} />
                  <Bar dataKey="income" name="Pendapatan" fill={C.brand} radius={[4, 4, 0, 0]} barSize={28} />
                  <Bar dataKey="cogs" name="HPP" fill={C.amber} radius={[4, 4, 0, 0]} barSize={28} />
                  <Line type="monotone" dataKey="profit" name="Laba" stroke={C.blue} strokeWidth={2.5} dot={{ r: 4, fill: C.blue }} />
                </ComposedChart>
              </ResponsiveContainer>
            </DashCard>
          )}

          {/* ── 5. Detail Breakdown Table ── */}
          {summary.daily?.length > 0 && (
            <DashCard sx={{ mb: 3, p: 2.5 }}>
              <SectionTitle icon={BarChartIcon}>Rincian per Hari</SectionTitle>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: C.textSec }}>Tanggal</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>Transaksi</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>Pendapatan</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>HPP</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>Laba/Rugi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.daily.map((d) => (
                      <TableRow key={d.date} hover>
                        <TableCell sx={{ color: C.textPri }}>{d.date}</TableCell>
                        <TableCell align="right" sx={{ color: C.textPri }}>{d.transactions}</TableCell>
                        <TableCell align="right" sx={{ color: C.brand, fontWeight: 600 }}>{formatRp(d.revenue)}</TableCell>
                        <TableCell align="right" sx={{ color: C.amber, fontWeight: 600 }}>{formatRp(d.cogs)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: d.profit >= 0 ? C.brand : C.red }}>
                          {d.profit >= 0 ? '' : '-'}{formatRp(Math.abs(d.profit))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'var(--bg-elevated)' }}>
                      <TableCell sx={{ fontWeight: 700, color: C.textPri }}>TOTAL</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.textPri }}>{summary.totalTransactions}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.brand }}>{formatRp(summary.totalRevenue)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: C.amber }}>{formatRp(summary.totalCogs)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: profitColor }}>
                        {summary.isLoss ? '-' : ''}{formatRp(Math.abs(summary.totalProfit))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </DashCard>
          )}

          {/* ── 6. Transaction List ── */}
          <DashCard sx={{ p: 2.5 }}>
            <SectionTitle icon={ReceiptLongIcon}>Detail Transaksi</SectionTitle>
            <Tabs value={txType} onChange={handleTxType} sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}>
              <Tab value="" label="Semua" />
              <Tab value="sale" label="Penjualan" />
              <Tab value="refund" label="Refund" />
            </Tabs>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: C.textSec }}>No. Transaksi</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: C.textSec }}>Tanggal</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: C.textSec }}>Kasir</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: C.textSec }}>Tipe</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>Pendapatan</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>HPP</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: C.textSec }}>Laba</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {txData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: C.textMut }}>Tidak ada transaksi</TableCell>
                    </TableRow>
                  ) : txData.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: C.textPri }}>{t.transaction_no}</TableCell>
                      <TableCell sx={{ color: C.textPri }}>{t.date}</TableCell>
                      <TableCell sx={{ color: C.textSec }}>{t.kasir}</TableCell>
                      <TableCell>
                        <Chip
                          label={t.type === 'refund' ? 'Refund' : 'Sale'}
                          size="small"
                          sx={{
                            fontWeight: 600, fontSize: '0.7rem', height: 22,
                            bgcolor: t.type === 'refund' ? `${C.red}18` : `${C.brand}18`,
                            color: t.type === 'refund' ? C.red : C.brand,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ color: C.brand, fontWeight: 600 }}>{formatRp(t.income)}</TableCell>
                      <TableCell align="right" sx={{ color: C.amber, fontWeight: 600 }}>{formatRp(t.cogs)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: t.profit >= 0 ? C.brand : C.red }}>
                        {formatRp(t.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {txPagination && txPagination.totalPages > 1 && (
              <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
                <Pagination
                  count={txPagination.totalPages}
                  page={txPage}
                  onChange={handleTxPage}
                  color="primary"
                  size="small"
                />
              </Stack>
            )}
          </DashCard>
        </>
      )}
    </Box>
  );
}
