import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ProfitDashboard from './ProfitDashboard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function Reports() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState(0);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');

  const formatRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

  useEffect(() => {
    api.get('/locations').then((res) => setLocations(res.data || [])).catch(() => {});
  }, []);

  const fetchDaily = async () => {
    setLoading(true);
    try {
      const params = { date };
      if (locationId) params.location_id = locationId;
      const res = await api.get('/reports/daily', { params });
      setReport(res.data);
    } catch (err) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params = { from: fromDate, to: toDate };
      if (locationId) params.location_id = locationId;
      const res = await api.get('/reports/summary', { params });
      setSummary(res.data);
    } catch (err) {
      toast.error('Gagal memuat ringkasan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssessmentIcon /> Laporan Penjualan
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Laporan Harian" />
        <Tab label="Ringkasan Periode" />
        <Tab label="Laba / Rugi" />
      </Tabs>

      {/* Location filter – shared across all tabs */}
      {locations.length > 0 && (
        <TextField select size="small" label="Lokasi" value={locationId} onChange={(e) => setLocationId(e.target.value)} sx={{ mb: 2, minWidth: 200 }}>
          <MenuItem value="">Semua Lokasi</MenuItem>
          {locations.map((loc) => (
            <MenuItem key={loc.id} value={loc.id}>{loc.name}</MenuItem>
          ))}
        </TextField>
      )}

      {/* ── TAB 0: HARIAN ── */}
      {tab === 0 && (
        <>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <TextField type="date" size="small" value={date} onChange={(e) => setDate(e.target.value)} />
            <Button variant="contained" onClick={fetchDaily} disabled={loading}>
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </Stack>

          {report && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <ShoppingCartIcon fontSize="small" />
                        <Typography variant="body2">Total Transaksi</Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700}>{report.totalTransactions}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <AttachMoneyIcon fontSize="small" />
                        <Typography variant="body2">Total Omzet</Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} color="success.main">{formatRp(report.totalRevenue)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <TrendingUpIcon fontSize="small" />
                        <Typography variant="body2">Total Item Terjual</Typography>
                      </Stack>
                      <Typography variant="h4" fontWeight={700} color="primary.main">{report.totalItems}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {report.topProducts?.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmojiEventsIcon color="warning" /> Barang Terlaris
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>No</TableCell>
                          <TableCell>Nama Barang</TableCell>
                          <TableCell align="right">Qty Terjual</TableCell>
                          <TableCell align="right">Pendapatan</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.topProducts.map((p, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell align="right">{p.quantity}</TableCell>
                            <TableCell align="right">{formatRp(p.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Daftar Transaksi</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>No. Transaksi</TableCell>
                        <TableCell>Waktu</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.transactions?.map((t) => (
                        <TableRow key={t.id} hover sx={t.transaction_type === 'refund' ? { bgcolor: 'error.50' } : {}}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.transaction_no}</TableCell>
                          <TableCell>{new Date(t.created_at).toLocaleTimeString('id-ID')}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: t.transaction_type === 'refund' ? 'error.main' : 'inherit' }}>{formatRp(t.total)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={t.transaction_type === 'refund' ? 'Refund' : t.status === 'paid' ? 'Lunas' : 'Batal'}
                              size="small"
                              color={t.transaction_type === 'refund' ? 'error' : t.status === 'paid' ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </>
      )}

      {/* ── TAB 1: RINGKASAN PERIODE ── */}
      {tab === 1 && (
        <>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <TextField type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Typography color="text.secondary">s/d</Typography>
            <TextField type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <Button variant="contained" onClick={fetchSummary} disabled={loading}>
              {loading ? 'Memuat...' : 'Tampilkan'}
            </Button>
          </Stack>

          {summary && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Total Transaksi</Typography>
                      <Typography variant="h4" fontWeight={700}>{summary.totalTransactions}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Total Omzet</Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">{formatRp(summary.totalRevenue)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>Rincian per Hari</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tanggal</TableCell>
                        <TableCell align="right">Jumlah Transaksi</TableCell>
                        <TableCell align="right">Omzet</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.daily?.map((d) => (
                        <TableRow key={d.date} hover>
                          <TableCell>{d.date}</TableCell>
                          <TableCell align="right">{d.count}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{formatRp(d.revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}
        </>
      )}

      {/* ── TAB 2: LABA / RUGI (Dashboard) ── */}
      {tab === 2 && <ProfitDashboard locationId={locationId} />}
    </Box>
  );
}
