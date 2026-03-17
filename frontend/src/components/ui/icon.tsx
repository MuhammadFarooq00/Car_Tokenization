import * as React from 'react';
import { type LucideIcon, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizeMap: Record<IconSize, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
};

const strokeWidthMap: Record<IconSize, number> = {
  xs: 2,
  sm: 2,
  md: 1.75,
  lg: 1.5,
  xl: 1.5,
  '2xl': 1.25,
};

export interface IconProps extends Omit<LucideProps, 'size'> {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
}

/**
 * Icon wrapper component with standardized sizes
 *
 * @example
 * <Icon icon={Car} size="lg" />
 * <Icon icon={Settings} size="md" className="text-primary" />
 */
export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, size = 'md', className, strokeWidth, ...props }, ref) => {
    const pixelSize = sizeMap[size];
    const defaultStrokeWidth = strokeWidthMap[size];

    return (
      <IconComponent
        ref={ref}
        size={pixelSize}
        strokeWidth={strokeWidth ?? defaultStrokeWidth}
        className={cn('shrink-0', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

// Re-export commonly used automotive/platform icons for convenience
export {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Search,
  Filter,
  SlidersHorizontal,
  MoreHorizontal,
  MoreVertical,
  Plus,
  Minus,
  Check,
  Copy,

  // User & Auth
  User,
  Users,
  UserCircle,
  UserPlus,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  Phone,

  // Automotive
  Car,
  Fuel,
  Gauge,
  MapPin,
  Navigation,
  Route,
  Clock,
  Calendar,

  // Finance & Stats
  Wallet,
  CreditCard,
  Coins,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Percent,

  // Actions
  Share2,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Settings,
  Settings2,
  Edit,
  Trash2,
  Eye,
  EyeOff,

  // Status & Feedback
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Bell,
  BellRing,

  // Media & Files
  Image,
  FileText,
  File,
  Camera,

  // Social & Communication
  MessageSquare,
  Send,
  Star,
  Heart,
  ThumbsUp,
  Award,
  Trophy,

  // Layout
  LayoutDashboard,
  LayoutGrid,
  List,
  Grid3X3,
  Columns,

  // Misc
  Sparkles,
  Zap,
  Target,
  Flag,
  Bookmark,
  Link2,
  Globe,
  Home,
  Building2,

  // Loading
  Loader2,
} from 'lucide-react';

// Icon with background circle
export interface IconBadgeProps extends IconProps {
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
}

const variantStyles = {
  default: 'bg-background-elevated text-text-secondary',
  primary: 'bg-primary-muted text-primary',
  accent: 'bg-accent-muted text-accent',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  error: 'bg-error-muted text-error',
  info: 'bg-info-muted text-info',
};

const badgeSizeMap: Record<IconSize, string> = {
  xs: 'p-1.5',
  sm: 'p-2',
  md: 'p-2.5',
  lg: 'p-3',
  xl: 'p-4',
  '2xl': 'p-5',
};

export const IconBadge = React.forwardRef<HTMLDivElement, IconBadgeProps & { wrapperClassName?: string }>(
  ({ icon, size = 'md', variant = 'default', className, wrapperClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl',
          variantStyles[variant],
          badgeSizeMap[size],
          wrapperClassName
        )}
      >
        <Icon icon={icon} size={size} className={className} {...props} />
      </div>
    );
  }
);

IconBadge.displayName = 'IconBadge';
