import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { SlideOver } from '../common/SlideOver.jsx';
import { Toast } from '../common/Toast.jsx';
import { ExportModal } from '../common/ExportModal.jsx';
import { GoogleSheetsViewerModal } from '../common/GoogleSheetsViewerModal.jsx';
import { PageTransition } from '../common/PageTransition.jsx';
import { Clock } from 'lucide-react';
import { store } from '../../lib/store.js';
import { exportToExcel } from '../../lib/exportUtils.js';
import { supabase } from '../../lib/supabase.js';

export const Layout = ({ activePage, setActivePage, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState(null);

  // Global Export Modal State
  const [exportState, setExportState] = useState({
    isOpen: false,
    moduleTitle: '',
    data: [],
    columns: []
  });

  // Google Sheets Simulator State
  const [sheetsState, setSheetsState] = useState({
    isOpen: false,
    data: [],
    columns: [],
    title: ''
  });

  const triggerExportModal = (moduleTitle, data, columns) => {
    setExportState({ isOpen: true, moduleTitle, data, columns });
  };

  const handleConfirmExport = async (config) => {
    const { scope, method, webhookUrl } = config;
    // For 'filtered', we currently just take a mock slice. In a real implementation, 
    // we would pass the actual filtered data from the page state. 
    // To implement properly, components should pass `filteredData` to `triggerExportModal`.
    const exportedData = scope === 'all' ? exportState.data : exportState.data.slice(0, 10);

    if (method === 'excel') {
      const filename = exportToExcel(exportState.moduleTitle, exportedData, exportState.columns);
      setToast({ type: 'success', message: `✓ ${filename} downloaded successfully.` });
    } else if (method === 'sheets') {
      try {
        setToast({ type: 'info', message: 'Sending data to Google Sheets...' });
        
        // This makes an actual POST request to the provided webhook URL
        const response = await fetch(webhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Google Apps Script webhooks often require no-cors for simple posts
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: exportState.moduleTitle,
            columns: exportState.columns.map(c => c.label),
            data: exportedData.map(row => exportState.columns.map(c => row[c.key]))
          })
        });

        setToast({ type: 'success', message: '✓ Data successfully sent to Google Sheets.' });
      } catch (err) {
        console.error('Webhook error:', err);
        setToast({ type: 'error', message: '✕ Failed to send data to Google Sheets.' });
      }
    }
  };

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial activity logs & subscribe to real-time changes
  React.useEffect(() => {
    let channel;
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data.map(d => ({
          id: d.id,
          userName: d.user_name,
          userAvatar: d.user_avatar,
          action: d.action,
          recordAffected: d.record_affected,
          moduleName: d.module_name,
          timestamp: d.timestamp ? new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        })));
      }
    };

    fetchLogs();

    // Supabase Real-time Notification Subscription
    channel = supabase
      .channel('realtime_activity_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newRow = payload.new;
          const newNotif = {
            id: newRow.id,
            userName: newRow.user_name,
            userAvatar: newRow.user_avatar,
            action: newRow.action,
            recordAffected: newRow.record_affected,
            moduleName: newRow.module_name,
            timestamp: 'Just now'
          };
          setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
          setUnreadCount(count => count + 1);
          setToast({
            type: 'info',
            message: `⚡ Real-time Activity: ${newRow.user_name} ${newRow.action.toLowerCase()} "${newRow.record_affected}" in ${newRow.module_name}`
          });
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          activePage={activePage}
          setActivePage={setActivePage}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          unreadCount={unreadCount}
          onOpenNotifications={() => {
            setShowNotifications(true);
            setUnreadCount(0);
          }}
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
        />

        <main className="main-content-wrapper" style={{ flex: 1, padding: '1.5rem 1.75rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
          <PageTransition pageKey={activePage}>
            {React.cloneElement(children, { searchQuery, triggerExportModal, setToast })}
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

      {/* Notification Drawer */}
      <SlideOver
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        title="System Notifications & Activity Feed"
        width="420px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {notifications.map((log) => (
            <div key={log.id} style={{
              display: 'flex',
              gap: '0.875rem',
              padding: '0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)'
            }}>
              <img
                src={log.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={log.userName}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                    {log.userName}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={12} /> {log.timestamp}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {log.action} <span style={{ fontWeight: 600 }}>{log.recordAffected}</span>
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'inline-block', marginTop: '4px' }}>
                  {log.moduleName}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SlideOver>

      {/* Export to Google Sheets Modal */}
      <ExportModal
        isOpen={exportState.isOpen}
        onClose={() => setExportState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmExport}
        moduleTitle={exportState.moduleTitle}
      />

      {/* Google Sheets Viewer Modal */}
      <GoogleSheetsViewerModal
        isOpen={sheetsState.isOpen}
        onClose={() => setSheetsState(prev => ({ ...prev, isOpen: false }))}
        data={sheetsState.data}
        columns={sheetsState.columns}
        title={sheetsState.title}
      />

      {/* Toast Snackbar */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
