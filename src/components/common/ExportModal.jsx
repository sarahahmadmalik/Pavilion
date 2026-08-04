import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { FileSpreadsheet, Check, Download, Link as LinkIcon } from 'lucide-react';

export const ExportModal = ({ isOpen, onClose, onConfirm, moduleTitle = 'Records' }) => {
  const [scope, setScope] = useState('all'); // 'all' | 'filtered'
  const [method, setMethod] = useState('excel'); // 'excel' | 'sheets'
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleConfirm = () => {
    if (method === 'sheets' && !webhookUrl) {
      alert("Please provide a valid Google Apps Script Webhook URL.");
      return;
    }
    onConfirm({ scope, method, webhookUrl });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Header Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
          borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)'
          }}>
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
              Export {moduleTitle}
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Download an Excel file or send data directly to Google Sheets.
            </p>
          </div>
        </div>

        {/* Scope Selection */}
        <div>
          <h5 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Data Scope</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
              border: `2px solid ${scope === 'all' ? 'var(--color-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              backgroundColor: scope === 'all' ? 'var(--color-primary-light)' : 'transparent'
            }}>
              <input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>All Records</span>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
              border: `2px solid ${scope === 'filtered' ? 'var(--color-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              backgroundColor: scope === 'filtered' ? 'var(--color-primary-light)' : 'transparent'
            }}>
              <input type="radio" name="scope" checked={scope === 'filtered'} onChange={() => setScope('filtered')} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Filtered View</span>
            </label>
          </div>
        </div>

        {/* Method Selection */}
        <div>
          <h5 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>Export Method</h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
              border: `2px solid ${method === 'excel' ? '#10B981' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              backgroundColor: method === 'excel' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
            }}>
              <input type="radio" name="method" checked={method === 'excel'} onChange={() => setMethod('excel')} />
              <Download size={16} color={method === 'excel' ? '#10B981' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Excel (.xlsx)</span>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
              border: `2px solid ${method === 'sheets' ? '#3B82F6' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-sm)', cursor: 'pointer',
              backgroundColor: method === 'sheets' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
            }}>
              <input type="radio" name="method" checked={method === 'sheets'} onChange={() => setMethod('sheets')} />
              <LinkIcon size={16} color={method === 'sheets' ? '#3B82F6' : 'var(--text-muted)'} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Google Sheets Link</span>
            </label>
          </div>
        </div>

        {/* Webhook Input if Sheets selected */}
        {method === 'sheets' && (
          <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem', display: 'block' }}>
              Google Apps Script Webhook URL
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              We will POST the data to this URL. You must configure your Google Sheet with an Apps Script <code>doPost(e)</code> listener.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} style={{ backgroundColor: method === 'excel' ? '#10B981' : '#3B82F6', borderColor: method === 'excel' ? '#10B981' : '#3B82F6' }}>
            <Check size={16} /> {method === 'excel' ? 'Download Excel' : 'Send to Sheets'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
