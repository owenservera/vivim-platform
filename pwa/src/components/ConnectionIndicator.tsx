/**
 * Connection Indicator Component
 * Visual indicator for AI streaming connection states
 * VIVIM Integration - Foundation Layer
 */

import React, { useState, useEffect } from 'react';
import type { ConnectionState, ConnectionQuality, ConnectionConfig } from '../types/ai-chat';
import { ConnectionQualityUtils } from '../types/ai-chat';

/**
 * Connection Indicator Props
 */
export interface ConnectionIndicatorProps {
  state: ConnectionState;
  quality?: ConnectionQuality;
  config?: Partial<ConnectionConfig>;
  showQuality?: boolean;
  showLatency?: boolean;
  showCountdown?: boolean;
  showRetryButton?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'dot' | 'bar' | 'full';
  onRetry?: () => void;
  onReconnect?: () => void;
}

/**
 * Connection Quality Badge Props
 */
interface QualityBadgeProps {
  quality: ConnectionQuality;
  latency: number;
  size: 'small' | 'medium' | 'large';
}

/**
 * Countdown Timer Props
 */
interface CountdownTimerProps {
  remaining: number;
  maxTime: number;
  onComplete?: () => void;
}

/**
 * Quality Badge Component
 */
function QualityBadge({ quality, latency, size }: QualityBadgeProps): React.ReactElement {
  const color = ConnectionQualityUtils.getQualityColor(quality);
  const label = ConnectionQualityUtils.getQualityLabel(quality);

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { fontSize: '10px', padding: '2px 6px' },
    medium: { fontSize: '12px', padding: '4px 8px' },
    large: { fontSize: '14px', padding: '6px 12px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: `${color}20`,
        color: color,
        borderRadius: '12px',
        fontWeight: 500,
        ...sizeStyles[size],
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      {label} {latency > 0 && `(${latency}ms)`}
    </span>
  );
}

/**
 * Countdown Timer Component
 */
function CountdownTimer({ remaining, maxTime, onComplete }: CountdownTimerProps): React.ReactElement {
  const progress = Math.max(0, Math.min(100, (remaining / maxTime) * 100));
  const [displayRemaining, setDisplayRemaining] = useState(remaining);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    setDisplayRemaining(remaining);
  }, [remaining, onComplete]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div
        style={{
          width: '60px',
          height: '4px',
          backgroundColor: '#E5E7EB',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: progress < 20 ? '#EF4444' : progress < 50 ? '#F59E0B' : '#10B981',
            transition: 'width 1s linear',
          }}
        />
      </div>
      <span style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>
        {Math.ceil(displayRemaining / 1000)}s
      </span>
    </div>
  );
}

/**
 * Pulse Animation Keyframes
 */
const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

/**
 * Connection Indicator Component
 */
