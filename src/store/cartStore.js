import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  items: [],
  customerName: '',
  notes: '',

  addItem: (product) => {
    const items = [...get().items];
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += 1;
      existing.subtotal = existing.quantity * existing.unit_price;
    } else {
      items.push({
        product_id: product.id,
        barcode: product.barcode,
        product_name: product.name,
        unit: product.unit,
        quantity: 1,
        unit_price: parseFloat(product.price),
        subtotal: parseFloat(product.price),
        stock: product.stock,
      });
    }
    set({ items });
  },

  updateQuantity: (productId, quantity) => {
    const items = get().items.map((item) => {
      if (item.product_id === productId) {
        const qty = Math.max(1, parseInt(quantity) || 1);
        return { ...item, quantity: qty, subtotal: qty * item.unit_price };
      }
      return item;
    });
    set({ items });
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  setCustomerName: (name) => set({ customerName: name }),
  setNotes: (notes) => set({ notes }),

  getTotal: () => get().items.reduce((sum, i) => sum + i.subtotal, 0),
  getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
  getItemCount: () => get().items.length,

  clear: () => set({ items: [], customerName: '', notes: '' }),
}));
