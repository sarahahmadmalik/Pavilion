import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { SlideOver } from '../common/SlideOver.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { Toast } from '../common/Toast.jsx';
import { ExportModal } from '../common/ExportModal.jsx';
import { ImportModal } from '../common/ImportModal.jsx';
import { PageTransition } from '../common/PageTransition.jsx';
import { exportToExcel } from '../../lib/exportUtils.js';
import { batchInsert, generateSampleTemplate, IMPORT_CONFIGS } from '../../lib/importUtils.js';

// Layout Context for reliable child component access to modal triggers
export const LayoutContext = React.createContext({
  triggerExportModal: () => {},
  triggerImportModal: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  setToast: () => {}
});

export const useLayout = () => React.useContext(LayoutContext);
import { Bell, Ticket, Activity, CheckCheck, Clock, Trash2 } from 'lucide-react';

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
const NotificationCard = ({ notif, onRead, onNavigate }) => {
  const isUnread = !notif.is_read;
  const isTicket = !!notif.ticket_id;
  const iconStyle = isTicket
    ? { bg: 'rgba(26,63,160,0.12)', color: '#1A3FA0' }
    : { bg: 'rgba(6,182,212,0.12)', color: '#0891B2' };

  const handleClick = () => {
    if (isUnread) onRead(notif.id);
    if (isTicket) onNavigate?.();
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: isUnread ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
        border: `1px solid ${isUnread ? 'rgba(26,63,160,0.2)' : 'var(--border-color)'}`,
        cursor: isUnread || isTicket ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        position: 'relative'
      }}
      onMouseEnter={e => { if (isUnread || isTicket) e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {/* Unread dot */}
      {isUnread && (
        <div style={{
          position: 'absolute', top: '0.625rem', right: '0.625rem',
          width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--color-primary)'
        }} />
      )}

      {/* Type icon */}
      <div style={{
        width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
        backgroundColor: iconStyle.bg, color: iconStyle.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        {isTicket ? <Ticket size={16} /> : <Activity size={16} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2px' }}>
          <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: '0.8125rem', color: 'var(--text-main)', lineHeight: 1.3 }}>
            {notif.title}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
            <Clock size={11} />
            {formatTime(notif.created_at)}
          </span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: isUnread ? 'var(--text-main)' : 'var(--text-muted)', lineHeight: 1.4 }}>
          {notif.message}
        </p>
      </div>
    </div>
  );
};

// ─── Main Layout ──────────────────────────────────────────────────────────────
export const Layout = ({ activePage, setActivePage, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1180 : false
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-collapse sidebar on mid-size screens (tablets / small laptops)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1180 && window.innerWidth > 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth > 1180) {
        setIsCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const { notifications, unreadCount, markAsRead, markAllRead, clearAll } = useNotifications() || {};

  // Global Export Modal State
  const [exportState, setExportState] = useState({
    isOpen: false,
    moduleTitle: '',
    data: [],
    columns: [],
    filteredData: []
  });

  const triggerExportModal = (moduleTitle, filteredData, columns, allData = null) => {
    const fullData = allData || filteredData || [];
    const filtData = filteredData || [];
    const hasActiveFilters = Array.isArray(filtData) && Array.isArray(fullData) && filtData.length > 0 && filtData.length < fullData.length;
    setExportState({ isOpen: true, moduleTitle, data: fullData, columns, filteredData: filtData, hasActiveFilters });
  };

  const handleConfirmExport = async ({ scope }) => {
    let exportedData = [];
    if (scope === 'filtered') {
      exportedData = exportState.filteredData;
    } else {
      const moduleTitle = exportState.moduleTitle;
      let res = { data: exportState.data };
      try {
        if (moduleTitle.includes('Guest List')) res = await fetchGuests('');
        else if (moduleTitle.includes('GH Maintenance') || moduleTitle.includes('Guest House Maintenance')) res = await fetchGHMaintenance('');
        else if (moduleTitle.includes('GH Inventory') || moduleTitle.includes('Guest House Inventory')) res = await fetchGHInventory('');
        else if (moduleTitle.includes('Office Bill') || moduleTitle.includes('Office Bills')) res = await fetchBillPayments('');
        else if (moduleTitle.includes('Office Asset') || moduleTitle.includes('Office Assets')) res = await fetchOfficeAssets('');
        else if (moduleTitle.includes('Office Maintenance')) res = await fetchOfficeMaintenance('');
        else if (moduleTitle.includes('User')) res = await fetchAllUsers('');
        else if (moduleTitle.includes('Activity') || moduleTitle.includes('Audit')) res = await fetchActivityLogs(5000, '');
      } catch (err) {
        console.error('Error fetching full dataset for export:', err);
      }
      exportedData = (res.data && Array.isArray(res.data) && res.data.length > 0) ? res.data : exportState.data;
    }
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

  const handleOpenNotifications = () => setShowNotifications(true);

  const handleNavigateToTicket = () => {
    setShowNotifications(false);
    setActivePage('tickets');
  };

  const handleClearAll = async () => {
    await clearAll?.();
  };

  return (
    <LayoutContext.Provider value={{ triggerExportModal, triggerImportModal, searchQuery, setSearchQuery, setToast }}>
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
            borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem'
          }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              {(notifications || []).length} notification{(notifications || []).length === 1 ? '' : 's'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => markAllRead?.()}
                disabled={!unreadCount}
                style={{
                  background: 'none', border: 'none',
                  cursor: unreadCount ? 'pointer' : 'not-allowed',
                  fontSize: '0.8125rem',
                  color: unreadCount ? 'var(--color-primary)' : 'var(--text-muted)',
                  opacity: unreadCount ? 1 : 0.5,
                  fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)', fontFamily: 'inherit'
                }}
                onMouseEnter={e => { if (unreadCount) e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
              <button
                onClick={() => setConfirmClearOpen(true)}
                disabled={!(notifications || []).length}
                style={{
                  background: 'none', border: 'none',
                  cursor: (notifications || []).length ? 'pointer' : 'not-allowed',
                  fontSize: '0.8125rem',
                  color: (notifications || []).length ? '#EF4444' : 'var(--text-muted)',
                  opacity: (notifications || []).length ? 1 : 0.5,
                  fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)', fontFamily: 'inherit'
                }}
                onMouseEnter={e => { if ((notifications || []).length) e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', flex: 1, overflowY: 'auto' }}>
            {!(notifications || []).length ? (
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
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>New activity will appear here in real-time.</p>
                </div>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notif={notif}
                  onRead={markAsRead}
                  onNavigate={notif.ticket_id ? handleNavigateToTicket : undefined}
                />
              ))
            )}
          </div>
        </div>
      </SlideOver>

      {/* Clear Notifications Confirm */}
      <ConfirmDialog
        isOpen={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={handleClearAll}
        title="Clear Notifications"
        headline="Clear all notifications?"
        message="This permanently deletes every notification in your list. This can't be undone."
        confirmText="Yes, Clear All"
        confirmLoadingText="Clearing..."
      />

      {/* ─── Export Modal ───────────────────────────────────────────────────── */}
      <ExportModal
        isOpen={exportState.isOpen}
        onClose={() => setExportState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmExport}
        moduleTitle={exportState.moduleTitle}
        hasActiveFilters={exportState.hasActiveFilters}
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
    </LayoutContext.Provider>
  );
};
