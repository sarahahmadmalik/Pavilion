import React, { useState, useRef, useCallback } from 'react';
import { Modal } from './Modal.jsx';
import {
  Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, X, ChevronRight
} from 'lucide-react';
import { IMPORT_CONFIGS, downloadSampleTemplate, parseExcelFile, mapRowsToDb } from '../../lib/importUtils.js';

// ─── Step indicator ───────────────────────────────────────────────────────────
const Step = ({ num, label, active, done }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', opacity: done || active ? 1 : 0.4 }}>
    <div style={{
      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700,
      backgroundColor: done ? '#10B981' : active ? 'var(--color-primary)' : 'var(--bg-card-hover)',
      color: done || active ? '#fff' : 'var(--text-muted)',
      border: `2px solid ${done ? '#10B981' : active ? 'var(--color-primary)' : 'var(--border-color)'}`
    }}>
      {done ? <CheckCircle size={13} /> : num}
    </div>
    <span style={{ fontSize: '0.75rem', fontWeight: active || done ? 600 : 400, color: active ? 'var(--color-primary)' : 'var(--text-main)' }}>
      {label}
    </span>
  </div>
);

// ─── Main Import Modal ────────────────────────────────────────────────────────
export const ImportModal = ({ isOpen, onClose, moduleKey, onStartImport }) => {
  const config = IMPORT_CONFIGS[moduleKey];

  const [step, setStep] = useState(1); // 1=template, 2=upload, 3=preview
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [skippedRows, setSkippedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setStep(1);
    setFile(null);
    setParseError(null);
    setParsedRows([]);
    setSkippedRows([]);
    setIsParsing(false);
    onClose();
  };

  const processFile = useCallback(async (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext)) {
      setParseError('Please upload an Excel file (.xlsx or .xls). CSV files are not supported.');
      return;
    }
    setFile(f);
    setParseError(null);
    setIsParsing(true);

    try {
      const { rows } = await parseExcelFile(f);
      if (rows.length === 0) {
        setParseError('The file appears to be empty. Please fill in some data rows and try again.');
        setIsParsing(false);
        return;
      }
      const { validRows, skippedRows: skipped } = mapRowsToDb(moduleKey, rows);
      setParsedRows(validRows);
      setSkippedRows(skipped);
      setStep(3);
    } catch (err) {
      setParseError(err.message || 'Failed to read the file. Please check the format and try again.');
    }
    setIsParsing(false);
  }, [moduleKey]);

  const handleFileInput = (e) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  const handleStartImport = () => {
    onStartImport({ moduleKey, rows: parsedRows, skippedRows, config });
    handleClose();
  };

  if (!config) return null;

  // Columns to show in preview (first 4 only)
  const previewCols = config.columns.slice(0, 5);
  const previewRows = parsedRows.slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Import ${config.label}`} maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <Step num={1} label="Download Template" active={step === 1} done={step > 1} />
          <ChevronRight size={14} color="var(--text-muted)" />
          <Step num={2} label="Upload File" active={step === 2} done={step > 2} />
          <ChevronRight size={14} color="var(--text-muted)" />
          <Step num={3} label="Preview & Import" active={step === 3} done={false} />
        </div>

        {/* ── STEP 1: Template ──────────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              padding: '1rem', borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, rgba(26,63,160,0.06), rgba(26,63,160,0.02))',
              border: '1px solid rgba(26,63,160,0.15)'
            }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                To ensure a successful import, please download the sample template below. 
                Fill in your data keeping the column headers exactly as they appear, then upload the file in the next step.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => downloadSampleTemplate(moduleKey)}
                style={{ gap: '0.5rem' }}
              >
                <Download size={15} /> Download Sample Template (.xlsx)
              </button>
            </div>

            {/* Column reference */}
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Expected Columns
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {config.columns.map((col, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.375rem 0.625rem', borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)',
                    fontSize: '0.8125rem'
                  }}>
                    <FileSpreadsheet size={13} color="var(--color-primary)" />
                    <span style={{ fontWeight: 500, color: 'var(--text-main)', flex: 1 }}>{col.header}</span>
                    {col.required
                      ? <span style={{ fontSize: '0.6875rem', color: '#DC2626', fontWeight: 700 }}>Required</span>
                      : <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Optional</span>
                    }
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setStep(2)} style={{ gap: '0.5rem' }}>
                Next: Upload File <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Upload ────────────────────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Drag-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: dragOver ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
                transition: 'all 0.15s ease'
              }}
            >
              <Upload size={32} color={dragOver ? 'var(--color-primary)' : 'var(--text-muted)'} style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                {isParsing ? 'Reading file…' : 'Drop your Excel file here'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                or <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>click to browse</span> · .xlsx only
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>

            {parseError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)'
              }}>
                <XCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                <p style={{ fontSize: '0.8125rem', color: '#DC2626' }}>{parseError}</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Preview ───────────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Summary */}
            <div style={{
              display: 'flex', gap: '0.75rem',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              backgroundColor: parsedRows.length > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${parsedRows.length > 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
            }}>
              <CheckCircle size={18} color={parsedRows.length > 0 ? '#10B981' : '#EF4444'} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  {parsedRows.length} record{parsedRows.length !== 1 ? 's' : ''} ready to import
                  {skippedRows.length > 0 && ` · ${skippedRows.length} row${skippedRows.length !== 1 ? 's' : ''} will be skipped`}
                </p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  From: <strong>{file?.name}</strong>
                </p>
              </div>
            </div>

            {/* Skipped rows warning */}
            {skippedRows.length > 0 && (
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={15} color="#D97706" />
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#D97706' }}>
                    {skippedRows.length} row{skippedRows.length !== 1 ? 's' : ''} will be skipped due to missing required fields:
                  </span>
                </div>
                {skippedRows.slice(0, 3).map((s, i) => (
                  <p key={i} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.25rem' }}>
                    Row {s.rowNumber}: {s.issues.join(', ')}
                  </p>
                ))}
                {skippedRows.length > 3 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1.25rem' }}>
                    …and {skippedRows.length - 3} more
                  </p>
                )}
              </div>
            )}

            {/* Preview table */}
            {parsedRows.length > 0 && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Data Preview (first {Math.min(5, parsedRows.length)} rows)
                </p>
                <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                        {previewCols.map(col => (
                          <th key={col.key} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-color)' }}>
                            {col.header.split(' (')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {previewCols.map(col => (
                            <td key={col.key} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '160px', textOverflow: 'ellipsis' }}>
                              {row[col.key] ?? <em style={{ color: 'var(--text-muted)' }}>—</em>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedRows.length > 5 && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
                    + {parsedRows.length - 5} more rows
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', borderTop: '1px solid var(--border-color)' }}>
              <button className="btn btn-secondary" onClick={() => { setStep(2); setFile(null); setParsedRows([]); setSkippedRows([]); }}>
                Choose Different File
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartImport}
                disabled={parsedRows.length === 0}
                style={{ opacity: parsedRows.length === 0 ? 0.5 : 1, gap: '0.5rem' }}
              >
                <Upload size={15} /> Start Import ({parsedRows.length} records)
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
