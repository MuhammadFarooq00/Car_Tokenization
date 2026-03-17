import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Shield, Search, ChevronLeft, ChevronRight, Loader2,
  Mail, CheckCircle2, XCircle, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminUsers, useUpdateUserRoles } from '@/hooks/api/useAdminApi';
import { formatAddress } from '@/lib/utils';

const AVAILABLE_ROLES = ['investor', 'car_owner', 'driver', 'admin'] as const;

const ROLE_COLORS: Record<string, string> = {
  investor: 'bg-primary/10 text-primary border-primary/30',
  car_owner: 'bg-accent/10 text-accent border-accent/30',
  driver: 'bg-success/10 text-success border-success/30',
  admin: 'bg-warning/10 text-warning border-warning/30',
};

export function UsersManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editRoles, setEditRoles] = useState<string[]>([]);

  const { data, isLoading } = useAdminUsers({ page, limit: 15 });
  const { mutate: updateRoles, isPending: updatingRoles } = useUpdateUserRoles();

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  const filteredUsers = search
    ? users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.walletAddress?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleEditRoles = (userId: string, currentRoles: string[]) => {
    setEditingUserId(userId);
    setEditRoles([...currentRoles]);
  };

  const handleToggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSaveRoles = () => {
    if (!editingUserId || editRoles.length === 0) return;
    updateRoles(
      { id: editingUserId, roles: editRoles },
      { onSuccess: () => setEditingUserId(null) }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="relative py-12 lg:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="container relative">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-text-secondary bg-background-elevated border border-border hover:text-text-primary hover:border-primary/40 hover:bg-background-hover transition-all mb-6"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">User Management</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
              Manage <span className="text-gradient">Users</span>
            </h1>
            <p className="text-text-secondary max-w-xl">
              View all platform users, manage their roles, and monitor account status.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container pb-16">
        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search by name, email, or wallet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            inputSize="lg"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No users found.</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background-elevated/50">
                      <th className="text-left p-4 font-medium text-text-muted">User</th>
                      <th className="text-left p-4 font-medium text-text-muted">Email</th>
                      <th className="text-left p-4 font-medium text-text-muted">Wallet</th>
                      <th className="text-left p-4 font-medium text-text-muted">Roles</th>
                      <th className="text-left p-4 font-medium text-text-muted">KYC</th>
                      <th className="text-left p-4 font-medium text-text-muted">Joined</th>
                      <th className="text-right p-4 font-medium text-text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-background-elevated/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <span className="font-medium text-text-primary">{user.name || 'Unnamed'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-text-secondary">
                            <Mail className="h-3.5 w-3.5" />
                            {user.email || '—'}
                          </div>
                        </td>
                        <td className="p-4">
                          {user.walletAddress ? (
                            <span className="font-mono text-xs text-text-muted">
                              {formatAddress(user.walletAddress)}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {editingUserId === user.id ? (
                            <div className="flex flex-wrap gap-1.5">
                              {AVAILABLE_ROLES.map((role) => (
                                <button
                                  key={role}
                                  onClick={() => handleToggleRole(role)}
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all ${
                                    editRoles.includes(role)
                                      ? ROLE_COLORS[role]
                                      : 'bg-background-elevated border-border text-text-muted opacity-50'
                                  }`}
                                >
                                  {role.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[role] ?? 'bg-background-elevated border-border text-text-muted'}`}
                                >
                                  {role.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {user.kycVerified ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" /> Unverified
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-text-muted text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          {editingUserId === user.id ? (
                            <div className="flex items-center gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingUserId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                variant="glow"
                                isLoading={updatingRoles}
                                onClick={handleSaveRoles}
                                disabled={editRoles.length === 0}
                              >
                                Save
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRoles(user.id, user.roles)}
                            >
                              <Shield className="h-3.5 w-3.5 mr-1" />
                              Edit Roles
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-text-muted">
                  Page {page} of {totalPages} ({data?.total ?? 0} users)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
