import React from 'react';
import { Modal } from './Modal.jsx';
import { AlertTriangle, Trash2 } from 'lucide-react';

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure you want to proceed?' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(220, 38, 38, 0.08)',
          border: '1px solid rgba(220, 38, 38, 0.2)'
        }}>
          <div style={{
            padding: '0.5rem',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9375rem' }}>
              Warning: Irreversible Operation
            </h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => { onConfirm(); onClose(); }}>
            <Trash2 size={16} /> Yes, Delete Record
          </button>
        </div>
      </div>
    </Modal>
  );
};
