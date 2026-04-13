import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL
      : `${window.location.origin}${import.meta.env.VITE_API_URL}`)
  : 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const skipAuth = (config as { skipAuth?: boolean }).skipAuth;
  if (skipAuth) {
    if (config.headers && 'Authorization' in config.headers) {
      delete config.headers.Authorization;
    }
    return config;
  }
  const token = localStorage.getItem('rumi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getMatches(params?: any) {
  return api.get('/matches', { params });
}

export async function getReceivedRequests() {
  return api.get('/request/received');
}

export async function getReceivedAcceptedRequests() {
  return api.get('/request/received/accepted');
}

export async function getSentRequests(params?: { roomId?: string }) {
  return api.get('/request/sent', { params: params || {} });
}

export async function sendRequest(toUserId: string) {
  return api.post('/request/send', { toUserId });
}

export async function passRequest(toUserId: string) {
  return api.post('/request/pass', { toUserId });
}

export async function acceptRequest(data: any) {
  return api.post('/request/accept', data);
}

export async function rejectRequest(data: any) {
  return api.post('/request/reject', data);
}

// Auth — skipAuth avoids sending a stale Bearer token (can break reset/login on some setups)
export async function register(data: any) {
  return api.post('/auth/register', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function login(data: any) {
  return api.post('/auth/login', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function sendOtp(data: any) {
  return api.post('/auth/otp/send', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function verifyOtp(data: any) {
  return api.post('/auth/otp/verify', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function requestPasswordReset(data: { email: string }) {
  return api.post('/auth/password-reset/request', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function verifyPasswordResetCode(data: { email: string; code: string }) {
  return api.post('/auth/password-reset/verify-code', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function confirmPasswordReset(data: { resetToken: string; newPassword: string }) {
  return api.post('/auth/password-reset/confirm', data, { skipAuth: true } as { skipAuth: boolean });
}

export async function getChatHistory(otherUserId: string, roomId?: string | null) {
  const params: Record<string, string> = { userId: otherUserId };
  if (roomId) params.roomId = roomId;
  return api.get('/chat/history', { params });
}

// Assistant (Gemini)
export async function sendAssistantMessage(payload: any) {
  return api.post('/assistant/chat', payload);
}

// Profile
export async function updateProfile(data: any) {
  return api.put('/user/profile', data);
}

export async function getProfile() {
  return api.get('/user/profile');
}

export async function uploadProfilePhoto(file: File) {
  const form = new FormData();
  form.append('photo', file);
  return api.post('/user/profile/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// Rooms (Offer a Room / Just Exploring)
export async function createRoom(form: FormData) {
  return api.post('/rooms', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getRecommendedRooms(limit: number = 5) {
  return api.get('/rooms/recommended', { params: { limit } });
}

// --- Offer a Room (room owner dashboard) ---

export async function getMyRooms() {
  return api.get('/rooms/mine');
}

export async function updateRoomStatus(roomId: string, status: 'active' | 'paused' | 'rented') {
  return api.patch(`/rooms/${roomId}/status`, { status });
}

export async function updateRoom(roomId: string, form: FormData) {
  return api.put(`/rooms/${roomId}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function deleteRoom(roomId: string) {
  return api.delete(`/rooms/${roomId}`);
}

export async function incrementRoomView(roomId: string) {
  return api.post(`/rooms/${roomId}/view`);
}

export async function getRoomReceivedRequests(roomId: string) {
  return api.get('/request/received', { params: { roomId } });
}

export async function getRoomReceivedAcceptedRequests(roomId: string) {
  return api.get('/request/received/accepted', { params: { roomId } });
}

export async function getChatThreads(roomId: string) {
  return api.get('/chat/threads', { params: { roomId } });
}

export async function getChatHistoryWithRoom(otherUserId: string, roomId: string) {
  return api.get('/chat/history', { params: { userId: otherUserId, roomId } });
}

export async function getRoomSuggestions(roomId: string, limit: number = 10) {
  return api.get(`/rooms/${roomId}/suggestions`, { params: { limit } });
}

// Invite to Connect (room-scoped request)
export async function inviteToConnect(toUserId: string, roomId: string) {
  return api.post('/request/send', { toUserId, roomId });
}

