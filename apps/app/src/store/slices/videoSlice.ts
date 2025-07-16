import { videosApi, type VideoSummary } from '@/services/videos';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface VideoState {
  videos: VideoSummary[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: VideoState = {
  videos: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchUserVideos = createAsyncThunk(
  'videos/fetchUserVideos',
  async (_, { rejectWithValue }) => {
    try {
      const response = await videosApi.getUserVideos();
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch videos';
      return rejectWithValue(message);
    }
  },
);

// Slice
const videoSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideos: (state) => {
      state.videos = [];
      state.error = null;
      state.lastFetch = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setVideos: (state, action: PayloadAction<VideoSummary[]>) => {
      state.videos = action.payload;
      state.lastFetch = Date.now();
    },
    updateVideoTimestampCount: (
      state,
      action: PayloadAction<{ videoId: string; count: number }>,
    ) => {
      const video = state.videos.find(
        (v) => v.video_id === action.payload.videoId,
      );
      if (video) {
        video.timestamp_count = action.payload.count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user videos
      .addCase(fetchUserVideos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserVideos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.videos = action.payload.videos;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchUserVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearVideos, clearError, setVideos, updateVideoTimestampCount } =
  videoSlice.actions;

export default videoSlice.reducer;

// Selectors
export const selectVideos = (state: { videos: VideoState }) =>
  state.videos.videos;
export const selectVideosLoading = (state: { videos: VideoState }) =>
  state.videos.isLoading;
export const selectVideosError = (state: { videos: VideoState }) =>
  state.videos.error;
export const selectVideosLastFetch = (state: { videos: VideoState }) =>
  state.videos.lastFetch;
export const selectVideoByVideoId =
  (videoId: string) => (state: { videos: VideoState }) =>
    state.videos.videos.find((video) => video.video_id === videoId);
