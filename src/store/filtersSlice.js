import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  search: '',
  minRating: '',
  sort: 'newest',
  datePreset: '',
  startDate: '',
  endDate: '',
  customerIds: [],
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSearch(state, action) {
      state.search = action.payload;
    },
    setMinRating(state, action) {
      state.minRating = action.payload;
    },
    setSort(state, action) {
      state.sort = action.payload;
    },
    setDateRange(state, action) {
      const { preset = '', startDate = '', endDate = '' } = action.payload;
      state.datePreset = preset;
      state.startDate = startDate;
      state.endDate = endDate;
    },
    clearDateRange(state) {
      state.datePreset = '';
      state.startDate = '';
      state.endDate = '';
    },
    toggleCustomerId(state, action) {
      const id = action.payload;
      const idx = state.customerIds.indexOf(id);
      if (idx >= 0) state.customerIds.splice(idx, 1);
      else state.customerIds.push(id);
    },
    clearCustomerIds(state) {
      state.customerIds = [];
    },
    clearAllFilters() {
      return initialState;
    },
  },
});

export const {
  setSearch,
  setMinRating,
  setSort,
  setDateRange,
  clearDateRange,
  toggleCustomerId,
  clearCustomerIds,
  clearAllFilters,
} = filtersSlice.actions;
export default filtersSlice.reducer;
