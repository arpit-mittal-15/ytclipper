import config from '@/config';

export interface Timestamp {
  id: string;
  video_id: string;
  user_id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTimestampRequest {
  video_id: string;
  timestamp: number;
  title?: string;
  note?: string;
  tags?: string[];
}

export interface GetTimestampsResponse {
  timestamps: Timestamp[];
  video_id: string;
  user_id: string;
}

export interface DeleteTimestampResponse {
  message: string;
  timestamp_id: string;
  user_id: string;
}

class TimestampsApiService {
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

    console.log('🔍 Making timestamp request to:', url);
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
      console.log('❌ Timestamp request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    // Handle structured response format
    if (responseData.success && responseData.data !== undefined) {
      return responseData.data;
    }

    // Handle direct response format
    return responseData;
  }

  async createTimestamp(data: CreateTimestampRequest): Promise<Timestamp> {
    console.log('🔍 Creating timestamp:', data);
    const response = await this.request<{ timestamp: Timestamp }>(
      '/api/v1/timestamps',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
    return response.timestamp;
  }

  async getTimestamps(videoId: string): Promise<GetTimestampsResponse> {
    console.log('🔍 Fetching timestamps for video:', videoId);
    return await this.request<GetTimestampsResponse>(
      `/api/v1/timestamps/${videoId}`,
    );
  }

  async deleteTimestamp(timestampId: string): Promise<DeleteTimestampResponse> {
    console.log('🔍 Deleting timestamp:', timestampId);
    return await this.request<DeleteTimestampResponse>(
      `/api/v1/timestamps/${timestampId}`,
      {
        method: 'DELETE',
      },
    );
  }
}

export const timestampsApi = new TimestampsApiService();
