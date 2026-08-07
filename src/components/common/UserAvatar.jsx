import React, { useState } from 'react';

/** Deterministic gradient background based on name */
function getAvatarGradient(name = '') {
  const gradients = [
    'linear-gradient(135deg, #1A3FA0, #0D2565)',
    'linear-gradient(135deg, #059669, #047857)',
    'linear-gradient(135deg, #7C3AED, #5B21B6)',
    'linear-gradient(135deg, #D97706, #B45309)',
    'linear-gradient(135deg, #2563EB, #1E40AF)',
    'linear-gradient(135deg, #0891B2, #0E7490)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * UserAvatar Component
 * ====================
 * Renders user avatar photo if uploaded.
 * If no photo exists, renders a rich SVG avatar graphic illustration badge
 * with curated gradients and persona styling — no plain text letters or third-party broken URLs.
 */
export const UserAvatar = ({ name = 'User', src = null, size = 32, style = {}, border = '2px solid var(--color-primary)' }) => {
  const [imgError, setImgError] = useState(false);
  const isValidSrc = Boolean(
    src &&
    typeof src === 'string' &&
    src.trim().length > 0 &&
    !src.includes('unsplash') &&
    !src.includes('ui-avatars')
  );

  if (isValidSrc && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border,
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  // Graphical Vector Avatar Icon
  const iconSize = Math.max(14, Math.floor(size * 0.54));

  return (
    <div
      title={name}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: getAvatarGradient(name),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border,
        flexShrink: 0,
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
};
