import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { SlideOver } from '../common/SlideOver.jsx';
import { Toast } from '../common/Toast.jsx';
import { ExportModal } from '../common/ExportModal.jsx';
import { ImportModal } from '../common/ImportModal.jsx';
import { PageTransition } from '../common/PageTransition.jsx';
import { exportToExcel } from '../../lib/exportUtils.js';
import { batchInsert } from '../../lib/importUtils.js';
import { supabase } from '../../lib/supabase.js';
import {
  Bell, Activity, Users, Wrench, Package, CreditCard, Barcode, ClipboardList, ShieldCheck,
  CheckCheck, Clock
} from 'lucide-react';

// ─── Module icon map ──────────────────────────────────────────────────────────
const MODULE_ICONS = {
  'Guest List':            <Users size={16} />,
  'GH Maintenance':        <Wrench size={16} />,
  'GH Inventory':          <Package size={16} />,
  'Office Bills':          <CreditCard size={16} />,
  'Office Assets':         <Barcode size={16} />,
  'Office Maintenance':    <Wrench size={16} />,
  'User Management':       <ShieldCheck size={16} />,
  'Activity Log':          <ClipboardList size={16} />,
};

const MODULE_COLORS = {
  'Guest List':          { bg: 'rgba(26,63,160,0.12)', color: '#1A3FA0' },
  'GH Maintenance':      { bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  'GH Inventory':        { bg: 'rgba(139,92,246,0.12)', color: '#7C3AED' },
  'Office Bills':        { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
  'Office Assets':       { bg: 'rgba(236,72,153,0.12)', color: '#DB2777' },
  'Office Maintenance':  { bg: 'rgba(245,158,11,0.12)', color: '#D97706' },
  'User Management':     { bg: 'rgba(99,102,241,0.12)', color: '#4F46E5' },
  'Activity Log':        { bg: 'rgba(6,182,212,0.12)', color: '#0891B2' },
};

// ─── Time formatter ───────────────────────────────────────────────────────────
function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Single Notification Card ─────────────────────────────────────────────────
const NotificationCard = ({ log, isUnread, onRead }) => {
  const mod = log.moduleName || '';
  const iconStyle = MODULE_COLORS[mod] || { bg: 'rgba(100,116,139,0.12)', color: '#64748B' };
  const icon = MODULE_ICONS[mod] || <Activity size={16} />;

  return (
    <div
      onClick={() => isUnread && onRead(log.id)}
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isUnread ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
        border: `1px solid ${isUnread ? 'rgba(26,63,160,0.2)' : 'var(--border-color)'}`,
        cursor: isUnread ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={e => { if (isUnread) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { if (isUnread) e.currentTarget.style.opacity = '1'; }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{
          position: 'absolute', top: '0.625rem', right: '0.625rem',
          width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-primary)'
        }} />
      )}

      {/* Module icon */}
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
        backgroundColor: iconStyle.bg, color: iconStyle.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2px' }}>
          <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
            {log.userName}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <Clock size={11} />
            {formatTime(log.rawTimestamp)}
          </span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.4, marginBottom: '4px' }}>
          <span style={{ textTransform: 'lowercase' }}>{log.action}</span>{' '}
          <strong style={{ color: 'var(--text-main)' }}>{log.recordAffected}</strong>
        </p>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          fontSize: '0.6875rem', color: iconStyle.color, fontWeight: 600,
          backgroundColor: iconStyle.bg, padding: '1px 6px', borderRadius: '999px'
        }}>
          {icon} {mod}
        </span>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
