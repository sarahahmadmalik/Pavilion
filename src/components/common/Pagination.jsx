import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination bar.
 *
 * Props:
 *  currentPage  — 1-indexed current page
 *  totalPages   — total number of pages
 *  onPageChange — (page: number) => void
 *  totalItems   — total item count (for display)
 *  itemsPerPage — items per page (for display)
 */
export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems = 0, itemsPerPage = 10 }) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * itemsPerPage + 1;
  const to   = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page number array with ellipsis
  const pages = [];
  const delta = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 6px',
    borderRadius: '7px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-muted)',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.14s ease',
    fontFamily: 'inherit'
  };

  const btnActive = {
    ...btnBase,
    backgroundColor: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
    color: '#FFFFFF',
    fontWeight: 700,
    cursor: 'default'
  };

  const btnDisabled = {
    ...btnBase,
    opacity: 0.35,
    cursor: 'not-allowed'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: '1rem',
      marginTop: '0.75rem',
      borderTop: '1px solid var(--border-color)',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      {/* Count info */}
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        Showing <strong style={{ color: 'var(--text-main)' }}>{from}–{to}</strong> of{' '}
        <strong style={{ color: 'var(--text-main)' }}>{totalItems}</strong> results
      </span>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {/* Prev */}
        <button
          style={currentPage === 1 ? btnDisabled : btnBase}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          onMouseEnter={e => { if (currentPage !== 1) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ChevronLeft size={15} />
        </button>

        {/* Pages */}
        {pages.map((page, idx) =>
          page === '...'
            ? <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>…</span>
            : (
              <button
                key={page}
                style={page === currentPage ? btnActive : btnBase}
                onClick={() => page !== currentPage && onPageChange(page)}
                onMouseEnter={e => { if (page !== currentPage) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}}
                onMouseLeave={e => { if (page !== currentPage) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}}
              >
                {page}
              </button>
            )
        )}

        {/* Next */}
        <button
          style={currentPage === totalPages ? btnDisabled : btnBase}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={e => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};
