import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try to refresh once then logout
let refreshing = false;
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !refreshing) {
      original._retry = true;
      refreshing = true;
      try {
        const rt = useAuthStore.getState().refreshToken;
        if (rt) {
          const res = await axios.post('/api/auth/refresh', { refresh_token: rt });
          useAuthStore.getState().setTokens(res.data.access_token, res.data.refresh_token);
          original.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(original);
        }
      } catch {
        useAuthStore.getState().logout();
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const register = (email: string, full_name: string, password: string) =>
  api.post('/auth/register', { email, full_name, password }).then((r) => r.data);

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const refreshTokens = (refresh_token: string) =>
  api.post('/auth/refresh', { refresh_token }).then((r) => r.data);

export const getMe = () => api.get('/auth/me').then((r) => r.data);

// ── Questions ─────────────────────────────────────────────────────────────────

export const getQuestions = (params?: {
  category?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
}) => api.get('/questions', { params }).then((r) => r.data);

export const getRandomQuestion = (params?: { category?: string; difficulty?: string }) =>
  api.get('/questions/random', { params }).then((r) => r.data);

export const getQuestion = (id: string) => api.get(`/questions/${id}`).then((r) => r.data);

// ── Sessions ──────────────────────────────────────────────────────────────────

export const createSession = (question_id: string, notes?: string) =>
  api.post('/sessions', { question_id, notes }).then((r) => r.data);

export const getSessions = (params?: { limit?: number; offset?: number }) =>
  api.get('/sessions', { params }).then((r) => r.data);

export const getSession = (id: string) => api.get(`/sessions/${id}`).then((r) => r.data);

export const deleteSession = (id: string) => api.delete(`/sessions/${id}`);

export const uploadRecording = (sessionId: string, blob: Blob, durationSeconds: number) => {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  form.append('duration_seconds', String(durationSeconds));
  return api.post(`/sessions/${sessionId}/recording`, form).then((r) => r.data);
};

export const getRecordingStatus = (sessionId: string) =>
  api.get(`/sessions/${sessionId}/recording/status`).then((r) => r.data);

export const getSessionAudio = async (id: string): Promise<string> => {
  const resp = await api.get(`/sessions/${id}/audio`, { responseType: 'blob' });
  return URL.createObjectURL(resp.data);
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const getAnalyticsSummary = () => api.get('/analytics/summary').then((r) => r.data);

export const getAnalyticsProgress = () => api.get('/analytics/progress').then((r) => r.data);

export const getAnalyticsWeaknesses = () => api.get('/analytics/weaknesses').then((r) => r.data);

export const getAnalyticsFillerWords = () => api.get('/analytics/filler-words').then((r) => r.data);

export const getAnalyticsCategoryBreakdown = () =>
  api.get('/analytics/category-breakdown').then((r) => r.data);

export default api;
