import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
  persist(
    (set) => ({
      collapsed: false,
      mobileOpen: false,
      badges: {},

      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      setBadge: (path, value) =>
        set((s) => ({ badges: { ...s.badges, [path]: value } })),
    }),
    {
      name: 'pos_sidebar',
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);
