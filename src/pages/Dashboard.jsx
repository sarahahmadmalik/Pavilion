import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore } from '../lib/store.js';
import { MaintenancePieChart } from '../components/charts/MaintenancePieChart.jsx';
import { BillsBarChart } from '../components/charts/BillsBarChart.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import {
  UserCheck,
  Wrench,
  Package,
  CreditCard,
  Barcode,
  ArrowRight,
  Activity,
  ChevronRight,
  Users,
  ClipboardList,
  ShieldCheck
} from 'lucide-react';

export const Dashboard = ({ setActivePage }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const [data, setData] = useState({
    users: store.getUsers(),
    guests: store.getGuests(),
    ghMaintenance: store.getGHMaintenance(),
    ghInventory: store.getGHInventory(),
    bills: store.getOfficeBills(),
    officeAssets: store.getOfficeAssets(),
    officeMaintenance: store.getOfficeMaintenance(),
    activityLogs: store.getActivityLogs()
  });

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      setData({
        users: store.getUsers(),
        guests: store.getGuests(),
        ghMaintenance: store.getGHMaintenance(),
        ghInventory: store.getGHInventory(),
        bills: store.getOfficeBills(),
        officeAssets: store.getOfficeAssets(),
        officeMaintenance: store.getOfficeMaintenance(),
        activityLogs: store.getActivityLogs()
      });
    });
    return unsubscribe;
  }, []);

  // Compute Statistics per module
  const totalGuestsCheckedIn = data.guests.length;

  const allMaintenance = [...data.ghMaintenance, ...data.officeMaintenance];
  const openMaintenanceCount = allMaintenance.filter(m => m.status === 'Open').length;
  const inProgressMaintenanceCount = allMaintenance.filter(m => m.status === 'In Progress').length;
  const resolvedMaintenanceCount = allMaintenance.filter(m => m.status === 'Resolved').length;

  const totalInventoryCount = data.ghInventory.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  const totalBillsAmount = data.bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalAssetsCount = data.officeAssets.length;
  const officeMaintenanceOpen = data.officeMaintenance.filter(m => m.status === 'Open').length;

  const role = currentUser?.role || 'super_admin';

  // Filtered activity feed based on module access permissions
  const filteredActivityLogs = data.activityLogs.filter(log => {
    if (role === 'super_admin' || role === 'admin') return true;
    const key = log.moduleName.toLowerCase().replace(/\s+/g, '_');
    return hasModulePermission(key);
  }).slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      

      {/* Access-Based Module KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        
        {/* 1. Guest List Stat Card */}
        {hasModulePermission('guest_list') && (
          <div
            onClick={() => setActivePage('guest_list')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            className="hover-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Checked-in Guests
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {totalGuestsCheckedIn}
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#DBEAFE', color: '#1D4ED8' }}>
                <UserCheck size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Guest List <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 2. Guest House Maintenance Stat Card */}
        {hasModulePermission('gh_maintenance') && (
          <div
            onClick={() => setActivePage('gh_maintenance')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Guest House Repairs
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: data.ghMaintenance.filter(m => m.status === 'Open').length > 0 ? '#EF4444' : 'var(--text-main)', marginTop: '0.25rem' }}>
                  {data.ghMaintenance.filter(m => m.status === 'Open').length} Open
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
                <Wrench size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View GH Maintenance <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 3. Guest House Inventory Stat Card */}
        {hasModulePermission('gh_inventory') && (
          <div
            onClick={() => setActivePage('gh_inventory')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Inventory Items
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {totalInventoryCount} Units
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                <Package size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Inventory Catalog <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 4. Office Bill Payments Stat Card */}
        {hasModulePermission('office_bills') && (
          <div
            onClick={() => setActivePage('office_bills')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Office Bill Payments
                </span>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  GHS {totalBillsAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#DCFCE7', color: '#15803D' }}>
                <CreditCard size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Bill Disbursements <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 5. Office Asset List Stat Card */}
        {hasModulePermission('office_assets') && (
          <div
            onClick={() => setActivePage('office_assets')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Tagged Office Assets
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {totalAssetsCount} Assets
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#E0E7FF', color: '#4338CA' }}>
                <Barcode size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Asset Registry <ChevronRight size={14} />
            </div>
          </div>
        )}

        {/* 6. Office Maintenance Stat Card */}
        {hasModulePermission('office_maintenance') && (
          <div
            onClick={() => setActivePage('office_maintenance')}
            style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Office Maintenance
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: officeMaintenanceOpen > 0 ? '#EF4444' : 'var(--text-main)', marginTop: '0.25rem' }}>
                  {officeMaintenanceOpen} Open
                </h3>
              </div>
              <div style={{ padding: '0.625rem', borderRadius: 'var(--radius-md)', backgroundColor: '#FFEDD5', color: '#C2410C' }}>
                <Wrench size={22} />
              </div>
            </div>
            <div style={{ marginTop: '0.875rem', fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              View Office Maintenance <ChevronRight size={14} />
            </div>
          </div>
        )}

      </div>

      {/* Analytics Charts & Recent Activity Row (Shown based on access) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* Maintenance Breakdown Chart */}
        {(hasModulePermission('gh_maintenance') || hasModulePermission('office_maintenance')) && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Maintenance Issues Breakdown
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Status breakdown across Guest House & Office Facilities.
            </p>
            <MaintenancePieChart
              openCount={openMaintenanceCount}
              inProgressCount={inProgressMaintenanceCount}
              resolvedCount={resolvedMaintenanceCount}
            />
          </div>
        )}

        {/* Bills Payment Chart */}
        {hasModulePermission('office_bills') && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Monthly Office Bill Disbursements
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Cheque payments trend in Ghanaian Cedi (GHS).
            </p>
            <BillsBarChart billItems={data.bills} />
          </div>
        )}

        {/* Recent Audit Activity Feed — Timeline Style */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--color-primary)" /> Recent Activity
            </h3>
            {role !== 'staff' && (
              <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('activity_log')}>
                View All <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filteredActivityLogs.map((log, idx) => {
              const isLast = idx === filteredActivityLogs.length - 1;

              // Per-module icon config
              const moduleConfig = {
                'Guest List':              { icon: Users,        bg: '#1A3FA0', light: 'rgba(26,63,160,0.12)' },
                'Guest House Maintenance': { icon: Wrench,       bg: '#D97706', light: 'rgba(217,119,6,0.12)'  },
                'Guest House Inventory':   { icon: Package,      bg: '#7C3AED', light: 'rgba(124,58,237,0.12)' },
                'Office Bill Payments':    { icon: CreditCard,   bg: '#059669', light: 'rgba(5,150,105,0.12)'  },
                'Office Asset List':       { icon: Barcode,      bg: '#DC2626', light: 'rgba(220,38,38,0.12)'  },
                'Office Maintenance':      { icon: Wrench,       bg: '#D97706', light: 'rgba(217,119,6,0.12)'  },
                'Activity Log':            { icon: ClipboardList,bg: '#0891B2', light: 'rgba(8,145,178,0.12)'  },
                'User Management':         { icon: ShieldCheck,  bg: '#B45309', light: 'rgba(180,83,9,0.12)'   },
              };
              const cfg = moduleConfig[log.moduleName] || { icon: Activity, bg: '#1A3FA0', light: 'rgba(26,63,160,0.12)' };
              const IconComp = cfg.icon;

              // Human-readable time-ago
              const timeAgo = (() => {
                try {
                  const parts = log.timestamp.split(' ');
                  const [datePart, timePart] = parts;
                  const dt = new Date(`${datePart}T${timePart}`);
                  const diffMs = Date.now() - dt.getTime();
                  const mins = Math.floor(diffMs / 60000);
                  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs} hr${hrs !== 1 ? 's' : ''} ago`;
                  const days = Math.floor(hrs / 24);
                  return `${days} day${days !== 1 ? 's' : ''} ago`;
                } catch { return log.timestamp; }
              })();

              // Action title
              const actionTitle = (() => {
                if (log.action === 'Created') return `New ${log.moduleName.replace('Guest House ', 'GH ').replace('Office ', '')} record added`;
                if (log.action === 'Edited')  return `${log.moduleName.replace('Guest House ', 'GH ').replace('Office ', '')} updated`;
                if (log.action === 'Deleted') return `Record removed from ${log.moduleName.replace('Guest House ', 'GH ')}` ;
                return log.action;
              })();

              return (
                <div key={log.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                  {/* Timeline connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '44px' }}>
                    {/* Icon circle */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: cfg.light,
                      border: `2px solid ${cfg.bg}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      zIndex: 1
                    }}>
                      <IconComp size={20} color={cfg.bg} strokeWidth={1.8} />
                    </div>
                    {/* Vertical line connecting items */}
                    {!isLast && (
                      <div style={{
                        width: '2px',
                        flex: 1,
                        minHeight: '20px',
                        backgroundColor: 'var(--border-color)',
                        margin: '4px 0'
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : '1.25rem', paddingTop: '0.25rem' }}>
                    <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.2rem' }}>
                      {actionTitle}
                    </p>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.375rem' }}>
                      {log.recordAffected}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {timeAgo}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
