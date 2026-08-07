import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, ShieldAlert, Info } from 'lucide-react';

const TYPES = {
  error: {
    icon: AlertTriangle,
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    color: '#DC2626',
    label: 'Error'
  },
  warning: {
    icon: AlertTriangle,
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.3)',
    color: '#D97706',
    label: 'Warning'
  },
  offline: {
    icon: WifiOff,
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.25)',
    color: '#64748B',
    label: 'Offline'
  },
  permission: {
    icon: ShieldAlert,
    bg: 'rgba(99,102,241,0.08)',
    border: 'rgba(99,102,241,0.25)',
    color: '#4F46E5',
    label: 'Access'
  },
  info: {
    icon: Info,
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.25)',
    color: '#0284C7',
    label: 'Info'
  }
};

/**
 * ErrorBanner — friendly inline error/warning/info banner.
 * 
 * Props:
 *  type: 'error' | 'warning' | 'offline' | 'permission' | 'info'  (default: 'error')
 *  title: string — short headline
 *  message: string — detailed user-friendly explanation (no JSON, no stack traces)
 *  onRetry: function — if provided, shows a "Try Again" button
 */
export const ErrorBanner = ({ type = 'error', title, message, onRetry }) => {
  const cfg = TYPES[type] || TYPES.error;
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
      padding: '1rem 1.25rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
    }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
        backgroundColor: `${cfg.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: cfg.color
      }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: cfg.color, marginBottom: '3px' }}>
            {title}
          </p>
        )}
        {message && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            background: 'none', border: `1.5px solid ${cfg.color}`,
            color: cfg.color, borderRadius: 'var(--radius-sm)',
            padding: '0.375rem 0.75rem', cursor: 'pointer',
            fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'inherit',
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = `${cfg.color}14`}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <RefreshCw size={13} /> Try Again
        </button>
      )}
    </div>
  );
};
