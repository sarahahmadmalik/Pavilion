import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Layout } from './components/layout/Layout.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { GuestList } from './pages/GuestList.jsx';
import { GuestHouseMaintenance } from './pages/GuestHouseMaintenance.jsx';
import { GuestHouseInventory } from './pages/GuestHouseInventory.jsx';
import { OfficeBillPayments } from './pages/OfficeBillPayments.jsx';
import { OfficeAssetList } from './pages/OfficeAssetList.jsx';
import { OfficeMaintenance } from './pages/OfficeMaintenance.jsx';
import { ActivityLog } from './pages/ActivityLog.jsx';
import { UserManagement } from './pages/UserManagement.jsx';
import { ProfileSettings } from './pages/ProfileSettings.jsx';
import { PageLoader } from './components/common/Loader.jsx';
import { ProtectedRoute } from './components/common/ProtectedRoute.jsx';

const MainContent = () => {
  const { currentUser, authLoading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  // Show full-page loader while Supabase checks the session
  if (authLoading) {
    return <PageLoader message="Initializing MTA Ghana Portal..." />;
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
      case 'office_assets':
        return (
          <ProtectedRoute moduleKey="office_assets" moduleName="Office Asset List">
            <OfficeAssetList />
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
      case 'profile':
        return <ProfileSettings />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
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
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

