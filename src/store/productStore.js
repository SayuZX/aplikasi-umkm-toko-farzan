import { create } from 'zustand';

export const useProductStore = create((set, get) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),

  updateProduct: (updatedProduct) => {
    const products = get().products.map((p) =>
      p.id === updatedProduct.id ? updatedProduct : p
    );
    set({ products });
  },

  addProduct: (product) => {
    set({ products: [...get().products, product] });
  },

  removeProduct: (id) => {
    set({ products: get().products.filter((p) => p.id !== id) });
  },

  updateStock: (updates) => {
    const products = get().products.map((p) => {
      const update = updates.find((u) => u.productId === p.id);
      if (update) {
        return { ...p, stock: update.newStock };
      }
      return p;
    });
    set({ products });
  },
}));
