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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
    </Provider>
  </React.StrictMode>,
);
