import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL.startsWith('http') ? import.meta.env.VITE_API_URL : `${window.location.origin}${import.meta.env.VITE_API_URL}`)
  : 'http://localhost:4000';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rumi_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rumi_token');
      localStorage.removeItem('rumi_user');
      window.dispatchEvent(new Event('rumi:logout'));
    }
    return Promise.reject(err);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const sendOtp = (email) => api.post('/auth/otp/send', { email });
export const verifyOtp = (email, code) => api.post('/auth/otp/verify', { email, code });

// User
export const getProfile = () => api.get('/user/profile');
export const updateProfile = (data) => api.put('/user/profile', data);

// Matches
export const getMatches = (params) => api.get('/matches', { params });
export const getMatchExplain = (userId) => api.get('/matches/explain', { params: { userId } });

// Requests
export const sendRequest = (toUserId) => api.post('/request/send', { toUserId });
export const acceptRequest = (data) => api.post('/request/accept', data);
export const rejectRequest = (data) => api.post('/request/reject', data);
export const getReceivedRequests = () => api.get('/request/received');
export const getSentRequests = () => api.get('/request/sent');

// Chat
export const getChatHistory = (userId) => api.get('/chat/history', { params: { userId } });

// Report
export const createReport = (data) => api.post('/report', data);

export default api;
