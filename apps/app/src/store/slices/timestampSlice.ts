import {
  timestampsApi,
  type CreateTimestampRequest,
  type Timestamp,
} from '@/services/timestamps';
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

export interface TimestampState {
  timestamps: Timestamp[];
  currentVideoId: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: TimestampState = {
  timestamps: [],
  currentVideoId: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchTimestamps = createAsyncThunk(
  'timestamps/fetchTimestamps',
  async (videoId: string, { rejectWithValue }) => {
    try {
      const response = await timestampsApi.getTimestamps(videoId);
      return response;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch timestamps';
      return rejectWithValue(message);
    }
  },
);

export const createTimestamp = createAsyncThunk(
  'timestamps/createTimestamp',
  async (data: CreateTimestampRequest, { rejectWithValue }) => {
    try {
      const timestamp = await timestampsApi.createTimestamp(data);
      return timestamp;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create timestamp';
      return rejectWithValue(message);
    }
  },
);

export const deleteTimestamp = createAsyncThunk(
  'timestamps/deleteTimestamp',
  async (timestampId: string, { rejectWithValue }) => {
    try {
      const response = await timestampsApi.deleteTimestamp(timestampId);
      return { timestampId, response };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete timestamp';
      return rejectWithValue(message);
    }
  },
);

// Slice
const timestampSlice = createSlice({
  name: 'timestamps',
  initialState,
  reducers: {
    clearTimestamps: (state) => {
      state.timestamps = [];
      state.currentVideoId = null;
      state.error = null;
      state.lastFetch = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentVideoId: (state, action: PayloadAction<string | null>) => {
      state.currentVideoId = action.payload;
    },
    setTimestamps: (state, action: PayloadAction<Timestamp[]>) => {
      state.timestamps = action.payload;
      state.lastFetch = Date.now();
    },
    addTimestamp: (state, action: PayloadAction<Timestamp>) => {
      state.timestamps.push(action.payload);
      // Sort timestamps by timestamp value
      state.timestamps.sort((a, b) => a.timestamp - b.timestamp);
    },
    updateTimestamp: (state, action: PayloadAction<Timestamp>) => {
      const index = state.timestamps.findIndex(
        (t) => t.id === action.payload.id,
      );
      if (index !== -1) {
        state.timestamps[index] = action.payload;
        // Re-sort after update
        state.timestamps.sort((a, b) => a.timestamp - b.timestamp);
      }
    },
    removeTimestamp: (state, action: PayloadAction<string>) => {
      state.timestamps = state.timestamps.filter(
        (t) => t.id !== action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch timestamps
      .addCase(fetchTimestamps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTimestamps.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timestamps = action.payload.timestamps;
        state.currentVideoId = action.payload.video_id;
        state.lastFetch = Date.now();
        state.error = null;
      })
      .addCase(fetchTimestamps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Create timestamp
      .addCase(createTimestamp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createTimestamp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timestamps.push(action.payload);
        // Sort timestamps by timestamp value
        state.timestamps.sort((a, b) => a.timestamp - b.timestamp);
        state.error = null;
      })
      .addCase(createTimestamp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Delete timestamp
      .addCase(deleteTimestamp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTimestamp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.timestamps = state.timestamps.filter(
          (t) => t.id !== action.payload.timestampId,
        );
        state.error = null;
      })
      .addCase(deleteTimestamp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearTimestamps,
  clearError,
  setCurrentVideoId,
  setTimestamps,
  addTimestamp,
  updateTimestamp,
  removeTimestamp,
} = timestampSlice.actions;

export default timestampSlice.reducer;

// Selectors
export const selectTimestamps = (state: { timestamps: TimestampState }) =>
  state.timestamps.timestamps;
export const selectTimestampsLoading = (state: {
  timestamps: TimestampState;
}) => state.timestamps.isLoading;
export const selectTimestampsError = (state: { timestamps: TimestampState }) =>
  state.timestamps.error;
export const selectTimestampsLastFetch = (state: {
  timestamps: TimestampState;
}) => state.timestamps.lastFetch;
export const selectCurrentVideoId = (state: { timestamps: TimestampState }) =>
  state.timestamps.currentVideoId;
export const selectTimestampById =
  (id: string) => (state: { timestamps: TimestampState }) =>
    state.timestamps.timestamps.find((timestamp) => timestamp.id === id);
export const selectTimestampsByVideoId =
  (videoId: string) => (state: { timestamps: TimestampState }) =>
    state.timestamps.currentVideoId === videoId
      ? state.timestamps.timestamps
      : [];
export const selectTimestampsCount = (state: { timestamps: TimestampState }) =>
  state.timestamps.timestamps.length;
