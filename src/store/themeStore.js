import { create } from 'zustand';

// Force default to light mode — reset if previously dark
if (!localStorage.getItem('pos_theme')) {
  localStorage.setItem('pos_theme', 'light');
}

export const useThemeStore = create((set) => ({
  mode: localStorage.getItem('pos_theme') || 'light',
  toggleMode: () =>
    set((state) => {
      const next = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('pos_theme', next);
      return { mode: next };
    }),
}));
