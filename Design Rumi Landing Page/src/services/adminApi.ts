import axios from 'axios';
import { API_BASE_URL } from './api';

/** Axios instance for admin panel — uses `rumi_admin_token`, not user `rumi_token`. */
export const adminHttp = axios.create({
  baseURL: `${String(API_BASE_URL).replace(/\/$/, '')}/api`,
  headers: { 'Content-Type': 'application/json' },
});

adminHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('rumi_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function adminLogin(body: { username: string; password: string }) {
  return adminHttp.post<{ success: boolean; token?: string; admin?: unknown; message?: string }>(
    '/admin/login',
    body
  );
}

export function adminOverview() {
  return adminHttp.get('/admin/overview');
}

export function adminListUsers(params?: Record<string, string | number | undefined>) {
  return adminHttp.get('/admin/users', { params });
}

export function adminGetUser(id: string) {
  return adminHttp.get(`/admin/users/${id}`);
}

export function adminUpdateUser(id: string, body: Record<string, unknown>) {
  return adminHttp.patch(`/admin/users/${id}`, body);
}

export function adminDeleteUser(id: string) {
  return adminHttp.delete(`/admin/users/${id}`);
}

export function adminListRooms(params?: Record<string, string | number | undefined>) {
  return adminHttp.get('/admin/rooms', { params });
}

export function adminModerateRoom(id: string, moderationStatus: 'pending' | 'approved' | 'rejected') {
  return adminHttp.patch(`/admin/rooms/${id}`, { moderationStatus });
}

export function adminDeleteRoom(id: string) {
  return adminHttp.delete(`/admin/rooms/${id}`);
}

export function adminListMatches(params?: Record<string, string | number | undefined>) {
  return adminHttp.get('/admin/matches', { params });
}

export function adminDeleteMatch(id: string) {
  return adminHttp.delete(`/admin/matches/${id}`);
}

export function adminListReports(params?: Record<string, string | number | undefined>) {
  return adminHttp.get('/admin/reports', { params });
}

export function adminHandleReport(
  id: string,
  body: { action: 'warn' | 'block' | 'delete' | 'dismiss'; note?: string }
) {
  return adminHttp.patch(`/admin/reports/${id}/handle`, body);
}
