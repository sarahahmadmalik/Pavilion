import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Spinner } from './Loader.jsx';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  headline = 'Warning: Irreversible Operation',
  confirmText = 'Yes, Delete Record',
  confirmLoadingText = 'Deleting...',
  icon: Icon = AlertTriangle,
  confirmIcon: ConfirmIcon = Trash2,
  danger = true
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm?.();
    } finally {
      setLoading(false);
      onClose?.();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: danger ? 'rgba(220, 38, 38, 0.08)' : 'var(--color-primary-light)',
          border: `1px solid ${danger ? 'rgba(220, 38, 38, 0.2)' : 'rgba(26,63,160,0.2)'}`
        }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: '50%',
            backgroundColor: danger ? '#FEE2E2' : 'var(--color-primary-light)',
            color: danger ? '#DC2626' : 'var(--color-primary)'
          }}>
            <Icon size={24} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
              {headline}
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                <Spinner size={14} color="#ffffff" /> {confirmLoadingText}
              </span>
            ) : (
              <>
                <ConfirmIcon size={16} /> {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
