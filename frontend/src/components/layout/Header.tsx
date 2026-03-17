import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBalance } from 'wagmi';
import { Car, Menu, X, Sparkles, LayoutDashboard, TrendingUp, User, LogOut, ChevronDown, Bell, Briefcase, Shield, Wallet, RefreshCw, Heart } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn, formatEth } from '@/lib/utils';
import { ConnectButton } from '@/components/wallet/ConnectButton';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount, useNotifications, useMarkAllRead } from '@/hooks/api/useNotificationsApi';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useLikes } from '@/hooks/api/useLikes';

const navLinks = [
  { href: '/discover', label: 'Buy Shares', icon: Car },
  { href: '/marketplace', label: 'Trade Shares', icon: TrendingUp },
  // { href: '/leaderboard', label: 'Leaderboard', icon: Users },
];

const authLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Create', icon: Sparkles, highlight: true },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Primary wallet balance (Hoodi testnet)
  const primaryWalletAddress = user?.walletAddress as `0x${string}` | undefined;
  const {
    data: balanceData,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useBalance({
    address: primaryWalletAddress,
    query: {
      enabled: !!primaryWalletAddress && !!user,
      staleTime: 30_000,
    },
  });

  // Liked cars count
  const { likedCount } = useLikes();

  // Notifications
  const { data: unreadData } = useUnreadCount();
  const { data: notifData } = useNotifications();
  const { mutate: markAllRead } = useMarkAllRead();
  const unreadCount = unreadData?.count ?? 0;
  const notifications = notifData?.data ?? [];

  // Real-time WebSocket — connects when authenticated, disconnects on logout
  const [toast, setToast] = useState<{ title: string; message: string; type: string } | null>(null);
  useNotificationSocket({
    enabled: isAuthenticated,
    onNotification: (n) => {
      setToast({ title: n.title, message: n.message, type: n.type });
      setTimeout(() => setToast(null), 5000);
    },
  });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Show auth links only when the user has an active session (logged in)
  const showAuthLinks = isAuthenticated;
  const userIsAdmin = user?.roles?.includes('admin') ?? false;

  // Determine which auth links to show based on role
  const activeAuthLinks = userIsAdmin
    ? [
        { href: '/admin', label: 'Admin Panel', icon: Shield, highlight: false },
      ]
    : authLinks;

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
      {/* Real-time notification toast */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-[9999] flex items-start gap-3 pl-4 pr-3 py-3 rounded-xl shadow-2xl max-w-sm animate-slideDown',
          'bg-surface border border-border',
          // coloured left accent bar via box-shadow inset
          toast.type === 'success' && 'border-l-4 border-l-success',
          toast.type === 'warning' && 'border-l-4 border-l-warning',
          toast.type === 'error'   && 'border-l-4 border-l-error',
          toast.type === 'info'    && 'border-l-4 border-l-info',
        )}>
          {/* Colour dot */}
          <div className={cn(
            'mt-1 w-2 h-2 rounded-full shrink-0',
            toast.type === 'success' && 'bg-success',
            toast.type === 'warning' && 'bg-warning',
            toast.type === 'error'   && 'bg-error',
            toast.type === 'info'    && 'bg-info',
          )} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-snug">{toast.title}</p>
            <p className="text-xs text-text-muted mt-0.5 break-words leading-relaxed">{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="shrink-0 ml-1 p-1 rounded-md hover:bg-background-hover transition-colors">
            <X className="w-3.5 h-3.5 text-text-muted" />
          </button>
        </div>
      )}

      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-all duration-300">
              <Car className="h-5 w-5" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-heading font-bold text-text-primary leading-tight">
                CarShares
              </span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider">
                Tokenized Ownership
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive(link.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {showAuthLinks && (
              <>
                <div className="w-px h-6 bg-border mx-2" />
                {activeAuthLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        link.highlight && !isActive(link.href)
                          ? 'bg-primary text-white hover:bg-primary-hover shadow-md shadow-primary/20'
                          : isActive(link.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Auth buttons for non-connected users */}
            {!showAuthLinks && (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm">
                    Sign up
                  </Button>
                </Link>
              </div>
            )}

            {/* Liked Cars Button - Desktop (auth only) */}
            {isAuthenticated && <Link
              to="/liked"
              title="Liked Cars"
              className="hidden lg:flex relative p-2 rounded-lg hover:bg-background-hover transition-colors"
            >
              <Heart className={cn(
                'w-5 h-5 transition-colors',
                isActive('/liked') ? 'text-error fill-error' : 'text-text-secondary'
              )} />
              {likedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                  {likedCount > 9 ? '9+' : likedCount}
                </span>
              )}
            </Link>}

            {/* Notifications Bell - Desktop */}
            {showAuthLinks && isAuthenticated && (
              <div className="hidden lg:block relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    if (!notifOpen && unreadCount > 0) markAllRead();
                  }}
                  className="relative p-2 rounded-lg hover:bg-background-hover transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-surface border border-border shadow-xl z-50 animate-slideDown">
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                      <p className="font-medium text-text-primary text-sm">Notifications</p>
                      {notifications && notifications.length > 0 && (
                        <button
                          onClick={() => markAllRead()}
                          className="text-xs text-primary hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-border">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="px-4 py-6 text-center text-text-muted text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications?.slice(0, 8)?.map((notif, i) => (
                          <div
                            key={i}
                            className={cn(
                              'px-4 py-3 hover:bg-background-hover transition-colors',
                              !notif.read && 'bg-primary/5'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className={cn(
                                'mt-1 w-2 h-2 rounded-full shrink-0',
                                notif.type === 'success' ? 'bg-success' :
                                notif.type === 'warning' ? 'bg-warning' :
                                notif.type === 'error' ? 'bg-error' : 'bg-info'
                              )} />
                              <div>
                                <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                                <p className="text-xs text-text-muted mt-0.5">{notif.message}</p>
                                <p className="text-[10px] text-text-muted mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu with Logout - Desktop */}
            {showAuthLinks && (
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                    'hover:bg-background-hover',
                    userMenuOpen && 'bg-background-hover'
                  )}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <ChevronDown className={cn(
                    'w-4 h-4 text-text-muted transition-transform duration-200',
                    userMenuOpen && 'rotate-180'
                  )} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl bg-surface border border-border shadow-xl z-50 animate-slideDown">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-text-primary truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-text-muted truncate">{user?.email || 'Connected via wallet'}</p>
                      {userIsAdmin ? (
                        <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-bold rounded-full bg-warning/20 text-warning border border-warning/30">
                          Super Admin
                        </span>
                      ) : (
                        user?.roles && user.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.roles.filter(r => r !== 'admin').map(role => (
                              <span key={role} className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary capitalize">
                                {role.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        )
                      )}
                      {/* Wallet balance — only shown when user has a primary wallet */}
                      {primaryWalletAddress && (
                        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Wallet className="w-3 h-3 text-text-muted shrink-0" />
                            {balanceLoading ? (
                              <span className="text-xs text-text-muted animate-pulse">Loading...</span>
                            ) : balanceError ? (
                              <span className="text-xs text-text-muted">—</span>
                            ) : (
                              <span className="text-xs font-semibold text-text-primary">
                                {formatEth(balanceData!.value, 4)} ETH
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); refetchBalance(); }}
                            className="p-1 rounded hover:bg-background-hover transition-colors"
                            aria-label="Refresh balance"
                            title="Refresh balance"
                          >
                            <RefreshCw className={cn('w-3 h-3 text-text-muted', balanceLoading && 'animate-spin')} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile Settings
                      </Link>
                      {userIsAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      ) : (
                        <>
                          <Link
                            to="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <Link
                            to="/portfolio"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
                          >
                            <Briefcase className="w-4 h-4" />
                            Portfolio
                          </Link>
                          <Link
                            to="/liked"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-background-hover transition-colors"
                          >
                            <span className="flex items-center gap-3">
                              <Heart className="w-4 h-4" />
                              Liked Cars
                            </span>
                            {likedCount > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error/15 text-error text-[10px] font-bold px-1">
                                {likedCount}
                              </span>
                            )}
                          </Link>
                          {/* Earnings link disabled — page not ready */}
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="pt-1 border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <ConnectButton />

            {/* Mobile ETH balance pill — shown only when logged in and wallet connected */}
            {isAuthenticated && primaryWalletAddress && (
              <div className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface border border-border">
                <Wallet className="w-3.5 h-3.5 text-text-muted shrink-0" />
                {balanceLoading ? (
                  <span className="text-xs text-text-muted animate-pulse">...</span>
                ) : balanceError ? (
                  <span className="text-xs text-text-muted">—</span>
                ) : (
                  <span className="text-xs font-semibold text-text-primary">
                    {formatEth(balanceData!.value, 3)} ETH
                  </span>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50 animate-slideDown">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive(link.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}

              {showAuthLinks && (
                <>
                  <div className="h-px bg-border my-2" />
                  {activeAuthLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                          link.highlight && !isActive(link.href)
                            ? 'bg-primary text-white'
                            : isActive(link.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                  <div className="h-px bg-border my-2" />
                  {/* User Info in Mobile */}
                  {user && (
                    <div className="px-4 py-3 flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'User'}
                          className="w-10 h-10 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-text-primary">{user.name || 'User'}</p>
                        {userIsAdmin ? (
                          <span className="text-xs font-bold text-warning">Super Admin</span>
                        ) : (
                          <p className="text-xs text-text-muted capitalize">
                            {user.roles?.filter(r => r !== 'admin').map(r => r.replace('_', ' ')).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Profile & Context Links in Mobile */}
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive('/profile')
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                    )}
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  {userIsAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive('/admin')
                          ? 'bg-primary/10 text-primary'
                          : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/portfolio"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive('/portfolio')
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                        )}
                      >
                        <Briefcase className="h-4 w-4" />
                        Portfolio
                      </Link>
                      <Link
                        to="/liked"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                          isActive('/liked')
                            ? 'bg-error/10 text-error'
                            : 'text-text-secondary hover:text-text-primary hover:bg-background-hover'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Heart className={cn('h-4 w-4', isActive('/liked') && 'fill-error')} />
                          Liked Cars
                        </span>
                        {likedCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-error/15 text-error text-[10px] font-bold px-1">
                            {likedCount}
                          </span>
                        )}
                      </Link>
                      {/* Earnings link disabled — page not ready */}
                    </>
                  )}
                  <div className="h-px bg-border my-2" />
                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-error hover:bg-error/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </>
              )}

              {!showAuthLinks && (
                <>
                  <div className="h-px bg-border my-2" />
                  <div className="flex gap-2 px-4">
                    <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        Log in
                      </Button>
                    </Link>
                    <Link to="/signup" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="default" className="w-full">
                        Sign up
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
