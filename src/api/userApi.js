const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getHeaders() {
  const userId = localStorage.getItem('rumi_user_id');
  const headers = { 'Content-Type': 'application/json' };
  if (userId) headers['x-user-id'] = userId;
  return headers;
}

export async function register(email, phone) {
  const res = await fetch(`${API_BASE}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email || '', phone: phone || '' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Registration failed');
  return json;
}

export async function uploadProfilePicture(userId, file) {
  const id = userId || localStorage.getItem('rumi_user_id');
  const form = new FormData();
  form.append('photo', file);
  form.append('userId', id);
  const headers = {};
  if (id) headers['x-user-id'] = id;
  const res = await fetch(`${API_BASE}/user/upload-profile-picture`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to upload photo');
  return json;
}

export async function createProfile(userId, data) {
  const res = await fetch(`${API_BASE}/user/create-profile`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ ...data, userId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to create profile');
  return json;
}

export async function getProfile(userId) {
  const id = userId || localStorage.getItem('rumi_user_id');
  const res = await fetch(`${API_BASE}/user/profile/${id || ''}`, {
    headers: getHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to fetch profile');
  return json;
}

export async function updateProfile(userId, data) {
  const id = userId || localStorage.getItem('rumi_user_id');
  const res = await fetch(`${API_BASE}/user/update-profile`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ ...data, userId: id }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to update profile');
  return json;
}

export async function uploadVerification(userId, file, type = 'aadhar') {
  const id = userId || localStorage.getItem('rumi_user_id');
  const form = new FormData();
  form.append('document', file);
  form.append('type', type);
  form.append('userId', id);
  const headers = {};
  if (id) headers['x-user-id'] = id;
  const res = await fetch(`${API_BASE}/user/upload-verification`, {
    method: 'POST',
    headers,
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Failed to upload verification');
  return json;
}
