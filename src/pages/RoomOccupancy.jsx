import React, { useState, useEffect } from 'react';
import { fetchRoomOccupancy, createRoomSuite, updateRoomSuite } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { BedDouble, CheckCircle2, Clock, Wrench, Sparkles, Users, Calendar, Plus } from 'lucide-react';

const ITEMS_PER_PAGE = 6;

const STATUS_BADGE = {
  Occupied: { bg: 'var(--status-blue-bg)', color: 'var(--status-blue-text)', icon: Users },
  Available: { bg: 'var(--status-green-bg)', color: 'var(--status-green-text)', icon: CheckCircle2 },
  Reserved: { bg: 'var(--status-amber-bg)', color: 'var(--status-amber-text)', icon: Clock },
  Maintenance: { bg: 'var(--status-red-bg)', color: 'var(--status-red-text)', icon: Wrench }
};

export const RoomOccupancy = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    wing: 'Main Wing',
    capacity: 2,
    status: 'Available',
    amenities: ''
  });

  const load = async () => {
    setLoading(true);
    const { data } = await fetchRoomOccupancy();
    setRooms(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = {
    All: rooms.length,
    Occupied: rooms.filter(r => r.status === 'Occupied').length,
    Available: rooms.filter(r => r.status === 'Available').length,
    Reserved: rooms.filter(r => r.status === 'Reserved').length,
    Maintenance: rooms.filter(r => r.status === 'Maintenance').length
  };

  const visible = filter === 'All' ? rooms : rooms.filter(r => r.status === filter);
  const totalPages = Math.max(1, Math.ceil(visible.length / ITEMS_PER_PAGE));
  const paginated = visible.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [filter]);

  const cycleHousekeeping = async (room) => {
    const order = ['Inspected', 'Turnaround', 'In Service'];
    const next = order[(order.indexOf(room.housekeeping) + 1) % order.length];
    await updateRoomSuite(room.id, { housekeeping: next });
    load();
  };

  const toggleAvailability = async (room) => {
    if (room.status === 'Available') {
      await updateRoomSuite(room.id, { status: 'Reserved', guest: 'Reserved Hold', checkOut: 'Hold Active' });
    } else if (room.status === 'Reserved') {
      await updateRoomSuite(room.id, { status: 'Available', guest: null, checkOut: 'Ready Now' });
    }
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    await createRoomSuite({ ...form, capacity: Number(form.capacity) || 2 });
    setShowModal(false);
    setForm({ ...form, name: '', amenities: '' });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Suites & Room Occupancy
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Live suite availability, guest allocations, and housekeeping readiness across the guest house.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> Add Suite
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '210px' }}>
          <CustomSelect
            value={filter}
            onChange={setFilter}
            options={Object.keys(counts).map(key => ({
              value: key,
              label: key === 'All' ? `All Suites (${counts[key]})` : `${key} (${counts[key]})`
            }))}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading suites...</p>
      ) : visible.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          No suites found in Supabase. Click <strong>Add Suite</strong> to register guest house rooms.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
          {paginated.map(room => {
            const badge = STATUS_BADGE[room.status] || STATUS_BADGE.Available;
            const Icon = badge.icon;
            return (
              <div
                key={room.id}
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
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {room.wing} · Up to {room.capacity} Guests
                    </span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BedDouble size={16} color="var(--color-primary)" /> {room.name}
                    </h3>
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
                    backgroundColor: badge.bg, color: badge.color,
                    display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0
                  }}>
                    <Icon size={12} /> {room.status}
                  </span>
                </div>

                {room.amenities && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {room.amenities}
                  </div>
                )}

                <div style={{
                  padding: '0.65rem 0.8rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-page)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {room.guest || 'Unassigned'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} /> {room.checkOut || 'Ready Now'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                  <button
                    onClick={() => cycleHousekeeping(room)}
                    className="btn btn-secondary"
                    style={{ padding: '0.32rem 0.65rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Sparkles size={12} /> {room.housekeeping}
                  </button>

                  {(room.status === 'Available' || room.status === 'Reserved') && (
                    <button
                      onClick={() => toggleAvailability(room)}
                      className="btn btn-primary"
                      style={{ padding: '0.32rem 0.7rem', fontSize: '0.74rem' }}
                    >
                      {room.status === 'Available' ? 'Quick Reserve' : 'Release Hold'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={visible.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Guest House Suite">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Suite / Room Name</label>
            <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Suite 101" />
          </div>
          <div className="responsive-form-grid-2">
            <div>
              <label className="form-label">Wing / Building</label>
              <input className="form-input" value={form.wing} onChange={e => setForm({ ...form, wing: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Capacity</label>
              <input type="number" min="1" className="form-input" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">Amenities</label>
            <input className="form-input" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} placeholder="e.g., Private Balcony · Fiber Wi-Fi" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Suite</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
