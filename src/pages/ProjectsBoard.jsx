import React, { useState, useEffect } from 'react';
import { fetchProjects, createProject, updateProject, deleteProject } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { Plus, Trash2, Calendar, DollarSign, ArrowRight, CheckCircle2, FolderKanban } from 'lucide-react';

const STAGES = ['Todo', 'In Progress', 'Review', 'Completed'];

const PRIORITY_STYLES = {
  High: { bg: 'var(--status-red-bg)', color: 'var(--status-red-text)' },
  Medium: { bg: 'var(--status-amber-bg)', color: 'var(--status-amber-text)' },
  Low: { bg: 'var(--status-green-bg)', color: 'var(--status-green-text)' }
};

export const ProjectsBoard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    department: 'Facilities',
    owner: 'Marcus Vance',
    priority: 'Medium',
    status: 'Todo',
    progress: 20,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    budget: 5000
  });

  const load = async () => {
    setLoading(true);
    const { data } = await fetchProjects();
    setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createProject({ ...form, budget: Number(form.budget) || 0, progress: Number(form.progress) || 0 });
    setShowModal(false);
    setForm({ ...form, title: '' });
    load();
  };

  const handleAdvance = async (proj) => {
    const idx = STAGES.indexOf(proj.status);
    const nextStatus = STAGES[(idx + 1) % STAGES.length];
    const nextProgress = nextStatus === 'Completed' ? 100 : nextStatus === 'Review' ? 85 : nextStatus === 'In Progress' ? 50 : 15;
    await updateProject(proj.id, { status: nextStatus, progress: nextProgress });
    load();
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Projects & Task Board
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track community upgrades, guest house renovations, and operational initiatives.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> New Initiative
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading board...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', alignItems: 'start' }}>
          {STAGES.map(stage => {
            const items = projects.filter(p => p.status === stage);
            return (
              <div
                key={stage}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem',
                  minHeight: '360px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.65rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                    {stage === 'Completed' ? <CheckCircle2 size={15} color="var(--status-green-text)" /> : <FolderKanban size={15} color="var(--color-primary)" />}
                    {stage}
                  </div>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
                    backgroundColor: 'var(--bg-page)', padding: '2px 8px', borderRadius: '999px',
                    border: '1px solid var(--border-color)'
                  }}>
                    {items.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {items.map(proj => {
                    const pStyle = PRIORITY_STYLES[proj.priority] || PRIORITY_STYLES.Medium;
                    return (
                      <div
                        key={proj.id}
                        style={{
                          backgroundColor: 'var(--bg-page)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.9rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', backgroundColor: pStyle.bg, color: pStyle.color }}>
                            {proj.priority}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {proj.department}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                          {proj.title}
                        </h3>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
                          Owner: <strong style={{ color: 'var(--text-main)' }}>{proj.owner}</strong>
                        </div>

                        <div style={{ height: '5px', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.65rem' }}>
                          <div style={{ width: `${proj.progress}%`, height: '100%', backgroundColor: 'var(--color-primary)' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.7rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {proj.dueDate}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}><DollarSign size={12} /> {Number(proj.budget).toLocaleString()}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.55rem', borderTop: '1px solid var(--border-color)' }}>
                          <button
                            onClick={() => handleAdvance(proj)}
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            Advance <ArrowRight size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(proj.id)}
                            title="Delete Initiative"
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0.5rem' }}>
                      No initiatives in {stage}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Strategic Initiative">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Initiative Title</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Executive Lounge Acoustic Upgrade" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Department</label>
              <input className="form-input" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Owner</label>
              <input className="form-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Priority</label>
              <select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="form-label">Budget ($)</label>
              <input type="number" className="form-input" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Initiative</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
