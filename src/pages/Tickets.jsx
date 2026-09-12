import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  fetchTickets,
  fetchTicketById,
  createTicket,
  replyToTicket,
  closeTicket,
  closeStaleTickets,
  uploadTicketAttachment,
  fetchTicketAttachments
} from '../lib/supabaseService.js';
import { TICKET_CATEGORIES, getTicketCategoryConfig } from '../lib/ticketCategories.js';
import { useSelection } from '../lib/useSelection.js';

import { SlideOver } from '../components/common/SlideOver.jsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { BulkActionBar } from '../components/common/BulkActionBar.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { Pagination } from '../components/common/Pagination.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { SearchableSelect } from '../components/common/SearchableSelect.jsx';
import { TableLoader } from '../components/common/Loader.jsx';
import { ResponsiveFilterBar } from '../components/common/ResponsiveFilterBar.jsx';
import { useLayout } from '../components/layout/Layout.jsx';
import { Plus, Eye, Send, CheckCircle2, Lock, Paperclip, X, Image as ImageIcon, FileText, File as FileIcon } from 'lucide-react';

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'Low' },
  { label: 'Normal', value: 'Normal' },
  { label: 'High', value: 'High' }
];

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_ATTACHMENTS = 5;
const ACCEPTED_ATTACHMENT_TYPES = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt';

