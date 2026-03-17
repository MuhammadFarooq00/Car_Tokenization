import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useAccount, useDisconnect, useSignMessage, useChainId } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { SiweMessage } from 'siwe';
import { api, setTokens, clearTokens, getRefreshToken } from '@/lib/api-client';
import { queryKeys } from '@/hooks/api/keys';
import type {
  AuthContextType,
  AuthState,
  LoginCredentials,
  SignupData,
  UserProfile,
  UserRole,
  RegularUserRole,
  BackendUserProfile,
  AuthResponse,
} from '@/types/auth';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/api$/, '') || 'http://localhost:3001';

/** Resolve avatar path — turns backend relative paths into absolute URLs */
function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_BASE}${url}`;
}

// Map backend user to frontend UserProfile
function mapBackendUser(backendUser: BackendUserProfile): UserProfile {
  return {
    id: backendUser.id,
    email: backendUser.email || '',
    name: backendUser.name,
    avatar: resolveAvatarUrl(backendUser.avatar),
    roles: backendUser.roles,
    activeRole: (backendUser.activeRole as RegularUserRole) || undefined,
    walletAddress: backendUser.walletAddress || undefined,
    kycVerified: backendUser.kycVerified,
    onboardingCompleted: backendUser.onboardingCompleted,
    createdAt: new Date(backendUser.createdAt),
    updatedAt: new Date(),
  };
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const walletSyncRef = useRef(false);
  const queryClient = useQueryClient();

  // ─── Bootstrap: restore session from refresh token ────────────────────────
  useEffect(() => {
    async function bootstrap() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        setState({ ...initialState, isLoading: false });
        return;
      }

      try {
        const tokens = await api.post<AuthResponse>(
          '/auth/refresh',
          { refreshToken },
          { skipAuth: true },
        );
        setTokens(tokens.accessToken, tokens.refreshToken);

        const backendUser = await api.get<BackendUserProfile>('/auth/me');
        const user = mapBackendUser(backendUser);

        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch {
        clearTokens();
        setState({ ...initialState, isLoading: false });
      }
    }

    bootstrap();
  }, []);

  // ─── Auto-sync wallet address to backend ──────────────────────────────────
  // Save every newly connected wallet to the multi-wallet table.
  // Also updates User.walletAddress if this is the first wallet.
  useEffect(() => {
    if (isConnected && address && state.user && !walletSyncRef.current) {
      walletSyncRef.current = true;
      api.post('/users/wallets', { walletAddress: address })
        .then(() => {
          // If user had no primary wallet, set it now
          if (!state.user!.walletAddress) {
            setState((prev) => ({
              ...prev,
              user: prev.user ? { ...prev.user, walletAddress: address } : null,
            }));
          }
          // Invalidate wallet & profile queries so the UI updates instantly
          queryClient.invalidateQueries({ queryKey: queryKeys.users.wallets() });
          queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() });
        })
        .catch(() => { /* silent fail - non-critical */ })
        .finally(() => { walletSyncRef.current = false; });
    }
  }, [isConnected, address, state.user]);

  // ─── Login with email/password ────────────────────────────────────────────
  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const tokens = await api.post<AuthResponse>(
        '/auth/login',
        { email: credentials.email, password: credentials.password },
        { skipAuth: true },
      );
      setTokens(tokens.accessToken, tokens.refreshToken);

      const backendUser = await api.get<BackendUserProfile>('/auth/me');
      const user = mapBackendUser(backendUser);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      throw err;
    }
  }, []);

  // ─── Login with wallet (SIWE) ────────────────────────────────────────────
  const loginWithWallet = useCallback(async () => {
    if (!isConnected || !address) {
      setState((prev) => ({ ...prev, error: 'Please connect your wallet first' }));
      throw new Error('Wallet not connected');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get nonce
      const { nonce } = await api.post<{ nonce: string }>(
        '/auth/nonce',
        { walletAddress: address },
        { skipAuth: true },
      );

      // Step 2: Build SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to CarShares',
        uri: window.location.origin,
        version: '1',
        chainId: chainId || 1,
        nonce,
      });
      const messageStr = siweMessage.prepareMessage();

      // Step 3: Sign with wallet
      const signature = await signMessageAsync({ message: messageStr });

      // Step 4: Verify on backend
      const tokens = await api.post<AuthResponse>(
        '/auth/wallet-login',
        { message: messageStr, signature },
        { skipAuth: true },
      );
      setTokens(tokens.accessToken, tokens.refreshToken);

      const backendUser = await api.get<BackendUserProfile>('/auth/me');
      const user = mapBackendUser(backendUser);

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet login failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, [isConnected, address, chainId, signMessageAsync]);

  // ─── Signup ───────────────────────────────────────────────────────────────
  // Returns { message } — email verification is now required before login.
  // The Signup page redirects to /verify-email after this resolves.
  const signup = useCallback(async (data: SignupData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await api.post<{ message: string }>(
        '/auth/signup',
        {
          email: data.email,
          password: data.password,
          name: data.name,
          walletAddress: address || undefined,
          roles: data.roles,
        },
        { skipAuth: true },
      );
      // Account created — not yet authenticated. Redirect handled by Signup page.
      setState((prev) => ({ ...prev, isLoading: false, error: null }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
      }));
      throw err;
    }
  }, [address]);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearTokens();
    disconnect();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  }, [disconnect]);

  // ─── Role Helpers ─────────────────────────────────────────────────────────
  const hasRole = useCallback((role: UserRole): boolean => {
    return state.user?.roles?.includes(role) ?? false;
  }, [state.user]);

  const isAdmin = useCallback((): boolean => {
    return state.user?.roles?.includes('admin') ?? false;
  }, [state.user]);

  const setActiveRole = useCallback((role: RegularUserRole) => {
    if (state.user && state.user.roles.includes(role)) {
      const updatedUser = { ...state.user, activeRole: role, updatedAt: new Date() };
      setState((prev) => ({ ...prev, user: updatedUser }));
    }
  }, [state.user]);

  const addRole = useCallback(async (role: RegularUserRole) => {
    if (state.user && !state.user.roles.includes(role)) {
      try {
        await api.post('/users/role', { role });
        const updatedUser: UserProfile = {
          ...state.user,
          roles: [...state.user.roles, role],
          updatedAt: new Date(),
        };
        setState((prev) => ({ ...prev, user: updatedUser }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add role';
        setState((prev) => ({ ...prev, error: message }));
      }
    }
  }, [state.user]);

  const removeRole = useCallback((role: RegularUserRole) => {
    if (state.user && state.user.roles.includes(role) && state.user.roles.length > 1) {
      const updatedRoles = state.user.roles.filter((r) => r !== role);
      const updatedUser = {
        ...state.user,
        roles: updatedRoles,
        activeRole:
          state.user.activeRole === role
            ? (updatedRoles.find((r) => r !== 'admin') as RegularUserRole | undefined)
            : state.user.activeRole,
        updatedAt: new Date(),
      };
      setState((prev) => ({ ...prev, user: updatedUser }));
    }
  }, [state.user]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!state.user) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await api.put('/users/profile', {
        name: data.name,
        avatar: data.avatar,
        activeRole: data.activeRole,
      });
      const updatedUser = {
        ...state.user,
        ...data,
        // Resolve any relative avatar path saved to backend
        avatar: resolveAvatarUrl(data.avatar) || state.user.avatar,
        updatedAt: new Date(),
      };
      setState((prev) => ({ ...prev, user: updatedUser, isLoading: false }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [state.user]);

  // ─── Refresh user from server ──────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const backendUser = await api.get<BackendUserProfile>('/auth/me');
      const user = mapBackendUser(backendUser);
      setState((prev) => ({ ...prev, user, isAuthenticated: true }));
    } catch {
      // Silent — if refresh fails keep existing state
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    loginWithWallet,
    signup,
    logout,
    hasRole,
    isAdmin,
    setActiveRole,
    addRole,
    removeRole,
    updateProfile,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
