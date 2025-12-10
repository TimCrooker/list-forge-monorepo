import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SyncState } from '../../types';

const initialState: SyncState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncAt: undefined,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncingStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
    },
    setLastSyncAt: (state, action: PayloadAction<number>) => {
      state.lastSyncAt = action.payload;
    },
  },
});

export const {
  setOnlineStatus,
  setSyncingStatus,
  setPendingCount,
  setLastSyncAt,
} = syncSlice.actions;
export default syncSlice.reducer;
