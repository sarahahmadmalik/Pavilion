import React from 'react';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFound = ({ onGoHome }) => {
  return (
    <div style={{
      minHeight: '65vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.875rem'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Compass size={28} />
        </div>

        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--color-primary)'
        }}>
          404 — Page Not Found
        </span>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
          We couldn’t find that page
        </h2>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          The section you requested doesn’t exist or may have been moved. Use the button below to return to your dashboard.
        </p>

        <button
          type="button"
          onClick={onGoHome || (() => { window.location.href = '/'; })}
          className="btn btn-primary"
          style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
};
