import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { FileSpreadsheet, Download } from 'lucide-react';

export const ExportModal = ({ isOpen, onClose, onConfirm, moduleTitle = 'Records', hasActiveFilters = false }) => {
  const [scope, setScope] = useState('all'); // 'all' | 'filtered'

  useEffect(() => {
    if (hasActiveFilters) {
      setScope('filtered');
    } else {
      setScope('all');
    }
  }, [hasActiveFilters, isOpen]);

  const handleConfirm = () => {
    onConfirm({ scope: hasActiveFilters ? scope : 'all', method: 'excel' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to Excel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Header Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
          border: '1px solid rgba(16,185,129,0.25)'
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
            backgroundColor: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', flexShrink: 0
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)', marginBottom: '2px' }}>
              Export {moduleTitle}
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Download data as a formatted <strong>.xlsx</strong> Excel spreadsheet.
            </p>
          </div>
        </div>

        {/* Scope Selection */}
        <div>
          <h5 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
            Data Scope
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
              border: `2px solid ${scope === 'all' ? '#10B981' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              backgroundColor: scope === 'all' ? 'rgba(16,185,129,0.08)' : 'var(--bg-input)',
              transition: 'all 0.15s ease'
            }}>
              <input
                type="radio" name="scope"
                checked={scope === 'all'}
                onChange={() => setScope('all')}
                style={{ accentColor: '#10B981' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', display: 'block' }}>
                  All Records
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Export the complete dataset for this module.
                </span>
              </div>
            </label>

            {hasActiveFilters && (
              <label style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem',
                border: `2px solid ${scope === 'filtered' ? '#10B981' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                backgroundColor: scope === 'filtered' ? 'rgba(16,185,129,0.08)' : 'var(--bg-input)',
                transition: 'all 0.15s ease'
              }}>
                <input
                  type="radio" name="scope"
                  checked={scope === 'filtered'}
                  onChange={() => setScope('filtered')}
                  style={{ accentColor: '#10B981' }}
                />
                <div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)', display: 'block' }}>
                    Filtered View Only
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Export only the current search &amp; filter results.
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.25rem', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            style={{ backgroundColor: '#10B981', borderColor: '#10B981', gap: '0.5rem' }}
          >
            <Download size={15} /> Download Excel
          </button>
        </div>
      </div>
    </Modal>
  );
};
