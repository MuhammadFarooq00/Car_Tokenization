import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Wallet, Shield, Camera, Save, LogOut, Bell,
  Key, ChevronRight, ChevronDown, CheckCircle2, AlertCircle, Copy, ExternalLink,
  TrendingUp, Car, Gauge, Lock, Upload, FileText, X, Eye, EyeOff, Loader2,
  Star, Trash2, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useAppKit } from '@reown/appkit/react';
import { ROLE_INFO } from '@/types/auth';
import { formatAddress } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useUserWallets, useSetPrimaryWallet, useRemoveWallet } from '@/hooks/api/useUsersApi';

const ROLE_ICONS = {
  investor: TrendingUp,
  car_owner: Car,
  driver: Gauge,
  admin: Shield,
};

const ROLE_COLORS = {
  investor: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary' },
  car_owner: { bg: 'bg-accent/10', border: 'border-accent/30', text: 'text-accent' },
  driver: { bg: 'bg-success/10', border: 'border-success/30', text: 'text-success' },
  admin: { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning' },
};

// ─── Multi-Wallet Section Component ────────────────────────────────────────
function WalletSection({ openConnectModal }: { openConnectModal: () => void }) {
  const { data: wallets = [], isLoading } = useUserWallets();
  const setPrimary = useSetPrimaryWallet();
  const removeWallet = useRemoveWallet();
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-lg text-text-primary">
            Connected Wallets
          </h3>
          <p className="text-sm text-text-muted mt-1">
            Manage your connected wallets &middot; {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => openConnectModal()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Connect
        </Button>
      </div>

      <div className="p-6 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-heading font-bold text-text-primary mb-2">
              No Wallets Connected
            </h4>
            <p className="text-sm text-text-muted mb-4">
              Connect a wallet to access blockchain features
            </p>
            <Button onClick={() => openConnectModal()} variant="glow">
              Connect Wallet
            </Button>
          </div>
        ) : (
          wallets.map((w) => (
            <div
              key={w.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                w.isPrimary
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-background-elevated border-border/50'
              }`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg shrink-0 ${
                w.isPrimary ? 'bg-primary/10' : 'bg-surface'
              }`}>
                <Wallet className={`h-5 w-5 ${w.isPrimary ? 'text-primary' : 'text-text-muted'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-text-primary truncate">
                    {formatAddress(w.address)}
                  </p>
                  {w.isPrimary && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                      Primary
                    </Badge>
                  )}
                </div>
                {w.label && (
                  <p className="text-xs text-text-muted mt-0.5">{w.label}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">
                  Connected {new Date(w.connectedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-1">
                {/* Copy */}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(w.address)}>
                  {copiedAddr === w.address ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>

                {/* Etherscan */}
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <a href={`https://etherscan.io/address/${w.address}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>

                {/* Set primary */}
                {!w.isPrimary && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    disabled={setPrimary.isPending}
                    onClick={() => setPrimary.mutate(w.address)}
                    title="Set as primary"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </Button>
                )}

                {/* Remove */}
                {confirmRemove === w.address ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs px-2"
                      disabled={removeWallet.isPending}
                      onClick={() => {
                        removeWallet.mutate(w.address, { onSettled: () => setConfirmRemove(null) });
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setConfirmRemove(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-text-muted hover:text-error"
                    onClick={() => setConfirmRemove(w.address)}
                    title="Remove wallet"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type SettingsPanel = 'notifications' | 'security' | 'kyc' | null;

export function Profile() {
  const { user, updateProfile, setActiveRole, hasRole, addRole, removeRole, logout, isAdmin } = useAuth();
  const userIsAdmin = isAdmin();
  const { open: openConnectModal } = useAppKit();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<SettingsPanel>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security panel state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences (stored locally)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem('carshares_notif_prefs');
    return saved ? JSON.parse(saved) : {
      emailNotifications: true,
      tradeAlerts: true,
      dividendAlerts: true,
      platformUpdates: false,
      marketingEmails: false,
    };
  });

  // KYC panel state
  const [kycStatus, setKycStatus] = useState<{ status: string; reviewNote?: string } | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycDocType, setKycDocType] = useState('passport');
  const [kycDocUrl, setKycDocUrl] = useState('');
  const [kycSelfieUrl, setKycSelfieUrl] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMessage, setKycMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadKycStatus = async () => {
    setKycLoading(true);
    try {
      const status = await api.get<{ status: string; reviewNote?: string | null }>('/users/kyc/status');
      setKycStatus({ status: status.status, reviewNote: status.reviewNote ?? undefined });
    } catch {
      setKycStatus(null);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    if (activePanel === 'kyc') {
      loadKycStatus();
    }
  }, [activePanel]);

  if (!user) {
    return null;
  }

  const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:3001';

  /** Resolve avatar path to a full URL (handles relative backend paths and absolute URLs) */
  const resolveAvatar = (url?: string | null) => {
    if (!url) return undefined;
    // Already absolute (http/https or data URI)
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    // Relative path from backend — prepend API base
    return `${API_BASE}${url}`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({ name, avatar: avatarUrl || undefined });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate on client side too
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB');
      return;
    }

    setAvatarUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadFile<{ url: string }>('/uploads/avatar', file);
      // result.url is a relative path like /uploads/avatars/xxx.jpg
      setAvatarUrl(result.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setAvatarUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const togglePanel = (panel: SettingsPanel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPasswordChanging(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordMessage({ type: 'error', text: message });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleNotifToggle = (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key as keyof typeof notifPrefs] };
    setNotifPrefs(updated);
    localStorage.setItem('carshares_notif_prefs', JSON.stringify(updated));
  };

  const handleKycSubmit = async () => {
    setKycMessage(null);
    if (!kycDocUrl) {
      setKycMessage({ type: 'error', text: 'Please provide a document URL' });
      return;
    }
    setKycSubmitting(true);
    try {
      await api.post('/users/kyc', {
        documentType: kycDocType,
        documentUrl: kycDocUrl,
        selfieUrl: kycSelfieUrl || undefined,
      });
      setKycMessage({ type: 'success', text: 'KYC documents submitted successfully!' });
      loadKycStatus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit KYC';
      setKycMessage({ type: 'error', text: message });
    } finally {
      setKycSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Hero Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Account Settings</span>
            </div>

            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Your Profile
            </h1>
            <p className="text-text-secondary">
              Manage your account settings and preferences
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              {/* Avatar Section */}
              <div className="relative p-8 text-center bg-gradient-to-b from-primary/10 to-transparent">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-surface mx-auto bg-background-elevated">
                    {avatarUploading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (avatarUrl || user.avatar) ? (
                      <img
                        src={resolveAvatar(avatarUrl || user.avatar) || ''}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-text-muted" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    disabled={avatarUploading}
                    className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
                    title="Change avatar"
                  >
                    {avatarUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  </button>
                  {uploadError && (
                    <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-error whitespace-nowrap">{uploadError}</p>
                  )}
                </div>

                <h2 className="font-heading font-bold text-xl text-text-primary mt-4">
                  {user.name}
                </h2>
                <p className="text-text-muted text-sm">{user.email}</p>

                {/* Role Badges — show all non-admin roles */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {(user.roles ?? [])
                    .filter((r) => r !== 'admin')
                    .map((r) => {
                      const role = r as 'investor' | 'car_owner' | 'driver';
                      const Icon = ROLE_ICONS[role];
                      const colors = ROLE_COLORS[role];
                      const info = ROLE_INFO[role];
                      return (
                        <div
                          key={role}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium ${colors.bg} ${colors.border} ${colors.text}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {info?.title ?? role}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 border-t border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Member since</span>
                    <span className="text-text-primary font-medium">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">KYC Status</span>
                    {user.kycVerified ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="p-6 border-t border-border">
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="w-full text-error hover:bg-error/10 hover:text-error"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Personal Information
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Update your personal details
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="name" className="text-text-secondary">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-2"
                      inputSize="lg"
                      leftIcon={<User className="h-5 w-5" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-text-secondary">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-2"
                      inputSize="lg"
                      leftIcon={<Mail className="h-5 w-5" />}
                      disabled
                    />
                    <p className="text-xs text-text-muted mt-1">Email cannot be changed</p>
                  </div>
                </div>

                {/* Avatar URL field */}
                <div>
                  <Label htmlFor="avatarUrl" className="text-text-secondary">Avatar URL (click camera icon to upload, or paste a URL)</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="mt-2"
                    inputSize="lg"
                    leftIcon={avatarUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  />
                  {uploadError && (
                    <p className="text-xs text-error mt-1">{uploadError}</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4">
                  {saveSuccess && (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Changes saved</span>
                    </div>
                  )}
                  <div className="flex-1" />
                  <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    variant="glow"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            {/* Wallet */}
            <WalletSection openConnectModal={openConnectModal} />

            {/* Role Management — hidden for admin */}
            {!userIsAdmin && (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Manage Roles
                </h3>
                <p className="text-sm text-text-muted mt-1">
                  Add or remove roles to access different features
                </p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(ROLE_INFO)
                    .filter((r) => r.id !== 'admin')
                    .map((role) => {
                      const Icon = ROLE_ICONS[role.id];
                      const roleHas = hasRole(role.id);
                      const isActiveRole = user.activeRole === role.id;
                      const colors = ROLE_COLORS[role.id];

                      return (
                        <div
                          key={role.id}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            roleHas
                              ? `${colors.bg} ${colors.border}`
                              : 'border-border bg-background-elevated'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Icon className={`h-5 w-5 ${roleHas ? colors.text : 'text-text-muted'}`} />
                              <span className={`font-medium ${roleHas ? colors.text : 'text-text-primary'}`}>
                                {role.title}
                              </span>
                            </div>
                            {roleHas && (
                              <input
                                type="checkbox"
                                checked={roleHas}
                                onChange={() => {
                                  if (roleHas && user.roles && user.roles.filter(r => r !== 'admin').length > 1) {
                                    removeRole(role.id as 'investor' | 'car_owner' | 'driver');
                                  }
                                }}
                                disabled={user.roles?.filter(r => r !== 'admin').length === 1}
                                className="w-4 h-4 accent-primary"
                              />
                            )}
                            {!roleHas && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addRole(role.id as 'investor' | 'car_owner' | 'driver')}
                              >
                                Add
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-text-muted line-clamp-2 mb-3">
                            {role.description}
                          </p>
                          {roleHas && isActiveRole && (
                            <Badge variant="success">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Active View
                            </Badge>
                          )}
                          {roleHas && !isActiveRole && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveRole(role.id as 'investor' | 'car_owner' | 'driver')}
                              className="text-xs"
                            >
                              Set as Active
                            </Button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            )}

            {/* Account Settings — Expandable Panels */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="p-6 border-b border-border">
                <h3 className="font-heading font-bold text-lg text-text-primary">
                  Account Settings
                </h3>
              </div>

              <div className="divide-y divide-border">
                {/* ─── Notifications Panel ─── */}
                <div>
                  <button
                    onClick={() => togglePanel('notifications')}
                    className="w-full flex items-center justify-between p-4 hover:bg-background-elevated/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated">
                        <Bell className="h-5 w-5 text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Notifications</p>
                        <p className="text-sm text-text-muted">Manage notification preferences</p>
                      </div>
                    </div>
                    {activePanel === 'notifications' ? (
                      <ChevronDown className="h-5 w-5 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                  <AnimatePresence>
                    {activePanel === 'notifications' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {[
                            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
                            { key: 'tradeAlerts', label: 'Trade Alerts', desc: 'Get notified about share buy/sell activity' },
                            { key: 'dividendAlerts', label: 'Dividend Alerts', desc: 'Get notified when dividends are distributed' },
                            { key: 'platformUpdates', label: 'Platform Updates', desc: 'News about new features and changes' },
                            { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotional content and offers' },
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-background-elevated">
                              <div>
                                <p className="text-sm font-medium text-text-primary">{item.label}</p>
                                <p className="text-xs text-text-muted">{item.desc}</p>
                              </div>
                              <button
                                onClick={() => handleNotifToggle(item.key)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                  notifPrefs[item.key as keyof typeof notifPrefs] ? 'bg-primary' : 'bg-border'
                                }`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                  notifPrefs[item.key as keyof typeof notifPrefs] ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>
                          ))}
                          <p className="text-xs text-text-muted pt-2">Preferences are saved automatically.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── Security Panel ─── */}
                <div>
                  <button
                    onClick={() => togglePanel('security')}
                    className="w-full flex items-center justify-between p-4 hover:bg-background-elevated/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated">
                        <Key className="h-5 w-5 text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Security</p>
                        <p className="text-sm text-text-muted">Password and security settings</p>
                      </div>
                    </div>
                    {activePanel === 'security' ? (
                      <ChevronDown className="h-5 w-5 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                  <AnimatePresence>
                    {activePanel === 'security' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          <div className="p-4 rounded-xl bg-background-elevated space-y-4">
                            <h4 className="font-medium text-text-primary flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Change Password
                            </h4>
                            {!user.email ? (
                              <p className="text-sm text-text-muted">
                                Password change is not available for wallet-only accounts.
                              </p>
                            ) : (
                              <>
                                <div>
                                  <Label className="text-text-secondary text-sm">Current Password</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={showCurrentPassword ? 'text' : 'password'}
                                      value={currentPassword}
                                      onChange={(e) => setCurrentPassword(e.target.value)}
                                      placeholder="Enter current password"
                                      leftIcon={<Lock className="h-4 w-4" />}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    >
                                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-text-secondary text-sm">New Password</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={showNewPassword ? 'text' : 'password'}
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="Min 8 characters"
                                      leftIcon={<Key className="h-4 w-4" />}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                    >
                                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-text-secondary text-sm">Confirm New Password</Label>
                                  <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="mt-1"
                                    leftIcon={<Key className="h-4 w-4" />}
                                  />
                                </div>
                                {passwordMessage && (
                                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                                    passwordMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                                  }`}>
                                    {passwordMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {passwordMessage.text}
                                  </div>
                                )}
                                <Button onClick={handleChangePassword} isLoading={passwordChanging} variant="default" className="w-full">
                                  <Lock className="h-4 w-4 mr-2" />
                                  Update Password
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── KYC Verification Panel (hidden for admin) ─── */}
                {!userIsAdmin && <div>
                  <button
                    onClick={() => togglePanel('kyc')}
                    className="w-full flex items-center justify-between p-4 hover:bg-background-elevated/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated">
                        <Shield className="h-5 w-5 text-text-muted" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">KYC Verification</p>
                        <p className="text-sm text-text-muted">Complete identity verification</p>
                      </div>
                    </div>
                    {activePanel === 'kyc' ? (
                      <ChevronDown className="h-5 w-5 text-text-muted" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-text-muted" />
                    )}
                  </button>
                  <AnimatePresence>
                    {activePanel === 'kyc' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {kycLoading ? (
                            <div className="p-6 text-center">
                              <Loader2 className="h-6 w-6 text-primary mx-auto animate-spin" />
                              <p className="text-sm text-text-muted mt-2">Loading KYC status...</p>
                            </div>
                          ) : user.kycVerified ? (
                            <div className="p-4 rounded-xl bg-success/10 border border-success/20">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-success" />
                                <div>
                                  <p className="font-medium text-success">Identity Verified</p>
                                  <p className="text-sm text-text-muted">Your KYC verification is complete.</p>
                                </div>
                              </div>
                            </div>
                          ) : kycStatus?.status === 'pending' ? (
                            <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-warning" />
                                <div>
                                  <p className="font-medium text-warning">Verification Pending</p>
                                  <p className="text-sm text-text-muted">Your documents are being reviewed. This usually takes 1-3 business days.</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {kycStatus?.status === 'rejected' && (
                                <div className="p-4 rounded-xl bg-error/10 border border-error/20">
                                  <div className="flex items-center gap-3">
                                    <X className="h-6 w-6 text-error" />
                                    <div>
                                      <p className="font-medium text-error">Verification Rejected</p>
                                      <p className="text-sm text-text-muted">{kycStatus.reviewNote || 'Please resubmit with valid documents.'}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="p-4 rounded-xl bg-background-elevated space-y-4">
                                <h4 className="font-medium text-text-primary flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  Submit KYC Documents
                                </h4>
                                <div>
                                  <Label className="text-text-secondary text-sm">Document Type</Label>
                                  <select
                                    value={kycDocType}
                                    onChange={(e) => setKycDocType(e.target.value)}
                                    className="w-full mt-1 h-10 px-3 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary"
                                  >
                                    <option value="passport">Passport</option>
                                    <option value="drivers_license">Driver&apos;s License</option>
                                    <option value="national_id">National ID Card</option>
                                  </select>
                                </div>
                                <div>
                                  <Label className="text-text-secondary text-sm">Document URL</Label>
                                  <Input
                                    type="url"
                                    value={kycDocUrl}
                                    onChange={(e) => setKycDocUrl(e.target.value)}
                                    placeholder="https://ipfs.io/ipfs/... or upload service URL"
                                    className="mt-1"
                                    leftIcon={<FileText className="h-4 w-4" />}
                                  />
                                  <p className="text-xs text-text-muted mt-1">Upload your document to IPFS or secure storage and paste the URL</p>
                                </div>
                                <div>
                                  <Label className="text-text-secondary text-sm">Selfie URL (optional)</Label>
                                  <Input
                                    type="url"
                                    value={kycSelfieUrl}
                                    onChange={(e) => setKycSelfieUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="mt-1"
                                    leftIcon={<Camera className="h-4 w-4" />}
                                  />
                                </div>
                                {kycMessage && (
                                  <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                                    kycMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                                  }`}>
                                    {kycMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {kycMessage.text}
                                  </div>
                                )}
                                <Button onClick={handleKycSubmit} isLoading={kycSubmitting} variant="default" className="w-full">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Submit for Verification
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
