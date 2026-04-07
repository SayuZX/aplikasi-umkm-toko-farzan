import { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const BLUE = '#1E40AF';
const BLUE_LIGHT = '#2563EB';

const formatRp = (n) => 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');

const formatDateTime = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
};

const ZigzagTop = () => (
  <div style={{
    height: 20,
    background: `radial-gradient(circle at 50% 0%, #fff 12px, transparent 13px),
                 radial-gradient(circle at 0% 0%, #fff 12px, transparent 13px),
                 radial-gradient(circle at 100% 0%, #fff 12px, transparent 13px)`,
    backgroundSize: '24px 20px',
    backgroundRepeat: 'repeat-x',
    backgroundColor: BLUE,
  }} />
);

const ZigzagBottom = () => (
  <div style={{
    height: 20,
    background: `radial-gradient(circle at 50% 100%, #fff 12px, transparent 13px)`,
    backgroundSize: '24px 20px',
    backgroundRepeat: 'repeat-x',
    backgroundColor: '#fff',
  }} />
);

const Row = ({ label, value, bold, large, colorVal }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: bold ? '8px 0 4px' : '4px 0',
    fontSize: large ? 15 : 13,
    fontWeight: bold ? 700 : 400,
    color: '#374151',
    borderTop: bold ? '1px dashed #E5E7EB' : 'none',
    marginTop: bold ? 4 : 0,
  }}>
    <span>{label}</span>
    <span style={{ color: colorVal || (bold ? '#111827' : '#374151'), fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </span>
  </div>
);

function ReceiptCard({ transaction, settings, receiptRef }) {
  const { date, time } = formatDateTime(transaction.created_at);
  const storeName = (settings.store_name || 'TOKO FARZAN KALIKABONG').toUpperCase();
  const storeAddress = settings.store_address || '';
  const storePhone = settings.store_phone || '';

  const subtotal = transaction.items?.reduce((s, i) => s + Number(i.subtotal), 0) || 0;
  const discount = Number(transaction.discount_amount) || 0;
  const tax = Number(transaction.tax_amount) || 0;
  const total = Number(transaction.total) || 0;
  const paid = Number(transaction.payment_amount) || 0;
  const change = Number(transaction.change_amount) || 0;
  const methodLabel = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', kasbon: 'Kasbon' }[transaction.payment_method] || transaction.payment_method;

  return (
    <div ref={receiptRef} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', maxWidth: 360, margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Blue Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BLUE} 0%, ${BLUE_LIGHT} 100%)`,
        color: '#fff',
        textAlign: 'center',
        padding: '28px 24px 20px',
        borderRadius: '16px 16px 0 0',
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <CheckCircleIcon style={{ fontSize: 32, color: BLUE }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.5 }}>{storeName}</div>
        {storeAddress && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>{storeAddress}</div>}
        {storePhone && <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Telp: {storePhone}</div>}
      </div>

      <ZigzagTop />

      {/* Body */}
      <div style={{ background: '#fff', padding: '4px 20px 0' }}>
        <Row label="Tanggal" value={date} />
        <Row label="Waktu" value={time} />
        <Row label="No. Struk" value={transaction.transaction_no} />
        <Row label="Kasir" value={transaction.user?.full_name || '-'} />
        {transaction.customer_name && <Row label="Pelanggan" value={transaction.customer_name} />}
        <Row label="Metode" value={methodLabel} />
        {transaction.transfer_bank && <Row label="Bank" value={transaction.transfer_bank.toUpperCase()} />}
        {transaction.payment_ref && <Row label="Ref" value={transaction.payment_ref} />}

        {/* LUNAS badge */}
        <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 20px',
            border: `2px solid ${BLUE}`,
            borderRadius: 6,
            color: BLUE,
            fontWeight: 800,
            fontSize: 13,
            letterSpacing: 3,
          }}>
            {transaction.payment_method === 'kasbon' ? '## KASBON ##' : '## LUNAS ##'}
          </span>
        </div>

        <div style={{ borderTop: '1px dashed #E5E7EB', margin: '8px 0' }} />

        {/* Accordion items */}
        <details style={{ marginBottom: 8 }}>
          <summary style={{
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: BLUE, padding: '6px 0', listStyle: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Lihat Detail Pembelian ({transaction.items?.length || 0} item)</span>
            <span style={{ fontSize: 10 }}>▾</span>
          </summary>
          <div style={{ paddingTop: 6 }}>
            {transaction.items?.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4B5563', padding: '3px 0' }}>
                <span style={{ flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.product_name} <span style={{ color: '#9CA3AF' }}>×{item.quantity}</span>
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{formatRp(item.subtotal)}</span>
              </div>
            ))}
          </div>
        </details>

        <div style={{ borderTop: '1px dashed #E5E7EB', margin: '8px 0' }} />

        {/* Totals */}
        <Row label="Subtotal" value={formatRp(subtotal)} />
        {discount > 0 && <Row label="Diskon Voucher" value={`– ${formatRp(discount)}`} colorVal={BLUE} />}
        {tax > 0 && <Row label="Pajak" value={formatRp(tax)} />}
        <Row label="Total" value={formatRp(total)} bold large />
        <Row label="Bayar" value={formatRp(paid)} />
        <Row label="Kembalian" value={formatRp(change)} bold colorVal="#16A34A" />

        <div style={{ textAlign: 'center', padding: '14px 0 8px', fontSize: 11, color: '#9CA3AF' }}>
          {settings.receipt_footer || 'Terima kasih telah berbelanja!'}
        </div>
      </div>

      <ZigzagBottom />
    </div>
  );
}

