import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Users, Wrench, Package, CreditCard, Barcode, ArrowRight, ClipboardList, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

// ─── Comprehensive Module configuration ──────────────────────────────────────
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
    fields: ['issue', 'location', 'name_of_worker', 'updates'],
    displayField: 'issue',
    subtitleFields: ['location', 'name_of_worker', 'status'],
  },
  {
    key: 'gh_inventory',
    label: 'GH Inventory',
    table: 'guest_house_inventory',
    icon: <Package size={14} />,
    color: '#7C3AED',
    bg: 'rgba(139,92,246,0.1)',
    fields: ['item', 'location', 'notes'],
    displayField: 'item',
    subtitleFields: ['location', 'condition'],
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
    subtitleFields: ['payee', 'cheque_no'],
  },
  {
    key: 'office_assets',
    label: 'Office Assets',
    table: 'office_assets',
    icon: <Barcode size={14} />,
    color: '#DB2777',
    bg: 'rgba(236,72,153,0.1)',
    fields: ['description', 'location', 'barcode'],
    displayField: 'description',
    subtitleFields: ['location', 'barcode', 'status'],
  },
  {
    key: 'office_maintenance',
    label: 'Office Maintenance',
    table: 'office_maintenance',
    icon: <Wrench size={14} />,
    color: '#0891B2',
    bg: 'rgba(6,182,212,0.1)',
    fields: ['issue', 'location', 'updates', 'name_of_worker'],
    displayField: 'issue',
    subtitleFields: ['location', 'name_of_worker', 'status'],
  },
  {
    key: 'user_management',
    label: 'User Accounts',
    table: 'users',
    icon: <Shield size={14} />,
    color: '#4F46E5',
    bg: 'rgba(79,70,229,0.1)',
    fields: ['name', 'email'],
    displayField: 'name',
    subtitleFields: ['email', 'role', 'status'],
  },
  {
    key: 'activity_log',
    label: 'Activity Audit Logs',
    table: 'activity_logs',
    icon: <ClipboardList size={14} />,
    color: '#64748B',
    bg: 'rgba(100,116,139,0.1)',
    fields: ['user_name', 'module_name', 'record_affected'],
    displayField: 'record_affected',
    subtitleFields: ['user_name', 'action', 'module_name'],
  }
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

// ─── Main Search Bar Component ────────────────────────────────────────────────
export const GlobalSearchBar = ({ searchQuery, setSearchQuery, setActivePage }) => {
  const [inputValue, setInputValue] = useState(searchQuery || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Comprehensive parallel search across all database tables
  const doSearch = useCallback(async (q) => {
    if (!q || !q.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsSearching(true);
    const term = q.trim();
    const allResults = [];

    // Query each module in parallel
    await Promise.all(
      MODULES.map(async (mod) => {
        try {
          const orFilter = mod.fields.map(f => `${f}.ilike.%${term}%`).join(',');
          const { data } = await supabase
            .from(mod.table)
            .select('*')
            .or(orFilter)
            .limit(5);

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
                rawRow: row
              });
            });
          }
        } catch (e) {
          // Ignore table query errors gracefully
        }
      })
    );

    setResults(allResults.slice(0, 16)); // cap at 16 top matches
    setIsOpen(true);
    setIsSearching(false);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setActiveIndex(-1);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(val);
    }, 200);
  };

  const handleSelect = (result) => {
    const filterTerm = result.title;
    setInputValue(filterTerm);
    setSearchQuery?.(filterTerm);
    setResults([]);
    setIsOpen(false);
    if (result.module?.key) {
      setActivePage(result.module.key);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen && results.length > 0) setIsOpen(true);
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex]);
      } else if (results.length > 0) {
        // Top match fallback
        handleSelect(results[0]);
      } else if (inputValue.trim()) {
        setSearchQuery?.(inputValue.trim());
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Group search results by module
  const grouped = {};
  results.forEach(r => {
    const label = r.module.label;
    if (!grouped[label]) grouped[label] = { mod: r.module, items: [] };
    grouped[label].items.push(r);
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
      {/* Search Input Box */}
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
          placeholder="Search all guests, assets, bills, users…"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim()) {
              if (results.length > 0) setIsOpen(true);
              else doSearch(inputValue);
            }
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
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Global Live Results Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
          zIndex: 9999,
          maxHeight: '440px',
          overflowY: 'auto',
          animation: 'fadeIn 0.12s ease-out'
        }}>
          {isSearching ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Searching across all database tables…
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <Search size={22} color="var(--text-muted)" style={{ marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                No records found matching "{inputValue}"
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Try searching for guest names, asset tags, bill companies, or usernames.
              </p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([label, group]) => (
                <div key={label}>
                  {/* Category Header */}
                  <div style={{
                    padding: '0.5rem 0.875rem 0.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    borderTop: '1px solid var(--border-color)'
                  }}>
                    <span style={{
                      fontSize: '0.6875rem', fontWeight: 700, color: group.mod.color,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      backgroundColor: group.mod.bg, padding: '2px 6px', borderRadius: '999px',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {group.mod.icon} {label}
                    </span>
                  </div>

                  {/* Result Items */}
                  {group.items.map((result) => {
                    const globalIdx = results.indexOf(result);
                    const isSelected = activeIndex === globalIdx;
                    return (
                      <button
                        key={`${result.module.key}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem',
                          padding: '0.625rem 0.875rem',
                          border: 'none', background: isSelected ? 'var(--color-primary-light)' : 'none',
                          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                          transition: 'background 0.1s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = isSelected ? 'var(--color-primary-light)' : 'transparent'}
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
                              <Highlight text={result.subtitle} query={inputValue} />
                            </p>
                          )}
                        </div>
                        <ArrowRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* Keyboard tip footer */}
              <div style={{
                padding: '0.5rem 0.875rem', borderTop: '1px solid var(--border-color)',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: 'var(--bg-card-hover)'
              }}>
                <kbd style={{
                  padding: '1px 5px', borderRadius: '3px', fontSize: '0.625rem',
                  border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)'
                }}>↵</kbd>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Press Enter to view record module</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
