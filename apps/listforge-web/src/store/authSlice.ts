import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDto, OrgDto } from '@listforge/api-types';

export interface AuthState {
  user: UserDto | null;
  currentOrg: OrgDto | null;
  token: string | null;
  isAuthenticated: boolean;
}

const getStoredToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const initialState: AuthState = {
  user: null,
  currentOrg: null,
  token: getStoredToken(),
  // Don't set isAuthenticated to true just because we have a token
  // Wait for /auth/me to confirm it's valid
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: UserDto;
        currentOrg: OrgDto | null;
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.currentOrg = action.payload.currentOrg;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', action.payload.token);
      }
    },
    setCurrentOrg: (state, action: PayloadAction<{ org: OrgDto; token: string }>) => {
      state.currentOrg = action.payload.org;
      state.token = action.payload.token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', action.payload.token);
      }
    },
    setUser: (state, action: PayloadAction<UserDto>) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.currentOrg = null;
      state.token = null;
      state.isAuthenticated = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    },
  },
});

export const { setCredentials, setCurrentOrg, setUser, logout } = authSlice.actions;
export default authSlice.reducer;

