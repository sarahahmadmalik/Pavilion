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
import { AccessDenied } from './pages/AccessDenied.jsx';

const MainContent = () => {
  const { currentUser } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (!currentUser) {
    return <Login onLoginSuccess={() => setActivePage('dashboard')} />;
  }

  const renderPageComponent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'guest_list':
        return <GuestList />;
      case 'gh_maintenance':
        return <GuestHouseMaintenance />;
      case 'gh_inventory':
        return <GuestHouseInventory />;
      case 'office_bills':
        return <OfficeBillPayments />;
      case 'office_assets':
        return <OfficeAssetList />;
      case 'office_maintenance':
        return <OfficeMaintenance />;
      case 'activity_log':
        return <ActivityLog />;
      case 'user_management':
        return <UserManagement />;
      case 'profile':
        return <ProfileSettings />;
      default:
        return <Dashboard setActivePage={setActivePage} />;
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
    >
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