export default function Receipt({ transaction, onClose }) {
  const [settings, setSettings] = useState({});
  const receiptRef = useRef(null);

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data)).catch(() => {});
  }, []);

  const buildThermalHtml = (s) => {
    const storeName = (s.store_name || 'TOKO FARZAN KALIKABONG').toUpperCase();
    const storeAddress = s.store_address || '';
    const storePhone = s.store_phone || '';
    const { date, time } = formatDateTime(transaction.created_at);
    const subtotal = transaction.items?.reduce((acc, i) => acc + Number(i.subtotal), 0) || 0;
    const discount = Number(transaction.discount_amount) || 0;
    const tax = Number(transaction.tax_amount) || 0;
    const total = Number(transaction.total) || 0;
    const paid = Number(transaction.payment_amount) || 0;
    const change = Number(transaction.change_amount) || 0;
    const methodLabel = { cash: 'Tunai', qris: 'QRIS', transfer: 'Transfer', kasbon: 'Kasbon' }[transaction.payment_method] || transaction.payment_method;

    const pad = (left, right, width = 32) => {
      const r = String(right);
      const spaces = width - String(left).length - r.length;
      return String(left) + ' '.repeat(Math.max(1, spaces)) + r;
    };

    const itemsHtml = (transaction.items || []).map(item =>
      `<div><b>${item.product_name}</b></div>` +
      `<div class="pre">${pad('  ' + item.quantity + ' x ' + formatRp(item.unit_price), formatRp(item.subtotal))}</div>`
    ).join('');

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Courier New',Courier,monospace; font-size:8pt; color:#000; background:#fff; width:58mm; padding:2mm 3mm; }
  .center { text-align:center; }
  .pre { white-space:pre; font-family:inherit; font-size:8pt; }
  .row { display:flex; justify-content:space-between; font-family:inherit; margin:2px 0; }
  .line { border-top:1px solid #000; margin:4px 0; }
  .dashed { border-top:1px dashed #000; margin:4px 0; }
  @page { size:58mm auto; margin:0; }
</style></head><body>
<div class="center" style="font-size:10pt;font-weight:bold">${storeName}</div>
${storeAddress ? `<div class="center">${storeAddress}</div>` : ''}
${storePhone ? `<div class="center">Telp: ${storePhone}</div>` : ''}
<div class="line"></div>
<div class="pre">${pad('Tgl', date)}</div>
<div class="pre">${pad('Waktu', time)}</div>
<div class="pre">${pad('No', transaction.transaction_no)}</div>
<div class="pre">${pad('Kasir', transaction.user?.full_name || '-')}</div>
${transaction.customer_name ? `<div class="pre">${pad('Pelanggan', transaction.customer_name)}</div>` : ''}
<div class="pre">${pad('Metode', methodLabel)}</div>
${transaction.transfer_bank ? `<div class="pre">${pad('Bank', transaction.transfer_bank.toUpperCase())}</div>` : ''}
${transaction.payment_ref ? `<div class="pre">${pad('Ref', transaction.payment_ref)}</div>` : ''}
<div class="line"></div>
${itemsHtml}
<div class="dashed"></div>
<div class="pre">${pad('Subtotal', formatRp(subtotal))}</div>
${discount > 0 ? `<div class="pre">${pad('Diskon', '-' + formatRp(discount))}</div>` : ''}
${tax > 0 ? `<div class="pre">${pad('Pajak', formatRp(tax))}</div>` : ''}
<div class="line"></div>
<div class="row" style="font-size:10pt;font-weight:bold"><span>TOTAL</span><span>${formatRp(total)}</span></div>
<div class="line"></div>
<div class="pre">${pad('Bayar', formatRp(paid))}</div>
<div class="row" style="font-weight:bold"><span>Kembalian</span><span>${formatRp(change)}</span></div>
<div class="dashed"></div>
<div class="center" style="font-weight:bold;margin-top:4px">${transaction.payment_method === 'kasbon' ? '** KASBON **' : '** LUNAS **'}</div>
<div class="center" style="margin-top:6px">${s.receipt_footer || 'Terima kasih telah berbelanja!'}</div>
<div class="center" style="margin-top:4px;font-size:7pt">*** Simpan struk sebagai bukti ***</div>
</body></html>`;
  };

  const handlePrint = () => {
    const pw = window.open('', '_blank', 'width=320,height=700');
    if (pw) {
      pw.document.write(buildThermalHtml(settings));
      pw.document.close();
      pw.focus();
      setTimeout(() => { pw.print(); pw.close(); }, 300);
    }
  };

  const handleShare = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `struk-${transaction.transaction_no}.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Struk Belanja' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = file.name; a.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch {
      handlePrint();
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      scroll="paper"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: '#F3F4F6',
            maxHeight: 'calc(100vh - 80px)',
            mx: 2,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1.5, pt: 1, flexShrink: 0 }}>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </Box>

      <DialogContent sx={{ px: 2, pt: 0, pb: 1, overflowY: 'auto' }}>
        <ReceiptCard transaction={transaction} settings={settings} receiptRef={receiptRef} />
      </DialogContent>

      <Box sx={{ display: 'flex', gap: 1.5, px: 2, pb: 2.5, pt: 0.5, flexShrink: 0 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ borderRadius: 2, fontWeight: 700, py: 1.25 }}
        >
          Cetak Struk
        </Button>
        <IconButton
          onClick={handleShare}
          sx={{
            border: '1px solid #BFDBFE', bgcolor: '#EFF6FF', color: '#1D4ED8', borderRadius: 2,
            width: 48, height: 48, flexShrink: 0, '&:hover': { bgcolor: '#DBEAFE' },
          }}
        >
          <ShareIcon />
        </IconButton>
      </Box>
    </Dialog>
  );
}
