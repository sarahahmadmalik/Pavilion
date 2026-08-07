import React, { useState, useEffect } from 'react';
import { Search, Filter, X, SlidersHorizontal, Check } from 'lucide-react';
import { SlideOver } from './SlideOver.jsx';

/**
 * ResponsiveFilterBar
 * ===================
 * Desktop (>768px): Inline filter bar.
 * Mobile (<=768px): Compact Search + "Filters (N)" button that opens a clean right-side filter drawer.
 *
 * Props:
 *  - searchVal: string
 *  - onSearchChange: fn(string)
 *  - searchPlaceholder: string
 *  - activeFilterCount: number (count of active non-search filters)
 *  - onClearFilters: fn()
 *  - children: React nodes (CustomSelects, DatePickers, etc.)
 */
export const ResponsiveFilterBar = ({
  searchVal = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  activeFilterCount = 0,
  onClearFilters,
  children
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsDrawerOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const hasSearch = Boolean(searchVal && searchVal.trim());
  const hasAnyFilter = activeFilterCount > 0 || hasSearch;

  return (
    <>
      {/* Main Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
      }}>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '140px' : '220px' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="input-control"
            placeholder={searchPlaceholder}
            value={searchVal}
            onChange={(e) => onSearchChange?.(e.target.value)}
            style={{ paddingLeft: '2.125rem', paddingRight: searchVal ? '2rem' : '0.75rem', fontSize: '0.8125rem' }}
          />
          {searchVal && (
            <button
              onClick={() => onSearchChange?.('')}
              style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Desktop Mode (>768px): Inline Filters */}
        {!isMobile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              {children}
            </div>

            {hasAnyFilter && (
              <button
                onClick={onClearFilters}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--status-red-text)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginLeft: 'auto' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </>
        )}

        {/* Mobile Mode (<=768px): Filters Drawer Trigger Button */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                borderColor: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--border-color)',
                backgroundColor: activeFilterCount > 0 ? 'var(--color-primary-light)' : 'var(--bg-card)',
                color: activeFilterCount > 0 ? 'var(--color-primary)' : 'var(--text-main)',
                padding: '0.5rem 0.75rem'
              }}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span style={{
                  minWidth: '18px', height: '18px', borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)', color: '#fff',
                  fontSize: '0.6875rem', fontWeight: 700, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', padding: '0 4px'
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasAnyFilter && (
              <button
                onClick={onClearFilters}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--status-red-text)', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                title="Clear All Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Drawer Panel */}
      {isMobile && (
        <SlideOver
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Filter Records"
          width="320px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'No active filters'}
              </span>
              {hasAnyFilter && (
                <button
                  onClick={onClearFilters}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', color: '#EF4444', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <X size={14} /> Clear All
                </button>
              )}
            </div>

            {/* Filter controls stacked vertically */}
            <div className="mobile-filter-drawer-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
              {React.Children.map(children, (child) => {
                if (!child) return null;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
                    {child}
                  </div>
                );
              })}
            </div>

            {/* Bottom Apply Button */}
            <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsDrawerOpen(false)}
                style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Check size={16} /> Apply Filters
              </button>
            </div>
          </div>
        </SlideOver>
      )}
    </>
  );
};
