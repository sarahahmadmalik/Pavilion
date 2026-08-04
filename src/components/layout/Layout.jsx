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

  const handleConfirmExport = (option) => {
    const exportedData = option === 'all' ? exportState.data : exportState.data.slice(0, 10);
    setToast({
      type: 'success',
      message: `Exported ${exportedData.length} records successfully to Google Sheets!`,
      linkText: 'Open in Google Sheets',
      onLinkClick: () => {
        setSheetsState({
          isOpen: true,
          data: exportedData,
          columns: exportState.columns,
          title: `MTA Ghana - ${exportState.moduleTitle}`
        });
      }
    });
  };

  const activityLogs = store.getActivityLogs().slice(0, 8);

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
          onOpenNotifications={() => setShowNotifications(true)}
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
          <span>MTA Ghana © 2026 Majlis-e-Ahmadiyya Institutional Portal • All Rights Reserved</span>
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
          {activityLogs.map((log) => (
            <div key={log.id} style={{
              display: 'flex',
              gap: '0.875rem',
              padding: '0.875rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card-hover)',
              border: '1px solid var(--border-color)'
            }}>
              <img
                src={log.userAvatar}
                alt={log.userName}
                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)' }}>
                    {log.userName}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Clock size={12} /> {log.timestamp.split(' ')[1]}
                  </span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', marginTop: '2px' }}>
                  {log.action} <span style={{ fontWeight: 600 }}>{log.recordAffected}</span>
                </p>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', display: 'inline-block', marginTop: '4px' }}>
                  Module: {log.moduleName}
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
