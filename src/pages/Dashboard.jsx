import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGuests,
  fetchGHMaintenance,
  fetchGHInventory,
  fetchBillPayments,
  fetchOfficeAssets,
  fetchOfficeMaintenance,
  fetchActivityLogs
} from '../lib/supabaseService.js';
import { MaintenancePieChart } from '../components/charts/MaintenancePieChart.jsx';
import { BillsBarChart } from '../components/charts/BillsBarChart.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import {
  CardSkeleton,
  ChartSkeleton,
  ActivityFeedSkeleton
} from '../components/common/Loader.jsx';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import {
  UserCheck,
  Wrench,
  CreditCard,
  Barcode,
  ArrowRight,
  Activity,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// ─── KPI Stat Card ─────────────────────────────────────────────────────────
const StatCard = ({ label, value, subtext, icon: Icon, iconBg, iconColor, onClick }) => (
  <div
    onClick={onClick}
    className="hover-card"
    style={{
      padding: '1.25rem', borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
      transition: 'var(--transition-fast)'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem', lineHeight: 1 }}>
          {value}
        </h3>
      </div>
      <div style={{
        width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
        backgroundColor: iconBg, color: iconColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={22} />
      </div>
    </div>
    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
      {subtext} <ArrowRight size={12} />
    </p>
  </div>
);

// ─── Time formatter ─────────────────────────────────────────────────────────
function formatTime(ts) {
  if (!ts) return 'Just now';
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export const Dashboard = ({ setActivePage }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    guests: [],
    ghMaintenance: [],
    officeMaintenance: [],
    bills: [],
    officeAssets: [],
    activityLogs: []
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        guestsRes,
        ghMaintRes,
        officeMaintRes,
        billsRes,
        officeAssetsRes,
        logsRes
      ] = await Promise.all([
        fetchGuests(),
        fetchGHMaintenance(),
        fetchOfficeMaintenance(),
        fetchBillPayments(),
        fetchOfficeAssets(),
        fetchActivityLogs(20)
      ]);

      // Check for critical errors (don't crash on partial failure)
      const hasError = [guestsRes, ghMaintRes, officeMaintRes, billsRes, officeAssetsRes].some(r => r.error);
      if (hasError) {
        setError('Could not load some data from the server. Showing what was available.');
      }

      setData({
        guests: guestsRes.data || [],
        ghMaintenance: ghMaintRes.data || [],
        officeMaintenance: officeMaintRes.data || [],
        bills: billsRes.data || [],
        officeAssets: officeAssetsRes.data || [],
        activityLogs: logsRes.data || []
      });
    } catch (err) {
      setError('Unable to reach the server. Please check your connection and try again.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // ─── Computed stats ───────────────────────────────────────────────────────
  const totalGuests = data.guests.length;

  const allMaintenance = [...data.ghMaintenance, ...data.officeMaintenance];
  const openMaintenanceCount = allMaintenance.filter(m => m.status === 'Open').length;
  const inProgressCount = allMaintenance.filter(m => m.status === 'In Progress').length;
  const resolvedCount = allMaintenance.filter(m => m.status === 'Resolved').length;

  const totalBillsAmount = data.bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const totalAssetsCount = data.officeAssets.length;

  const role = currentUser?.role || 'staff';

  const filteredActivityLogs = data.activityLogs.filter(log => {
    if (role === 'super_admin' || role === 'admin') return true;
    const key = (log.moduleName || '').toLowerCase().replace(/\s+/g, '_');
    return hasModulePermission(key);
  }).slice(0, 6);

  // ─── KPI card configs ─────────────────────────────────────────────────────
  const statCards = [
    {
      key: 'guest_list',
      label: 'Checked-in Guests',
      value: totalGuests,
      subtext: 'Active stay allocations',
      icon: UserCheck,
      iconBg: 'var(--color-primary-light)',
      iconColor: 'var(--color-primary)',
      page: 'guest_list'
    },
    {
      key: 'maintenance',
      label: 'Open Maintenance',
      value: openMaintenanceCount,
      subtext: `${inProgressCount} in progress · ${resolvedCount} resolved`,
      icon: Wrench,
      iconBg: 'rgba(239,68,68,0.1)',
      iconColor: '#EF4444',
      page: 'gh_maintenance'
    },
    {
      key: 'office_bills',
      label: 'Total Disbursements',
      value: `GHS ${totalBillsAmount.toLocaleString('en-GH', { maximumFractionDigits: 0 })}`,
      subtext: `${data.bills.length} bill payments logged`,
      icon: CreditCard,
      iconBg: 'rgba(16,185,129,0.1)',
      iconColor: '#10B981',
      page: 'office_bills'
    },
    {
      key: 'office_assets',
      label: 'Registered Assets',
      value: totalAssetsCount,
      subtext: 'Barcode-tagged office items',
      icon: Barcode,
      iconBg: 'rgba(99,102,241,0.1)',
      iconColor: '#6366F1',
      page: 'office_assets'
    }
  ].filter(card => {
    if (card.key === 'maintenance') return hasModulePermission('gh_maintenance') || hasModulePermission('office_maintenance');
    return hasModulePermission(card.key);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Error Banner */}
      {error && (
        <ErrorBanner
          type="warning"
          title="Partial data loaded"
          message={error}
          onRetry={loadDashboardData}
        />
      )}

      {/* ─── KPI Stats Grid ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : statCards.map(card => (
              <StatCard
                key={card.key}
                label={card.label}
                value={card.value}
                subtext={card.subtext}
                icon={card.icon}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                onClick={() => setActivePage(card.page)}
              />
            ))
        }
      </div>

      {/* ─── Main Content Grid (Left: Charts, Right: Recent Activity Card) ─── */}
      <div className="dashboard-main-grid">

        {/* Left Column: Analytics Charts */}
        {(hasModulePermission('gh_maintenance') || hasModulePermission('office_bills')) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {hasModulePermission('gh_maintenance') && (
              <div style={{
                padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Maintenance Ticket Status
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Combined GH &amp; Office work order breakdown.
                </p>
                {loading
                  ? <ChartSkeleton height={240} />
                  : (openMaintenanceCount + inProgressCount + resolvedCount === 0)
                    ? (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', flexDirection: 'column', gap: '0.5rem' }}>
                        <Wrench size={28} color="var(--border-color)" />
                        <span>No maintenance records yet</span>
                      </div>
                    )
                    : <MaintenancePieChart openCount={openMaintenanceCount} inProgressCount={inProgressCount} resolvedCount={resolvedCount} />
                }
              </div>
            )}

            {hasModulePermission('office_bills') && (
              <div style={{
                padding: '1.25rem', borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                  Utility &amp; Vendor Bill Disbursements
                </h4>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Recent payments breakdown (GHS).
                </p>
                {loading
                  ? <ChartSkeleton height={240} />
                  : data.bills.length === 0
                    ? (
                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', flexDirection: 'column', gap: '0.5rem' }}>
                        <CreditCard size={28} color="var(--border-color)" />
                        <span>No bill payments recorded yet</span>
                      </div>
                    )
                    : <BillsBarChart bills={data.bills} />
                }
              </div>
            )}
          </div>
        )}

        {/* Right Column: Recent Operational Activity Card */}
        <div style={{
          padding: '1.25rem', borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', flexDirection: 'column',
          height: '100%', minHeight: '520px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Activity
              </h4>
            </div>
            {role !== 'staff' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setActivePage('activity_log')}
                style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Full Audit <ChevronRight size={14} />
              </button>
            )}
          </div>

          {loading
            ? <ActivityFeedSkeleton rows={5} />
            : filteredActivityLogs.length > 0
              ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                  {filteredActivityLogs.map(log => (
                    <div key={log.id} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                      padding: '0.75rem', borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flex: 1, minWidth: '160px' }}>
                        <UserAvatar name={log.userName} src={log.userAvatar} size={30} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-main)', display: 'block', wordBreak: 'break-word' }}>
                            {log.userName}
                          </span>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-word', marginTop: '2px', lineHeight: 1.35 }}>
                            <span style={{ textTransform: 'lowercase' }}>{log.action}</span>{' '}
                            <strong style={{ color: 'var(--text-main)' }}>{log.recordAffected}</strong>
                            {' '}in {log.moduleName}
                          </p>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingTop: '2px' }}>
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )
              : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={32} color="var(--border-color)" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.8125rem' }}>No recent activity logged yet.</p>
                </div>
              )
          }
        </div>

      </div>
    </div>
  );
};
