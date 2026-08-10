import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchActivityLogs } from '../lib/supabaseService.js';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import {
  Search, FileSpreadsheet, ChevronDown, ChevronUp, Clock, Eye, X,
  User, Tag, PenLine, Trash2, Plus, Info
} from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { UserAvatar } from '../components/common/UserAvatar.jsx';

// ─── Human-readable detail renderer ──────────────────────────────────────────
function renderDetailRows(details) {
  if (!details || Object.keys(details).length === 0) return null;

  // Normalise: details may be { before: {}, after: {} } or flat key-value
  const hasDiff = details.before !== undefined && details.after !== undefined;

  if (hasDiff) {
    const allKeys = new Set([
      ...Object.keys(details.before || {}),
      ...Object.keys(details.after || {})
    ]);
    const rows = [];
    allKeys.forEach(k => {
      const before = details.before?.[k];
      const after = details.after?.[k];
      if (JSON.stringify(before) === JSON.stringify(after)) return; // skip unchanged
      rows.push({ field: k, before, after });
    });
    return rows;
  }

  // Flat key-value → treat as metadata
  return Object.entries(details).map(([k, v]) => ({
    field: k,
    before: null,
    after: typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')
  }));
}

function friendlyFieldName(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function friendlyValue(val) {
  if (val === null || val === undefined || val === '') return <em style={{ color: 'var(--text-muted)' }}>empty</em>;
  return String(val);
}

// ─── Expand Accordion (inline under row) ─────────────────────────────────────
const DetailAccordion = ({ log }) => {
  const rows = renderDetailRows(log.details);
  const hasDiff = log.details?.before !== undefined && log.details?.after !== undefined;

  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <Info size={14} /> No detailed field changes were recorded for this action.
      </div>
    );
  }

  return (
    <div style={{ padding: '0.875rem 1.5rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
        {hasDiff ? 'Fields Changed' : 'Action Details'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map(({ field, before, after }) => (
          <div key={field} style={{
            display: 'grid',
            gridTemplateColumns: hasDiff ? '1fr 1fr 1fr' : '1fr 2fr',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            fontSize: '0.8125rem'
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{friendlyFieldName(field)}</span>
            {hasDiff && (
              <span style={{ color: 'var(--status-red-text)', textDecoration: 'line-through', opacity: 0.8 }}>
                {friendlyValue(before)}
              </span>
            )}
            <span style={{ color: hasDiff ? 'var(--status-green-text)' : 'var(--text-main)', fontWeight: 500 }}>
              {friendlyValue(after)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Inspect SlideOver ────────────────────────────────────────────────────────
const InspectPanel = ({ log }) => {
  if (!log) return null;
  const rows = renderDetailRows(log.details);
  const hasDiff = log.details?.before !== undefined && log.details?.after !== undefined;
  const actionIcon = log.action === 'Created' ? <Plus size={14} /> : log.action === 'Deleted' ? <Trash2 size={14} /> : <PenLine size={14} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Who + When */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)' }}>
        <UserAvatar name={log.userName} src={log.userAvatar} size={44} />
        <div>
          <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{log.userName}</h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {log.timestamp ? new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
          </p>
        </div>
      </div>

      {/* What happened */}
      <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
            backgroundColor: log.action === 'Deleted' ? 'rgba(239,68,68,0.1)' : log.action === 'Created' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color: log.action === 'Deleted' ? '#EF4444' : log.action === 'Created' ? '#10B981' : '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {actionIcon}
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Action</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{log.action} a record</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={14} />
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Module</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{log.moduleName}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(99,102,241,0.1)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={14} />
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Record Affected</span>
            <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>{log.recordAffected || '—'}</p>
          </div>
        </div>
      </div>

      {/* Change details */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>
          {hasDiff ? 'What Changed' : 'Details'}
        </p>

        {rows && rows.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {hasDiff && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', padding: '0.375rem 0.75rem' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Field</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Before</span>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>After</span>
              </div>
            )}
            {rows.map(({ field, before, after }) => (
              <div key={field} style={{
                display: 'grid',
                gridTemplateColumns: hasDiff ? '1fr 1fr 1fr' : '1fr 2fr',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8125rem'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{friendlyFieldName(field)}</span>
                {hasDiff && (
                  <span style={{ color: '#B91C1C', textDecoration: 'line-through', opacity: 0.85 }}>
                    {friendlyValue(before)}
                  </span>
                )}
                <span style={{ color: hasDiff ? '#059669' : 'var(--text-main)', fontWeight: 500 }}>
                  {friendlyValue(after)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.8125rem', color: 'var(--text-muted)'
          }}>
            <Info size={15} />
            No additional change details were recorded for this action.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ActivityLog = ({ searchQuery, triggerExportModal }) => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [inspectingLog, setInspectingLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async (q) => {
    setLoading(true);
    setLoadError(null);
    const searchTerm = q !== undefined ? q : (searchQuery || localSearch);
    try {
      const { data, error } = await fetchActivityLogs(200, searchTerm);
      if (error) {
        setLoadError('Unable to load activity logs. Please try again.');
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch {
      setLoadError('A network error occurred while loading the audit log.');
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(searchQuery || localSearch);
  }, [searchQuery, localSearch]);

  if (currentUser?.role === 'staff') {
    return <AccessDenied moduleName="System Audit Activity Logs" />;
  }

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.userName || '').toLowerCase().includes(query) ||
      (log.moduleName || '').toLowerCase().includes(query) ||
      (log.recordAffected || '').toLowerCase().includes(query) ||
      (log.action || '').toLowerCase().includes(query);

    const matchesModule = moduleFilter === 'All' || log.moduleName === moduleFilter;
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    return matchesSearch && matchesModule && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [query, moduleFilter, actionFilter]);

  const exportColumns = [
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'User Name', key: 'userName' },
    { label: 'Action', key: 'action' },
    { label: 'Module', key: 'moduleName' },
    { label: 'Record Affected', key: 'recordAffected' }
  ];

  const hasActiveFilters = moduleFilter !== 'All' || actionFilter !== 'All' || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            System Audit &amp; Activity Logs
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Full audit trail of all user actions across MTA Ghana.
          </p>
        </div>
        <button
          className="btn btn-export"
          onClick={() => triggerExportModal?.('Activity Audit Logs', filteredLogs, exportColumns, logs)}
        >
          <FileSpreadsheet size={16} /> Export
        </button>
      </div>

      {/* Error Banner */}
      {loadError && <ErrorBanner type="error" title="Failed to load logs" message={loadError} onRetry={loadData} />}

      {/* Responsive Filter Bar */}
      <ResponsiveFilterBar
        searchVal={localSearch}
        onSearchChange={setLocalSearch}
        searchPlaceholder="Search audit trail..."
        activeFilterCount={(actionFilter !== 'All' ? 1 : 0) + (moduleFilter !== 'All' ? 1 : 0)}
        onClearFilters={() => { setModuleFilter('All'); setActionFilter('All'); setLocalSearch(''); }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Action:</span>
          <CustomSelect value={actionFilter} onChange={setActionFilter}
            options={[
              { label: 'All Actions', value: 'All' },
              { label: 'Created', value: 'Created' },
              { label: 'Edited', value: 'Edited' },
              { label: 'Deleted', value: 'Deleted' }
            ]}
            style={{ width: '140px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Module:</span>
          <CustomSelect value={moduleFilter} onChange={setModuleFilter}
            options={[
              { label: 'All Modules', value: 'All' },
              { label: 'Guest List', value: 'Guest List' },
              { label: 'GH Maintenance', value: 'Guest House Maintenance' },
              { label: 'GH Inventory', value: 'Guest House Inventory' },
              { label: 'Office Bills', value: 'Office Bill Payments' },
              { label: 'Office Assets', value: 'Office Asset List' },
              { label: 'Office Maintenance', value: 'Office Maintenance' },
              { label: 'User Management', value: 'User Management' }
            ]}
            style={{ width: '180px' }}
          />
        </div>
      </ResponsiveFilterBar>

      {/* Table */}
      {loading ? (
        <TableLoader rows={8} cols={6} />
      ) : (
        <div className="table-container" style={{ maxHeight: '580px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-card-hover)' }}>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record Affected</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    No audit log entries found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map(log => {
                  return (
                    <tr
                      key={log.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setInspectingLog(log)}
                      title="Click to view full detail in right-side inspector"
                    >
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} />
                          {log.timestamp
                            ? new Date(log.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
                            : 'Just now'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <UserAvatar name={log.userName} src={log.userAvatar} size={26} />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.userName}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={log.action} /></td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>{log.moduleName}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{log.recordAffected}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={e => { e.stopPropagation(); setInspectingLog(log); }}
                          style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Open full details panel"
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredLogs.length}
        itemsPerPage={itemsPerPage}
      />

      {/* Inspect Drawer */}
      <SlideOver
        isOpen={!!inspectingLog}
        onClose={() => setInspectingLog(null)}
        title="Activity Log Detail"
        width="480px"
      >
        <InspectPanel log={inspectingLog} />
      </SlideOver>
    </div>
  );
};
