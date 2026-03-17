import { motion } from 'framer-motion';
import { Check, TrendingUp, Car, Gauge, Shield, ChevronRight } from 'lucide-react';
import { ROLE_INFO, type UserRole, type RegularUserRole } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';

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

// Multi-select role selector for signup
interface MultiRoleSelectorProps {
  selectedRoles: RegularUserRole[];
  onToggle: (role: RegularUserRole) => void;
  variant?: 'cards' | 'compact';
  showFeatures?: boolean;
}

export function MultiRoleSelector({
  selectedRoles,
  onToggle,
  variant = 'cards',
  showFeatures = true,
}: MultiRoleSelectorProps) {
  const roles = Object.values(ROLE_INFO).filter((r) => r.id !== 'admin');

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.id];
          const isSelected = selectedRoles.includes(role.id as RegularUserRole);
          const colors = ROLE_COLORS[role.id];

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onToggle(role.id as RegularUserRole)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.border} ${colors.text}`
                  : 'border-border bg-surface hover:border-border-hover text-text-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{role.title}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.map((role, index) => {
        const Icon = ROLE_ICONS[role.id];
        const isSelected = selectedRoles.includes(role.id as RegularUserRole);
        const colors = ROLE_COLORS[role.id];

        return (
          <motion.button
            key={role.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onToggle(role.id as RegularUserRole)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
              isSelected
                ? `border-primary bg-primary/5`
                : 'border-border bg-surface hover:border-border-hover'
            }`}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}

            {/* Icon */}
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${
                isSelected ? colors.bg : 'bg-background-elevated'
              }`}
            >
              <Icon
                className={`h-7 w-7 ${isSelected ? colors.text : 'text-text-muted'}`}
              />
            </div>

            {/* Title & Description */}
            <h3
              className={`font-heading font-bold text-lg mb-2 ${
                isSelected ? 'text-primary' : 'text-text-primary'
              }`}
            >
              {role.title}
            </h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              {role.description}
            </p>

            {/* Features */}
            {showFeatures && (
              <ul className="space-y-2">
                {role.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-text-muted"
                  >
                    <Check className="h-3 w-3 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// Legacy single-select role selector (for backwards compatibility)
interface RoleSelectorProps {
  selectedRole?: UserRole;
  onSelect: (role: UserRole) => void;
  excludeAdmin?: boolean;
  variant?: 'cards' | 'compact';
  showFeatures?: boolean;
}

export function RoleSelector({
  selectedRole,
  onSelect,
  excludeAdmin = true,
  variant = 'cards',
  showFeatures = true,
}: RoleSelectorProps) {
  const roles = Object.values(ROLE_INFO).filter(
    (r) => !(excludeAdmin && r.id === 'admin')
  );

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => {
          const Icon = ROLE_ICONS[role.id];
          const isSelected = selectedRole === role.id;
          const colors = ROLE_COLORS[role.id];

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelect(role.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                isSelected
                  ? `${colors.bg} ${colors.border} ${colors.text}`
                  : 'border-border bg-surface hover:border-border-hover text-text-secondary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{role.title}</span>
              {isSelected && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.map((role, index) => {
        const Icon = ROLE_ICONS[role.id];
        const isSelected = selectedRole === role.id;
        const colors = ROLE_COLORS[role.id];

        return (
          <motion.button
            key={role.id}
            type="button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            onClick={() => onSelect(role.id)}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
              isSelected
                ? `border-primary bg-primary/5`
                : 'border-border bg-surface hover:border-border-hover'
            }`}
          >
            {/* Selected indicator */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
              >
                <Check className="h-4 w-4 text-white" />
              </motion.div>
            )}

            {/* Icon */}
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${
                isSelected ? colors.bg : 'bg-background-elevated'
              }`}
            >
              <Icon
                className={`h-7 w-7 ${isSelected ? colors.text : 'text-text-muted'}`}
              />
            </div>

            {/* Title & Description */}
            <h3
              className={`font-heading font-bold text-lg mb-2 ${
                isSelected ? 'text-primary' : 'text-text-primary'
              }`}
            >
              {role.title}
            </h3>
            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
              {role.description}
            </p>

            {/* Features */}
            {showFeatures && (
              <ul className="space-y-2">
                {role.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-xs text-text-muted"
                  >
                    <Check className="h-3 w-3 text-success shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

interface RoleSwitcherProps {
  className?: string;
}

export function RoleSwitcher({ className }: RoleSwitcherProps) {
  const { user, setActiveRole, hasRole } = useAuth();

  if (!user || !user.roles) return null;

  // Get primary/active role
  const activeRole = user.activeRole || (user.roles.find(r => r !== 'admin') as RegularUserRole) || 'investor';
  const currentRole = ROLE_INFO[activeRole];
  const Icon = ROLE_ICONS[activeRole];
  const colors = ROLE_COLORS[activeRole];

  // Get other roles user has (for switching)
  const availableRoles = Object.values(ROLE_INFO).filter(
    (r) => r.id !== 'admin' && r.id !== activeRole && hasRole(r.id)
  );

  // Don't show switcher if user only has one role
  if (availableRoles.length === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bg} ${colors.border} border ${className}`}>
        <Icon className={`h-4 w-4 ${colors.text}`} />
        <span className={`font-medium ${colors.text}`}>{currentRole.title}</span>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Current Role Button */}
      <button
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bg} ${colors.border} border transition-all hover:opacity-80`}
      >
        <Icon className={`h-4 w-4 ${colors.text}`} />
        <span className={`font-medium ${colors.text}`}>{currentRole.title}</span>
        <ChevronRight className={`h-4 w-4 ${colors.text} transition-transform group-hover:rotate-90`} />
      </button>

      {/* Dropdown */}
      <div className="absolute top-full left-0 mt-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2 rounded-2xl bg-surface border border-border shadow-xl">
          <p className="px-3 py-2 text-xs text-text-muted uppercase tracking-wider">
            Switch Active View
          </p>
          {availableRoles.map((role) => {
            const RoleIcon = ROLE_ICONS[role.id];
            return (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id as RegularUserRole)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-background-elevated transition-colors text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background-elevated">
                  <RoleIcon className="h-5 w-5 text-text-muted" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{role.title}</p>
                  <p className="text-xs text-text-muted truncate">{role.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
