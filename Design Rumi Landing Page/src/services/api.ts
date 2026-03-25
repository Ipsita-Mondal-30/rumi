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

export async function getSentRequests() {
  return api.get('/request/sent');
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

// Auth
export async function register(data: any) {
  return api.post('/auth/register', data);
}

export async function login(data: any) {
  return api.post('/auth/login', data);
}

export async function sendOtp(data: any) {
  return api.post('/auth/otp/send', data);
}

export async function verifyOtp(data: any) {
  return api.post('/auth/otp/verify', data);
}

export async function getChatHistory(otherUserId: string) {
  return api.get('/chat/history', { params: { userId: otherUserId } });
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

