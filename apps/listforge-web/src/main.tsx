import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { store } from './store/store';
import { routeTree } from './routeTree.gen';
import './index.css';
import AuthInitializer from './components/AuthInitializer';

// Create router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    store,
  },
});

// Register router type
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Global error handler for unhandled promise rejections
// This prevents "Failed to fetch" errors from showing as uncaught promises
// when RTK Query handles them via baseQueryWithErrorHandling
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Only handle fetch errors that are likely from our app
    if (
      event.reason?.message?.includes('Failed to fetch') ||
      (event.reason?.name === 'TypeError' && event.reason?.message?.includes('fetch'))
    ) {
      // Prevent default console error (we'll show toast instead via RTK Query)
      event.preventDefault();

      // Check if it's a network error we should handle
      const isNetworkError =
        event.reason?.message?.includes('Failed to fetch') ||
        event.reason?.message?.includes('NetworkError');

      if (isNetworkError) {
        // RTK Query will handle this via baseQueryWithErrorHandling
        // Just prevent the uncaught error from showing in console
        console.debug('Network error handled by RTK Query error handler');
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </Provider>
  </React.StrictMode>,
);
