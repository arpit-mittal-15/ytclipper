export interface User {
  id: string;
  email: string;
  name: string;
  token: null | string;
  token_expiry: null | number;
  picture?: string;
  email_verified: boolean;
  provider?: string; // Add provider field from the API response
  primary_provider?: string; // Keep for backward compatibility
  auth_methods?: string[];
  has_password?: boolean;
  has_google_account?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  timestamp: string; // Format: "MM:SS" or "HH:MM:SS"
  timestampSeconds: number; // Timestamp in seconds for sorting and YouTube API
  content: string;
  createdAt: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtubeId: string; // YouTube video ID for embedding
  thumbnailUrl: string;
  duration: string; // Format: "MM:SS" or "HH:MM:SS"
  channelName: string;
  createdAt: string;
  notes: Note[];
}

export interface ClipperData {
  videos: Video[];
}
