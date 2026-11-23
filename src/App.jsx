import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { GuestList } from './pages/GuestList.jsx';
import { GuestHouseMaintenance } from './pages/GuestHouseMaintenance.jsx';
import { GuestHouseInventory } from './pages/GuestHouseInventory.jsx';
import { OfficeBillPayments } from './pages/OfficeBillPayments.jsx';
import { VehicleMaintenance } from './pages/VehicleMaintenance.jsx';
import { OfficeMaintenance } from './pages/OfficeMaintenance.jsx';
import { Tickets } from './pages/Tickets.jsx';
import { ActivityLog } from './pages/ActivityLog.jsx';
import { UserManagement } from './pages/UserManagement.jsx';
import { ProfileSettings } from './pages/ProfileSettings.jsx';
import { ExecutiveAnalytics } from './pages/ExecutiveAnalytics.jsx';
import { ProjectsBoard } from './pages/ProjectsBoard.jsx';
import { VendorHub } from './pages/VendorHub.jsx';
import { StaffDirectory } from './pages/StaffDirectory.jsx';
import { DocumentVault } from './pages/DocumentVault.jsx';
import { RoomOccupancy } from './pages/RoomOccupancy.jsx';
import { CommunityEvents } from './pages/CommunityEvents.jsx';
import { TeamChat } from './pages/TeamChat.jsx';
import { PageLoader } from './components/common/Loader.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { NotFound } from './pages/NotFound.jsx';

const MainContent = () => {
  const { currentUser, authLoading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const isUnknownPath = window.location.pathname !== '/' && window.location.pathname !== '/index.html';

  if (isUnknownPath) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <NotFound onGoHome={() => { window.history.replaceState(null, '', '/'); window.location.reload(); }} />
      </div>
    );
  }

  // Show full-page loader while Supabase checks the session
  if (authLoading) {
    return <PageLoader message="Initializing PAVILION Portal..." />;
  }

  if (!currentUser) {
    return <Login onLoginSuccess={() => setActivePage('dashboard')} />;
  }

  const renderPageComponent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'guest_list':
        return (
          <ProtectedRoute moduleKey="guest_list" moduleName="Guest List Management">
            <GuestList />
          </ProtectedRoute>
        );
      case 'gh_maintenance':
        return (
          <ProtectedRoute moduleKey="gh_maintenance" moduleName="Guest House Maintenance">
            <GuestHouseMaintenance />
          </ProtectedRoute>
        );
      case 'gh_inventory':
        return (
          <ProtectedRoute moduleKey="gh_inventory" moduleName="Guest House Inventory">
            <GuestHouseInventory />
          </ProtectedRoute>
        );
      case 'office_bills':
        return (
          <ProtectedRoute moduleKey="office_bills" moduleName="Office Bill Payments">
            <OfficeBillPayments />
          </ProtectedRoute>
        );
      case 'vehicles_maintenance':
        return (
          <ProtectedRoute moduleKey="vehicles_maintenance" moduleName="Vehicles Maintenance">
            <VehicleMaintenance />
          </ProtectedRoute>
        );
      case 'office_maintenance':
        return (
          <ProtectedRoute moduleKey="office_maintenance" moduleName="Office Maintenance">
            <OfficeMaintenance />
          </ProtectedRoute>
        );
      case 'activity_log':
        return (
          <ProtectedRoute moduleKey="activity_log" moduleName="System Audit & Activity Logs">
            <ActivityLog />
          </ProtectedRoute>
        );
      case 'user_management':
        return (
          <ProtectedRoute moduleKey="user_management" moduleName="User Account Management">
            <UserManagement />
          </ProtectedRoute>
        );
      case 'tickets':
        return <Tickets />;
      case 'analytics':
        return (
          <ProtectedRoute moduleKey="analytics" moduleName="Executive Analytics">
            <ExecutiveAnalytics />
          </ProtectedRoute>
        );
      case 'projects':
        return (
          <ProtectedRoute moduleKey="projects" moduleName="Projects & Task Board">
            <ProjectsBoard />
          </ProtectedRoute>
        );
      case 'vendors':
        return (
          <ProtectedRoute moduleKey="vendors" moduleName="Vendor & Contract Hub">
            <VendorHub />
          </ProtectedRoute>
        );
      case 'staff_directory':
        return (
          <ProtectedRoute moduleKey="staff_directory" moduleName="Staff & HR Directory">
            <StaffDirectory />
          </ProtectedRoute>
        );
      case 'documents':
        return (
          <ProtectedRoute moduleKey="documents" moduleName="Document & Policy Vault">
            <DocumentVault />
          </ProtectedRoute>
        );
      case 'room_occupancy':
        return (
          <ProtectedRoute moduleKey="room_occupancy" moduleName="Suites & Room Occupancy">
            <RoomOccupancy />
          </ProtectedRoute>
        );
      case 'community_events':
        return (
          <ProtectedRoute moduleKey="community_events" moduleName="Notices & Community Events">
            <CommunityEvents />
          </ProtectedRoute>
        );
      case 'team_chat':
        return <TeamChat />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <NotFound onGoHome={() => setActivePage('dashboard')} />;
    }
  };

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPageComponent()}
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <MainContent />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

