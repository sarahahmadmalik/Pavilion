import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { BrandLogo } from '../common/BrandLogo.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Package,
  CreditCard,
  Car,
  Ticket,
  ClipboardList,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  LogOut,
  X,
  BarChart3,
  FolderKanban,
  Briefcase,
  Contact,
  FileText,
  BedDouble,
  Megaphone,
  MessageSquare
} from 'lucide-react';

const ACTIVE_COLOR   = '#4B7FE8';
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
  const { notifications, chatUnreadCount = 0 } = useNotifications() || {};
  const [logoHovered, setLogoHovered] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const ticketUnreadCount = (notifications || []).filter(n => n.ticket_id && !n.is_read).length;

  const navCategories = [
    {
      label: null,
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: true },
        { key: 'analytics', label: 'Community Analytics', icon: BarChart3, permission: hasModulePermission('analytics') }
      ]
    },
    {
      label: 'Guest House',
      items: [
        { key: 'room_occupancy', label: 'Suites & Occupancy', icon: BedDouble, permission: hasModulePermission('room_occupancy') },
        { key: 'guest_list', label: 'Guest House List', icon: Users, permission: hasModulePermission('guest_list') },
        { key: 'gh_maintenance', label: 'GH Maintenance', icon: Wrench, permission: hasModulePermission('gh_maintenance') },
        { key: 'gh_inventory', label: 'GH Inventory', icon: Package, permission: hasModulePermission('gh_inventory') }
      ]
    },
    {
      label: 'Community & Fleet',
      items: [
        { key: 'office_bills', label: 'Office Bill Payments', icon: CreditCard, permission: hasModulePermission('office_bills') },
        { key: 'vehicles_maintenance', label: 'Vehicles Maint', icon: Car, permission: hasModulePermission('vehicles_maintenance') },
        { key: 'office_maintenance', label: 'Office Maintenance', icon: Wrench, permission: hasModulePermission('office_maintenance') },
        { key: 'projects', label: 'Community Projects', icon: FolderKanban, permission: hasModulePermission('projects') },
        { key: 'community_events', label: 'Notices & Events', icon: Megaphone, permission: hasModulePermission('community_events') }
      ]
    },
    {
      label: 'People & Governance',
      items: [
        { key: 'vendors', label: 'Vendors & Contracts', icon: Briefcase, permission: hasModulePermission('vendors') },
        { key: 'staff_directory', label: 'Community Staff', icon: Contact, permission: hasModulePermission('staff_directory') },
        { key: 'documents', label: 'Document Vault', icon: FileText, permission: hasModulePermission('documents') }
      ]
    },
    {
      label: 'Communication & Admin',
      items: [
        { key: 'team_chat', label: 'Team Chat', icon: MessageSquare, permission: currentUser?.role !== 'super_admin', badge: chatUnreadCount },
        { key: 'tickets', label: 'Support Tickets', icon: Ticket, permission: true, badge: ticketUnreadCount },
        { key: 'activity_log', label: 'Activity Log', icon: ClipboardList, permission: currentUser?.role !== 'staff' },
        { key: 'user_management', label: 'User Management', icon: ShieldCheck, permission: currentUser?.role === 'super_admin' }
      ]
    }
  ];

  const handleNavClick = (key) => {
    setActivePage(key);
    if (isMobileOpen) setIsMobileOpen(false);
  };

  const renderNavItem = (item) => {
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
          fontFamily: 'inherit',
          position: 'relative'
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
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Icon
            size={20}
            strokeWidth={isActive ? 2.2 : 1.6}
            color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
          />
          {!!item.badge && (
            <span style={{
              position: 'absolute',
              top: isCollapsed ? '-4px' : '-5px',
              right: isCollapsed ? '-6px' : '-7px',
              minWidth: '15px',
              height: '15px',
              padding: '0 3px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              color: '#fff',
              fontSize: '0.5625rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              border: '1.5px solid var(--bg-sidebar)'
            }}>
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
            {item.label}
          </span>
        )}
      </button>
    );
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    await logout();
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
              cursor: isCollapsed ? 'pointer' : 'default',
              flexShrink: 0
            }}
            title={isCollapsed ? 'Expand Sidebar' : undefined}
          >
            <BrandLogo size={isCollapsed ? 28 : 30} showText={!isCollapsed} lightText={true} subtitle="Community & Guest House" />

            {/* Hover overlay on logo ONLY when collapsed */}
            {isCollapsed && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '12px',
                  backgroundColor: 'rgba(8, 12, 28, 0.78)',
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
          padding: '0.85rem 0.625rem',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {navCategories.map((cat, idx) => {
            const visibleItems = cat.items.filter(i => i.permission);
            if (visibleItems.length === 0) return null;
            return (
              <React.Fragment key={cat.label || idx}>
                {cat.label && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    margin: isCollapsed ? '0.65rem 0 0.2rem' : '0.85rem 0.25rem 0.2rem',
                    flexShrink: 0
                  }}>
                    <div style={{ flex: isCollapsed ? '1' : '0 0 10px', height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    {!isCollapsed && (
                      <span style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#4B5773',
                        whiteSpace: 'nowrap'
                      }}>
                        {cat.label}
                      </span>
                    )}
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  </div>
                )}
                {visibleItems.map(renderNavItem)}
              </React.Fragment>
            );
          })}
        </nav>

        {/* ── Sign Out & Collapse Toggle ── */}
        <div style={{
          padding: '0.625rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          flexDirection: isCollapsed ? 'column' : 'row',
          gap: '0.375rem'
        }}>
          <button
            onClick={handleSignOut}
            style={{
              flex: isCollapsed ? 'none' : 1,
              width: isCollapsed ? '100%' : 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.8125rem',
              padding: isCollapsed ? '0.625rem 0' : '0.625rem 0.875rem',
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

          {!isMobileOpen && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{
                flexShrink: 0,
                width: isCollapsed ? '100%' : '28px',
                height: '28px',
                borderRadius: '7px',
                border: '1px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                color: '#6B7A99',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
                marginLeft: isCollapsed ? 0 : 'auto'
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
              {isCollapsed ? <ChevronRight size={15} strokeWidth={2.5} /> : <ChevronLeft size={15} strokeWidth={2.5} />}
            </button>
          )}
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={confirmSignOut}
        title="Confirm Sign Out"
        headline="Sign out of PAVILION?"
        message="You will need to sign in again to access your workspace."
        confirmText="Sign Out"
        confirmLoadingText="Signing out..."
        icon={LogOut}
        confirmIcon={LogOut}
        danger={false}
      />
    </>
  );
};
