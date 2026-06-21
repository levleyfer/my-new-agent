export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  birth_date: string; // YYYY-MM-DD
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Tag {
  id: string;
  category: 'taste' | 'vibe' | 'logistics';
  name: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  verification_status: 'unverified' | 'pending' | 'verified';
  rating: number;
  is_available: boolean;
  is_online: boolean;
  avatar_url: string | null;
  tags: Tag[];
}

export interface MyProfile extends UserProfile {
  email: string;
  is_age_verified: boolean;
}

export interface DiscoverCandidate extends UserProfile {
  distance_km: number;
  shared_tag_count: number;
}

export type MatchStatus = 'pending' | 'video' | 'met' | 'closed';

export interface Match {
  id: string;
  status: MatchStatus;
  compatibility_score: number;
  created_at: string;
  other_user: UserProfile;
  my_rating: number | null;
}

export interface VideoSession {
  match_id: string;
  room_name: string;
}

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export type ReportReason = 'inappropriate_behavior' | 'fake_profile' | 'harassment' | 'safety_concern' | 'other';

export interface ApiErrorDetail {
  msg: string;
  loc: (string | number)[];
}

export class ApiError extends Error {
  status: number;
  details?: ApiErrorDetail[];

  constructor(status: number, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
