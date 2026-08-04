import React from 'react';
import { Database, Plus } from 'lucide-react';

export const EmptyState = ({ title = 'No records found', description = 'There are no items to display matching your criteria.', onAdd, addText = 'Add New Record', canAdd = true }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      backgroundColor: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      margin: '1rem 0'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-primary-light)',
        color: 'var(--color-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Database size={32} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.375rem' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '1.5rem' }}>
        {description}
      </p>
      {canAdd && onAdd && (
        <button className="btn btn-primary" onClick={onAdd}>
          <Plus size={16} /> {addText}
        </button>
      )}
    </div>
  );
};
