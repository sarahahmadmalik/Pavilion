import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function parseDateStr(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

function toDateStr(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(str) {
  const d = parseDateStr(str);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()].slice(0,3)} ${d.getFullYear()}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * DatePicker — animated calendar picker, replaces <input type="date">
 * Props: value (YYYY-MM-DD), onChange (val) => void, disabled, label, placeholder
 */
export const DatePicker = ({
  value,
  onChange,
  disabled = false,
  label,
  placeholder = 'Select date',
  alignRight = false,
  style = {}
}) => {
  const [open, setOpen] = useState(false);
  const [shouldAlignRight, setShouldAlignRight] = useState(alignRight);
  const ref = useRef(null);

  const selected = parseDateStr(value);
  const today = new Date();

  const [viewYear, setViewYear]   = useState((selected || today).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected || today).getMonth());

  const [dropdownStyle, setDropdownStyle] = useState({});

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
  }, [value]);

  // Position and check alignment on open
  useEffect(() => {
    if (open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const isRight = alignRight || rect.left + 280 > window.innerWidth || (rect.left > 150 && rect.left + 200 > window.innerWidth - 100);
      setShouldAlignRight(isRight);
      
      setDropdownStyle({
        top: rect.bottom + 4,
        left: isRight ? 'auto' : rect.left,
        right: isRight ? window.innerWidth - rect.right : 'auto'
      });
    }
  }, [open, alignRight]);

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        // Also check if click is inside the portal dropdown
        const dropdownEl = document.getElementById('datepicker-dropdown');
        if (dropdownEl && dropdownEl.contains(e.target)) return;
        setOpen(false);
      }
    };
    const onScroll = () => setOpen(false);
    
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true); // true for capturing scroll on any container
    
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v-1); } else setViewMonth(m => m-1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v+1); } else setViewMonth(m => m+1); };

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfWk = getFirstDayOfWeek(viewYear, viewMonth);

  const cells = [];
  for (let i = 0; i < firstDayOfWk; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      {label && (
        <label style={{
          display: 'block', fontSize: '0.8125rem', fontWeight: 600,
          color: 'var(--text-main)', marginBottom: '0.375rem'
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
          gap: '0.625rem',
          padding: '0.5625rem 0.875rem',
          backgroundColor: disabled ? 'var(--bg-card-hover)' : 'var(--bg-input)',
          border: `1px solid ${open ? 'var(--border-focus)' : 'var(--border-color)'}`,
          borderRadius: 'var(--radius-md)',
          color: value ? 'var(--text-main)' : 'var(--text-muted)',
          fontSize: '0.9rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxShadow: open ? '0 0 0 3px rgba(26,63,160,0.12)' : 'none',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left'
        }}
      >
        <Calendar size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {/* Calendar panel rendered in Portal */}
      {createPortal(
        <div
          id="datepicker-dropdown"
          style={{
            position: 'fixed',
            top: dropdownStyle.top || 0,
            left: dropdownStyle.left || 0,
            right: dropdownStyle.right || 'auto',
            zIndex: 99999, // Above SlideOver
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: '0.75rem',
            width: '272px',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
            transformOrigin: shouldAlignRight ? 'top right' : 'top left',
            transition: 'opacity 0.18s ease, transform 0.18s cubic-bezier(0.16,1,0.3,1)',
            pointerEvents: open ? 'auto' : 'none'
          }}
        >

          {/* Month/Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <button
              type="button"
              onClick={prevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={`e-${idx}`} />;
              const thisDate = new Date(viewYear, viewMonth, day);
              const isSelected = selected && toDateStr(selected) === toDateStr(thisDate);
              const isToday    = toDateStr(today) === toDateStr(thisDate);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => { onChange(toDateStr(thisDate)); setOpen(false); }}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    border: isToday && !isSelected ? '1px solid var(--color-primary)' : 'none',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    color: isSelected ? '#FFFFFF' : isToday ? 'var(--color-primary)' : 'var(--text-main)',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.12s ease, color 0.12s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = isToday ? 'var(--color-primary)' : 'var(--text-main)';
                    }
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Clear / Today */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.625rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--status-red-text)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(toDateStr(today)); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Today
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
