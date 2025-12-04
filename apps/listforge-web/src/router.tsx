import { RouteObject } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ItemsListPage from './pages/items/ItemsListPage';
import NewItemPage from './pages/items/NewItemPage';
import ItemDetailPage from './pages/items/ItemDetailPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrgsPage from './pages/admin/AdminOrgsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

export const router: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/items',
    element: (
      <ProtectedRoute>
        <ItemsListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/items/new',
    element: (
      <ProtectedRoute>
        <NewItemPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/items/:id',
    element: (
      <ProtectedRoute>
        <ItemDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <AdminUsersPage />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/orgs',
    element: (
      <AdminRoute>
        <AdminOrgsPage />
      </AdminRoute>
    ),
  },
];

