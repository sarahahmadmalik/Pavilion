import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { FileSpreadsheet, Check } from 'lucide-react';

export const ExportModal = ({ isOpen, onClose, onConfirm, moduleTitle = 'Records' }) => {
  const [option, setOption] = useState('all'); // 'all' | 'filtered'

  const handleConfirm = () => {
    onConfirm(option);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to Google Sheets">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
              Google Sheets Export Integration
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Export {moduleTitle} directly to a formatted cloud spreadsheet.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: `2px solid ${option === 'all' ? 'var(--color-primary)' : 'var(--border-color)'}`,
            backgroundColor: option === 'all' ? 'var(--color-primary-light)' : 'var(--bg-input)',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="exportOption"
                value="all"
                checked={option === 'all'}
                onChange={() => setOption('all')}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Export all records
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Exports the entire dataset for this module.
                </p>
              </div>
            </div>
          </label>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.875rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: `2px solid ${option === 'filtered' ? 'var(--color-primary)' : 'var(--border-color)'}`,
            backgroundColor: option === 'filtered' ? 'var(--color-primary-light)' : 'var(--bg-input)',
            cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="radio"
                name="exportOption"
                value="filtered"
                checked={option === 'filtered'}
                onChange={() => setOption('filtered')}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Export filtered view only
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Exports only the current search/filter results.
                </p>
              </div>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
            <Check size={16} /> Confirm Export
          </button>
        </div>
      </div>
    </Modal>
  );
};
