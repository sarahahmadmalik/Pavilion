import React, { useRef, useEffect } from 'react';

/**
 * AnimatedDropdown - A smooth, CSS-animated custom dropdown panel.
 * Replaces all native <select> / plain div dropdowns with animated overlays.
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: fn
 *  - children: React nodes to render inside
 *  - style: additional override styles for the panel
 *  - align: 'left' | 'right' (default 'right')
 *  - width: string (default '220px')
 */
export const AnimatedDropdown = ({ isOpen, onClose, children, style = {}, align = 'right', width = '220px' }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        ref.current.parentElement &&
        !ref.current.parentElement.contains(e.target)
      ) {
        onClose?.();
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 10);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        [align === 'right' ? 'right' : 'left']: 0,
        top: 'calc(100% + 8px)',
        width,
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-dropdown)',
        border: '1px solid var(--border-color)',
        padding: '0.5rem',
        zIndex: 999,
        pointerEvents: isOpen ? 'auto' : 'none',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
        transformOrigin: align === 'right' ? 'top right' : 'top left',
        transition: 'opacity 0.18s cubic-bezier(0.16,1,0.3,1), transform 0.18s cubic-bezier(0.16,1,0.3,1)',
        ...style
      }}
    >
      {children}
    </div>
  );
};

/**
 * DropdownItem - A styled menu item for AnimatedDropdown
 */
export const DropdownItem = ({ onClick, icon, label, danger = false, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      gap: '0.625rem',
      padding: '0.5rem 0.75rem',
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: 'none',
      color: danger ? '#DC2626' : 'var(--text-main)',
      fontSize: '0.8125rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      textAlign: 'left',
      opacity: disabled ? 0.5 : 1,
      transition: 'background 0.12s ease, color 0.12s ease',
      fontFamily: 'inherit',
      fontWeight: 500
    }}
    onMouseEnter={e => {
      if (!disabled) e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.backgroundColor = 'transparent';
    }}
  >
    {icon && React.cloneElement(icon, { size: 16 })}
    <span>{label}</span>
  </button>
);

/**
 * DropdownDivider
 */
export const DropdownDivider = () => (
  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '0.375rem 0' }} />
);
