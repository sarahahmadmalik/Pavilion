import React from 'react';

export const BrandLogo = ({ size = 36, showText = true, lightText = true, subtitle = 'Community & Guest House' }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', userSelect: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="10 10 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <path d="M12 12H42V22H22V42H12V12Z" fill={lightText ? '#4B7FE8' : '#1A3FA0'} />
        <path d="M52 52H22V42H42V22H52V52Z" fill={lightText ? '#93C5FD' : '#3B82F6'} />
        <rect x="27" y="27" width="10" height="10" fill={lightText ? '#FFFFFF' : '#60A5FA'} fillOpacity={lightText ? '0.92' : '1'} />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', minWidth: 0 }}>
          <span style={{
            fontSize: size >= 48 ? '1.35rem' : size <= 34 ? '0.95rem' : '1.05rem',
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: lightText ? '#FFFFFF' : 'var(--text-main)',
            lineHeight: 1.05
          }}>
            PAVILION
          </span>
          {subtitle && (
            <span style={{
              fontSize: size <= 34 ? '0.5rem' : '0.5625rem',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: lightText ? '#93C5FD' : 'var(--color-primary)',
              marginTop: '2px',
              whiteSpace: 'nowrap'
            }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
