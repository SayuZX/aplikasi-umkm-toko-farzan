/**
 * Centralized hotkey definitions.
 * Used by:
 *   - Settings page (display table)
 *   - useHotkeys hook (register listeners)
 */

export const HOTKEYS_CONFIG = [
  {
    section: 'Navigasi Halaman',
    items: [
      { action: 'Buka Dashboard', keys: ['Ctrl+D'], navigate: '/dashboard' },
      { action: 'Buka Penjualan / POS', keys: ['F1'], navigate: '/kasir' },
      { action: 'Buka Master Data Produk', keys: ['Ctrl+M'], navigate: '/products' },
      { action: 'Buka Laporan', keys: ['Ctrl+R'], navigate: '/reports' },
      { action: 'Buka Pengaturan', keys: ['Ctrl+,'], navigate: '/settings' },
      { action: 'Expand / Collapse Sidebar', keys: ['Ctrl+B'], description: 'Toggle sidebar kiri' },
    ],
  },
  {
    section: 'Kasir / POS',
    items: [
      { action: 'Fokus pencarian produk', keys: ['Ctrl+F', '/'], description: 'Fokus ke kolom cari produk' },
      { action: 'Scan barcode', keys: ['F2'], description: 'Fokus ke input barcode' },
      { action: 'Proses pembayaran / Checkout', keys: ['F5', 'Ctrl+Enter'], description: 'Buka modal checkout' },
      { action: 'Hapus item terakhir dari keranjang', keys: ['Delete'], description: 'Saat tidak ada input fokus' },
    ],
  },
  {
    section: 'Umum',
    items: [
      { action: 'Batal / Tutup modal', keys: ['Escape'] },
      { action: 'Layar penuh', keys: ['F11'], description: 'Toggle fullscreen' },
      { action: 'Reload aplikasi', keys: ['Ctrl+Shift+R'], description: 'Hanya saat mode developer' },
    ],
  },
];
