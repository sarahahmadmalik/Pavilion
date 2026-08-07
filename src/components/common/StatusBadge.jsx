import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalize = String(status).toLowerCase();

  let badgeClass = 'badge-blue';
  if (['super_admin', 'super admin', 'superadmin'].includes(normalize)) {
    badgeClass = 'badge-purple';
  } else if (['admin'].includes(normalize)) {
    badgeClass = 'badge-blue';
  } else if (['staff'].includes(normalize)) {
    badgeClass = 'badge-teal';
  } else if (['resolved', 'good', 'active', 'in use', 'completed'].includes(normalize)) {
    badgeClass = 'badge-green';
  } else if (['in progress', 'fair', 'pending'].includes(normalize)) {
    badgeClass = 'badge-amber';
  } else if (['open', 'damaged', 'inactive', 'retired', 'deleted'].includes(normalize)) {
    badgeClass = 'badge-red';
  }

  const label = status === 'super_admin' ? 'Super Admin' : status === 'admin' ? 'Admin' : status === 'staff' ? 'Staff' : status;

  return (
    <span className={`badge ${badgeClass}`}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
      }}></span>
      {label}
    </span>
  );
};
