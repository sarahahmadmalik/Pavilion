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

const ACTIVE_COLOR   = '#38BDF8';
const ACTIVE_BG      = 'rgba(56, 189, 248, 0.10)';
const INACTIVE_COLOR = '#5D6A85';

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
        <div
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            padding: isCollapsed ? '0' : '0 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            flexShrink: 0,
            position: 'relative',
            gap: '0.75rem'
          }}
        >
          {/* Logo — hover reveals expand/collapse icon overlay */}
          <div
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              position: 'relative',
              width: '52px',
              height: '52px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <img
              src="/logo.png"
              alt="MTA Ghana"
              style={{
                width: '52px',
                height: '52px',
                objectFit: 'contain',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                padding: '3px',
                display: 'block',
                transition: 'opacity 0.18s ease'
              }}
            />
            {/* Hover overlay: shows arrow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                backgroundColor: 'rgba(8, 12, 28, 0.70)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: logoHovered ? 1 : 0,
                transition: 'opacity 0.18s ease',
                pointerEvents: 'none'
              }}
            >
              {isCollapsed
                ? <ChevronRight size={20} color="#38BDF8" strokeWidth={2.5} />
                : <ChevronLeft  size={20} color="#38BDF8" strokeWidth={2.5} />
              }
            </div>
          </div>

          {/* Text: MTA Ghana + Operations Panel — visible when expanded */}
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
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
                color: '#38BDF8',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop: '2px',
                whiteSpace: 'nowrap'
              }}>
                Operations Panel
              </p>
            </div>
          )}

          {/* Mobile close button */}
          {!isCollapsed && isMobileOpen && (
            <button
              onClick={() => setIsMobileOpen(false)}
              className="mobile-only-btn"
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
