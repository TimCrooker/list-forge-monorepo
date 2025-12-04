import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { AppShell, AppSidebar, AppNavbar, useTheme, type NavGroup } from '@listforge/ui';
import { logout } from '../store/authSlice';
import { RootState } from '../store/store';
import { Package, Settings, Users, LayoutDashboard } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const router = useRouterState();
  const location = router.location;
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { setMode } = useTheme();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const navGroups: NavGroup[] = [
    {
      id: 'main',
      label: 'Navigation',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          href: '/',
          active: location.pathname === '/',
          onClick: () => navigate({ to: '/' }),
        },
        {
          id: 'inventory',
          label: 'Inventory',
          icon: Package,
          href: '/items',
          active: location.pathname.startsWith('/items'),
          onClick: () => navigate({ to: '/items' }),
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          href: '/settings',
          active: location.pathname.startsWith('/settings'),
          onClick: () => navigate({ to: '/settings' }),
        },
      ],
    },
  ];

  // Add admin navigation if user is superadmin
  if (user?.globalRole === 'superadmin') {
    navGroups.push({
      id: 'admin',
      label: 'Administration',
      items: [
        {
          id: 'admin',
          label: 'Admin',
          icon: Users,
          href: '/admin',
          active: location.pathname.startsWith('/admin'),
          onClick: () => navigate({ to: '/admin' }),
        },
      ],
    });
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    } else {
      setMode(newTheme);
    }
  };

  // Sync theme with system preference
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setMode(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, setMode]);

  const handleLogout = () => {
    dispatch(logout());
    navigate({ to: '/login' });
  };

  const handleProfileClick = () => {
    navigate({ to: '/settings' });
  };

  const sidebar = (
    <AppSidebar
      logo={
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img
            src="/assets/full_logo.png"
            alt="ListForge"
            className="h-16 w-auto"
          />
        </div>
      }
      navigation={navGroups}
      onNavigate={(item) => {
        if (item.onClick) {
          item.onClick();
        }
      }}
      footer={
        currentOrg && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {currentOrg.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentOrg.name}</p>
                <p className="text-xs text-muted-foreground truncate">Current Organization</p>
              </div>
            </div>
          </div>
        )
      }
    />
  );

  const navbar = (
    <AppNavbar
      user={
        user
          ? {
              name: user.name,
              email: user.email,
              avatar: undefined,
            }
          : undefined
      }
      theme={{
        current: theme,
        onChange: handleThemeChange,
      }}
      userMenu={{
        onProfile: handleProfileClick,
        onSettings: handleProfileClick,
        onLogout: handleLogout,
      }}
    />
  );

  return (
    <AppShell sidebar={sidebar} navbar={navbar} contentClassName="w-full">
      {children}
    </AppShell>
  );
}
