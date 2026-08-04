import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * SearchableSelect — animated dropdown with instant search input inside.
 * Ideal for country lists, user lists, etc.
 */
export const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  disabled = false,
  label,
  style = {}
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const ref = useRef(null);
  const searchInputRef = useRef(null);

  const normalized = options.map(opt =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  const selected = normalized.find(o => o.value === value);

  const filteredOptions = normalized.filter(o =>
    o.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      return;
    }
    
    // Position tracking
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
    }

    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        const dropdownEl = document.getElementById('searchable-select-dropdown');
        if (dropdownEl && dropdownEl.contains(e.target)) return;
        setOpen(false);
      }
    };
    
    const onScroll = () => setOpen(false);

    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true);
    
    // Focus search input on open
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
    };
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

      {/* Trigger Button */}
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
      </button>      {/* Animated Dropdown Menu rendered in Portal */}
      {createPortal(
        <div
          id="searchable-select-dropdown"
          style={{
            position: 'fixed',
            top: dropdownStyle.top || 0,
            left: dropdownStyle.left || 0,
            width: dropdownStyle.width || 'auto',
            minWidth: '220px',
            zIndex: 99999, // Above SlideOver
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: open ? '320px' : '0px',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scaleY(1)' : 'translateY(-6px) scaleY(0.95)',
            transformOrigin: 'top',
            transition: 'max-height 0.22s cubic-bezier(0.16,1,0.3,1), opacity 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: open ? 'auto' : 'none'
          }}
        >
          {/* Search input header */}
          <div style={{
            padding: '0.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-hover)',
            position: 'relative',
            flexShrink: 0
          }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.375rem 0.5rem 0.375rem 1.875rem',
                fontSize: '0.8125rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
            />
          </div>

          {/* Options List */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            maxHeight: '260px'
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                No results found.
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: value === opt.value ? 'var(--bg-card-hover)' : 'transparent',
                    border: 'none',
                    color: value === opt.value ? 'var(--color-primary)' : 'var(--text-main)',
                    fontSize: '0.875rem',
                    fontWeight: value === opt.value ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (value !== opt.value) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={e => {
                    if (value !== opt.value) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {value === opt.value && <Check size={16} color="var(--color-primary)" style={{ flexShrink: 0 }} />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
