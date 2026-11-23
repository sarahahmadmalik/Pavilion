import React, { useState, useEffect } from 'react';
import { fetchStaffDirectory, createStaffMember } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import { Plus, Search, MapPin, Mail, Phone } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

export const StaffDirectory = () => {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: '',
    department: 'Operations & Assets',
    location: 'HQ — Floor 2',
    status: 'On Duty',
    email: '',
    phone: '',
    utilization: 85
  });

  const load = async () => {
    const { data } = await fetchStaffDirectory(search);
    setStaff(data || []);
  };

  useEffect(() => { load(); }, [search]);

  const departments = ['All', ...Array.from(new Set(staff.map(s => s.department)))];
  const visible = deptFilter === 'All' ? staff : staff.filter(s => s.department === deptFilter);
  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const paginated = visible.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, deptFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createStaffMember({ ...form, utilization: Number(form.utilization) || 85 });
    setShowModal(false);
    setForm({ ...form, name: '', role: '', email: '', phone: '' });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Community Staff Directory
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Community management team, guest house hospitality, and facilities engineering roster.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> Add Team Member
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px', maxWidth: '340px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, role, location..."
            style={{ paddingLeft: '2.35rem' }}
          />
        </div>
        <div style={{ minWidth: '210px' }}>
          <CustomSelect
            value={deptFilter}
            onChange={setDeptFilter}
            options={departments.map(d => ({ value: d, label: d === 'All' ? 'All Departments' : d }))}
          />
        </div>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {paginated.map(member => (
          <div
            key={member.id}
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <UserAvatar name={member.name} size={46} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                  </h3>
                  <span style={{
                    fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                    backgroundColor: member.status === 'On Duty' ? 'var(--status-green-bg)' : 'var(--status-blue-bg)',
                    color: member.status === 'On Duty' ? 'var(--status-green-text)' : 'var(--status-blue-text)',
                    flexShrink: 0
                  }}>
                    {member.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>{member.role}</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{member.department}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} /> {member.location}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Mail size={13} /> {member.email}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Phone size={13} /> {member.phone}</span>
            </div>

            <div style={{ paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.3rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Capacity Utilization</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{member.utilization}%</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'var(--bg-page)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${member.utilization}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visible.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="responsive-form-grid-2">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Role / Title</label>
              <input className="form-input" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            </div>
          </div>
          <div className="responsive-form-grid-2">
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div className="responsive-form-grid-2">
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Member</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
