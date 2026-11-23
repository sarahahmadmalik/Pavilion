import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import {
  Sun,
  Moon,
  Bell,
  MessageSquare,
  Search,
  User,
  Users,
  LogOut,
  ChevronDown,
  Shield,
  ShieldCheck,
  Menu,
  Settings,
} from 'lucide-react';
import {
  AnimatedDropdown,
  DropdownItem,
  DropdownDivider
} from '../common/AnimatedDropdown.jsx';
import { GlobalSearchBar } from './GlobalSearchBar.jsx';
import { UserAvatar } from '../common/UserAvatar.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { Modal } from '../common/Modal.jsx';
import { DEMO_ACCOUNTS } from '../../lib/demoAccounts.js';

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
  const { currentUser, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { chatUnreadCount = 0 } = useNotifications() || {};

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoList, setShowDemoList] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [switchingDemo, setSwitchingDemo] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleSwitchDemoUser = async (acc) => {
    setShowDemoList(false);
    setShowProfileMenu(false);
    if (acc.email === currentUser?.email) return;
    setSwitchingDemo(true);
    await login(acc.email, acc.password);
    setSwitchingDemo(false);
    setActivePage('dashboard');
  };

  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;

  return (
    <header className="app-header" style={{
      height: '68px',
      minHeight: '68px',
      flexShrink: 0,
      boxSizing: 'border-box',
      backgroundColor: 'var(--bg-header)',
      borderBottom: '1px solid var(--border-header)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 90,
      gap: '0.5rem',
      transition: 'background-color var(--transition-normal)'
    }}>

      {/* ─── Left: Mobile Hamburger + Desktop Search Bar ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>

        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-ghost header-mobile-hamburger"
          style={{ padding: '0.45rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
          title="Open Menu"
        >
          <Menu size={22} color="var(--text-main)" />
        </button>

        {/* Global Search Bar — Desktop / Tablet (> 768px) */}
        <div className="desktop-search-bar" style={{ flex: 1, maxWidth: '360px', minWidth: '120px' }}>
          <GlobalSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setActivePage={setActivePage}
          />
        </div>
      </div>

      {/* ─── Right: Mobile Search Icon + Theme Toggle + Chat + Notifications + Profile ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
        <style>{`
          @keyframes notifPulseRing {
            0% { transform: scale(1); opacity: 0.55; }
            70% { transform: scale(2.1); opacity: 0; }
            100% { transform: scale(2.1); opacity: 0; }
          }
        `}</style>

        {/* Mobile Search Icon Trigger — opens Global Search Modal */}
        <button
          type="button"
          onClick={() => setShowSearchModal(true)}
          className="btn btn-ghost mobile-search-trigger"
          style={{ padding: '0.5rem', borderRadius: '50%' }}
          title="Search"
          aria-label="Search"
        >
          <Search size={18} color="var(--text-muted)" />
        </button>

        {/* Theme Toggle Button — visible on desktop / tablet (>768px) */}
        <button
          onClick={toggleTheme}
          className="btn btn-ghost desktop-theme-toggle"
          style={{ padding: '0.5rem', borderRadius: '50%' }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light'
            ? <Moon size={18} color="var(--text-muted)" />
            : <Sun size={18} color="#F59E0B" />}
        </button>

        {/* Team Chat Icon Button — Admin & Staff only */}
        {currentUser?.role !== 'super_admin' && (
          <button
            onClick={() => setActivePage('team_chat')}
            className="btn btn-ghost"
            style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
            title="Team Chat"
          >
            <MessageSquare size={18} color={activePage === 'team_chat' ? 'var(--color-primary)' : 'var(--text-muted)'} />
            {chatUnreadCount > 0 && (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#EF4444',
                    opacity: 0.55,
                    animation: 'notifPulseRing 1.8s ease-out infinite'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  minWidth: '16px',
                  height: '16px',
                  background: 'linear-gradient(145deg, #F87171, #DC2626)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  padding: '0 3px',
                  lineHeight: 1,
                  boxShadow: '0 0 0 2px var(--bg-header), 0 1px 4px rgba(220,38,38,0.5)'
                }}>
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              </>
            )}
          </button>
        )}

        {/* Notification Bell — visible to every role */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-ghost"
          style={{ padding: '0.5rem', borderRadius: '50%', position: 'relative' }}
          title="Notifications"
        >
          <Bell size={18} color="var(--text-muted)" />
          {unreadCount > 0 && (
            <>
              {/* Pulsing glow ring behind the badge */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  opacity: 0.55,
                  animation: 'notifPulseRing 1.8s ease-out infinite'
                }}
              />
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                minWidth: '16px',
                height: '16px',
                background: 'linear-gradient(145deg, #F87171, #DC2626)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.5625rem',
                fontWeight: 700,
                padding: '0 3px',
                lineHeight: 1,
                boxShadow: '0 0 0 2px var(--bg-header), 0 1px 4px rgba(220,38,38,0.5)'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
              <style>{`
                @keyframes notifPulseRing {
                  0% { transform: scale(1); opacity: 0.55; }
                  70% { transform: scale(2.1); opacity: 0; }
                  100% { transform: scale(2.1); opacity: 0; }
                }
              `}</style>
            </>
          )}
        </button>

        {/* Profile Avatar Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.25rem 0.375rem',
              borderRadius: 'var(--radius-md)',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserAvatar name={currentUser?.name} src={currentUser?.avatar} size={32} />
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

          {/* Profile Dropdown */}
          <AnimatedDropdown
            isOpen={showProfileMenu}
            onClose={() => setShowProfileMenu(false)}
            width="240px"
            align="right"
          >
            {/* User Info Header */}
            <div style={{ padding: '0.75rem 0.875rem 0.625rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <UserAvatar name={currentUser?.name} src={currentUser?.avatar} size={38} />
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
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'capitalize'
              }}>
                {ROLE_ICONS[currentUser?.role]}
                {roleLabel}
              </div>
            </div>

            <DropdownDivider />

            {/* Theme Toggle option inside profile dropdown — visible on mobile (<=768px) */}
            <div className="mobile-only-theme-dropdown">
              <DropdownItem
                icon={theme === 'light' ? <Moon size={16} color="#475569" /> : <Sun size={16} color="#F59E0B" />}
                label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                onClick={toggleTheme}
              />
            </div>

            <DropdownItem
              icon={<Settings size={16} />}
              label="Profile & Settings"
              onClick={() => { setActivePage('profile'); setShowProfileMenu(false); }}
            />

            <DropdownDivider />

            {/* Switch Demo User inside Profile Dropdown */}
            <button
              type="button"
              onClick={() => setShowDemoList(prev => !prev)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.55rem 0.875rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-main)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                fontFamily: 'inherit',
                borderRadius: '6px'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <Users size={16} color="var(--color-primary)" />
                <span>Switch Demo User</span>
              </span>
              <ChevronDown
                size={14}
                color="var(--text-muted)"
                style={{
                  transition: 'transform 0.16s ease',
                  transform: showDemoList ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {showDemoList && (
              <div style={{ padding: '0.25rem 0.5rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {DEMO_ACCOUNTS.map(acc => {
                  const isCurrent = acc.email === currentUser?.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={switchingDemo}
                      onClick={() => handleSwitchDemoUser(acc)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        padding: '0.45rem 0.625rem',
                        borderRadius: '6px',
                        backgroundColor: isCurrent ? 'var(--color-primary-light)' : 'transparent'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-main)' }}>{acc.name}</span>
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '999px',
                        backgroundColor: acc.role === 'super_admin' ? 'var(--color-primary-light)' : acc.role === 'admin' ? 'var(--status-blue-bg)' : 'var(--status-green-bg)',
                        color: acc.role === 'super_admin' ? 'var(--color-primary)' : acc.role === 'admin' ? 'var(--status-blue-text)' : 'var(--status-green-text)'
                      }}>
                        {acc.roleLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <DropdownDivider />

            <DropdownItem
              icon={<LogOut size={16} />}
              label="Sign Out"
              danger
              onClick={() => { setShowProfileMenu(false); setShowSignOutConfirm(true); }}
            />
          </AnimatedDropdown>
        </div>
      </div>

      {/* Global Search Modal (Mobile) */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        title="Search Workspace"
        maxWidth="540px"
      >
        <GlobalSearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActivePage={setActivePage}
          inModal={true}
          onCloseModal={() => setShowSearchModal(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={logout}
        title="Confirm Sign Out"
        headline="Sign out of PAVILION?"
        message="You will need to sign in again to access your workspace."
        confirmText="Sign Out"
        confirmLoadingText="Signing out..."
        icon={LogOut}
        confirmIcon={LogOut}
        danger={true}
      />
    </header>
  );
};
