import axios from 'axios';

const resolveBaseURL = () => {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const base = raw.replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const API = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 15000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAPIErrorMessage = (error, fallback = 'MissionGrid API request failed') => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'MissionGrid API timed out. Check the backend server.';
  if (error?.message === 'Network Error') return 'MissionGrid API is unreachable. Start the backend or use demo fallback.';
  return error?.message || fallback;
};

// Handle 401 responses globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    error.missionGridMessage = getAPIErrorMessage(error);

    const requestUrl = error.config?.url || '';
    const isAuthAttempt = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/register-captain')
      || requestUrl.includes('/auth/join-team');

    if (error.response?.status === 401 && !isAuthAttempt) {
      localStorage.removeItem('mg_token');
      localStorage.removeItem('mg_user');
      window.dispatchEvent(new CustomEvent('missiongrid:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// ==================== Auth ====================
export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  registerCaptain: (data) => API.post('/auth/register-captain', data),
  joinTeam: (data) => API.post('/auth/join-team', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
  getUsers: () => API.get('/auth/users'),
};

// ==================== Invites / Workspace ====================
export const inviteAPI = {
  getInvite: (inviteCode) => API.get(`/invites/${encodeURIComponent(inviteCode)}`),
  regenerate: () => API.post('/invites/regenerate'),
};

export const workspaceAPI = {
  getMe: () => API.get('/workspace/me'),
};

// ==================== Missions ====================
export const missionAPI = {
  getAll: () => API.get('/missions'),
  getOne: (id) => API.get(`/missions/${id}`),
  create: (data) => API.post('/missions', data),
  update: (id, data) => API.put(`/missions/${id}`, data),
  delete: (id) => API.delete(`/missions/${id}`),
};

// ==================== Objectives ====================
export const objectiveAPI = {
  getByMission: (missionId) => API.get(`/objectives/mission/${missionId}`),
  getMine: () => API.get('/objectives/my'),
  getOne: (id) => API.get(`/objectives/${id}`),
  create: (data) => API.post('/objectives', data),
  update: (id, data) => API.put(`/objectives/${id}`, data),
  delete: (id) => API.delete(`/objectives/${id}`),
};

// ==================== Analytics ====================
export const analyticsAPI = {
  getDashboard: () => API.get('/analytics/dashboard'),
  getMissionProgress: (id) => API.get(`/analytics/mission/${id}/progress`),
  getCoreStability: (missionId) => API.get(`/analytics/core-stability/${missionId}`),
  getWorkload: () => API.get('/analytics/workload'),
  getOverdue: () => API.get('/analytics/overdue'),
  getCometAlerts: () => API.get('/analytics/comet-alerts'),
};

export default API;