export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  state,
  quality = 'good',
  config,
  showQuality = true,
  showCountdown = true,
  showRetryButton = true,
  size = 'medium',
  variant = 'full',
  onRetry,
}) => {
  const [countdown, setCountdown] = useState(60000);
  const reconnectWindow = config?.reconnectWindow || 60000;

  useEffect(() => {
    if (state.status === 'reconnecting') {
      setCountdown(reconnectWindow);
      const interval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.status, reconnectWindow]);

  const getIndicatorContent = (): React.ReactNode => {
    switch (state.status) {
      case 'connected':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                borderRadius: '50%',
                backgroundColor: ConnectionQualityUtils.getQualityColor(quality),
                animation: 'pulse 2s infinite',
              }}
            />
            {variant === 'full' && (
              <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#10B981', fontWeight: 500 }}>
                Connected
              </span>
            )}
          </div>
        );

      case 'connecting':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
                height: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
                border: '2px solid #3B82F6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            {variant === 'full' && (
              <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#3B82F6', fontWeight: 500 }}>
                Connecting... ({state.attempt})
              </span>
            )}
          </div>
        );

      case 'reconnecting':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <span
              style={{
                width: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
                height: size === 'small' ? '12px' : size === 'medium' ? '16px' : '20px',
                border: '2px solid #F59E0B',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            {variant === 'full' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#F59E0B', fontWeight: 500 }}>
                  Reconnecting... ({state.attempt}/{state.maxAttempts})
                </span>
                {showCountdown && (
                  <CountdownTimer remaining={countdown} maxTime={reconnectWindow} />
                )}
              </div>
            )}
          </div>
        );

      case 'disconnected':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                borderRadius: '50%',
                backgroundColor: '#6B7280',
              }}
            />
            {variant === 'full' && (
              <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#6B7280' }}>
                Disconnected
              </span>
            )}
          </div>
        );

      case 'failed':
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'slideIn 0.3s ease-out',
            }}
          >
            <span
              style={{
                width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                animation: 'blink 1s infinite',
              }}
            />
            {variant === 'full' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#EF4444', fontWeight: 500 }}>
                  Connection Failed
                </span>
                {state.error && (
                  <span style={{ fontSize: '12px', color: '#9CA3AF', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {state.error}
                  </span>
                )}
                {showRetryButton && state.canRetry && onRetry && (
                  <button
                    onClick={onRetry}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#FFFFFF',
                      backgroundColor: '#3B82F6',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2563EB')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#3B82F6')}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        );

      case 'heartbeat-missed':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
                animation: 'blink 0.5s infinite',
              }}
            />
            {variant === 'full' && (
              <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#F59E0B', fontWeight: 500 }}>
                Heartbeat Missed ({state.missedCount})
              </span>
            )}
          </div>
        );

      case 'degraded':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                height: size === 'small' ? '8px' : size === 'medium' ? '10px' : '12px',
                borderRadius: '50%',
                backgroundColor: '#F59E0B',
              }}
            />
            {variant === 'full' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: size === 'small' ? '12px' : '14px', color: '#F59E0B', fontWeight: 500 }}>
                  Degraded
                </span>
                {state.warning && (
                  <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {state.warning}
                  </span>
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: size === 'small' ? '4px 8px' : size === 'medium' ? '6px 12px' : '8px 16px',
          backgroundColor: state.status === 'failed' ? '#FEF2F2' :
            state.status === 'reconnecting' ? '#FFFBEB' :
              state.status === 'connected' ? '#F0FDF4' : '#F9FAFB',
          borderRadius: '8px',
          border: `1px solid ${state.status === 'failed' ? '#FECACA' :
            state.status === 'reconnecting' ? '#FED7AA' :
              state.status === 'connected' ? '#BBF7D0' : '#E5E7EB'}`,
        }}
      >
        {getIndicatorContent()}
        {state.status === 'connected' && showQuality && state.latency > 0 && (
          <QualityBadge quality={quality} latency={state.latency} size={size} />
        )}
      </div>
    </>
  );
};

/**
 * Compact Connection Indicator (dot only)
 */
export const ConnectionDot: React.FC<{
  state: ConnectionState;
  size?: 'small' | 'medium' | 'large';
}> = ({ state, size = 'medium' }) => {
  const getColor = (): string => {
    switch (state.status) {
      case 'connected': return ConnectionQualityUtils.getQualityColor('good');
      case 'connecting':
      case 'reconnecting': return '#F59E0B';
      case 'failed': return '#EF4444';
      case 'disconnected': return '#6B7280';
      case 'heartbeat-missed': return '#F59E0B';
      case 'degraded': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAnimation = (): string => {
    switch (state.status) {
      case 'connected': return 'pulse 2s infinite';
      case 'connecting':
      case 'reconnecting': return 'spin 1s linear infinite';
      case 'failed':
      case 'heartbeat-missed': return 'blink 1s infinite';
      default: return 'none';
    }
  };

  const sizeMap = { small: 8, medium: 10, large: 12 };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <span
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          borderRadius: '50%',
          backgroundColor: getColor(),
          animation: getAnimation(),
        }}
      />
    </>
  );
};

/**
 * Connection Status Bar
 */
export const ConnectionStatusBar: React.FC<{
  state: ConnectionState;
  quality?: ConnectionQuality;
  onRetry?: () => void;
}> = ({ state, quality = 'good', onRetry }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '12px 24px',
        backgroundColor: state.status === 'failed' ? '#FEF2F2' :
          state.status === 'reconnecting' ? '#FFFBEB' :
            state.status === 'connected' ? '#F0FDF4' : '#F9FAFB',
        borderTop: `1px solid ${state.status === 'failed' ? '#FECACA' :
          state.status === 'reconnecting' ? '#FED7AA' :
            state.status === 'connected' ? '#BBF7D0' : '#E5E7EB'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 9999,
      }}
    >
      <ConnectionIndicator state={state} quality={quality} showRetryButton={false} variant="full" />
      {state.status === 'failed' && state.canRetry && onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#FFFFFF',
            backgroundColor: '#3B82F6',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};

export default ConnectionIndicator;
