import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useMeQuery } from '@listforge/api-rtk';
import { setCredentials, logout } from '../store/authSlice';
import { RootState } from '../store/store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Only fetch if we have a token but aren't authenticated yet
  const { data, error, isLoading } = useMeQuery(undefined, {
    skip: !token || isAuthenticated,
  });

  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      if (data) {
        // Restore auth state from /auth/me response
        dispatch(
          setCredentials({
            user: data.user,
            currentOrg: data.currentOrg,
            token: token,
          }),
        );
      } else if (error) {
        // Token is invalid, clear it
        dispatch(logout());
      }
    }
  }, [token, isAuthenticated, data, error, isLoading, dispatch]);

  return <>{children}</>;
}

