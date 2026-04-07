import { create } from 'zustand';

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('pos_token');
    const user = JSON.parse(localStorage.getItem('pos_user') || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create((set) => ({
  token: getStoredAuth().token,
  user: getStoredAuth().user,
  serverUrl: localStorage.getItem('pos_server_url') || (() => {
    const { protocol, hostname, port } = window.location;
    // Electron file:// protocol — use VPS directly
    if (protocol === 'file:') {
      return 'http://72.62.125.221:3000';
    }
    // On standard ports (80/443), API is served via reverse proxy at same origin
    if (!port || port === '80' || port === '443') {
      return `${protocol}//${hostname}`;
    }
    // On non-standard ports (dev/direct access), assume backend at port 3000
    return `${protocol}//${hostname}:3000`;
  })(),

  setAuth: (token, user) => {
    localStorage.setItem('pos_token', token);
    localStorage.setItem('pos_user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    set({ token: null, user: null });
  },

  setServerUrl: (url) => {
    localStorage.setItem('pos_server_url', url);
    // Sync to Electron main process for auto-update checks
    window.electronAPI?.setServerUrl?.(url);
    set({ serverUrl: url });
  },
}));
