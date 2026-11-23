import React, { useState, useEffect } from 'react';
import { fetchVendors, createVendor, deleteVendor } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { Plus, Search, Trash2, Award, Phone, Mail, Calendar } from 'lucide-react';

export const VendorHub = () => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'Facilities & Engineering',
    contact: '',
    phone: '',
    status: 'Active',
    slaScore: 95,
    annualSpend: 12000,
    renewalDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]
  });

  const load = async (q = search) => {
    const { data } = await fetchVendors(q);
    setVendors(data || []);
  };

  useEffect(() => { load(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createVendor({ ...form, slaScore: Number(form.slaScore) || 95, annualSpend: Number(form.annualSpend) || 0 });
    setShowModal(false);
    setForm({ ...form, name: '', contact: '', phone: '' });
    load();
  };

  const handleDelete = async (id) => {
    await deleteVendor(id);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Vendor & Contract Hub
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage preferred contractors, SLA compliance scores, and annual contract renewals.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> Register Vendor
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.25rem', maxWidth: '380px', position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors, categories..."
          style={{ paddingLeft: '2.35rem' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1rem' }}>
        {vendors.map(v => (
          <div
            key={v.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-primary)' }}>
                  {v.category}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  {v.name}
                </h3>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
                backgroundColor: v.status === 'Active' ? 'var(--status-green-bg)' : 'var(--status-amber-bg)',
                color: v.status === 'Active' ? 'var(--status-green-text)' : 'var(--status-amber-text)'
              }}>
                {v.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Mail size={13} /> {v.contact}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Phone size={13} /> {v.phone}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} /> Renewal: {v.renewalDate}</span>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Score</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Award size={14} color="var(--color-primary)" /> {v.slaScore}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Annual Spend</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ${Number(v.annualSpend).toLocaleString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(v.id)}
                title="Remove Vendor"
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Preferred Vendor">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Company Name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Atelier HVAC Partners" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Category</label>
              <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">SLA (%)</label>
              <input type="number" max="100" min="0" className="form-input" value={form.slaScore} onChange={e => setForm({ ...form, slaScore: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Annual Spend ($)</label>
              <input type="number" className="form-input" value={form.annualSpend} onChange={e => setForm({ ...form, annualSpend: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Renewal Date</label>
              <input type="date" className="form-input" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Vendor</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
