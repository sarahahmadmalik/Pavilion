import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { CustomSelect } from './CustomSelect.jsx';

/**
 * BulkActionBar — slim toolbar shown above a table once one or more rows
 * are checkbox-selected. Supports an optional bulk status-update control
 * (statusOptions + onApplyStatus), an optional bulk delete button
 * (onDelete), and/or one custom action button (e.g. "Close Selected"
 * on Tickets, which has no delete/status concept of its own).
 */
export const BulkActionBar = ({
  count,
  onClear,
  onDelete,
  deleteLabel = 'Delete Selected',
  statusOptions,
  onApplyStatus,
  statusPlaceholder = 'Set status...',
  customAction
}) => {
  const [statusValue, setStatusValue] = useState('');

  if (!count) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'var(--color-primary-light)',
      border: '1px solid rgba(26,63,160,0.25)',
      borderRadius: 'var(--radius-md)',
      animation: 'fadeIn 0.15s ease'
    }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
        {count} selected
      </span>

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginLeft: 'auto' }}>
        {statusOptions && (
          <>
            <CustomSelect
              value={statusValue}
              onChange={setStatusValue}
              options={statusOptions}
              placeholder={statusPlaceholder}
              style={{ width: '170px' }}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={!statusValue}
              onClick={() => { onApplyStatus(statusValue); setStatusValue(''); }}
            >
              Apply
            </button>
          </>
        )}

        {customAction && (
          <button type="button" className="btn btn-primary btn-sm" onClick={customAction.onClick}>
            {customAction.icon && <customAction.icon size={14} />} {customAction.label}
          </button>
        )}

        {onDelete && (
          <button type="button" className="btn btn-danger btn-sm" onClick={onDelete}>
            <Trash2 size={14} /> {deleteLabel}
          </button>
        )}

        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} style={{ color: 'var(--text-muted)' }}>
          <X size={14} /> Clear
        </button>
      </div>
    </div>
  );
};