export const Layout = ({ activePage, setActivePage, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Global Export Modal State
  const [exportState, setExportState] = useState({
    isOpen: false,
    moduleTitle: '',
    data: [],
    columns: [],
    filteredData: []
  });

  const triggerExportModal = (moduleTitle, filteredData, columns, allData = null) => {
    setExportState({ isOpen: true, moduleTitle, data: allData || filteredData, columns, filteredData });
  };

  const handleConfirmExport = ({ scope }) => {
    const exportedData = scope === 'filtered'
      ? exportState.filteredData
      : exportState.data;
    const filename = exportToExcel(exportState.moduleTitle, exportedData, exportState.columns);
    setToast({ type: 'success', message: `✓ ${filename} downloaded.` });
  };

  // ─── Global Import Modal State ────────────────────────────────────────────
  const [importState, setImportState] = useState({ isOpen: false, moduleKey: null });

  const triggerImportModal = (moduleKey) => {
    setImportState({ isOpen: true, moduleKey });
  };

  // ─── Background Import Runner (Google Drive-style) ────────────────────────
  const handleStartImport = async ({ moduleKey, rows, skippedRows, config }) => {
    if (rows.length === 0) {
      setToast({ type: 'warning', message: 'No valid rows to import. Check your file.' });
      return;
    }

    // Show initial "in progress" toast
    setToast({
      type: 'info',
      message: `Importing ${rows.length} records into ${config.label}… Please wait.`,
      persistent: true
    });

    try {
      const { insertedCount, errors } = await batchInsert(moduleKey, rows, ({ inserted, total }) => {
        // Update progress toast periodically
        if (inserted < total) {
          setToast({
            type: 'info',
            message: `Importing ${config.label}… ${inserted}/${total} records`,
            persistent: true
          });
        }
      });

      if (errors.length > 0 && insertedCount === 0) {
        setToast({
          type: 'error',
          message: `Import failed. The server rejected the data. Check column formats and try again.`
        });
      } else if (errors.length > 0) {
        setToast({
          type: 'warning',
          message: `Import completed with some issues. ${insertedCount} records added, ${skippedRows.length + errors.length} skipped.`
        });
      } else {
        const skipNote = skippedRows.length > 0 ? ` (${skippedRows.length} rows skipped — missing required fields)` : '';
        setToast({
          type: 'success',
          message: `✓ ${insertedCount} records successfully imported into ${config.label}.${skipNote}`
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Import failed due to a network error. Please check your connection and try again.'
      });
    }
  };

  const { currentUser } = useAuth();

  // Helper: Filter logs based on notification rules
  const filterNotification = (log, userRoleMap = {}) => {
    if (!currentUser) return false;
    const role = currentUser.role;

    // Rule 1: Notifications ONLY show to super_admin or admin
    if (role !== 'super_admin' && role !== 'admin') return false;

    // Rule 2: Self action check - users do NOT receive notifications of their own actions
    if (log.userId === currentUser.id || log.userName === currentUser.name) return false;

    // Rule 3: Super admin changes privacy - superadmin changes will NOT show to admin
    if (role === 'admin') {
      const actorRole = userRoleMap[log.userId] || log.userRole || log.details?._actor_role;
      if (actorRole === 'super_admin') return false;
    }

    return true;
  };

  // ─── Fetch notifications from activity_logs ───────────────────────────────
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let channel;

    const fetchLogsAndUsers = async () => {
      // Fetch users mapping to know roles
      const { data: usersData } = await supabase.from('users').select('id, role');
      const userRoleMap = {};
      if (usersData) {
        usersData.forEach(u => { userRoleMap[u.id] = u.role; });
      }

      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(30);

      if (data) {
        const mapped = data
          .map(d => ({
            id: d.id,
            userId: d.user_id,
            userRole: userRoleMap[d.user_id] || d.details?._actor_role,
            userName: d.user_name,
            userAvatar: d.user_avatar,
            action: d.action,
            recordAffected: d.record_affected,
            moduleName: d.module_name,
            rawTimestamp: d.timestamp,
            details: d.details
          }))
          .filter(log => filterNotification(log, userRoleMap));

        setNotifications(mapped);
      }
    };

    fetchLogsAndUsers();

    // Real-time subscription
    channel = supabase
      .channel('realtime_activity_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        async (payload) => {
          const r = payload.new;
          
          // Get role of creator if not in log
          let actorRole = r.details?._actor_role;
          if (!actorRole && r.user_id) {
            const { data: uData } = await supabase.from('users').select('role').eq('id', r.user_id).single();
            if (uData) actorRole = uData.role;
          }

          const newNotif = {
            id: r.id,
            userId: r.user_id,
            userRole: actorRole,
            userName: r.user_name,
            userAvatar: r.user_avatar,
            action: r.action,
            recordAffected: r.record_affected,
            moduleName: r.module_name,
            rawTimestamp: r.timestamp,
            details: r.details
          };

          // Apply notification visibility filter
          if (filterNotification(newNotif, { [r.user_id]: actorRole })) {
            setNotifications(prev => [newNotif, ...prev.slice(0, 19)]);
            setUnreadCount(c => c + 1);
            setToast({
              type: 'info',
              message: `⚡ ${r.user_name} ${r.action?.toLowerCase()} "${r.record_affected}" in ${r.module_name}`
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.role]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    // Mark all currently loaded as "read" by adding them to readIds
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      return next;
    });
  };

  const handleMarkOneRead = (id) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  // Determine which notifs are "unread" = loaded via realtime (not in initial fetch)
  // Simple heuristic: anything not yet in readIds is unread if unreadCount > 0
  const isUnread = (notif, idx) => idx < unreadCount && !readIds.has(notif.id);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area — Scoped Scrollable Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          unreadCount={unreadCount}
          onOpenNotifications={handleOpenNotifications}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
        />

        <main className="main-content-wrapper" style={{ flex: 1, padding: '1.5rem 1.75rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <PageTransition pageKey={activePage}>
            {React.cloneElement(children, { searchQuery, triggerExportModal, triggerImportModal, setToast })}
          </PageTransition>
        </main>

        {/* Footer */}
        <footer style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <span>MTA Ghana © 2026 • All Rights Reserved</span>
        </footer>
      </div>

      {/* ─── Notification Drawer ────────────────────────────────────────────── */}
      <SlideOver
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="Notifications"
        width="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

          {/* Toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '1rem', paddingBottom: '0.875rem',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {notifications.length} recent activities
            </span>
            <button
              onClick={() => {
                setReadIds(prev => {
                  const next = new Set(prev);
                  notifications.forEach(n => next.add(n.id));
                  return next;
                });
                setUnreadCount(0);
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
                borderRadius: 'var(--radius-sm)', fontFamily: 'inherit'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>

          {/* Notification List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                flex: 1, gap: '0.75rem', padding: '2rem', textAlign: 'center'
              }}>
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  backgroundColor: 'var(--bg-card-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <Bell size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>No notifications yet</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Activities will appear here in real-time.</p>
                </div>
              </div>
            ) : (
              notifications.map((log, idx) => (
                <NotificationCard
                  key={log.id}
                  log={log}
                  isUnread={isUnread(log, idx)}
                  onRead={handleMarkOneRead}
                />
              ))
            )}
          </div>
        </div>
      </SlideOver>

      {/* ─── Export Modal ───────────────────────────────────────────────────── */}
      <ExportModal
        isOpen={exportState.isOpen}
        onClose={() => setExportState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmExport}
        moduleTitle={exportState.moduleTitle}
      />

      {/* ─── Import Modal ───────────────────────────────────────────────────── */}
      <ImportModal
        isOpen={importState.isOpen}
        onClose={() => setImportState(prev => ({ ...prev, isOpen: false }))}
        moduleKey={importState.moduleKey}
        onStartImport={handleStartImport}
      />

      {/* ─── Toast Snackbar ─────────────────────────────────────────────────── */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
