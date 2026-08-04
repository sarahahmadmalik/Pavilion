import React from 'react';
import { Modal } from './Modal.jsx';
import { FileSpreadsheet, Download, Share2, Printer, Lock } from 'lucide-react';

export const GoogleSheetsViewerModal = ({ isOpen, onClose, data = [], columns = [], title = 'MTA Ghana Spreadsheet' }) => {
  const downloadCSV = () => {
    if (!data.length) return;
    const headers = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Google Sheets Live View: ${title}`} maxWidth="900px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Google Sheets Header Simulator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: '#F8FAFC',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              padding: '0.5rem',
              backgroundColor: '#10B981',
              borderRadius: '6px',
              color: '#FFFFFF'
            }}>
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0F172A' }}>
                  {title} - Auto-Synced Sheet
                </span>
                <span style={{ fontSize: '0.6875rem', backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                  Saved to Drive
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Insert</span>
                <span>Format</span>
                <span>Data</span>
                <span>Tools</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={downloadCSV}>
              <Download size={14} /> Download CSV
            </button>
            <button className="btn btn-primary btn-sm" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}>
              <Share2 size={14} /> Share
            </button>
          </div>
        </div>

        {/* Spreadsheet Table Grid */}
        <div style={{
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #CBD5E1',
          borderRadius: '4px',
          backgroundColor: '#FFFFFF',
          fontFamily: 'Consolas, monospace',
          fontSize: '0.8125rem'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1E293B' }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '1px solid #CBD5E1' }}>
                <th style={{ width: '40px', padding: '6px', borderRight: '1px solid #CBD5E1', textAlign: 'center', color: '#64748B' }}>#</th>
                {columns.map((col, idx) => (
                  <th key={idx} style={{
                    padding: '8px 12px',
                    borderRight: '1px solid #CBD5E1',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#0F172A',
                    backgroundColor: '#E2E8F0'
                  }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}>
                  <td style={{ padding: '6px', borderRight: '1px solid #CBD5E1', textAlign: 'center', color: '#94A3B8', fontWeight: 600 }}>
                    {rIdx + 1}
                  </td>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ padding: '8px 12px', borderRight: '1px solid #CBD5E1' }}>
                      {String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Total exported rows: {data.length}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} /> Encrypted MTA Ghana Cloud Storage
          </span>
        </div>
      </div>
    </Modal>
  );
};
