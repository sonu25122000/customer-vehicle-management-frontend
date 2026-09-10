import { configureStore } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import authReducer, { forceLogout } from './authSlice';
import filtersReducer from './filtersSlice';
import api from '../api/client';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filters: filtersReducer,
  },
});

// Any request that comes back 401 while we believed we were logged in means this session
// was invalidated server-side (e.g. logged in from another device) — sign out locally too.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && store.getState().auth.admin) {
      store.dispatch(forceLogout());
      toast.error(error.response.data?.message || 'You have been signed out.');
    }
    return Promise.reject(error);
  }
);
