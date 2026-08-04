import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * CustomSelect — animated dropdown, replaces <select>
 * Props:
 *   value        — currently selected value
 *   onChange     — (value) => void
 *   options      — [{ label, value }] or ['str', 'str']
 *   placeholder  — shown when nothing selected
 *   disabled     — boolean
 *   label        — optional label above
 */
export const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  label,
  style = {}
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Normalize options
  const normalized = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selected = normalized.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          marginBottom: '0.375rem'
        }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5625rem 0.875rem',
          backgroundColor: disabled ? 'var(--bg-card-hover)' : 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--border-focus)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          color: selected ? 'var(--text-main)' : 'var(--text-muted)',
          fontSize: '0.9rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: open ? '0 0 0 3px rgba(26,63,160,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          gap: '0.5rem'
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          color="var(--text-muted)"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16,1,0.3,1)'
          }}
        />
      </button>

      {/* Dropdown panel */}
      <div
        style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 3000,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-dropdown)',
          overflow: 'hidden',
          maxHeight: open ? '260px' : '0px',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-6px) scaleY(0.95)',
          transformOrigin: 'top',
          transition: 'max-height 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: open ? 'auto' : 'none',
          overflowY: 'auto'
        }}
      >
        {normalized.map(opt => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                color: isSelected ? 'var(--color-primary)' : 'var(--text-main)',
                fontWeight: isSelected ? 600 : 400,
                fontSize: '0.875rem',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'background-color 0.12s ease'
              }}
              onMouseEnter={e => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
              }}
              onMouseLeave={e => {
                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span>{opt.label}</span>
              {isSelected && <Check size={14} />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
