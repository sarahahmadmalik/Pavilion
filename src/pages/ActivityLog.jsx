import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchActivityLogs } from '../lib/supabaseService.js';
import { store } from '../lib/store.js';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Search, FileSpreadsheet, ChevronDown, ChevronUp, Clock, Eye, X } from 'lucide-react';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';

export const ActivityLog = ({ searchQuery, triggerExportModal }) => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [inspectingLog, setInspectingLog] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await fetchActivityLogs(200);
    if (!error && data && data.length > 0) {
      setLogs(data);
    } else {
      setLogs(store.getActivityLogs());
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (currentUser?.role === 'staff') {
    return <AccessDenied moduleName="System Audit Activity Logs" />;
  }

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredLogs = logs.filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(query) ||
      (log.moduleName || '').toLowerCase().includes(query) ||
      (log.recordAffected || '').toLowerCase().includes(query) ||
      (log.action || '').toLowerCase().includes(query);

    const matchesUser = userFilter === 'All' || log.userName === userFilter;
    const matchesModule = moduleFilter === 'All' || log.moduleName === moduleFilter;
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;

    return matchesSearch && matchesUser && matchesModule && matchesAction;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [query, userFilter, moduleFilter, actionFilter]);

  const exportColumns = [
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'User Name', key: 'userName' },
    { label: 'Action', key: 'action' },
    { label: 'Module Name', key: 'moduleName' },
    { label: 'Record Affected', key: 'recordAffected' }
  ];

  const resetFilters = () => {
    setUserFilter('All');
    setModuleFilter('All');
    setActionFilter('All');
    setLocalSearch('');
  };

  const hasActiveFilters = userFilter !== 'All' || moduleFilter !== 'All' || actionFilter !== 'All' || localSearch;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            System Audit & Activity Logs
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Immutably track all user actions, record additions, edits, and deletions across MTA Ghana.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => triggerExportModal?.('Activity Log', filteredLogs, exportColumns)}
        >
          <FileSpreadsheet size={16} /> Export Audit Log
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        padding: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search audit trail..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Action:</span>
          <CustomSelect
            value={actionFilter}
            onChange={setActionFilter}
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
          <CustomSelect
            value={moduleFilter}
            onChange={setModuleFilter}
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

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--status-red-text)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <TableLoader rows={7} cols={7} />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module / Page</th>
                <th>Affected Record</th>
                <th>Change Diffs</th>
                <th style={{ textAlign: 'right' }}>Inspect</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLogs.map(log => {
                const isExpanded = expandedId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} /> {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <img
                            src={log.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                            alt={log.userName}
                            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.userName}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={log.action} /></td>
                      <td>
                        <span className="badge badge-blue">{log.moduleName}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.recordAffected}</span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : log.id); }}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {log.details ? 'View Field Diffs' : 'No Diff Details'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setInspectingLog(log); }}>
                          <Eye size={16} color="var(--color-primary)" />
                        </button>
                      </td>
                    </tr>

                    {/* Inline Diff Accordion */}
                    {isExpanded && log.details && (
                      <tr style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                        <td colSpan={7} style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ fontSize: '0.8125rem', fontFamily: 'Consolas, monospace' }}>
                            <p style={{ fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                              Field-Level Mutation Diffs:
                            </p>
                            <pre style={{
                              backgroundColor: 'var(--bg-input)',
                              padding: '0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              overflowX: 'auto',
                              color: 'var(--text-main)',
                              margin: 0
                            }}>
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
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

      {/* Inspect Log SlideOver Drawer */}
      <SlideOver
        isOpen={!!inspectingLog}
        onClose={() => setInspectingLog(null)}
        title="Audit Log Entry Inspection"
      >
        {inspectingLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)' }}>
              <img
                src={inspectingLog.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={inspectingLog.userName}
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              />
              <div>
                <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>{inspectingLog.userName}</h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{inspectingLog.timestamp ? new Date(inspectingLog.timestamp).toLocaleString() : 'Just now'}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION TYPE</span>
                <p style={{ marginTop: '2px' }}><StatusBadge status={inspectingLog.action} /></p>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>MODULE</span>
                <p style={{ marginTop: '2px', fontWeight: 600 }}>{inspectingLog.moduleName}</p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RECORD AFFECTED</span>
              <p style={{ marginTop: '2px', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                {inspectingLog.recordAffected}
              </p>
            </div>

            {inspectingLog.details && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DETAILS / PAYLOAD</span>
                <pre style={{
                  backgroundColor: 'var(--bg-input)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  fontFamily: 'Consolas, monospace',
                  color: 'var(--text-main)',
                  marginTop: '4px',
                  overflowX: 'auto'
                }}>
                  {JSON.stringify(inspectingLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </SlideOver>
    </div>
  );
};
