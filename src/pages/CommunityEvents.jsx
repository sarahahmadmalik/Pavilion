import React, { useState, useEffect } from 'react';
import { fetchCommunityEvents, createCommunityEvent, updateCommunityEvent } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { Megaphone, Calendar, MapPin, Users, Plus, Pin, Check } from 'lucide-react';

export const CommunityEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'Community Meeting',
    date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    time: '18:00',
    location: 'Main Clubhouse Hall',
    description: ''
  });

  const load = async () => {
    setLoading(true);
    const { data } = await fetchCommunityEvents();
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const incrementAttendee = async (evt) => {
    await updateCommunityEvent(evt.id, { attendees: (evt.attendees || 0) + 1 });
    load();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createCommunityEvent({
      ...form,
      attendees: 1,
      pinned: false
    });
    setShowModal(false);
    setForm({ ...form, title: '', description: '' });
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Notices & Community Events
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Share community announcements, maintenance windows, and guest house hospitality gatherings.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> Post Notice / Event
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading notices & events...</p>
      ) : events.length === 0 ? (
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          No community notices or events yet. Click <strong>Post Notice / Event</strong> to publish one.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '1rem' }}>
          {events.map(evt => (
            <div
              key={evt.id}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: '999px',
                  backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}>
                  <Megaphone size={12} /> {evt.category}
                </span>
                {evt.pinned && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Pin size={12} color="var(--color-primary)" /> Pinned
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35 }}>
                {evt.title}
              </h3>

              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {evt.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} /> {evt.date} · {evt.time}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><MapPin size={13} /> {evt.location}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.7rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Users size={14} /> <strong style={{ color: 'var(--text-main)' }}>{evt.attendees || 0}</strong> attending
                </span>
                <button
                  onClick={() => incrementAttendee(evt)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Check size={13} /> Confirm RSVP
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Post Community Notice or Event">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Title</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Community Garden Renovation" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="Community Meeting">Community Meeting</option>
                <option value="Maintenance Notice">Maintenance Notice</option>
                <option value="Social & Hospitality">Social & Hospitality</option>
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Time</label>
              <input className="form-input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">Details</label>
            <textarea className="form-input" rows="3" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Publish</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
