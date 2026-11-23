import React, { useState, useEffect } from 'react';
import { fetchDocuments, createDocument, deleteDocument } from '../lib/supabaseService.js';
import { Modal } from '../components/common/Modal.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { FileText, Plus, Search, Trash2, Eye, ShieldCheck } from 'lucide-react';

export const DocumentVault = () => {
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'SOP',
    owner: 'Victoria Sterling',
    size: '1.2 MB',
    status: 'Approved',
    summary: ''
  });

  const load = async () => {
    const { data } = await fetchDocuments(search);
    setDocs(data || []);
  };

  useEffect(() => { load(); }, [search]);

  const categories = ['All', 'SOP', 'Legal & Compliance', 'Engineering', 'Finance'];
  const visible = category === 'All' ? docs : docs.filter(d => d.category === category);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    await createDocument({ ...form, updatedAt: new Date().toISOString().split('T')[0] });
    setShowModal(false);
    setForm({ ...form, title: '', summary: '' });
    load();
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Document & Policy Vault
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Centralized repository for community SOPs, insurance binders, and compliance records.
          </p>
        </div>

        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} /> Register Document
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
            placeholder="Search documents..."
            style={{ paddingLeft: '2.35rem' }}
          />
        </div>
        <div style={{ minWidth: '190px' }}>
          <select
            className="form-input"
            value={category}
            onChange={e => setCategory(e.target.value)}
            aria-label="Filter by document category"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {visible.map(doc => (
          <div
            key={doc.id}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-primary)' }}>
                    {doc.category}
                  </span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                    {doc.title}
                  </h3>
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                backgroundColor: doc.status === 'Approved' ? 'var(--status-green-bg)' : 'var(--status-amber-bg)',
                color: doc.status === 'Approved' ? 'var(--status-green-text)' : 'var(--status-amber-text)',
                flexShrink: 0
              }}>
                {doc.status}
              </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {doc.summary}
            </p>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '0.7rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto',
              fontSize: '0.74rem', color: 'var(--text-muted)'
            }}>
              <span>Owner: <strong style={{ color: 'var(--text-main)' }}>{doc.owner}</strong> · {doc.size}</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Eye size={13} /> View
                </button>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  title="Delete Document"
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Modal isOpen={!!previewDoc} onClose={() => setPreviewDoc(null)} title={previewDoc?.title || 'Document Preview'}>
        {previewDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              <ShieldCheck size={16} /> {previewDoc.category} · {previewDoc.status} · Updated {previewDoc.updatedAt}
            </div>
            <div style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-page)',
              border: '1px solid var(--border-color)',
              fontSize: '0.875rem',
              lineHeight: 1.65,
              color: 'var(--text-main)'
            }}>
              {previewDoc.summary}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Document Owner: <strong>{previewDoc.owner}</strong> · File Size: {previewDoc.size}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Register Policy or Document">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="form-label">Document Title</label>
            <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Executive Security Protocol v4.0" />
          </div>
          <div className="responsive-form-grid-2">
            <div>
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="SOP">SOP</option>
                <option value="Legal & Compliance">Legal & Compliance</option>
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div>
              <label className="form-label">Owner</label>
              <input className="form-input" value={form.owner} onChange={e => setForm({ ...form, owner: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="form-label">Executive Summary</label>
            <textarea className="form-input" rows="3" required value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Document</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await handleDelete(deleteTarget.id);
        }}
        title="Delete Document"
        headline={`Delete "${deleteTarget?.title}"?`}
        message="This will permanently remove the document record from the vault."
      />
    </div>
  );
};
