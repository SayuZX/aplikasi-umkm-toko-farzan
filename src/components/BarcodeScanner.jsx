/**
 * BarcodeScanner — Reusable camera barcode scanner dialog.
 *
 * Props:
 *   open       {boolean}   Show/hide dialog
 *   onClose    {function}  Called when user closes; also called after successful scan in 'kasir' mode
 *   onScan     {function}  Called with decoded barcode string
 *   title      {string}    Dialog title
 *   mode       {string}    'kasir' | 'product'
 *                          kasir   → closes dialog after successful scan
 *                          product → stays open, lets user scan multiple times
 *
 * Supported formats: EAN-13, EAN-8, Code 128, Code 39, QR Code, Data Matrix
 * Also supports: HID USB scanner (handled by parent's text field)
 * File/image upload: scan barcode from an image file
 */
import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import toast from 'react-hot-toast';

/* ── Constants ────────────────────────────────────────────────── */
const DEBOUNCE_MS = 2000;

const SCAN_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

const FORMAT_LABELS = ['EAN-13', 'EAN-8', 'Code 128', 'Code 39', 'QR Code', 'Data Matrix'];

/* ── Beep via Web Audio API ──────────────────────────────────── */
const playBeep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch { /* silent fail */ }
};

/* ── Component ───────────────────────────────────────────────── */
export default function BarcodeScanner({
  open,
  onClose,
  onScan,
  title = 'Scan Barcode',
  mode = 'kasir',
}) {
  const uid = useId().replace(/:/g, '');
  const SCANNER_DIV_ID = `bcs-${uid}`;

  const scannerRef    = useRef(null);  // Html5Qrcode instance
  const lastScanTime  = useRef(0);
  const fileInputRef  = useRef(null);

  const [cameras,      setCameras]      = useState([]);
  const [activeCamId,  setActiveCamId]  = useState(null);
  const [status,       setStatus]       = useState('idle'); // idle|loading|scanning|error
  const [lastScanned,  setLastScanned]  = useState(null);
  const [flashOk,      setFlashOk]      = useState(false);
  const [scanHistory,  setScanHistory]  = useState([]);
  const [manualCode,   setManualCode]   = useState('');
  const isHttps = window.isSecureContext;

  /* ── Destroy scanner helper ──────────────────────────────── */
  const destroyScanner = async () => {
    if (!scannerRef.current) return;
    try { await scannerRef.current.stop(); } catch { /* already stopped */ }
    try { scannerRef.current.clear(); }     catch { /* element gone */ }
    scannerRef.current = null;
  };

  /* ── Get cameras when dialog opens ──────────────────────── */
  useEffect(() => {
    if (!open) {
      destroyScanner();
      setStatus('idle');
      setLastScanned(null);
      setFlashOk(false);
      setManualCode('');
      return;
    }

    // Camera API requires HTTPS — on plain HTTP it will always fail
    if (!window.isSecureContext) {
      setStatus('error');
      return;
    }

    setStatus('loading');
    Html5Qrcode.getCameras()
      .then((list) => {
        if (list.length === 0) {
          setStatus('error');
          toast.error('Tidak ada kamera terdeteksi');
          return;
        }
        setCameras(list);
        // Prefer back/environment camera for mobile devices
        const back = list.find((c) => /back|rear|environment/i.test(c.label));
        setActiveCamId(back ? back.id : list[0].id);
      })
      .catch(() => {
        setStatus('error');
        toast.error('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.');
      });

    return () => { destroyScanner(); };
  }, [open]); // eslint-disable-line

  /* ── Start scanner when camera ID is ready ───────────────── */
  useEffect(() => {
    if (!open || !activeCamId || status === 'error') return;

    // Delay so Dialog transition (≈200ms) finishes and div is in DOM
    const t = setTimeout(() => { startScanner(activeCamId); }, 350);
    return () => { clearTimeout(t); destroyScanner(); };
  }, [open, activeCamId]); // eslint-disable-line

  /* ── Start ───────────────────────────────────────────────── */
  const startScanner = async (cameraId) => {
    await destroyScanner();
    const div = document.getElementById(SCANNER_DIV_ID);
    if (!div || !cameraId) return;

    try {
      setStatus('scanning');
      const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        cameraId,
        {
          fps: 12,
          qrbox: (w, h) => ({
            width:  Math.min(280, Math.round(w * 0.78)),
            height: Math.min(160, Math.round(h * 0.55)),
          }),
          formatsToSupport: SCAN_FORMATS,
          aspectRatio: 1.6,
          useBarCodeDetectorIfSupported: true,
        },
        handleSuccess,
        () => { /* scan-frame error — ignore */ },
      );
    } catch (err) {
      console.error('[BarcodeScanner] start error:', err);
      setStatus('error');
      toast.error('Gagal memulai kamera');
    }
  };

  /* ── Scan success ────────────────────────────────────────── */
  const handleSuccess = (decodedText) => {
    const now = Date.now();
    if (now - lastScanTime.current < DEBOUNCE_MS) return;
    lastScanTime.current = now;

    playBeep();
    setLastScanned(decodedText);
    setFlashOk(true);
    setTimeout(() => setFlashOk(false), 700);
    setScanHistory((h) => [decodedText, ...h].slice(0, 5));

    onScan(decodedText);

    if (mode === 'kasir') {
      destroyScanner();
      onClose();
    }
  };

  /* ── Switch camera ───────────────────────────────────────── */
  const handleSwitchCamera = (id) => {
    setActiveCamId(id);
  };

  /* ── File / image upload ─────────────────────────────────── */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    await destroyScanner();
    setStatus('loading');

    const div = document.getElementById(SCANNER_DIV_ID);
    if (!div) { setStatus('error'); return; }

    try {
      const scanner = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
      scannerRef.current = scanner;
      const result = await scanner.scanFile(file, /* showImage= */ true);
      handleSuccess(result);
    } catch {
      toast.error('Barcode tidak terdeteksi di gambar tersebut');
    } finally {
      // Restart live camera after file scan
      if (activeCamId) {
        setTimeout(() => startScanner(activeCamId), 400);
      } else {
        setStatus('idle');
      }
    }
  };

  const handleClose = () => {
    destroyScanner();
    onClose();
  };

  const activeCam = cameras.find((c) => c.id === activeCamId);

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', m: 1 } }}
      >
        {/* ── Title ─────────────────────────────────────────── */}
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, px: 2.5 }}>
          <QrCodeScannerIcon color="primary" sx={{ fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, fontSize: 16 }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={handleClose} edge="end">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* ── Camera viewport ───────────────────────────────── */}
        <DialogContent sx={{ p: 0, position: 'relative', bgcolor: '#000', overflow: 'hidden' }}>
          {/* Scanner mount point — html5-qrcode renders video here */}
          <Box
            id={SCANNER_DIV_ID}
            sx={{
              width: '100%',
              minHeight: 260,
              '& video': { width: '100% !important', display: 'block' },
              '& canvas': { display: 'none !important' },
              /* Hide default html5-qrcode anchor/buttons inside viewport */
              '& #html5-qrcode-anchor-scan-type-change': { display: 'none !important' },
            }}
          />

          {/* Loading overlay */}
          {status === 'loading' && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.8)', gap: 2,
            }}>
              <CircularProgress color="primary" size={40} />
              <Typography sx={{ color: '#fff', fontSize: 13 }}>Memulai kamera…</Typography>
            </Box>
          )}

          {/* Error overlay */}
          {status === 'error' && (
            <Box sx={{
              position: 'absolute', inset: 0, minHeight: 260,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.92)', gap: 2, p: 3,
            }}>
              <CameraAltIcon sx={{ fontSize: 48, color: '#ef4444' }} />
              {!isHttps ? (
                <Typography sx={{ color: '#fff', textAlign: 'center', fontSize: 13, lineHeight: 1.7 }}>
                  <strong style={{ color: '#fbbf24', fontSize: 14 }}>Kamera memerlukan HTTPS</strong><br />
                  Situs ini berjalan via HTTP (tidak aman).<br />
                  Browser memblokir akses kamera pada koneksi HTTP.<br />
                  Gunakan <strong>Dari Gambar</strong> atau <strong>Input Manual</strong> di bawah.
                </Typography>
              ) : (
                <Typography sx={{ color: '#fff', textAlign: 'center', fontSize: 13, lineHeight: 1.6 }}>
                  Kamera tidak tersedia.<br />
                  Pastikan izin kamera sudah diberikan di browser,<br />
                  atau gunakan fitur <strong>Dari Gambar</strong> di bawah.
                </Typography>
              )}
              <Button
                variant="contained"
                size="small"
                startIcon={<FileUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ mt: 1, bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}
              >
                Scan dari Gambar
              </Button>
              {/* Manual barcode input — useful when no camera & no image */}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, width: '100%', maxWidth: 320 }}>
                <input
                  type="text"
                  placeholder="Atau ketik kode barcode…"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualCode.trim()) {
                      handleSuccess(manualCode.trim());
                      setManualCode('');
                    }
                  }}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6,
                    border: '1px solid #4b5563', background: '#1f2937',
                    color: '#fff', fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  onClick={() => { if (manualCode.trim()) { handleSuccess(manualCode.trim()); setManualCode(''); } }}
                  disabled={!manualCode.trim()}
                  style={{
                    padding: '8px 14px', borderRadius: 6, border: 'none',
                    background: manualCode.trim() ? '#2563eb' : '#374151',
                    color: '#fff', fontSize: 13, cursor: manualCode.trim() ? 'pointer' : 'default',
                  }}
                >
                  OK
                </button>
              </Box>
            </Box>
          )}

          {/* Success flash overlay */}
          {flashOk && (
            <Box sx={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(34,197,94,0.30)',
              animation: 'bcsFlash 0.7s ease forwards',
              '@keyframes bcsFlash': {
                '0%':   { opacity: 1 },
                '100%': { opacity: 0 },
              },
            }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: '#22c55e', filter: 'drop-shadow(0 0 12px #22c55e)' }} />
            </Box>
          )}

          {/* Scanning-state: hint text at bottom of video */}
          {status === 'scanning' && (
            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
              py: 1.25, textAlign: 'center',
            }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 12 }}>
                Arahkan kamera ke barcode produk
              </Typography>
            </Box>
          )}
        </DialogContent>

        {/* ── Info / result panel ───────────────────────────── */}
        <Box sx={{ px: 2, pt: 1.5, pb: lastScanned ? 1 : 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Supported format chips */}
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.4, mb: 1 }}>
            {FORMAT_LABELS.map((f) => (
              <Chip key={f} label={f} size="small" variant="outlined" sx={{ fontSize: 10, height: 20, borderRadius: 1 }} />
            ))}
          </Stack>

          {/* Last scanned result */}
          {lastScanned && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.75,
              borderRadius: 1.5, bgcolor: 'success.soft',
              border: '1px solid', borderColor: 'success.main',
              mb: 1,
            }}>
              <CheckCircleIcon fontSize="small" color="success" />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 10, color: 'success.main', fontWeight: 600, lineHeight: 1 }}>
                  TERDETEKSI
                </Typography>
                <Typography sx={{
                  fontSize: 15, fontWeight: 700, fontFamily: 'monospace',
                  color: 'success.dark', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {lastScanned}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Scan history (product mode only) */}
          {mode === 'product' && scanHistory.length > 1 && (
            <Box sx={{ mb: 0.5 }}>
              <Typography sx={{ fontSize: 10, color: 'text.disabled', mb: 0.25 }}>Riwayat scan:</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {scanHistory.slice(1).map((code, i) => (
                  <Chip
                    key={i}
                    label={code}
                    size="small"
                    onClick={() => onScan(code)}
                    sx={{ fontSize: 11, fontFamily: 'monospace', height: 22, cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>

        {/* ── Actions ───────────────────────────────────────── */}
        <DialogActions sx={{ px: 2, pb: 2, pt: 0.5, gap: 1, flexWrap: 'wrap' }}>
          {/* Camera selector */}
          {cameras.length > 1 && (
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <Select
                value={activeCamId || ''}
                onChange={(e) => handleSwitchCamera(e.target.value)}
                displayEmpty
                startAdornment={<FlipCameraAndroidIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
                sx={{ fontSize: 12, height: 32 }}
              >
                {cameras.map((c) => (
                  <MenuItem key={c.id} value={c.id} sx={{ fontSize: 12 }}>
                    {c.label || `Kamera ${cameras.indexOf(c) + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Camera info if only one */}
          {cameras.length === 1 && activeCam && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CameraAltIcon sx={{ fontSize: 14 }} />
              {activeCam.label || 'Kamera'}
            </Typography>
          )}

          <Tooltip title="Scan barcode dari file gambar">
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ fontSize: 12, height: 32 }}
            >
              Dari Gambar
            </Button>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          <Button variant="contained" size="small" onClick={handleClose} sx={{ height: 32 }}>
            Tutup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
