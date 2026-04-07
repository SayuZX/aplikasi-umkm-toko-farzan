import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Collapse from '@mui/material/Collapse';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, alpha } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DnsIcon from '@mui/icons-material/Dns';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PolicyIcon from '@mui/icons-material/Policy';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { HOTKEYS_CONFIG } from '../../config/hotkeys.config';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmailIcon from '@mui/icons-material/Email';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

export default function Settings() {
  const { serverUrl, setServerUrl } = useAuthStore();
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    receipt_header: '',
    receipt_footer: '',
    tax_percent: '0',
    qris_mode: 'static',
    qris_image: '',
    qris_bank_name: '',
    qris_account_number: '',
    qris_account_name: '',
  });
  const [transferBanks, setTransferBanks] = useState([]);
  const [digitalFee, setDigitalFee] = useState({
    type: 'fixed',
    value: '0',
    active: false,
  });
  const [localServerUrl, setLocalServerUrl] = useState(serverUrl);
  const [loading, setLoading] = useState(false);
  const [idleMinutes, setIdleMinutes] = useState(
    localStorage.getItem('idle_screen_minutes') ?? '5'
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        setSettings((prev) => ({ ...prev, ...res.data }));
        try {
          const banks = JSON.parse(res.data.transfer_banks || '[]');
          setTransferBanks(Array.isArray(banks) ? banks : []);
        } catch { setTransferBanks([]); }
        setDigitalFee({
          type: res.data.digital_service_fee_type || 'fixed',
          value: res.data.digital_service_fee_value || '0',
          active: res.data.digital_service_fee_active === 'true',
        });
      } catch (err) {
        toast.error('Gagal memuat pengaturan');
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await api.put('/settings', {
        ...settings,
        transfer_banks: JSON.stringify(transferBanks),
        digital_service_fee_type: digitalFee.type,
        digital_service_fee_value: digitalFee.value,
        digital_service_fee_active: String(digitalFee.active),
      });
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServerUrl = () => {
    setServerUrl(localServerUrl);
    toast.success('URL server diperbarui. Restart aplikasi untuk menerapkan.');
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon /> Pengaturan
      </Typography>

      <Box sx={{ maxWidth: 640 }}>
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorefrontIcon fontSize="small" /> Informasi Toko
          </Typography>
          <Stack spacing={2}>
            <TextField label="Nama Toko" fullWidth value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} />
            <TextField label="Alamat" fullWidth value={settings.store_address} onChange={(e) => setSettings({ ...settings, store_address: e.target.value })} />
            <TextField label="Telepon" fullWidth value={settings.store_phone} onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })} />
            <Divider />
            <TextField label="Header Struk" fullWidth value={settings.receipt_header} onChange={(e) => setSettings({ ...settings, receipt_header: e.target.value })} />
            <TextField label="Footer Struk" fullWidth value={settings.receipt_footer} onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })} />
            <TextField label="Pajak (%)" type="number" value={settings.tax_percent} onChange={(e) => setSettings({ ...settings, tax_percent: e.target.value })} sx={{ width: 150 }} />
          </Stack>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={loading} sx={{ mt: 3 }}>
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </Paper>

        {/* QRIS Settings */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2Icon fontSize="small" /> Konfigurasi QRIS
          </Typography>
          <Stack spacing={2}>
            <TextField select label="Mode QRIS" value={settings.qris_mode} onChange={(e) => setSettings({ ...settings, qris_mode: e.target.value })} sx={{ width: 200 }}>
              <MenuItem value="static">Statis (Gambar)</MenuItem>
              <MenuItem value="dynamic">Dinamis</MenuItem>
            </TextField>
            <TextField label="URL Gambar QRIS" fullWidth value={settings.qris_image} onChange={(e) => setSettings({ ...settings, qris_image: e.target.value })} placeholder="https://..." helperText="URL gambar QRIS statis untuk ditampilkan saat checkout" />
            {settings.qris_image && (
              <Box sx={{ textAlign: 'center' }}>
                <img src={settings.qris_image} alt="Preview QRIS" style={{ maxWidth: 180, borderRadius: 8, border: '1px solid #ddd' }} />
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Transfer Bank Settings */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountBalanceIcon fontSize="small" /> Rekening Transfer
          </Typography>
          {transferBanks.map((bank, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ flexGrow: 1 }}>Bank #{idx + 1}</Typography>
                <IconButton size="small" color="error" onClick={() => setTransferBanks(transferBanks.filter((_, i) => i !== idx))}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack spacing={1.5}>
                <TextField size="small" label="Nama Bank" fullWidth value={bank.bank_name || ''} onChange={(e) => { const b = [...transferBanks]; b[idx] = { ...b[idx], bank_name: e.target.value }; setTransferBanks(b); }} />
                <TextField size="small" label="No. Rekening" fullWidth value={bank.account_number || ''} onChange={(e) => { const b = [...transferBanks]; b[idx] = { ...b[idx], account_number: e.target.value }; setTransferBanks(b); }} />
                <TextField size="small" label="Atas Nama" fullWidth value={bank.account_name || ''} onChange={(e) => { const b = [...transferBanks]; b[idx] = { ...b[idx], account_name: e.target.value }; setTransferBanks(b); }} />
              </Stack>
            </Paper>
          ))}
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setTransferBanks([...transferBanks, { bank_name: '', account_number: '', account_name: '' }])} size="small">
            Tambah Rekening
          </Button>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </Button>
          </Box>
        </Paper>

        {/* Digital Service Fee Settings */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhonelinkIcon fontSize="small" /> Biaya Layanan Digital
          </Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={digitalFee.active}
                  onChange={(e) => setDigitalFee({ ...digitalFee, active: e.target.checked })}
                  color="primary"
                />
              }
              label={digitalFee.active ? 'Aktif' : 'Nonaktif'}
            />
            {digitalFee.active && (
              <>
                <TextField
                  select
                  label="Tipe Biaya"
                  fullWidth
                  size="small"
                  value={digitalFee.type}
                  onChange={(e) => setDigitalFee({ ...digitalFee, type: e.target.value })}
                >
                  <MenuItem value="fixed">Nominal Tetap (Rp)</MenuItem>
                  <MenuItem value="percentage">Persentase (%)</MenuItem>
                </TextField>
                <TextField
                  label={digitalFee.type === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                  fullWidth
                  size="small"
                  type="number"
                  value={digitalFee.value}
                  onChange={(e) => setDigitalFee({ ...digitalFee, value: e.target.value })}
                  inputProps={{ min: 0, ...(digitalFee.type === 'percentage' ? { max: 100, step: 0.1 } : { step: 100 }) }}
                  helperText={
                    digitalFee.type === 'percentage'
                      ? `Contoh: transaksi Rp 100.000 → biaya layanan Rp ${Math.round(100000 * (Number(digitalFee.value) || 0) / 100).toLocaleString('id-ID')}`
                      : `Biaya tetap Rp ${Number(digitalFee.value || 0).toLocaleString('id-ID')} per transaksi`
                  }
                />
              </>
            )}
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveSettings} disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
            </Button>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <DnsIcon fontSize="small" /> Konfigurasi Server
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth size="small" value={localServerUrl} onChange={(e) => setLocalServerUrl(e.target.value)} placeholder="http://192.168.1.100:3000" helperText="Masukkan IP dan port server backend" />
            <Button variant="contained" color="inherit" onClick={handleSaveServerUrl} sx={{ whiteSpace: 'nowrap' }}>Simpan</Button>
          </Stack>
        </Paper>

        {/* Tampilan — Idle Screen */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" /> Tampilan
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="Waktu idle sebelum tampilkan jam"
              value={idleMinutes}
              onChange={(e) => {
                setIdleMinutes(e.target.value);
                localStorage.setItem('idle_screen_minutes', e.target.value);
              }}
              sx={{ width: 280 }}
              helperText="Jam muncul saat aplikasi tidak digunakan"
            >
              <MenuItem value="1">1 menit</MenuItem>
              <MenuItem value="3">3 menit</MenuItem>
              <MenuItem value="5">5 menit</MenuItem>
              <MenuItem value="10">10 menit</MenuItem>
              <MenuItem value="off">Tidak aktif</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Pintasan Keyboard */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyboardIcon fontSize="small" /> Pintasan Keyboard
          </Typography>
          {HOTKEYS_CONFIG.map((section) => (
            <Box key={section.section} sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', display: 'block', mb: 1 }}>
                {section.section}
              </Typography>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="tbody">
                  {section.items.map((item) => (
                    <Box component="tr" key={item.action} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
                      <Box component="td" sx={{ py: 1, pr: 2, fontSize: '0.875rem', color: 'text.primary', width: '55%' }}>
                        {item.action}
                        {item.description && (
                          <Typography component="span" sx={{ display: 'block', fontSize: '0.72rem', color: 'text.secondary' }}>
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                      <Box component="td" sx={{ py: 1 }}>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                          {item.keys.map((k) => (
                            <Chip
                              key={k}
                              label={k}
                              size="small"
                              sx={{
                                fontFamily: 'monospace',
                                fontWeight: 600,
                                fontSize: '0.72rem',
                                bgcolor: 'action.hover',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: '6px',
                                height: 24,
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Privacy Policy */}
        <PrivacyPolicySection />

      </Box>
    </Box>
  );
}

// ═══════════════════════ PRIVACY POLICY ═══════════════════════

const POLICY_DATE = '1 April 2026';
const APP_NAME = 'POS Kasir UMKM';
const CONTACT_EMAIL = 'privacy@gemilangteknologi.tech';

const POLICY_SECTIONS = [
  {
    id: 'info-collected',
    title: '1. Informasi yang Dikumpulkan',
    content: `Dalam pengoperasian aplikasi ${APP_NAME}, kami mengumpulkan beberapa jenis informasi untuk memastikan layanan berjalan dengan optimal:`,
    bullets: [
      'Data identitas pengguna: nama lengkap, username, dan peran (role) dalam sistem',
      'Data operasional toko: nama toko, alamat, nomor telepon, dan konfigurasi struk',
      'Data transaksi: detail penjualan, metode pembayaran, item yang dijual, dan riwayat pembayaran',
      'Data produk: informasi barang, kategori, harga, stok, dan barcode',
      'Data pelanggan: nama pelanggan yang dicatat pada transaksi (jika diisi)',
      'Data teknis: alamat IP, log aktivitas, dan waktu akses untuk keperluan audit',
      'Data pembayaran digital: identifikasi pelanggan untuk layanan digital (nomor HP, ID pelanggan)',
    ],
  },
  {
    id: 'data-usage',
    title: '2. Penggunaan Data',
    content: 'Data yang dikumpulkan digunakan secara ketat untuk keperluan berikut:',
    bullets: [
      'Memproses dan mencatat transaksi penjualan secara akurat',
      'Mengelola inventaris dan stok barang',
      'Menghasilkan laporan keuangan dan ringkasan penjualan',
      'Mengelola akses dan autentikasi pengguna (login, sesi)',
      'Menyediakan layanan pembayaran digital (pulsa, token listrik, dll)',
      'Mencetak struk pembayaran dan bukti transaksi',
      'Melakukan audit keamanan dan pencatatan aktivitas sistem',
      'Meningkatkan performa dan keandalan aplikasi',
    ],
  },
  {
    id: 'security',
    title: '3. Keamanan & Penyimpanan Data',
    content: 'Kami berkomitmen menjaga keamanan data Anda dengan langkah-langkah berikut:',
    bullets: [
      'Password pengguna di-hash menggunakan algoritma bcrypt sebelum disimpan',
      'Autentikasi menggunakan JSON Web Token (JWT) dengan masa berlaku terbatas',
      'Komunikasi antara client dan server dilindungi dengan enkripsi SSL/TLS (HTTPS)',
      'Data disimpan pada server yang dilindungi firewall dan akses terbatas',
      'Log audit mencatat setiap aktivitas sensitif (login, akses data, perubahan pengaturan)',
      'Backup data dilakukan secara berkala untuk mencegah kehilangan data',
      'Akses data dibatasi berdasarkan peran (role-based access control)',
    ],
  },
  {
    id: 'data-sharing',
    title: '4. Berbagi Data dengan Pihak Ketiga',
    content: 'Kami tidak menjual, memperdagangkan, atau menyewakan data pribadi Anda kepada pihak ketiga. Data hanya dapat dibagikan dalam kondisi berikut:',
    bullets: [
      'Penyedia layanan pembayaran digital yang terintegrasi (untuk memproses transaksi layanan digital)',
      'Kewajiban hukum: jika diwajibkan oleh peraturan perundang-undangan yang berlaku',
      'Perlindungan hak: untuk melindungi hak, properti, atau keselamatan pengguna dan pihak terkait',
      'Dengan persetujuan eksplisit dari pengguna',
    ],
  },
  {
    id: 'user-rights',
    title: '5. Hak Pengguna',
    content: 'Sebagai pengguna, Anda memiliki hak-hak berikut terkait data pribadi Anda:',
    bullets: [
      'Hak akses: melihat data pribadi yang tersimpan dalam sistem',
      'Hak koreksi: meminta perbaikan data yang tidak akurat atau tidak lengkap',
      'Hak hapus: meminta penghapusan data pribadi sesuai ketentuan yang berlaku',
      'Hak portabilitas: meminta salinan data dalam format yang dapat dibaca mesin',
      'Hak keberatan: menolak pemrosesan data untuk tujuan tertentu',
      'Hak penarikan persetujuan: mencabut persetujuan penggunaan data kapan saja',
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookie & Local Storage',
    content: 'Aplikasi ini menggunakan teknologi penyimpanan lokal pada perangkat Anda:',
    bullets: [
      'Local Storage: menyimpan token autentikasi (JWT) dan preferensi pengguna (tema tampilan)',
      'Session data: informasi sesi aktif untuk menjaga status login',
      'Tidak menggunakan cookie pelacakan pihak ketiga',
      'Tidak menggunakan cookie untuk keperluan iklan atau analitik eksternal',
      'Data local storage dapat dihapus melalui pengaturan browser Anda',
    ],
  },
  {
    id: 'children',
    title: '7. Privasi Anak',
    content: `Aplikasi ${APP_NAME} ditujukan untuk penggunaan bisnis dan tidak dirancang untuk digunakan oleh anak di bawah usia 18 tahun. Kami tidak secara sengaja mengumpulkan data pribadi dari anak-anak. Jika Anda mengetahui bahwa anak di bawah umur telah memberikan data pribadi kepada kami, silakan hubungi kami untuk penghapusan data tersebut.`,
    bullets: [],
  },
  {
    id: 'changes',
    title: '8. Perubahan Kebijakan Privasi',
    content: 'Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan akan dikomunikasikan melalui:',
    bullets: [
      'Pembaruan nomor versi dan tanggal efektif pada halaman ini',
      'Notifikasi dalam aplikasi jika terdapat perubahan signifikan',
      'Penggunaan berkelanjutan setelah perubahan dianggap sebagai persetujuan terhadap kebijakan yang diperbarui',
    ],
  },
  {
    id: 'legal',
    title: '9. Dasar Hukum',
    content: 'Kebijakan privasi ini disusun dengan mengacu pada peraturan perundang-undangan yang berlaku di Indonesia:',
    bullets: [
      'Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)',
      'Undang-Undang No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 tentang Informasi dan Transaksi Elektronik (UU ITE)',
      'Peraturan Pemerintah No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik',
      'Peraturan Menteri Kominfo No. 20 Tahun 2016 tentang Perlindungan Data Pribadi dalam Sistem Elektronik',
    ],
  },
  {
    id: 'contact',
    title: '10. Kontak',
    content: `Jika Anda memiliki pertanyaan, keluhan, atau permintaan terkait kebijakan privasi ini atau pengelolaan data pribadi Anda, silakan hubungi kami melalui:`,
    bullets: [
      `Email: ${CONTACT_EMAIL}`,
      'Melalui menu "Hubungi Kami" pada halaman pengaturan aplikasi',
      'Kami akan merespons permintaan Anda dalam waktu maksimal 3×24 jam kerja',
    ],
  },
];

function PrivacyPolicySection() {
  const theme = useTheme();
  const [policyOpen, setPolicyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const contentRef = useRef(null);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    POLICY_SECTIONS.forEach((s) => { all[s.id] = true; });
    setExpandedSections(all);
  };

  const collapseAll = () => setExpandedSections({});

  const filteredSections = searchQuery
    ? POLICY_SECTIONS.filter((s) => {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          s.bullets.some((b) => b.toLowerCase().includes(q))
        );
      })
    : POLICY_SECTIONS;

  const highlightText = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <Box key={i} component="span" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.3), borderRadius: 0.5, px: 0.3 }}>
          {part}
        </Box>
      ) : part
    );
  };

  const handleContact = () => {
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=Pertanyaan Kebijakan Privasi - ${APP_NAME}`;
  };

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box
        onClick={() => setPolicyOpen(!policyOpen)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { opacity: 0.8 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <PolicyIcon fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight={600}>Kebijakan Privasi</Typography>
        </Stack>
        {policyOpen ? <ExpandLessIcon color="action" /> : <ExpandMoreIcon color="action" />}
      </Box>

      <Collapse in={policyOpen}>
        <Box sx={{ mt: 3 }} ref={contentRef}>
          {/* Title Block */}

          {/* Intro */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
            Selamat datang di {APP_NAME}. Kami menghargai dan berkomitmen untuk melindungi privasi data Anda.
            Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi
            informasi Anda saat menggunakan aplikasi ini. Dengan menggunakan layanan kami, Anda menyetujui praktik
            yang dijelaskan dalam kebijakan ini.
          </Typography>

          {/* Search + Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <TextField
              size="small"
              placeholder="Cari dalam kebijakan..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) expandAll();
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="text" onClick={expandAll} sx={{ textTransform: 'none', fontSize: 12 }}>
                Buka Semua
              </Button>
              <Button size="small" variant="text" onClick={collapseAll} sx={{ textTransform: 'none', fontSize: 12 }}>
                Tutup Semua
              </Button>
            </Stack>
          </Stack>

          {searchQuery && filteredSections.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Tidak ditemukan hasil untuk "{searchQuery}"
              </Typography>
            </Box>
          )}

          {/* Policy Sections */}
          <Stack spacing={0}>
            {filteredSections.map((section, idx) => {
              const isOpen = expandedSections[section.id] ?? false;
              return (
                <Box key={section.id}>
                  {/* Section header */}
                  <Box
                    onClick={() => toggleSection(section.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1.5,
                      px: 1,
                      cursor: 'pointer',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background 0.15s',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} color={isOpen ? 'primary.main' : 'text.primary'}>
                      {highlightText(section.title)}
                    </Typography>
                    {isOpen ? (
                      <ExpandLessIcon fontSize="small" color="action" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" color="action" />
                    )}
                  </Box>

                  {/* Section content */}
                  <Collapse in={isOpen}>
                    <Box sx={{ px: 1, pb: 2 }}>
                      {section.content && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: section.bullets.length ? 1.5 : 0, lineHeight: 1.8 }}>
                          {highlightText(section.content)}
                        </Typography>
                      )}
                      {section.bullets.length > 0 && (
                        <List dense disablePadding sx={{ pl: 1 }}>
                          {section.bullets.map((bullet, bi) => (
                            <ListItem key={bi} disableGutters sx={{ py: 0.3, alignItems: 'flex-start' }}>
                              <ListItemIcon sx={{ minWidth: 20, mt: 1 }}>
                                <FiberManualRecordIcon sx={{ fontSize: 6, color: 'text.secondary' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={highlightText(bullet)}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.secondary',
                                  lineHeight: 1.7,
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Collapse>

                  {idx < filteredSections.length - 1 && <Divider />}
                </Box>
              );
            })}
          </Stack>

          <Divider sx={{ mt: 2, mb: 3 }} />

          {/* Action buttons */}
          <Stack direction="row" spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              size="small"
              startIcon={<EmailIcon />}
              onClick={handleContact}
              sx={{ borderRadius: 2.5, textTransform: 'none' }}
            >
              Hubungi Kami
            </Button>
          </Stack>

          {/* Footer */}
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
            © {new Date().getFullYear()} {APP_NAME}. Seluruh hak dilindungi undang-undang.
          </Typography>
        </Box>
      </Collapse>
    </Paper>
  );
}
