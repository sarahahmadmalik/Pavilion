import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * SlideOver — right-side animated panel rendered in a React Portal
 * so parent transforms/overflow cannot clip it.
 */
export const SlideOver = ({ isOpen, onClose, title, children, width = '500px' }) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (isOpen) {
      setMounted(true);
      timerRef.current = setTimeout(() => setVisible(true), 16);
    } else {
      setVisible(false);
      timerRef.current = setTimeout(() => setMounted(false), 320);
    }
    return () => clearTimeout(timerRef.current);
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return createPortal(
    /* Full-viewport overlay — rendered directly into document.body */
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: visible ? 'rgba(5, 10, 28, 0.62)' : 'rgba(5, 10, 28, 0)',
        backdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: visible ? 'blur(4px)' : 'blur(0px)',
        transition: 'background-color 0.28s ease, backdrop-filter 0.28s ease'
      }}
    >
      {/* Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: width,
          height: '100%',
          backgroundColor: 'var(--bg-card)',
          boxShadow: '-12px 0 60px rgba(0,0,0,0.28)',
          borderLeft: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.125rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-card-hover)',
          flexShrink: 0
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            letterSpacing: '-0.01em'
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
              e.currentTarget.style.color = '#EF4444';
              e.currentTarget.style.borderColor = '#EF4444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
            aria-label="Close panel"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.5rem'
        }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
