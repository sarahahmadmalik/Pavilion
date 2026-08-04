import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  Sun,
  Moon,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Shield,
  ShieldCheck,
  Menu,
  Settings,
  ChevronRight
} from 'lucide-react';
import {
  AnimatedDropdown,
  DropdownItem,
  DropdownDivider
} from '../common/AnimatedDropdown.jsx';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff'
};

const ROLE_ICONS = {
  super_admin: <ShieldCheck size={13} />,
  admin: <Shield size={13} />,
  staff: <User size={13} />
};

export const Header = ({ activePage, setActivePage, searchQuery, setSearchQuery, unreadCount, onOpenNotifications, onToggleMobileSidebar }) => {
  const { currentUser, logout, switchRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const firstName = currentUser?.name?.split(' ')[0] || 'User';
  const isDashboard = activePage === 'dashboard';

  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;

  return (
    <header style={{
      height: '80px',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-header)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      transition: 'background-color var(--transition-normal)'
    }}>
      {/* Left: Mobile Hamburger + Welcome text on dashboard */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-ghost header-mobile-hamburger"
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
          title="Open Menu"
        >
          <Menu size={22} color="var(--text-main)" />
        </button>

        {/* Welcome message on dashboard, or search elsewhere */}
        {isDashboard ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontSize: '1.375rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em'
            }}>
              Welcome back, {firstName}
            </span>
          </div>
        ) : null}

        <div className="header-search-container" style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search records, guests, assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem', fontSize: '0.8125rem' }}
          />
        </div>
      </div>

      {/* Right: Theme Toggle + Notifications + Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost"
          style={{ padding: '0.5rem', borderRadius: '50%' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} color="#475569" /> : <Sun size={18} color="#F59E0B" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-ghost"
          style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
          title="Notifications"
        >
          <Bell size={18} color="var(--text-muted)" />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              minWidth: '16px',
              height: '16px',
              backgroundColor: '#EF4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.625rem',
              fontWeight: 'bold',
              padding: '0 4px'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Avatar Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowRoleMenu(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser?.name}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--color-primary)'
              }}
            />
            <div className="header-user-info" style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', lineHeight: 1.2 }}>
                {currentUser?.name}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                {roleLabel}
              </span>
            </div>
            <ChevronDown
              size={14}
              color="var(--text-muted)"
              style={{
                transition: 'transform 0.18s ease',
                transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)'
              }}
            />
          </button>

          {/* Animated Profile Dropdown */}
          <AnimatedDropdown
            isOpen={showProfileMenu}
            onClose={() => setShowProfileMenu(false)}
            width="240px"
            align="right"
          >
            {/* User Info Header */}
            <div style={{ padding: '0.625rem 0.75rem 0.5rem', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.name}
                  style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                />
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', lineHeight: 1.2 }}>
                    {currentUser?.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {currentUser?.email}
                  </span>
                </div>
              </div>

              {/* Role badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                marginTop: '0.625rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'capitalize'
              }}>
                {ROLE_ICONS[currentUser?.role]}
                {roleLabel}
              </div>
            </div>

            <DropdownDivider />


            <DropdownItem
              icon={<Settings />}
              label="Profile & Settings"
              onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}
            />

            <DropdownItem
              icon={<LogOut />}
              label="Sign Out"
              danger
              onClick={() => { logout(); setShowProfileMenu(false); }}
            />
          </AnimatedDropdown>
        </div>
      </div>
    </header>
  );
};
