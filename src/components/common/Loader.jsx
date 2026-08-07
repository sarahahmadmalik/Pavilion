import React, { useState, useEffect } from 'react';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, var(--bg-card-hover) 25%, var(--border-color) 50%, var(--bg-card-hover) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: '6px',
};

const shimmerKeyframes = `@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`;
const spinKeyframes = `@keyframes spin { to { transform: rotate(360deg); } }`;
const progressBarKeyframes = `@keyframes progressBarGlow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`;
const logoPulseKeyframes = `@keyframes logoPulse { 0%, 100% { transform: scale(1); opacity: 0.95; } 50% { transform: scale(1.04); opacity: 1; } }`;

/**
 * PageLoader — Full-page splash loader on refresh/session load.
 * Displays MTA Ghana Logo, animated glowing progress bar, and automatic connection issue recovery banner.
 */
export const PageLoader = ({ message = 'Initializing MTA Ghana Portal...' }) => {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If loading takes > 7 seconds, present connection retry option
    const timer = setTimeout(() => {
      setShowTimeoutWarning(true);
    }, 7000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(timer);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-page)', padding: '2rem', gap: '1.5rem'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <img
          src="/logo.png"
          alt="MTA Ghana Logo"
          style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(26,63,160,0.18))' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>

      {/* Theme-Adaptive Active Progress Bar */}
      <div style={{ width: '100%', maxWidth: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: '100%', height: '4px', borderRadius: '10px',
          backgroundColor: 'var(--border-color)', overflow: 'hidden', position: 'relative'
        }}>
          <div style={{
            width: '100%', height: '100%',
            background: 'linear-gradient(90deg, var(--color-primary), #3B82F6, var(--color-primary-hover), var(--color-primary))',
            backgroundSize: '300% 300%',
            animation: 'progressBarGlow 2s ease infinite'
          }} />
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {isOffline ? 'Offline - Waiting for internet...' : 'Loading...'}
        </span>
      </div>

      {/* Connection Issue Retry Card */}
      {(showTimeoutWarning || isOffline) && (
        <div style={{
          marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
          maxWidth: '340px', textAlign: 'center', animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626', fontWeight: 700, fontSize: '0.875rem' }}>
            {isOffline ? <WifiOff size={18} /> : <AlertTriangle size={18} />}
            <span>{isOffline ? 'No Internet Connection' : 'Connection Taking Longer Than Usual'}</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            {isOffline
              ? 'Please check your network settings and reconnect to the internet.'
              : 'The database server is slow to respond. Please check your connection or retry.'
            }
          </p>
          <button
            onClick={handleReload}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}
          >
            <RefreshCw size={14} /> Retry Connection
          </button>
        </div>
      )}

      <style>{`${spinKeyframes} ${progressBarKeyframes} ${logoPulseKeyframes}`}</style>
    </div>
  );
};

/** In-content row loader for tables */
export const TableLoader = ({ rows = 5, cols = 5 }) => (
  <div className="table-container">
    <table className="data-table">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <div style={{
                  ...shimmerStyle,
                  height: '14px',
                  width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '85%',
                }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <style>{shimmerKeyframes}</style>
  </div>
);

/** Small inline spinner */
export const Spinner = ({ size = 16, color = 'currentColor' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <span style={{
      width: size, height: size,
      border: `2px solid ${color}33`, borderTopColor: color,
      borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
      display: 'inline-block'
    }} />
    <style>{spinKeyframes}</style>
  </span>
);

/** Small spinner + text helper for loading buttons */
export const ButtonSpinner = ({ text = 'Saving...', color = 'currentColor' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
    <Spinner size={15} color={color} />
    <span>{text}</span>
  </span>
);

/** Skeleton card matching a KPI stat card */
export const CardSkeleton = () => (
  <div style={{
    padding: '1.25rem', borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow-sm)'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <div style={{ ...shimmerStyle, height: '10px', width: '60%', marginBottom: '10px' }} />
        <div style={{ ...shimmerStyle, height: '28px', width: '40%', marginBottom: '4px' }} />
      </div>
      <div style={{ ...shimmerStyle, width: '42px', height: '42px', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
    <div style={{ ...shimmerStyle, height: '10px', width: '70%', marginTop: '12px' }} />
    <style>{shimmerKeyframes}</style>
  </div>
);

/** Skeleton for chart area */
export const ChartSkeleton = ({ height = 240 }) => (
  <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{
      ...shimmerStyle,
      width: '100%', height: '100%',
      borderRadius: 'var(--radius-md)'
    }} />
    <style>{shimmerKeyframes}</style>
  </div>
);

/** Activity feed shimmer rows */
export const ActivityFeedSkeleton = ({ rows = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)'
      }}>
        <div style={{ ...shimmerStyle, width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ ...shimmerStyle, height: '10px', width: '35%', marginBottom: '6px' }} />
          <div style={{ ...shimmerStyle, height: '10px', width: '60%' }} />
        </div>
        <div style={{ ...shimmerStyle, height: '10px', width: '40px', flexShrink: 0 }} />
      </div>
    ))}
    <style>{shimmerKeyframes}</style>
  </div>
);
