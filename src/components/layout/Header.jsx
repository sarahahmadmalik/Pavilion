import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import {
  Sun,
  Moon,
  Bell,
  MessageSquare,
  User,
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
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { chatUnreadCount = 0 } = useNotifications() || {};

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const roleLabel = ROLE_LABELS[currentUser?.role] || currentUser?.role;

  return (
    <header style={{
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
      gap: '0.75rem',
      transition: 'background-color var(--transition-normal)'
    }}>

      {/* ─── Left: Mobile Hamburger + Welcome / Global Search Bar ─────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>

        {/* Mobile Hamburger */}
        <button
          onClick={onToggleMobileSidebar}
          className="btn btn-ghost header-mobile-hamburger"
          style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
          title="Open Menu"
        >
          <Menu size={22} color="var(--text-main)" />
        </button>

        {/* Global Search Bar */}
        <div style={{ flex: 1, maxWidth: '360px', minWidth: '120px' }}>
          <GlobalSearchBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setActivePage={setActivePage}
          />
        </div>
      </div>

      {/* ─── Right: Theme Toggle + Notifications + Profile ────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>

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

        {/* Team Chat Icon Button — visible to Admin & Staff */}
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

            <DropdownItem
              icon={<LogOut size={16} />}
              label="Sign Out"
              danger
              onClick={() => { setShowProfileMenu(false); setShowSignOutConfirm(true); }}
            />
          </AnimatedDropdown>
        </div>
      </div>

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
        danger={false}
      />
    </header>
  );
};
