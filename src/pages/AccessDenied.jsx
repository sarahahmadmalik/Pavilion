import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const AccessDenied = ({ moduleName = 'this restricted module', onBackToDashboard }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 25px rgba(220, 38, 38, 0.2)'
      }}>
        <ShieldAlert size={42} />
      </div>

      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        403 ACCESS DENIED
      </span>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
        Unauthorized Module Access
      </h2>
      <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '1.75rem', lineHeight: 1.6 }}>
        Your account role does not have permission to view or manage <strong>{moduleName}</strong>. Please contact the Super Admin to request module access permissions.
      </p>

      {onBackToDashboard && (
        <button className="btn btn-primary" onClick={onBackToDashboard}>
          <ArrowLeft size={16} /> Return to Dashboard
        </button>
      )}
    </div>
  );
};
