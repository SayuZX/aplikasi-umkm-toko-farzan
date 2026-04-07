import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useProductStore } from '../store/productStore';

let socket = null;

export const connectSocket = () => {
  const { serverUrl } = useAuthStore.getState();
  if (socket?.connected) return socket;

  socket = io(serverUrl, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  // Realtime product updates
  socket.on('product:created', ({ product }) => {
    useProductStore.getState().addProduct(product);
  });

  socket.on('product:updated', ({ product }) => {
    useProductStore.getState().updateProduct(product);
  });

  socket.on('product:deleted', ({ id }) => {
    useProductStore.getState().removeProduct(id);
  });

  socket.on('stock:updated', (updates) => {
    useProductStore.getState().updateStock(updates);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
