/**
 * unified/ErrorState.tsx
 *
 * Design-token-aware error state components for use across the entire VIVIM app.
 * Replaces `ios/ErrorState.tsx` (which used hardcoded Tailwind colors) with
 * components that read from CSS custom properties (defined in design-system.css).
 *
 * Components exported:
 *  - ErrorState       (full-page vertical centred, replaces IOSErrorState)
 *  - ErrorCard        (inline card, replaces IOSErrorCard)
 *  - ErrorBanner      (slim horizontal banner, replaces IOSErrorBanner)
 *  - ErrorNetwork / ErrorServer / ErrorNotFound / ErrorPermission  (pre-configured)
 */

import React from 'react';
import { AlertCircle, WifiOff, RefreshCw, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

// ─── Shared types ─────────────────────────────────────────────────────────────

export type ErrorType = 'network' | 'server' | 'not-found' | 'permission' | 'generic';

interface ErrorAction {
  label: string;
  onClick: () => void;
}

// ─── Design-token colour maps ─────────────────────────────────────────────────
// Using inline style with CSS variables so colors adapt automatically to
// theme changes without Tailwind-class knowledge baked in.

const ERROR_COLORS: Record<ErrorType, {
  cssVar: string;
  iconBg: string;
}> = {
  network:    { cssVar: '--provider-mistral-start', iconBg: 'rgba(249,115,22,0.12)' },
  server:     { cssVar: '--color-error-500',        iconBg: 'rgba(239,68,68,0.10)' },
  'not-found':{ cssVar: '--layer-1',                iconBg: 'rgba(99,102,241,0.10)' },
  permission: { cssVar: '--warning-500',             iconBg: 'rgba(245,158,11,0.10)' },
  generic:    { cssVar: '--color-error-500',         iconBg: 'rgba(239,68,68,0.10)' },
};

const ERROR_ICONS: Record<ErrorType, React.ReactNode> = {
  network:    <WifiOff />,
  server:     <XCircle />,
  'not-found': <AlertCircle />,
  permission: <AlertTriangle />,
  generic:    <AlertCircle />,
};

const ERROR_DEFAULTS: Record<ErrorType, { title: string; description: string }> = {
  network:    { title: 'No internet connection', description: 'Please check your connection and try again.' },
  server:     { title: 'Server error', description: 'Something went wrong on our end. Please try again later.' },
  'not-found':{ title: 'Not found', description: 'The item you are looking for could not be found.' },
  permission: { title: 'Access denied', description: 'You do not have permission to access this content.' },
  generic:    { title: 'Something went wrong', description: 'An unexpected error occurred. Please try again.' },
};

// ─── ErrorState (full-page) ───────────────────────────────────────────────────

export interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  action?: ErrorAction;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'generic',
  title,
  description,
  action,
  className,
}) => {
  const colors = ERROR_COLORS[type];
  const defaults = ERROR_DEFAULTS[type];

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-10 text-center min-h-[200px]',
        className
      )}
    >
      {/* Icon circle */}
      <div
        className="mb-5 w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: colors.iconBg }}
        aria-hidden="true"
      >
        <span
          className="[&>svg]:w-8 [&>svg]:h-8"
          style={{ color: `var(${colors.cssVar})` }}
        >
          {ERROR_ICONS[type]}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title ?? defaults.title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)] mb-7 max-w-xs">
        {description ?? defaults.description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: `var(${colors.cssVar})` }}
        >
          <RefreshCw className="w-4 h-4" />
          {action.label}
        </button>
      )}
    </div>
  );
};

// ─── Pre-configured shortcuts ─────────────────────────────────────────────────

export const ErrorNetwork: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState type="network" action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined} />
);

export const ErrorServer: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <ErrorState type="server" action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined} />
);

export const ErrorNotFound: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <ErrorState type="not-found" action={onAction ? { label: 'Go Back', onClick: onAction } : undefined} />
);

export const ErrorPermission: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
  <ErrorState type="permission" action={onAction ? { label: 'Go Back', onClick: onAction } : undefined} />
);

// ─── ErrorCard (inline card) ──────────────────────────────────────────────────

export interface ErrorCardProps {
  type?: ErrorType;
  title?: string;
  description?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  type = 'generic',
  title,
  description,
  onDismiss,
  onRetry,
  className,
}) => {
  const colors = ERROR_COLORS[type];
  const defaults = ERROR_DEFAULTS[type];

  return (
    <div
      role="alert"
      className={cn(
        'rounded-2xl p-4 border',
        'bg-[var(--surface-base)] border-[var(--border-subtle)]',
        className
      )}
      style={{
        borderLeftWidth: 3,
        borderLeftColor: `var(${colors.cssVar})`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0 [&>svg]:w-5 [&>svg]:h-5"
          style={{ background: colors.iconBg, color: `var(${colors.cssVar})` }}
          aria-hidden="true"
        >
          {ERROR_ICONS[type]}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
            {title ?? defaults.title}
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            {description ?? defaults.description}
          </p>

          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90"
                  style={{ background: `var(${colors.cssVar})` }}
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:opacity-80 transition-opacity"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Dismiss error"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── ErrorBanner (slim horizontal) ───────────────────────────────────────────

export interface ErrorBannerProps {
  type?: ErrorType;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  type = 'generic',
  message,
  onDismiss,
  className,
}) => {
  const colors = ERROR_COLORS[type];

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border',
        'border-[var(--border-subtle)]',
        className
      )}
      style={{ background: colors.iconBg }}
    >
      <span
        className="flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4"
        style={{ color: `var(${colors.cssVar})` }}
        aria-hidden="true"
      >
        {ERROR_ICONS[type]}
      </span>
      <p
        className="text-sm flex-1"
        style={{ color: `var(${colors.cssVar})` }}
      >
        {message}
      </p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          style={{ color: `var(${colors.cssVar})` }}
          aria-label="Dismiss"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ErrorState;
