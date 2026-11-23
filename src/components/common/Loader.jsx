import React, { useState, useEffect } from 'react';
import { RefreshCw, WifiOff, AlertTriangle } from 'lucide-react';
import { BrandLogo } from './BrandLogo.jsx';

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
 * PageLoader — Sleek moving-squares platform loader with PAVILION wordmark.
 */
export const PageLoader = () => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-page)', padding: '2rem', gap: '1.15rem'
    }}>
      <style>{`
        @keyframes sqMove1 {
          0%, 100% { transform: translate(0, 0); opacity: 1; }
          25% { transform: translate(20px, 0); opacity: 0.85; }
          50% { transform: translate(20px, 20px); opacity: 1; }
          75% { transform: translate(0, 20px); opacity: 0.85; }
        }
        @keyframes sqMove2 {
          0%, 100% { transform: translate(20px, 0); opacity: 0.85; }
          25% { transform: translate(20px, 20px); opacity: 1; }
          50% { transform: translate(0, 20px); opacity: 0.85; }
          75% { transform: translate(0, 0); opacity: 1; }
        }
        @keyframes sqMove3 {
          0%, 100% { transform: translate(20px, 20px); opacity: 1; }
          25% { transform: translate(0, 20px); opacity: 0.85; }
          50% { transform: translate(0, 0); opacity: 1; }
          75% { transform: translate(20px, 0); opacity: 0.85; }
        }
        @keyframes sqMove4 {
          0%, 100% { transform: translate(0, 20px); opacity: 0.75; }
          25% { transform: translate(0, 0); opacity: 1; }
          50% { transform: translate(20px, 0); opacity: 0.75; }
          75% { transform: translate(20px, 20px); opacity: 1; }
        }
      `}</style>

      <div style={{ position: 'relative', width: '36px', height: '36px' }}>
        <span style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#1A3FA0', animation: 'sqMove1 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        <span style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#3B82F6', animation: 'sqMove2 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        <span style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#60A5FA', animation: 'sqMove3 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
        <span style={{ position: 'absolute', width: '14px', height: '14px', borderRadius: '4px', backgroundColor: '#93C5FD', animation: 'sqMove4 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
      </div>

      <span style={{
        fontSize: '1.125rem',
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: 'var(--text-main)',
        lineHeight: 1
      }}>
        PAVILION
      </span>
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