function attachmentIcon(fileType) {
  if (fileType?.startsWith('image/')) return ImageIcon;
  if (fileType === 'application/pdf') return FileText;
  return FileIcon;
}

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Small file picker + selected-file chips, shared by the new-ticket form and reply box ──
const AttachmentPicker = ({ files, onAdd, onRemove, setToast }) => {
  const inputRef = React.useRef(null);

  const handleChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const combined = [...files];
    for (const f of incoming) {
      if (combined.length >= MAX_ATTACHMENTS) {
        setToast?.({ type: 'warning', message: `You can attach up to ${MAX_ATTACHMENTS} files.` });
        break;
      }
      if (f.size > MAX_ATTACHMENT_SIZE) {
        setToast?.({ type: 'warning', message: `"${f.name}" exceeds the 10MB limit and was skipped.` });
        continue;
      }
      combined.push(f);
    }
    onAdd(combined);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_ATTACHMENT_TYPES} onChange={handleChange} style={{ display: 'none' }} />
      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={() => inputRef.current?.click()}
        style={{ alignSelf: 'flex-start' }}
      >
        <Paperclip size={14} /> Attach Files
      </button>
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {files.map((f, idx) => {
            const Icon = attachmentIcon(f.type);
            return (
              <span key={`${f.name}-${idx}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
                padding: '0.25rem 0.5rem', borderRadius: '999px',
                backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)',
                fontSize: '0.75rem', color: 'var(--text-main)'
              }}>
                <Icon size={13} color="var(--color-primary)" />
                {f.name} <span style={{ color: 'var(--text-muted)' }}>({formatFileSize(f.size)})</span>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)', padding: 0 }}
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Row of attachment chips already uploaded (ticket description or a reply) ──
const AttachmentList = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {attachments.map(a => {
        const Icon = attachmentIcon(a.fileType);
        return (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              padding: '0.25rem 0.5rem', borderRadius: '999px',
              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
              fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600
            }}
          >
            <Icon size={13} /> {a.fileName}
          </a>
        );
      })}
    </div>
  );
};

export const Tickets = (props) => {
  const layoutContext = useLayout();
  const setToast = props.setToast || layoutContext.setToast;
  const { currentUser, hasModulePermission } = useAuth();
  const { notifications, markAsRead } = useNotifications() || {};
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // ── New Ticket form state ──────────────────────────────────────────────
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [ticketMode, setTicketMode] = useState('custom'); // 'custom' | 'module'
  const [newCategory, setNewCategory] = useState('');
  const [recordOptions, setRecordOptions] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  // ── Detail view state ───────────────────────────────────────────────────
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [sendingReply, setSendingReply] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const availableCategories = useMemo(
    () => TICKET_CATEGORIES.filter(c => hasModulePermission(c.permissionKey, 'view')),
    [currentUser]
  );

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await fetchTickets(currentUser, search);
    if (!error) {
      setTickets(data || []);
    } else {
      setTickets([]);
      setToast?.({ type: 'error', message: 'Database connection offline. Could not load tickets.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!currentUser) return;
    loadTickets();
    closeStaleTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Mark unread ticket notifications as read on visiting this page
  useEffect(() => {
    (notifications || []).forEach(n => {
      if (n.ticket_id && !n.is_read) markAsRead?.(n.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime — keep the list and open thread fresh
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel('tickets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => loadTickets())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies' }, (payload) => {
        setActiveTicket(prev => {
          if (!prev || prev.id !== payload.new.ticket_id) return prev;
          if (prev.replies.some(r => r.id === payload.new.id)) return prev;
          return {
            ...prev,
            replies: [...prev.replies, {
              id: payload.new.id,
              ticketId: payload.new.ticket_id,
              authorId: payload.new.author_id,
              authorName: payload.new.author_name,
              authorRole: payload.new.author_role,
              message: payload.new.message,
              createdAt: payload.new.created_at
            }]
          };
        });
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ── Fetch record options when a module category is picked ─────────────
  useEffect(() => {
    if (ticketMode !== 'module' || !newCategory) {
      setRecordOptions([]);
      return;
    }
    const config = getTicketCategoryConfig(newCategory);
    if (!config) return;
    let cancelled = false;
    setLoadingRecords(true);
    setSelectedRecordId('');
    config.fetchFn('').then(({ data }) => {
      if (cancelled) return;
      setRecordOptions((data || []).map(r => ({ label: config.buildLabel(r), value: r.id })));
      setLoadingRecords(false);
    });
    return () => { cancelled = true; };
  }, [newCategory, ticketMode]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, categoryFilter, search]);

  const tabFiltered = tickets.filter(t => activeTab === 'open' ? t.status !== 'Closed' : t.status === 'Closed');
  const filteredTickets = tabFiltered.filter(t => categoryFilter === 'All' || t.category === categoryFilter);
  const openCount = tickets.filter(t => t.status !== 'Closed').length;
  const closedCount = tickets.filter(t => t.status === 'Closed').length;

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Bulk close — admins only, and only on the Open tab (closed tickets aren't actionable)
  const bulkSelectable = isAdmin && activeTab === 'open';
  const { selected, toggle, toggleAll, isAllSelected, clear: clearSelection, count: selectedCount } =
    useSelection(bulkSelectable ? paginatedTickets.map(t => t.id) : []);
  const [confirmBulkCloseOpen, setConfirmBulkCloseOpen] = useState(false);
  const [bulkClosing, setBulkClosing] = useState(false);

  const handleBulkClose = async () => {
    setBulkClosing(true);
    const idsToClose = Array.from(selected);
    for (const id of idsToClose) {
      const ticket = tickets.find(t => t.id === id);
      if (ticket) await closeTicket(id, currentUser, ticket);
    }
    setBulkClosing(false);
    setToast?.({ type: 'success', message: `${idsToClose.length} ticket(s) closed.` });
    clearSelection();
    loadTickets();
  };

  const categoryFilterOptions = [
    { label: 'All Categories', value: 'All' },
    { label: 'Custom', value: 'Custom' },
    ...TICKET_CATEGORIES.map(c => ({ label: c.value, value: c.value }))
  ];

  const handleOpenNew = () => {
    setTicketMode('custom');
    setNewCategory('');
    setRecordOptions([]);
    setSelectedRecordId('');
    setSubject('');
    setDescription('');
    setPriority('Normal');
    setPendingFiles([]);
    setIsNewOpen(true);
  };

  const handleSubmitNew = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    if (ticketMode === 'module' && (!newCategory || !selectedRecordId)) return;

    setSubmitting(true);
    const selectedRecord = recordOptions.find(o => o.value === selectedRecordId);
    const formData = {
      category: ticketMode === 'custom' ? 'Custom' : newCategory,
      linkedRecordId: ticketMode === 'module' ? selectedRecordId : null,
      linkedRecordLabel: ticketMode === 'module' ? (selectedRecord?.label || null) : null,
      subject: subject.trim(),
      description: description.trim(),
      priority
    };
    const { data: newTicket, error } = await createTicket(formData, currentUser);

    if (!error && newTicket && pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        await uploadTicketAttachment(file, newTicket.id, null, currentUser);
      }
    }
    setSubmitting(false);

    if (!error) {
      setToast?.({ type: 'success', message: `Ticket submitted. We'll notify you when there's a response.` });
      setIsNewOpen(false);
      setPendingFiles([]);
      loadTickets();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleOpenDetail = async (ticket) => {
    // fetchTickets only carries reply *ids* for the count badge — show the
    // ticket immediately with an empty thread, then swap in the full thread.
    setActiveTicket({ ...ticket, replies: [], attachments: [] });
    const [{ data }, { data: attachments }] = await Promise.all([
      fetchTicketById(ticket.id),
      fetchTicketAttachments(ticket.id)
    ]);
    if (data) {
      const ticketAttachments = (attachments || []).filter(a => !a.replyId);
      const repliesWithAttachments = data.replies.map(r => ({
        ...r,
        attachments: (attachments || []).filter(a => a.replyId === r.id)
      }));
      setActiveTicket({ ...data, attachments: ticketAttachments, replies: repliesWithAttachments });
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !activeTicket) return;
    setSendingReply(true);
    const { data, error } = await replyToTicket(activeTicket.id, replyMessage.trim(), currentUser, activeTicket);

    let attachments = [];
    if (!error && data && replyFiles.length > 0) {
      for (const file of replyFiles) {
        const { data: att } = await uploadTicketAttachment(file, activeTicket.id, data.id, currentUser);
        if (att) attachments.push(att);
      }
    }
    setSendingReply(false);

    if (!error && data) {
      setReplyMessage('');
      setReplyFiles([]);
      setActiveTicket(prev => prev ? {
        ...prev,
        replies: [...prev.replies, { ...data, attachments }],
        status: prev.status === 'Open' && isAdmin ? 'In Progress' : prev.status
      } : prev);
      loadTickets();
    } else if (error) {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    const { data, error } = await closeTicket(activeTicket.id, currentUser, activeTicket);
    if (!error) {
      setToast?.({ type: 'success', message: `Ticket #${activeTicket.ticketNo} closed.` });
      setActiveTicket(data);
      loadTickets();
    } else {
      setToast?.({ type: 'error', message: error.message });
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('All');
  };

  const canReply = activeTicket && activeTicket.status !== 'Closed' &&
    (isAdmin || activeTicket.createdBy === currentUser?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Support Tickets
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {isAdmin
              ? 'Review, respond to, and close tickets raised across the organisation.'
              : 'Raise a custom query or a ticket against a specific record, and track responses here.'}
          </p>
        </div>
        {!isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={handleOpenNew}>
              <Plus size={16} /> New Ticket
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '4px', padding: '4px',
        backgroundColor: 'var(--bg-card-hover)', borderRadius: 'var(--radius-md)',
        width: 'fit-content', border: '1px solid var(--border-color)'
      }}>
        {[
          { key: 'open', label: `Open (${openCount})` },
          { key: 'closed', label: `Closed / History (${closedCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
              fontWeight: activeTab === tab.key ? 700 : 500,
              backgroundColor: activeTab === tab.key ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <ResponsiveFilterBar
        searchVal={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by subject, category, or requester..."
        activeFilterCount={categoryFilter !== 'All' ? 1 : 0}
        onClearFilters={resetFilters}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>Category:</span>
          <CustomSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryFilterOptions}
            style={{ width: '210px' }}
          />
        </div>
      </ResponsiveFilterBar>

      {bulkSelectable && (
        <BulkActionBar
          count={selectedCount}
          onClear={clearSelection}
          customAction={{
            label: bulkClosing ? 'Closing...' : `Close Selected`,
            icon: CheckCircle2,
            onClick: () => setConfirmBulkCloseOpen(true)
          }}
        />
      )}

      {/* Ticket Table */}
      {loading ? (
        <TableLoader rows={6} cols={isAdmin ? 6 : 5} />
      ) : paginatedTickets.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {bulkSelectable && (
                  <th style={{ width: '36px' }}>
                    <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
                  </th>
                )}
                <th>Ticket #</th>
                <th>Subject</th>
                {isAdmin && <th>Requested By</th>}
                <th>Status</th>
                <th>Last Activity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((t) => (
                <tr key={t.id}>
                  {bulkSelectable && (
                    <td>
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} />
                    </td>
                  )}
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>#{t.ticketNo}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>{t.subject}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {t.category}{t.linkedRecordLabel ? ` — ${t.linkedRecordLabel}` : ''}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>{t.createdByName}</td>
                  )}
                  <td><StatusBadge status={t.status} /></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {t.lastActivityAt ? new Date(t.lastActivityAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-sm" title="View Ticket" onClick={() => handleOpenDetail(t)}>
                      <Eye size={16} color="var(--text-muted)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title={activeTab === 'open' ? 'No Open Tickets' : 'No Closed Tickets'}
          description={activeTab === 'open'
            ? (isAdmin ? 'Nothing needs attention right now.' : 'Nothing needs attention right now. Raise a new ticket if you run into an issue.')
            : 'Closed tickets will appear here once resolved.'}
          canAdd={activeTab === 'open' && !isAdmin}
          onAdd={handleOpenNew}
          addText="New Ticket"
        />
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredTickets.length}
        itemsPerPage={itemsPerPage}
      />

      {/* ── New Ticket SlideOver ──────────────────────────────────────────── */}
      <SlideOver isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Raise a New Ticket">
        <form onSubmit={handleSubmitNew} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => { setTicketMode('custom'); setNewCategory(''); }}
              className="btn"
              style={{
                flex: 1, justifyContent: 'center',
                backgroundColor: ticketMode === 'custom' ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
                color: ticketMode === 'custom' ? 'var(--color-primary)' : 'var(--text-muted)',
                border: `1px solid ${ticketMode === 'custom' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                fontWeight: 600
              }}
            >
              Custom Query
            </button>
            <button
              type="button"
              onClick={() => setTicketMode('module')}
              className="btn"
              style={{
                flex: 1, justifyContent: 'center',
                backgroundColor: ticketMode === 'module' ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
                color: ticketMode === 'module' ? 'var(--color-primary)' : 'var(--text-muted)',
                border: `1px solid ${ticketMode === 'module' ? 'var(--color-primary)' : 'var(--border-color)'}`,
                fontWeight: 600
              }}
            >
              From a Module Record
            </button>
          </div>

          {ticketMode === 'module' && (
            <>
              <CustomSelect
                label="Category"
                value={newCategory}
                onChange={setNewCategory}
                placeholder="Select a module..."
                options={availableCategories.map(c => ({ label: c.value, value: c.value }))}
              />
              {newCategory && (
                <SearchableSelect
                  label="Linked Record"
                  value={selectedRecordId}
                  onChange={setSelectedRecordId}
                  options={recordOptions}
                  placeholder={loadingRecords ? 'Loading records...' : 'Select a record...'}
                  disabled={loadingRecords}
                />
              )}
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Subject
            </label>
            <input
              type="text"
              required
              className="input-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Description
            </label>
            <textarea
              rows={5}
              required
              className="input-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
            />
          </div>

          <CustomSelect
            label="Priority"
            value={priority}
            onChange={setPriority}
            options={PRIORITY_OPTIONS}
          />

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
              Attachments (optional)
            </label>
            <AttachmentPicker files={pendingFiles} onAdd={setPendingFiles} onRemove={(idx) => setPendingFiles(prev => prev.filter((_, i) => i !== idx))} setToast={setToast} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !subject.trim() || !description.trim() || (ticketMode === 'module' && (!newCategory || !selectedRecordId))}
            >
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* ── Ticket Detail SlideOver ───────────────────────────────────────── */}
      <SlideOver
        isOpen={!!activeTicket}
        onClose={() => { setActiveTicket(null); setReplyMessage(''); setReplyFiles([]); }}
        title={activeTicket ? `Ticket #${activeTicket.ticketNo}` : ''}
        width="560px"
      >
        {activeTicket && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.625rem' }}>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-main)' }}>{activeTicket.subject}</h3>
                <StatusBadge status={activeTicket.status} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span className="badge badge-blue">{activeTicket.category}</span>
                {activeTicket.linkedRecordLabel && (
                  <span className="badge badge-teal">{activeTicket.linkedRecordLabel}</span>
                )}
                <span className="badge badge-amber">{activeTicket.priority} Priority</span>
              </div>
              <p style={{
                fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                backgroundColor: 'var(--bg-card-hover)', padding: '0.875rem', borderRadius: 'var(--radius-md)'
              }}>
                {activeTicket.description}
              </p>
              <AttachmentList attachments={activeTicket.attachments} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Raised by {activeTicket.createdByName} · {new Date(activeTicket.createdAt).toLocaleString()}
              </p>
              {activeTicket.status === 'Closed' && activeTicket.closedAt && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Closed on {new Date(activeTicket.closedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Reply thread */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '0.75rem',
              borderTop: '1px solid var(--border-color)', paddingTop: '1rem'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Conversation
              </span>
              {(activeTicket.replies || []).length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                  No replies yet.
                </p>
              ) : (
                activeTicket.replies.map(r => (
                  <div
                    key={r.id}
                    style={{
                      alignSelf: r.authorId === currentUser.id ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: r.authorId === currentUser.id ? 'var(--color-primary-light)' : 'var(--bg-card-hover)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.625rem 0.875rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '2px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-main)' }}>{r.authorName}</span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{r.message}</p>
                    <AttachmentList attachments={r.attachments} />
                  </div>
                ))
              )}
            </div>

            {/* Reply box / closed notice */}
            {activeTicket.status === 'Closed' ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem',
                borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-card-hover)',
                color: 'var(--text-muted)', fontSize: '0.8125rem'
              }}>
                <Lock size={14} /> This ticket is closed.
              </div>
            ) : canReply ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <textarea
                  rows={3}
                  className="input-control"
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                />
                <AttachmentPicker files={replyFiles} onAdd={setReplyFiles} onRemove={(idx) => setReplyFiles(prev => prev.filter((_, i) => i !== idx))} setToast={setToast} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                  {isAdmin && (
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirmCloseOpen(true)}>
                      <CheckCircle2 size={16} /> Close Ticket
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginLeft: 'auto' }}
                    disabled={!replyMessage.trim() || sendingReply}
                    onClick={handleSendReply}
                  >
                    <Send size={16} /> {sendingReply ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </SlideOver>

      {/* Close confirmation */}
      <ConfirmDialog
        isOpen={confirmCloseOpen}
        onClose={() => setConfirmCloseOpen(false)}
        onConfirm={handleCloseTicket}
        title="Close Ticket"
        headline="Close this ticket?"
        message={`Ticket #${activeTicket?.ticketNo} will be marked closed and ${activeTicket?.createdByName || 'the requester'} will be notified. This can't be reopened.`}
        confirmText="Yes, Close Ticket"
        confirmLoadingText="Closing..."
        icon={CheckCircle2}
        confirmIcon={CheckCircle2}
        danger={false}
      />

      {/* Bulk close confirmation */}
      <ConfirmDialog
        isOpen={confirmBulkCloseOpen}
        onClose={() => setConfirmBulkCloseOpen(false)}
        onConfirm={handleBulkClose}
        title="Close Tickets"
        headline={`Close ${selectedCount} ticket(s)?`}
        message="Each requester will be notified. This can't be reopened."
        confirmText="Yes, Close Selected"
        confirmLoadingText="Closing..."
        icon={CheckCircle2}
        confirmIcon={CheckCircle2}
        danger={false}
      />
    </div>
  );
};
