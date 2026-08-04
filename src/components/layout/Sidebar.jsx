import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  CreditCard,
  Barcode,
  ClipboardList,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X
} from 'lucide-react';

const ACTIVE_COLOR   = '#4B7FE8';          // bright readable blue on dark bg
const ACTIVE_BG      = 'rgba(75, 127, 232, 0.14)';
const INACTIVE_COLOR = '#6B7A99';

export const Sidebar = ({
  activePage,
  setActivePage,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { currentUser, hasModulePermission, logout } = useAuth();
  const [logoHovered, setLogoHovered] = useState(false);

  const menuItems = [
    { key: 'dashboard',          label: 'Dashboard',            icon: LayoutDashboard, permission: true },
    { key: 'guest_list',         label: 'Guest List',           icon: Users,           permission: hasModulePermission('guest_list') },
    { key: 'gh_maintenance',     label: 'GH Maintenance',       icon: Wrench,          permission: hasModulePermission('gh_maintenance') },
    { key: 'gh_inventory',       label: 'GH Inventory',         icon: Package,         permission: hasModulePermission('gh_inventory') },
    { key: 'office_bills',       label: 'Office Bill Payments', icon: CreditCard,      permission: hasModulePermission('office_bills') },
    { key: 'office_assets',      label: 'Office Assets',        icon: Barcode,         permission: hasModulePermission('office_assets') },
    { key: 'office_maintenance', label: 'Office Maintenance',   icon: Wrench,          permission: hasModulePermission('office_maintenance') },
    { key: 'activity_log',       label: 'Activity Log',         icon: ClipboardList,   permission: currentUser?.role !== 'staff' },
    { key: 'user_management',    label: 'User Management',      icon: ShieldCheck,     permission: currentUser?.role === 'super_admin' }
  ];

  const handleNavClick = (key) => {
    setActivePage(key);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const handleSignOut = () => {
    logout();
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 10, 20, 0.72)',
            backdropFilter: 'blur(4px)',
            zIndex: 1400
          }}
        />
      )}

      <aside
        className={`sidebar-container ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: isCollapsed ? '72px' : '248px',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 1500,
          transition: 'width 0.26s cubic-bezier(0.16, 1, 0.3, 1)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '3px 0 20px rgba(0,0,0,0.22)',
          flexShrink: 0,
          overflow: 'hidden'
        }}
      >

        {/* ── Logo Header ── */}
        <div style={{
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '0 0.5rem' : '0 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
          gap: '0.625rem',
          position: 'relative'
        }}>
          {/* Logo container */}
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            onClick={() => { if (isCollapsed) setIsCollapsed(false); }}
            style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              cursor: isCollapsed ? 'pointer' : 'default',
              flexShrink: 0
            }}
            title={isCollapsed ? 'Expand Sidebar' : undefined}
          >
            <img
              src="/logo.png"
              alt="MTA Ghana"
              style={{
                width: '48px',
                height: '48px',
                objectFit: 'contain',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                padding: '3px',
                display: 'block'
              }}
            />

            {/* Hover overlay on logo ONLY when collapsed */}
            {isCollapsed && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(8, 12, 28, 0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: logoHovered ? 1 : 0,
                  transition: 'opacity 0.18s ease',
                  pointerEvents: 'none'
                }}
              >
                <ChevronRight size={18} color="#4B7FE8" strokeWidth={2.5} />
              </div>
            )}
          </div>

          {/* Text — visible when expanded */}
          {!isCollapsed && (
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <p style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                whiteSpace: 'nowrap'
              }}>
                MTA Ghana
              </p>
              <p style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: '#4B7FE8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '2px',
                whiteSpace: 'nowrap'
              }}>
                Operations Panel
              </p>
            </div>
          )}

          {/* Collapse button on right side when expanded */}
          {!isCollapsed && !isMobileOpen && (
            <button
              onClick={() => setIsCollapsed(true)}
              title="Collapse Sidebar"
              style={{
                flexShrink: 0,
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#6B7A99',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                marginLeft: 'auto'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(75,127,232,0.18)';
                e.currentTarget.style.color = '#4B7FE8';
                e.currentTarget.style.borderColor = 'rgba(75,127,232,0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.color = '#6B7A99';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              <ChevronLeft size={14} strokeWidth={2.5} />
            </button>
          )}


          {/* Mobile close */}
          {isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              style={{
                background: 'none', border: 'none',
                color: '#5D6A85', cursor: 'pointer',
                padding: '0.25rem', display: 'flex', alignItems: 'center',
                marginLeft: 'auto'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>


        {/* ── Navigation ── */}
        <nav style={{
          flex: 1,
          padding: '1rem 0.625rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {menuItems.map((item) => {
            if (!item.permission) return null;
            const Icon = item.icon;
            const isActive = activePage === item.key;

            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8125rem',
                  padding: isCollapsed ? '0.75rem 0' : '0.625rem 0.875rem',
                  borderRadius: '9px',
                  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                  color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  transition: 'background-color 0.14s ease, color 0.14s ease',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.045)';
                    e.currentTarget.style.color = '#9AAEC8';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = INACTIVE_COLOR;
                  }
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.6}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                  style={{ flexShrink: 0 }}
                />
                {!isCollapsed && (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Sign Out ── */}
        <div style={{
          padding: '0.625rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0
        }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8125rem',
              padding: isCollapsed ? '0.75rem 0' : '0.625rem 0.875rem',
              borderRadius: '9px',
              backgroundColor: 'transparent',
              color: '#5D6A85',
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              transition: 'background-color 0.14s ease, color 0.14s ease',
              fontFamily: 'inherit',
              fontWeight: 400
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.10)';
              e.currentTarget.style.color = '#F87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#5D6A85';
            }}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={20} strokeWidth={1.6} style={{ flexShrink: 0, color: 'inherit' }} />
            {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
