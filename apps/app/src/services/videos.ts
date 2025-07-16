import config from '@/config';

export interface VideoSummary {
  video_id: string;
  timestamp_count: number;
  first_timestamp?: number;
  last_timestamp?: number;
  earliest_created: string;
  latest_created: string;
}

export interface GetUserVideosResponse {
  videos: VideoSummary[];
  user_id: string;
}

class VideosApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = config.apiUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for authentication
    };

    console.log('🔍 Making videos request to:', url);
    console.log('🔍 Request config:', config);

    const response = await fetch(url, config);
    const responseData = await response.json();

    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response data:', responseData);

    if (!response.ok) {
      const errorMessage =
        responseData.error?.message ||
        responseData.message ||
        `HTTP error! status: ${response.status}`;
      console.log('❌ Videos request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle structured response format
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }

    // Handle direct response format
    return responseData;
  }

  async getUserVideos(): Promise<GetUserVideosResponse> {
    console.log('🔍 Fetching user videos');
    return await this.request<GetUserVideosResponse>('/api/v1/videos');
  }
}

export const videosApi = new VideosApiService();
