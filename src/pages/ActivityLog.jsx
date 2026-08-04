import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore } from '../lib/store.js';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { SlideOver } from '../components/common/SlideOver.jsx';
import { AccessDenied } from './AccessDenied.jsx';
import { Search, FileSpreadsheet, ChevronDown, ChevronUp, Clock, Filter, Eye } from 'lucide-react';

export const ActivityLog = ({ searchQuery, triggerExportModal }) => {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'staff') return <AccessDenied moduleName="Activity Log Audit Trail" />;

  const [logs, setLogs] = useState(store.getActivityLogs());
  const [localSearch, setLocalSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [inspectingLog, setInspectingLog] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setLogs(store.getActivityLogs());
    });
    return unsubscribe;
  }, []);

  const query = (searchQuery || localSearch).toLowerCase();
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(query) ||
      log.moduleName.toLowerCase().includes(query) ||
      log.recordAffected.toLowerCase().includes(query);

    const matchesUser = userFilter === 'All' || log.userName === userFilter;
    const matchesModule = moduleFilter === 'All' || log.moduleName === moduleFilter;
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;

    return matchesSearch && matchesUser && matchesModule && matchesAction;
  });

  const exportColumns = [
    { label: 'Timestamp', key: 'timestamp' },
    { label: 'User Name', key: 'userName' },
    { label: 'Action Type', key: 'action' },
    { label: 'Module / Page', key: 'moduleName' },
    { label: 'Affected Record', key: 'recordAffected' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            System Activity Log & Audit Trail
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Comprehensive immutable audit log of all create, edit, and delete operations performed by staff and administrators.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => triggerExportModal('Activity Log', filteredLogs, exportColumns)} style={{ color: '#10B981', borderColor: '#10B981' }}>
          <FileSpreadsheet size={16} /> Export Audit Log
        </button>
      </div>

      {/* Multi-Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        padding: '1rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ position: 'relative', width: '260px' }}>
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
          <select className="input-control" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ width: '130px', padding: '0.375rem 0.5rem' }}>
            <option value="All">All Actions</option>
            <option value="Created">Created</option>
            <option value="Edited">Edited</option>
            <option value="Deleted">Deleted</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Module:</span>
          <select className="input-control" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} style={{ width: '180px', padding: '0.375rem 0.5rem' }}>
            <option value="All">All Modules</option>
            <option value="Guest List">Guest List</option>
            <option value="Guest House Maintenance">GH Maintenance</option>
            <option value="Guest House Inventory">GH Inventory</option>
            <option value="Office Bill Payments">Office Bills</option>
            <option value="Office Asset List">Office Assets</option>
            <option value="Office Maintenance">Office Maintenance</option>
            <option value="User Management">User Management</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
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
            {filteredLogs.map(log => {
              const isExpanded = expandedId === log.id;
              return (
                <React.Fragment key={log.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {log.timestamp}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <img src={log.userAvatar} alt={log.userName} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
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

                  {/* Expanded Row Diffs */}
                  {isExpanded && log.details && (
                    <tr style={{ backgroundColor: 'var(--bg-card-hover)' }}>
                      <td colSpan={7} style={{ padding: '1rem 1.5rem' }}>
                        <div style={{
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border-color)'
                        }}>
                          <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                            Before / After Field Changes (Diff View):
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontFamily: 'Consolas, monospace', fontSize: '0.8125rem' }}>
                            {Object.entries(log.details).map(([key, val]) => (
                              <div key={key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, minWidth: '140px', color: 'var(--color-primary)' }}>{key}:</span>
                                {typeof val === 'object' && val !== null ? (
                                  <span>
                                    <span style={{ color: '#EF4444', textDecoration: 'line-through' }}>{String(val.old ?? 'null')}</span>
                                    <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>→</span>
                                    <span style={{ color: '#10B981', fontWeight: 700 }}>{String(val.new ?? 'null')}</span>
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-main)' }}>{JSON.stringify(val)}</span>
                                )}
                              </div>
                            ))}
                          </div>
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

      {/* Inspect Log SlideOver Drawer */}
      <SlideOver
        isOpen={!!inspectingLog}
        onClose={() => setInspectingLog(null)}
        title="Audit Trail Entry Inspection"
      >
        {inspectingLog && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)' }}>
              <img src={inspectingLog.userAvatar} alt={inspectingLog.userName} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{inspectingLog.userName}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Performed {inspectingLog.action} on {inspectingLog.timestamp}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Target Module</span>
              <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>{inspectingLog.moduleName}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Affected Record</span>
              <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{inspectingLog.recordAffected}</p>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Raw Audit Data</span>
              <pre style={{
                marginTop: '0.5rem',
                padding: '1rem',
                backgroundColor: '#0F172A',
                color: '#38BDF8',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                overflowX: 'auto',
                fontFamily: 'Consolas, monospace'
              }}>
                {JSON.stringify(inspectingLog, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setInspectingLog(null)}>
                Close Audit Drawer
              </button>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  );
};
