import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { store, subscribeStore } from '../lib/store.js';
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
import { TableLoader } from '../components/common/Loader.jsx';

export const Dashboard = ({ setActivePage }) => {
  const { currentUser, hasModulePermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: store.getUsers(),
    guests: [],
    ghMaintenance: [],
    ghInventory: [],
    bills: [],
    officeAssets: [],
    officeMaintenance: [],
    activityLogs: []
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [
        guestsRes,
        ghMaintRes,
        ghInvRes,
        billsRes,
        officeAssetsRes,
        officeMaintRes,
        logsRes
      ] = await Promise.all([
        fetchGuests(),
        fetchGHMaintenance(),
        fetchGHInventory(),
        fetchBillPayments(),
        fetchOfficeAssets(),
        fetchOfficeMaintenance(),
        fetchActivityLogs(20)
      ]);

      setData({
        users: store.getUsers(),
        guests: guestsRes.data?.length ? guestsRes.data : store.getGuests(),
        ghMaintenance: ghMaintRes.data?.length ? ghMaintRes.data : store.getGHMaintenance(),
        ghInventory: ghInvRes.data?.length ? ghInvRes.data : store.getGHInventory(),
        bills: billsRes.data?.length ? billsRes.data : store.getBillPayments(),
        officeAssets: officeAssetsRes.data?.length ? officeAssetsRes.data : store.getOfficeAssets(),
        officeMaintenance: officeMaintRes.data?.length ? officeMaintRes.data : store.getOfficeMaintenance(),
        activityLogs: logsRes.data?.length ? logsRes.data : store.getActivityLogs()
      });
    } catch (err) {
      console.warn('Supabase dashboard load failed, using local store:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
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
    const key = (log.moduleName || '').toLowerCase().replace(/\s+/g, '_');
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
                  {loading ? '...' : totalGuestsCheckedIn}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <UserCheck size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Active stay allocations <ArrowRight size={12} />
            </p>
          </div>
        )}

        {/* 2. GH Maintenance Stat Card */}
        {hasModulePermission('gh_maintenance') && (
          <div
            onClick={() => setActivePage('gh_maintenance')}
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
                  GH Maintenance
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {loading ? '...' : data.ghMaintenance.filter(m => m.status === 'Open').length}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wrench size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open repair tickets <ArrowRight size={12} />
            </p>
          </div>
        )}

        {/* 3. GH Inventory Stat Card */}
        {hasModulePermission('gh_inventory') && (
          <div
            onClick={() => setActivePage('gh_inventory')}
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
                  GH Inventory
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {loading ? '...' : totalInventoryCount}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Package size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Total tracked units <ArrowRight size={12} />
            </p>
          </div>
        )}

        {/* 4. Office Bills Stat Card */}
        {hasModulePermission('office_bills') && (
          <div
            onClick={() => setActivePage('office_bills')}
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
                  Total Bill Payments
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {loading ? '...' : `GHS ${totalBillsAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CreditCard size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {data.bills.length} disbursements logged <ArrowRight size={12} />
            </p>
          </div>
        )}

        {/* 5. Office Assets Stat Card */}
        {hasModulePermission('office_assets') && (
          <div
            onClick={() => setActivePage('office_assets')}
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
                  Registered Assets
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {loading ? '...' : totalAssetsCount}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366F1',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Barcode size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Barcode tagged devices <ArrowRight size={12} />
            </p>
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
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            className="hover-card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Office Repairs
                </span>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                  {loading ? '...' : officeMaintenanceOpen}
                </h3>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#EC4899',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Wrench size={22} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Facility & Generator tickets <ArrowRight size={12} />
            </p>
          </div>
        )}
      </div>

      {/* Analytics Charts & Visual Summaries Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Visual Chart 1: Maintenance Status Breakdown */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Overall Maintenance Ticket Status
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Aggregated work order status across Guest House and Central Office.
          </p>
          <MaintenancePieChart
            openCount={openMaintenanceCount}
            inProgressCount={inProgressMaintenanceCount}
            resolvedCount={resolvedMaintenanceCount}
          />
        </div>

        {/* Visual Chart 2: Recent Disbursements Bar Breakdown */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            Utility & Vendor Bill Disbursements
          </h4>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Recent payments breakdown (GHS).
          </p>
          <BillsBarChart bills={data.bills} />
        </div>
      </div>

      {/* Bottom Row: Recent Activity Log Feed & Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Activity Trail Feed */}
        <div style={{
          padding: '1.5rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--color-primary)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Operational Activity
              </h4>
            </div>
            {role !== 'staff' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setActivePage('activity_log')}
                style={{ fontSize: '0.8125rem', color: 'var(--color-primary)' }}
              >
                View Full Audit Log <ChevronRight size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {filteredActivityLogs.length > 0 ? (
              filteredActivityLogs.map(log => (
                <div
                  key={log.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card-hover)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={log.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={log.userName}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                        {log.userName}
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {log.action} record in <strong style={{ color: 'var(--text-main)' }}>{log.moduleName}</strong>: {log.recordAffected}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                No recent activity logged.
              </p>
            )}
          </div>
        </div>


      </div>
    </div>
  );
};
