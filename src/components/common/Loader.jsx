import React from 'react';

/** Full-page loading screen */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-page)',
    gap: '1rem'
  }}>
    <div style={{
      width: '44px',
      height: '44px',
      border: '3px solid var(--border-color)',
      borderTopColor: 'var(--color-primary)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{message}</p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

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
                  height: '14px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-card-hover)',
                  width: c === 0 ? '70%' : c === cols - 1 ? '40%' : '85%',
                  animation: 'shimmer 1.4s ease-in-out infinite',
                  background: 'linear-gradient(90deg, var(--bg-card-hover) 25%, var(--border-color) 50%, var(--bg-card-hover) 75%)',
                  backgroundSize: '200% 100%'
                }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

/** Small inline spinner */
export const Spinner = ({ size = 18, color = 'var(--color-primary)' }) => (
  <>
    <div style={{
      width: size,
      height: size,
      border: `2px solid ${color}33`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </>
);
