import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalize = String(status).toLowerCase();

  let badgeClass = 'badge-blue';
  if (['resolved', 'good', 'active', 'in use', 'completed'].includes(normalize)) {
    badgeClass = 'badge-green';
  } else if (['in progress', 'fair', 'pending'].includes(normalize)) {
    badgeClass = 'badge-amber';
  } else if (['open', 'damaged', 'inactive', 'retired', 'deleted'].includes(normalize)) {
    badgeClass = 'badge-red';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }}></span>
      {status}
    </span>
  );
};
