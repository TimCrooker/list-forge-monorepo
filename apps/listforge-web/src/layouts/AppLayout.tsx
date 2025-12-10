import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { AppShell, AppSidebar, AppNavbar, useTheme, type NavGroup, Button } from '@listforge/ui';
import { logout } from '../store/authSlice';
import { RootState } from '../store/store';
import { Package, Settings, Users, LayoutDashboard, Camera, ClipboardCheck, Wrench, MessageSquare } from 'lucide-react';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { useSidebar } from '@listforge/ui';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const router = useRouterState();
  const location = router.location;
  const user = useSelector((state: RootState) => state.auth.user);
  const currentOrg = useSelector((state: RootState) => state.auth.currentOrg);
  const { setMode } = useTheme();
  const { toggleChat } = useChat();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  // Responsive sidebar state: collapsed on small screens, open on large
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    // Always collapsed on mobile
    if (window.innerWidth < 768) return true;
    // On desktop, check localStorage
    const stored = localStorage.getItem('nav-sidebar-collapsed');
    if (stored !== null) return stored === 'true';
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Force collapse on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Only persist on desktop
    if (!isMobile) {
      localStorage.setItem('nav-sidebar-collapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed, isMobile]);

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
          id: 'capture',
          label: 'Capture',
          icon: Camera,
          href: '/capture',
          active: location.pathname.startsWith('/capture'),
          onClick: () => navigate({ to: '/capture' }),
        },
        {
          id: 'review',
          label: 'Review',
          icon: ClipboardCheck,
          href: '/review',
          active: location.pathname.startsWith('/review'),
          onClick: () => navigate({ to: '/review' }),
        },
        {
          id: 'needs-work',
          label: 'Needs Work',
          icon: Wrench,
          href: '/needs-work',
          active: location.pathname.startsWith('/needs-work'),
          onClick: () => navigate({ to: '/needs-work' }),
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

  // Add admin navigation if user is superadmin or staff
  if (user?.globalRole === 'superadmin' || user?.globalRole === 'staff') {
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
      collapsedLogo={
        <div className="flex items-center justify-center px-2 py-1.5">
          <img
            src="/assets/icon_logo.png"
            alt="ListForge"
            className="h-8 w-8"
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
          <SidebarFooterContent
            orgName={currentOrg.name}
          />
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
      chatButton={
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          className="h-8 w-8"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="sr-only">Toggle chat</span>
        </Button>
      }
    />
  );

  return (
    <AppShell
      sidebar={sidebar}
      navbar={navbar}
      contentClassName="w-full"
      sidebarCollapsed={sidebarCollapsed}
      onSidebarCollapsedChange={setSidebarCollapsed}
    >
      <div className="flex h-full">
        <div className="flex-1 min-w-0 overflow-auto">
          {children}
        </div>
        <ChatSidebar />
      </div>
    </AppShell>
  );
}

// Footer component that adapts to collapsed state
function SidebarFooterContent({ orgName }: { orgName: string }) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <div className="p-2 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          {orgName.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          {orgName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{orgName}</p>
          <p className="text-xs text-muted-foreground truncate">Current Organization</p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ChatProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </ChatProvider>
  );
}
