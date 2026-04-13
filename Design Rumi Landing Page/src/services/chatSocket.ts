import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';

function socketOrigin(): string {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/$/, '');
  }
}

let socket: Socket | null = null;

/**
 * Singleton Socket.io client authenticated with `rumi_token`.
 */
export function getChatSocket(): Socket | null {
  const token = localStorage.getItem('rumi_token');
  if (!token) return null;

  if (socket?.connected) return socket;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(socketOrigin(), {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect_error', () => {
    // Avoid noisy logs in production UI; caller may show an error.
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
