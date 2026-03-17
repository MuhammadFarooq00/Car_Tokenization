import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/feedback/LoadingState';
import type { UserRole, RegularUserRole } from '@/types/auth';
import { Link } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingState message="Checking authentication..." fullScreen />;
  }

  // Redirect to login if not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role access - user needs to have AT LEAST ONE of the allowed roles
  if (allowedRoles && isAuthenticated) {
    const hasAccess = allowedRoles.some(role => hasRole(role));
    if (!hasAccess) {
      return <UnauthorizedPage allowedRoles={allowedRoles} />;
    }
  }

  return <>{children}</>;
}

interface UnauthorizedPageProps {
  allowedRoles?: UserRole[];
}

function UnauthorizedPage({ allowedRoles }: UnauthorizedPageProps) {
  const { user, addRole, hasRole } = useAuth();

  const roleNames: Record<UserRole, string> = {
    investor: 'Investor',
    car_owner: 'Car Owner',
    driver: 'Driver',
    admin: 'Admin',
  };

  // Get roles user doesn't have
  const missingRoles = allowedRoles?.filter(role =>
    role !== 'admin' && !hasRole(role)
  ) as RegularUserRole[] | undefined;

  // Handle adding a role
  const handleAddRole = (role: RegularUserRole) => {
    addRole(role);
    // Page will re-render with access granted
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto text-center"
        >
          {/* Icon */}
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-warning/20 to-error/20 mx-auto mb-8 border border-warning/20">
            <AlertTriangle className="h-12 w-12 text-warning" />
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl font-bold text-text-primary mb-4">
            Access Restricted
          </h1>

          {/* Description */}
          <p className="text-text-secondary leading-relaxed max-w-md mx-auto mb-6">
            You need additional roles to access this page.
            {user && user.roles && user.roles.length > 0 && (
              <span className="block mt-2 text-sm text-text-muted">
                Your current roles: {user.roles.map((r: UserRole) => roleNames[r]).join(', ')}
              </span>
            )}
          </p>

          {/* Required Roles */}
          {allowedRoles && allowedRoles.length > 0 && (
            <div className="p-4 rounded-xl bg-surface border border-border mb-8">
              <p className="text-sm text-text-muted mb-3">Required role(s):</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {allowedRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                  >
                    {roleNames[role]}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add Role Option - Only for non-admin roles */}
          {missingRoles && missingRoles.length > 0 && (
            <div className="p-4 rounded-xl bg-surface-lighter border border-border mb-8">
              <p className="text-sm text-text-secondary mb-3">
                Want to access this feature? Add the required role:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {missingRoles.map((role) => (
                  <Button
                    key={role}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddRole(role)}
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Become {roleNames[role]}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-5 w-5" />
                <span>Go Home</span>
              </Link>
            </Button>
            <Button asChild variant="glow" size="lg">
              <Link to="/dashboard" className="inline-flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Your Dashboard</span>
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface GuestOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function GuestOnlyRoute({ children, redirectTo = '/dashboard' }: GuestOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState message="Loading..." fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
