import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Users, Wrench, Package, CreditCard, Barcode, ArrowRight, ClipboardList } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

// ─── Module config ────────────────────────────────────────────────────────────
const MODULES = [
  {
    key: 'guest_list',
    label: 'Guest List',
    table: 'guest_list',
    icon: <Users size={14} />,
    color: '#1A3FA0',
    bg: 'rgba(26,63,160,0.1)',
    fields: ['name', 'country', 'room_allocated', 'purpose_of_stay'],
    displayField: 'name',
    subtitleFields: ['country', 'room_allocated'],
  },
  {
    key: 'gh_maintenance',
    label: 'GH Maintenance',
    table: 'guest_house_maintenance',
    icon: <Wrench size={14} />,
    color: '#D97706',
    bg: 'rgba(245,158,11,0.1)',
    fields: ['issue', 'location', 'name_of_worker', 'status'],
    displayField: 'issue',
    subtitleFields: ['location', 'status'],
  },
  {
    key: 'gh_inventory',
    label: 'GH Inventory',
    table: 'guest_house_inventory',
    icon: <Package size={14} />,
    color: '#7C3AED',
    bg: 'rgba(139,92,246,0.1)',
    fields: ['item_description', 'location'],
    displayField: 'item_description',
    subtitleFields: ['location'],
  },
  {
    key: 'office_bills',
    label: 'Bill Payments',
    table: 'office_bill_payments',
    icon: <CreditCard size={14} />,
    color: '#059669',
    bg: 'rgba(16,185,129,0.1)',
    fields: ['company', 'payee', 'cheque_no'],
    displayField: 'company',
    subtitleFields: ['payee'],
  },
  {
    key: 'office_assets',
    label: 'Office Assets',
    table: 'office_assets',
    icon: <Barcode size={14} />,
    color: '#DB2777',
    bg: 'rgba(236,72,153,0.1)',
    fields: ['description', 'location', 'assigned_to'],
    displayField: 'description',
    subtitleFields: ['location', 'assigned_to'],
  },
  {
    key: 'office_maintenance',
    label: 'Office Maintenance',
    table: 'office_maintenance',
    icon: <Wrench size={14} />,
    color: '#0891B2',
    bg: 'rgba(6,182,212,0.1)',
    fields: ['issue', 'location', 'status'],
    displayField: 'issue',
    subtitleFields: ['location', 'status'],
  },
];

// ─── Highlight matching text ──────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query || !text) return <span>{text}</span>;
  const idx = String(text).toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  const before = String(text).slice(0, idx);
  const match = String(text).slice(idx, idx + query.length);
  const after = String(text).slice(idx + query.length);
  return (
    <span>
      {before}
      <mark style={{ backgroundColor: 'rgba(234,179,8,0.35)', color: 'inherit', borderRadius: '2px', padding: '0 1px' }}>
        {match}
      </mark>
      {after}
    </span>
  );
}

// ─── Main Search Bar ──────────────────────────────────────────────────────────
export const GlobalSearchBar = ({ searchQuery, setSearchQuery, setActivePage }) => {
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      setSearchQuery('');
      return;
    }
    setIsSearching(true);
    const term = q.trim();
    const allResults = [];

    // Query each module in parallel
    await Promise.all(
      MODULES.map(async (mod) => {
        try {
          // Build OR filter across text fields
          const orFilter = mod.fields.map(f => `${f}.ilike.%${term}%`).join(',');
          const { data } = await supabase
            .from(mod.table)
            .select('*')
            .or(orFilter)
            .limit(4);

          if (data && data.length > 0) {
            data.forEach(row => {
              const displayVal = row[mod.displayField] || '';
              const subtitles = mod.subtitleFields
                .map(f => row[f])
                .filter(Boolean)
                .join(' · ');

              allResults.push({
                id: row.id,
                module: mod,
                title: displayVal,
                subtitle: subtitles,
              });
            });
          }
        } catch (e) {
          // Silently skip modules with search errors
        }
      })
    );

    setResults(allResults.slice(0, 12)); // cap at 12 total
    setIsOpen(true);
    setIsSearching(false);
  }, [setSearchQuery]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setActiveIndex(-1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(val);
    }, 280);
  };

  const handleSelect = (result) => {
    setInputValue('');
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    setActivePage(result.module.key);
  };

  const handleClear = () => {
    setInputValue('');
    setSearchQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Propagate to page-level search after a short delay
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      } else if (inputValue.trim()) {
        // Fall back to in-page search
        setSearchQuery(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Group results by module
  const grouped = {};
  results.forEach(r => {
    const label = r.module.label;
    if (!grouped[label]) grouped[label] = { mod: r.module, items: [] };
    grouped[label].items.push(r);
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        />
        <input
          ref={inputRef}
          type="text"
          className="input-control"
          placeholder="Search guests, assets, bills…"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          style={{ paddingLeft: '2.125rem', paddingRight: inputValue ? '2rem' : '0.75rem', fontSize: '0.8125rem' }}
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={handleClear}
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

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          zIndex: 9999,
          maxHeight: '420px',
          overflowY: 'auto',
          animation: 'fadeIn 0.12s ease-out'
        }}>
          {isSearching ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Searching…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Search size={24} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                No results found
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Try different keywords or check spelling.
              </p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([label, group]) => (
                <div key={label}>
                  {/* Group header */}
                  <div style={{
                    padding: '0.5rem 0.875rem 0.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    borderTop: '1px solid var(--border-color)',
                    marginTop: Object.keys(grouped)[0] === label ? 0 : 0
                  }}>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, color: group.mod.color,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      backgroundColor: group.mod.bg, padding: '2px 6px', borderRadius: '999px',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {group.mod.icon} {label}
                    </span>
                  </div>

                  {/* Results */}
                  {group.items.map((result, resultIdx) => {
                    const globalIdx = results.indexOf(result);
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.625rem 0.875rem',
                          border: 'none', background: activeIndex === globalIdx ? 'var(--color-primary-light)' : 'none',
                          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                          transition: 'background 0.1s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = activeIndex === globalIdx ? 'var(--color-primary-light)' : 'transparent'}
                      >
                        <div style={{
                          width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
                          backgroundColor: group.mod.bg, color: group.mod.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {group.mod.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Highlight text={result.title} query={inputValue} />
                          </p>
                          {result.subtitle && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <ArrowRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Footer tip */}
              <div style={{
                padding: '0.5rem 0.875rem', borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'var(--bg-card-hover)'
              }}>
                <kbd style={{
                  padding: '1px 5px', borderRadius: '3px', fontSize: '0.625rem',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)'
                }}>↵</kbd>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>to navigate · Click to go to module</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
