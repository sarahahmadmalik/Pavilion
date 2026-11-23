import React, { useState, useEffect } from 'react';
import {
  fetchBillPayments,
  fetchGHMaintenance,
  fetchVehicleMaintenance,
  fetchOfficeMaintenance,
  fetchProjects,
  fetchVendors
} from '../lib/supabaseService.js';
import {
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Download,
  Building2,
  Layers
} from 'lucide-react';
import { exportToExcel } from '../lib/exportUtils.js';

export const ExecutiveAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalSpend: 0,
    maintenanceSpend: 0,
    billsSpend: 0,
    projectBudget: 0,
    slaRate: 96.4,
    activeProjects: 0,
    activeVendors: 0,
    departments: []
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [billsRes, ghRes, vehRes, offRes, projRes, vndRes] = await Promise.all([
        fetchBillPayments(),
        fetchGHMaintenance(),
        fetchVehicleMaintenance(),
        fetchOfficeMaintenance(),
        fetchProjects(),
        fetchVendors()
      ]);

      const bills = billsRes.data || [];
      const gh = ghRes.data || [];
      const veh = vehRes.data || [];
      const off = offRes.data || [];
      const projects = projRes.data || [];
      const vendors = vndRes.data || [];

      const billsSpend = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
      const ghSpend = gh.reduce((s, m) => s + Number(m.cost || 0), 0);
      const vehSpend = veh.reduce((s, v) => s + Number(v.cost || 0), 0);
      const offSpend = off.reduce((s, o) => s + Number(o.cost || 0), 0);
      const maintenanceSpend = ghSpend + vehSpend + offSpend;
      const projectBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);

      const avgSla = vendors.length
        ? (vendors.reduce((s, v) => s + Number(v.slaScore || 95), 0) / vendors.length).toFixed(1)
        : 96.4;

      const total = billsSpend + maintenanceSpend + projectBudget;
      const departments = [
        { name: 'Guest House & Residences', amount: ghSpend + offSpend, budget: 18000, color: '#1A3FA0' },
        { name: 'Community Utilities & Bills', amount: billsSpend, budget: 12000, color: '#0F172A' },
        { name: 'Community Fleet', amount: vehSpend, budget: 6500, color: '#64748B' },
        { name: 'Community Initiatives', amount: projectBudget, budget: 95000, color: '#4B7FE8' }
      ];

      setMetrics({
        totalSpend: total,
        maintenanceSpend,
        billsSpend,
        projectBudget,
        slaRate: avgSla,
        activeProjects: projects.filter(p => p.status !== 'Completed').length,
        activeVendors: vendors.filter(v => v.status === 'Active').length,
        departments
      });
      setLoading(false);
    };
    load();
  }, []);

  const handleExportReport = () => {
    exportToExcel(
      metrics.departments.map(d => ({
        Department: d.name,
        'Actual Spend ($)': d.amount,
        'Allocated Budget ($)': d.budget,
        'Utilization (%)': Math.round((d.amount / d.budget) * 100)
      })),
      'VERA_Executive_Analytics'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Analytics & Financial Overview
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Community budget utilization, guest house readiness, and vendor SLA compliance.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleExportReport} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export Summary
          </button>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Total Managed Spend', value: `$${metrics.totalSpend.toLocaleString()}`, sub: '+4.2% vs prior quarter', icon: DollarSign },
          { label: 'Vendor SLA Compliance', value: `${metrics.slaRate}%`, sub: `${metrics.activeVendors} active partners`, icon: ShieldCheck },
          { label: 'Active Initiatives', value: metrics.activeProjects, sub: 'Across 4 departments', icon: Layers },
          { label: 'Avg Resolution Time', value: '3.8 hrs', sub: '18% faster than target', icon: Clock }
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.35rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: '34px', height: '34px', borderRadius: '9px',
                  backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={17} />
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {loading ? '—' : kpi.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={13} color="var(--color-primary)" /> {kpi.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Budget Utilization & Operational Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Building2 size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Department Spend vs. Budget
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {metrics.departments.map(dept => {
              const pct = Math.min(100, Math.round((dept.amount / dept.budget) * 100));
              return (
                <div key={dept.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dept.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                      ${dept.amount.toLocaleString()} / ${dept.budget.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-page)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <TrendingUp size={18} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Quarterly Executive Scorecard
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[
              { title: 'Hospitality & Suite Readiness', score: '99.1%', note: 'Zero guest escalations across 5 VIP residences' },
              { title: 'Preventive Maintenance Ratio', score: '84.0%', note: 'Proactive scheduled work vs reactive repairs' },
              { title: 'Fleet Availability Index', score: '94.5%', note: '3 executive vehicles operational with backup' },
              { title: 'Governance & Audit Readiness', score: '100%', note: 'All compliance & insurance binders current' }
            ].map(item => (
              <div
                key={item.title}
                style={{
                  padding: '0.9rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.note}</div>
                </div>
                <span style={{
                  fontSize: '0.9375rem', fontWeight: 800, color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-primary-light)', padding: '0.35rem 0.7rem',
                  borderRadius: 'var(--radius-full)', flexShrink: 0
                }}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
