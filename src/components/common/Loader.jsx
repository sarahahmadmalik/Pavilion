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
 * PageLoader — Minimal architectural sketch-in splash loader.
 * Displays ONLY the PAVILION geometric mark sketching itself in + PAVILION wordmark.
 */
export const PageLoader = () => {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-page)', padding: '2rem'
    }}>
      <style>{`
        @keyframes pavilionSketchOuter {
          0% { stroke-dashoffset: 160; fill-opacity: 0; }
          45% { stroke-dashoffset: 0; fill-opacity: 0; }
          70% { stroke-dashoffset: 0; fill-opacity: 1; }
          90% { stroke-dashoffset: 0; fill-opacity: 1; opacity: 1; }
          100% { stroke-dashoffset: 160; fill-opacity: 0; opacity: 0.4; }
        }
        @keyframes pavilionSketchCore {
          0%, 20% { stroke-dashoffset: 48; fill-opacity: 0; transform: scale(0.85); }
          55% { stroke-dashoffset: 0; fill-opacity: 0; transform: scale(1); }
          75%, 90% { stroke-dashoffset: 0; fill-opacity: 1; transform: scale(1); }
          100% { stroke-dashoffset: 48; fill-opacity: 0; transform: scale(0.85); }
        }
        @keyframes pavilionWordReveal {
          0%, 15% { opacity: 0.25; transform: translateY(3px); }
          55%, 88% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0.25; transform: translateY(3px); }
        }
      `}</style>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', userSelect: 'none' }}>
        <svg
          width={44}
          height={44}
          viewBox="10 10 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M12 12H42V22H22V42H12V12Z"
            fill="#1A3FA0"
            stroke="#1A3FA0"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeDasharray="160"
            style={{ animation: 'pavilionSketchOuter 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
          />
          <path
            d="M52 52H22V42H42V22H52V52Z"
            fill="#3B82F6"
            stroke="#3B82F6"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeDasharray="160"
            style={{ animation: 'pavilionSketchOuter 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite', animationDelay: '0.12s' }}
          />
          <rect
            x="27"
            y="27"
            width="10"
            height="10"
            fill="#60A5FA"
            stroke="#60A5FA"
            strokeWidth="1.4"
            strokeDasharray="48"
            style={{ animation: 'pavilionSketchCore 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite', transformOrigin: '32px 32px' }}
          />
        </svg>

        <span style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: 'var(--text-main)',
          lineHeight: 1,
          animation: 'pavilionWordReveal 2.4s ease-in-out infinite'
        }}>
          PAVILION
        </span>
      </div>
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
