export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './Card';
export type {
  CardProps,
  CardHeaderProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps
} from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Badge } from './Badge';
export type { BadgeProps } from './Badge';

export {
  ResponsiveLayout,
  ResponsiveGrid,
  ResponsiveContainer,
  useResponsive
} from './ResponsiveLayout';
export type {
  ResponsiveLayoutProps,
  ResponsiveGridProps,
  ResponsiveContainerProps
} from './ResponsiveLayout';

/**
 * Unified Error State components — design-token-aware, no hardcoded colors.
 * Prefer these over ios/ErrorState exports for new code.
 */
export {
  ErrorState,
  ErrorCard,
  ErrorBanner,
  ErrorNetwork,
  ErrorServer,
  ErrorNotFound,
  ErrorPermission,
} from './ErrorState';
export type {
  ErrorStateProps,
  ErrorCardProps,
  ErrorBannerProps,
  ErrorType,
} from './ErrorState';

/**
 * @deprecated Prefer unified/ErrorState components. These are kept for
 * backward compatibility only and will be removed in a future release.
 */
export {
  IOSErrorState,
  IOSErrorCard,
  IOSErrorBanner,
} from '../ios/ErrorState';
export type {
  IOSErrorStateProps,
  IOSErrorCardProps,
  IOSErrorBannerProps,
  IOSErrorType,
} from '../ios/ErrorState';

// Skeleton components
export { Skeleton, CardSkeleton, ListSkeleton } from '../ui/Skeleton/Skeleton';

