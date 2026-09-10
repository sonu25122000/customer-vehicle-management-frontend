import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.admin;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Not authenticated');
  }
});

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password, remember }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { username, password, remember });
      return res.data.admin;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await api.post('/auth/logout');
    return true;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Logout failed');
  }
});

export const updateMaxSessions = createAsyncThunk(
  'auth/updateMaxSessions',
  async (maxActiveSessions, { rejectWithValue }) => {
    try {
      const res = await api.patch('/auth/max-sessions', { maxActiveSessions });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update device limit');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    admin: null,
    status: 'idle', // idle | loading | succeeded | failed
    checkedSession: false,
    error: null,
  },
  reducers: {
    // Triggered by the axios interceptor when a request comes back 401 because
    // this session was invalidated by a login on another device.
    forceLogout(state) {
      state.admin = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admin = action.payload;
        state.checkedSession = true;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.status = 'idle';
        state.admin = null;
        state.checkedSession = true;
      })
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.admin = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.admin = null;
        state.status = 'idle';
      })
      .addCase(updateMaxSessions.fulfilled, (state, action) => {
        if (state.admin) {
          state.admin.maxActiveSessions = action.payload.maxActiveSessions;
          state.admin.activeSessionCount = action.payload.activeSessionCount;
        }
      });
  },
});

export const { forceLogout } = authSlice.actions;
export default authSlice.reducer;
