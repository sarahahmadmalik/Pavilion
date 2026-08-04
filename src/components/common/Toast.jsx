import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, ExternalLink } from 'lucide-react';

export const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type !== 'error';

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 1100,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.875rem 1.25rem',
      borderRadius: 'var(--radius-md)',
      backgroundColor: isSuccess ? '#0F172A' : '#7F1D1D',
      color: '#FFFFFF',
      boxShadow: 'var(--shadow-lg)',
      border: `1px solid ${isSuccess ? '#1E293B' : '#991B1B'}`,
      animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '450px'
    }}>
      {isSuccess ? <CheckCircle size={20} color="#4ADE80" /> : <AlertCircle size={20} color="#FCA5A5" />}
      <div style={{ flex: 1, fontSize: '0.875rem' }}>
        <span>{toast.message}</span>
        {toast.linkText && (
          <button
            onClick={toast.onLinkClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginLeft: '0.5rem',
              color: '#60A5FA',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {toast.linkText} <ExternalLink size={14} />
          </button>
        )}
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
        <X size={16} />
      </button>
    </div>
  );
};
