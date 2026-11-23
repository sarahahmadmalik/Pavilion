import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGuests,
  fetchGHMaintenance,
  fetchGHInventory,
  fetchBillPayments,
  fetchVehicleMaintenance,
  fetchOfficeMaintenance,
  fetchActivityLogs,
  fetchRoomOccupancy,
  fetchProjects,
  fetchVendors,
  fetchTickets,
  fetchStaffDirectory,
  fetchCommunityEvents,
  fetchDocuments
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
  Car,
  ArrowRight,
  Activity,
  ChevronRight,
  ChevronLeft,
  BedDouble,
  FolderKanban,
  Ticket,
  Briefcase
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
    vehicleMaintenance: [],
    activityLogs: [],
    rooms: [],
    projects: [],
    vendors: [],
    tickets: [],
    staff: [],
    events: [],
    documents: []
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
        vehicleMaintRes,
        logsRes,
        roomsRes,
        projectsRes,
        vendorsRes,
        ticketsRes,
        staffRes,
        eventsRes,
        docsRes
      ] = await Promise.all([
        fetchGuests(),
        fetchGHMaintenance(),
        fetchOfficeMaintenance(),
        fetchBillPayments(),
        fetchVehicleMaintenance(),
        fetchActivityLogs(20),
        fetchRoomOccupancy(),
        fetchProjects(),
        fetchVendors(),
        fetchTickets(currentUser),
        fetchStaffDirectory(),
        fetchCommunityEvents(),
        fetchDocuments()
      ]);

      // Check for critical errors (don't crash on partial failure)
      const hasError = [guestsRes, ghMaintRes, officeMaintRes, billsRes, vehicleMaintRes].some(r => r.error);
      if (hasError) {
        setError('Could not load some data from the server. Showing what was available.');
      }

      setData({
        guests: guestsRes.data || [],
        ghMaintenance: ghMaintRes.data || [],
        officeMaintenance: officeMaintRes.data || [],
        bills: billsRes.data || [],
        vehicleMaintenance: vehicleMaintRes.data || [],
        activityLogs: logsRes.data || [],
        rooms: roomsRes.data || [],
        projects: projectsRes.data || [],
        vendors: vendorsRes.data || [],
        tickets: ticketsRes.data || [],
        staff: staffRes.data || [],
        events: eventsRes.data || [],
        documents: docsRes.data || []
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

  const allMaintenance = [...data.ghMaintenance, ...data.officeMaintenance, ...data.vehicleMaintenance];
  const openMaintenanceCount = allMaintenance.filter(m => m.status === 'Open').length;
  const inProgressCount = allMaintenance.filter(m => m.status === 'In Progress').length;
  const resolvedCount = allMaintenance.filter(m => m.status === 'Resolved').length;

  const totalBillsAmount = data.bills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const vehiclesInRepairCount = data.vehicleMaintenance.filter(v => v.status !== 'Resolved').length;
  const occupiedRoomsCount = data.rooms.filter(r => r.status === 'Occupied').length;
  const occupancyPct = data.rooms.length ? Math.round((occupiedRoomsCount / data.rooms.length) * 100) : 0;
  const activeProjectsCount = data.projects.filter(p => p.status !== 'Completed').length;
  const activeProjectBudget = data.projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const openTicketsCount = data.tickets.filter(t => t.status !== 'Closed').length;
  const activeVendorsCount = data.vendors.filter(v => v.status === 'Active').length;
  const onDutyStaffCount = data.staff.filter(s => s.status === 'On Duty' || s.status === 'In Field').length;

  const role = currentUser?.role || 'staff';
  const isAdminOrSuper = role === 'admin' || role === 'super_admin';

  const filteredActivityLogs = data.activityLogs.filter(log => {
    if (role === 'super_admin' || role === 'admin') return true;
    const key = (log.moduleName || '').toLowerCase().replace(/\s+/g, '_');
    return hasModulePermission(key);
  }).slice(0, 2);

  // ─── Role-Specific KPI card configs ────────────────────────────────────────
  const availableSuitesCount = data.rooms.filter(r => r.status === 'Available').length;

  const statCardsByRole = {
    super_admin: [
      {
        key: 'guest_list',
        label: 'Checked-in Guests',
        value: totalGuests,
        subtext: `${occupancyPct}% suite occupancy`,
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
        key: 'vendors',
        label: 'Active Vendors',
        value: activeVendorsCount,
        subtext: `GHS ${activeProjectBudget.toLocaleString('en-GH', { maximumFractionDigits: 0 })} project budget`,
        icon: Briefcase,
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#6366F1',
        page: 'vendors'
      }
    ],
    admin: [
      {
        key: 'room_occupancy',
        label: 'Suite Occupancy',
        value: `${occupancyPct}%`,
        subtext: `${occupiedRoomsCount} of ${data.rooms.length} suites occupied`,
        icon: BedDouble,
        iconBg: 'var(--color-primary-light)',
        iconColor: 'var(--color-primary)',
        page: 'room_occupancy'
      },
      {
        key: 'maintenance',
        label: 'Open Maintenance',
        value: openMaintenanceCount,
        subtext: `${inProgressCount} in progress · ${vehiclesInRepairCount} fleet`,
        icon: Wrench,
        iconBg: 'rgba(239,68,68,0.1)',
        iconColor: '#EF4444',
        page: 'gh_maintenance'
      },
      {
        key: 'projects',
        label: 'Active Projects',
        value: activeProjectsCount,
        subtext: `${data.projects.length} total initiatives`,
        icon: FolderKanban,
        iconBg: 'rgba(245,158,11,0.12)',
        iconColor: '#D97706',
        page: 'projects'
      },
      {
        key: 'tickets',
        label: 'Open Tickets',
        value: openTicketsCount,
        subtext: `${onDutyStaffCount} staff on duty`,
        icon: Ticket,
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#10B981',
        page: 'tickets'
      }
    ],
    staff: [
      {
        key: 'guest_list',
        label: 'Guest Check-ins',
        value: totalGuests,
        subtext: `${availableSuitesCount} suites available now`,
        icon: UserCheck,
        iconBg: 'var(--color-primary-light)',
        iconColor: 'var(--color-primary)',
        page: 'guest_list'
      },
      {
        key: 'maintenance',
        label: 'Pending Tasks',
        value: openMaintenanceCount + inProgressCount,
        subtext: `${openMaintenanceCount} open · ${inProgressCount} in progress`,
        icon: Wrench,
        iconBg: 'rgba(239,68,68,0.1)',
        iconColor: '#EF4444',
        page: 'gh_maintenance'
      },
      {
        key: 'room_occupancy',
        label: 'Available Suites',
        value: availableSuitesCount,
        subtext: `${data.rooms.length} total guest house suites`,
        icon: BedDouble,
        iconBg: 'rgba(16,185,129,0.1)',
        iconColor: '#10B981',
        page: 'room_occupancy'
      },
      {
        key: 'vehicles_maintenance',
        label: 'Fleet & Events',
        value: `${vehiclesInRepairCount} / ${data.events.length}`,
        subtext: `${vehiclesInRepairCount} vehicles in shop · ${data.events.length} events`,
        icon: Car,
        iconBg: 'rgba(99,102,241,0.1)',
        iconColor: '#6366F1',
        page: 'community_events'
      }
    ]
  };

  const statCards = (statCardsByRole[role] || statCardsByRole.staff).filter(card => {
    if (card.key === 'maintenance') return hasModulePermission('gh_maintenance') || hasModulePermission('office_maintenance') || hasModulePermission('vehicles_maintenance');
    if (card.key === 'tickets') return true;
    return hasModulePermission(card.key);
  });

  const needsAttentionItems = [
    ...(openMaintenanceCount > 0 ? [{
      label: `${openMaintenanceCount} Open Maintenance Issue${openMaintenanceCount > 1 ? 's' : ''}`,
      detail: `${inProgressCount} currently in progress across guest house & facilities`,
      badge: 'Urgent',
      badgeBg: 'var(--status-red-bg)',
      badgeColor: 'var(--status-red-text)',
      page: 'gh_maintenance'
    }] : []),
    ...(openTicketsCount > 0 ? [{
      label: `${openTicketsCount} Unresolved Support Ticket${openTicketsCount > 1 ? 's' : ''}`,
      detail: 'Awaiting response or resolution from operations team',
      badge: 'Action',
      badgeBg: 'var(--status-amber-bg)',
      badgeColor: 'var(--status-amber-text)',
      page: 'tickets'
    }] : []),
    ...((data.rooms.filter(r => r.status === 'Maintenance' || r.housekeeping === 'Turnaround').length > 0) ? [{
      label: `${data.rooms.filter(r => r.status === 'Maintenance' || r.housekeeping === 'Turnaround').length} Suite${data.rooms.filter(r => r.status === 'Maintenance' || r.housekeeping === 'Turnaround').length > 1 ? 's' : ''} Need Turnaround / Service`,
      detail: 'Housekeeping or engineering check required before next arrival',
      badge: 'Guest House',
      badgeBg: 'var(--status-blue-bg)',
      badgeColor: 'var(--status-blue-text)',
      page: 'room_occupancy'
    }] : []),
    ...((data.vendors.filter(v => v.status === 'Under Review').length > 0) ? [{
      label: `${data.vendors.filter(v => v.status === 'Under Review').length} Vendor Contract${data.vendors.filter(v => v.status === 'Under Review').length > 1 ? 's' : ''} Under Review`,
      detail: 'Pending SLA evaluation or renewal sign-off',
      badge: 'Governance',
      badgeBg: 'var(--status-amber-bg)',
      badgeColor: 'var(--status-amber-text)',
      page: 'vendors'
    }] : [])
  ];

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

      {/* ─── Needs Attention & Suite/Project Visual Breakdown ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Needs Attention */}
        <div style={{
          padding: '1.25rem', borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Needs Attention</h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Priority items requiring review</p>
            </div>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '999px',
              backgroundColor: needsAttentionItems.length > 0 ? 'var(--status-amber-bg)' : 'var(--status-green-bg)',
              color: needsAttentionItems.length > 0 ? 'var(--status-amber-text)' : 'var(--status-green-text)'
            }}>
              {needsAttentionItems.length > 0 ? `${needsAttentionItems.length} Items` : 'All Clear'}
            </span>
          </div>

          {needsAttentionItems.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', padding: '1rem 0' }}>
              Everything is running smoothly — no urgent items right now.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {needsAttentionItems.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePage(item.page)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.75rem 0.9rem',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-page)', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.detail}</div>
                  </div>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    backgroundColor: item.badgeBg, color: item.badgeColor, flexShrink: 0
                  }}>
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Occupancy & Project Progress Bars */}
        <div style={{
          padding: '1.25rem', borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.9rem'
        }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Operations Health</h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Live capacity &amp; execution metrics</p>
          </div>

          {[
            { label: 'Guest House Occupancy', pct: occupancyPct, meta: `${occupiedRoomsCount}/${data.rooms.length} suites`, color: '#1A3FA0' },
            { label: 'Maintenance Resolution Rate', pct: allMaintenance.length ? Math.round((resolvedCount / allMaintenance.length) * 100) : 100, meta: `${resolvedCount}/${allMaintenance.length} resolved`, color: '#10B981' },
            { label: 'Project Completion', pct: data.projects.length ? Math.round(((data.projects.length - activeProjectsCount) / data.projects.length) * 100) : 0, meta: `${data.projects.length - activeProjectsCount}/${data.projects.length} completed`, color: '#3B82F6' }
          ].map(bar => (
            <div key={bar.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{bar.label}</span>
                <span style={{ color: 'var(--text-muted)' }}>{bar.meta} ({bar.pct}%)</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--bg-page)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ width: `${bar.pct}%`, height: '100%', backgroundColor: bar.color, borderRadius: '999px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          ))}
        </div>
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

      {/* ─── Platform Modules Overview ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {/* Upcoming Community Events */}
        <div
          onClick={() => setActivePage('community_events')}
          className="hover-card"
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Upcoming Community Events</h4>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          {data.events.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No upcoming events scheduled.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.events.slice(0, 3).map(evt => (
                <div key={evt.id} style={{ padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{evt.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{evt.date} · {evt.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Community Projects */}
        <div
          onClick={() => setActivePage('projects')}
          className="hover-card"
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Active Projects</h4>
            <ArrowRight size={15} color="var(--text-muted)" />
          </div>
          {data.projects.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No active projects logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.projects.filter(p => p.status !== 'Completed').slice(0, 3).map(prj => (
                <div key={prj.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '75%' }}>{prj.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{prj.progress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-page)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${prj.progress}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vendors, Staff & Governance Vault */}
        <div
          style={{
            padding: '1.25rem', borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.65rem'
          }}
        >
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Community &amp; Governance</h4>
          {[
            { label: 'Preferred Vendors', value: `${activeVendorsCount} Active`, page: 'vendors' },
            { label: 'Community Staff', value: `${onDutyStaffCount} On Duty / Field`, page: 'staff_directory' },
            { label: 'Policy & SOP Vault', value: `${data.documents.length} Documents`, page: 'documents' }
          ].map(row => (
            <button
              key={row.label}
              type="button"
              onClick={() => setActivePage(row.page)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-page)', cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>{row.label}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)' }}>{row.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
