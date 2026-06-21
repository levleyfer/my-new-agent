import { API_BASE_URL } from './config';
import {
  ApiError,
  ApiErrorDetail,
  ChatMessage,
  DiscoverCandidate,
  LoginPayload,
  Match,
  MyProfile,
  RegisterPayload,
  ReportReason,
  Tag,
  UserProfile,
  VideoSession,
} from './types';

async function parseErrorMessage(response: Response): Promise<{ message: string; details?: ApiErrorDetail[] }> {
  try {
    const body = await response.json();
    if (Array.isArray(body.detail)) {
      const details = body.detail as ApiErrorDetail[];
      return { message: details.map((d) => d.msg).join('\n'), details };
    }
    if (typeof body.detail === 'string') {
      return { message: body.detail };
    }
  } catch {
    // response body wasn't JSON — fall through to generic message
  }
  return { message: `Request failed with status ${response.status}` };
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const { message, details } = await parseErrorMessage(response);
    throw new ApiError(response.status, message, details);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function registerUser(payload: RegisterPayload): Promise<UserProfile> {
  return request('/users', { method: 'POST', body: payload });
}

export async function login(payload: LoginPayload): Promise<string> {
  const { access_token } = await request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: payload,
  });
  return access_token;
}

export function getUser(userId: string): Promise<UserProfile> {
  return request(`/users/${userId}`);
}

export function getMyProfile(token: string): Promise<MyProfile> {
  return request('/users/me', { token });
}

export function updateMyTags(token: string, tagIds: string[]): Promise<MyProfile> {
  return request('/users/me/tags', { method: 'PUT', token, body: { tag_ids: tagIds } });
}

export function updateMyLocation(token: string, latitude: number, longitude: number): Promise<MyProfile> {
  return request('/users/me/location', { method: 'PATCH', token, body: { latitude, longitude } });
}

export function updateMyAvailability(token: string, isAvailable: boolean): Promise<MyProfile> {
  return request('/users/me/availability', { method: 'PATCH', token, body: { is_available: isAvailable } });
}

export function verifyMyAge(token: string): Promise<MyProfile> {
  return request('/users/me/verify', { method: 'POST', token });
}

export function listTags(): Promise<Tag[]> {
  return request('/tags');
}

export function discover(token: string): Promise<DiscoverCandidate[]> {
  return request('/discover', { token });
}

export function createMatch(token: string, targetUserId: string): Promise<Match> {
  return request('/matches', { method: 'POST', token, body: { target_user_id: targetUserId } });
}

export function listMyMatches(token: string): Promise<Match[]> {
  return request('/matches', { token });
}

export function startVirtualCheers(token: string, matchId: string): Promise<VideoSession> {
  return request(`/matches/${matchId}/video`, { method: 'POST', token });
}

export function rateMatch(token: string, matchId: string, score: number): Promise<Match> {
  return request(`/matches/${matchId}/rate`, { method: 'POST', token, body: { score } });
}

export function listMessages(token: string, matchId: string): Promise<ChatMessage[]> {
  return request(`/matches/${matchId}/messages`, { token });
}

export function sendMessage(token: string, matchId: string, body: string): Promise<ChatMessage> {
  return request(`/matches/${matchId}/messages`, { method: 'POST', token, body: { body } });
}

export function blockUser(token: string, userId: string): Promise<void> {
  return request(`/users/${userId}/block`, { method: 'POST', token });
}

export function unblockUser(token: string, userId: string): Promise<void> {
  return request(`/users/${userId}/block`, { method: 'DELETE', token });
}

export function listBlockedUsers(token: string): Promise<UserProfile[]> {
  return request('/users/me/blocked', { token });
}

export function reportUser(token: string, userId: string, reason: ReportReason, details?: string): Promise<void> {
  return request(`/users/${userId}/report`, { method: 'POST', token, body: { reason, details } });
}
