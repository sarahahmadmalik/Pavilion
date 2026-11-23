import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  fetchChatPeers,
  fetchChatOverview,
  fetchWorkspaceMessages,
  fetchChatMessages,
  sendChatMessage,
  markChatMessagesDelivered,
  markChatMessagesRead
} from '../lib/supabaseService.js';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import {
  Search,
  Send,
  Paperclip,
  X,
  Check,
  CheckCheck,
  FileText,
  Download,
  MessageSquare,
  Lock,
  Hash,
  ArrowLeft
} from 'lucide-react';

function formatShortTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const WORKSPACE_TARGET = { id: 'workspace', name: 'Community Workspace', isWorkspace: true };

export const TeamChat = () => {
  const { currentUser } = useAuth();
  const { refreshChatUnreadCount } = useNotifications() || {};
  const [peers, setPeers] = useState([]);
  const [overview, setOverview] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(WORKSPACE_TARGET);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'thread'
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(true);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedRef = useRef(selectedTarget);

  useEffect(() => {
    selectedRef.current = selectedTarget;
  }, [selectedTarget]);

  if (currentUser?.role === 'super_admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="page-header-container">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Team Chat
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Workspace &amp; direct messaging for Admin and Staff members.
            </p>
          </div>
        </div>
        <div style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Lock size={28} style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            Team Chat is restricted to Admin and Staff accounts.
          </p>
        </div>
      </div>
    );
  }

  const loadPeersAndOverview = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoadingPeers(true);
    const [peersRes, overviewRes] = await Promise.all([
      fetchChatPeers(currentUser.id),
      fetchChatOverview(currentUser.id)
    ]);

    if (peersRes.error) setError(peersRes.error.message);
    if (overviewRes.error && !peersRes.error) setError(overviewRes.error.message);

    setPeers(peersRes.data || []);
    setOverview(overviewRes.data || []);
    setLoadingPeers(false);
    await markChatMessagesDelivered(currentUser.id);
  }, [currentUser?.id]);

  const loadConversation = useCallback(async (target) => {
    if (!currentUser?.id || !target) return;
    if (target.isWorkspace) {
      const { data, error: wsErr } = await fetchWorkspaceMessages();
      if (wsErr) {
        setError(wsErr.message);
        return;
      }
      setMessages(data || []);
      return;
    }

    const { data, error: msgErr } = await fetchChatMessages(currentUser.id, target.id);
    if (msgErr) {
      setError(msgErr.message);
      return;
    }
    setMessages(data || []);
    await markChatMessagesRead(currentUser.id, target.id);
    refreshChatUnreadCount?.();
    setOverview(prev => prev.map(m =>
      m.sender_id === target.id && m.recipient_id === currentUser.id && !m.read_at
        ? { ...m, read_at: new Date().toISOString(), delivered_at: m.delivered_at || new Date().toISOString() }
        : m
    ));
  }, [currentUser?.id]);

  useEffect(() => {
    loadPeersAndOverview();
  }, [loadPeersAndOverview]);

  useEffect(() => {
    if (selectedTarget) {
      loadConversation(selectedTarget);
    }
  }, [selectedTarget, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel(`team_chat_${currentUser.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages' },
        async (payload) => {
          const row = payload.new;
          if (!row) return;
          const isWorkspaceMsg = row.channel === 'workspace';
          const involvesMe = isWorkspaceMsg || row.sender_id === currentUser.id || row.recipient_id === currentUser.id;
          if (!involvesMe) return;

          const ov = await fetchChatOverview(currentUser.id);
          if (!ov.error) setOverview(ov.data || []);

          if (!isWorkspaceMsg && payload.eventType === 'INSERT' && row.recipient_id === currentUser.id && !row.delivered_at) {
            await markChatMessagesDelivered(currentUser.id, row.sender_id);
          }

          const active = selectedRef.current;
          if (active?.isWorkspace && isWorkspaceMsg) {
            await loadConversation(active);
          } else if (active && !active.isWorkspace && (row.sender_id === active.id || row.recipient_id === active.id)) {
            await loadConversation(active);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, loadConversation]);

  const handleSelectTarget = (target) => {
    setSelectedTarget(target);
    setMobileView('thread');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedTarget || sending) return;
    if (!draft.trim() && !attachment) return;

    setError('');
    setSending(true);
    const { data, error: sendErr } = await sendChatMessage({
      sender: currentUser,
      recipient: selectedTarget.isWorkspace ? null : selectedTarget,
      channel: selectedTarget.isWorkspace ? 'workspace' : 'dm',
      body: draft,
      file: attachment
    });
    setSending(false);

    if (sendErr) {
      setError(sendErr.message);
      return;
    }

    setDraft('');
    setAttachment(null);
    if (data) {
      setMessages(prev => [...prev, { ...data, sender: { id: currentUser.id, name: currentUser.name, role: currentUser.role } }]);
      setOverview(prev => [data, ...prev]);
    }
  };

  const getPeerMeta = (peerId) => {
    const threadMsgs = overview.filter(m =>
      m.channel !== 'workspace' && (
        (m.sender_id === currentUser.id && m.recipient_id === peerId) ||
        (m.sender_id === peerId && m.recipient_id === currentUser.id)
      )
    );
    const last = threadMsgs[0] || null;
    const unread = threadMsgs.filter(m => m.sender_id === peerId && m.recipient_id === currentUser.id && !m.read_at).length;
    return { last, unread };
  };

  const filteredPeers = peers.filter(p =>
    !search.trim() ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Team Chat
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Combined workspace channel and private direct messages with delivery &amp; read receipts.
          </p>
        </div>
      </div>

      {error && (
        <ErrorBanner
          type="error"
          title="Messaging Notice"
          message={error}
          onRetry={loadPeersAndOverview}
        />
      )}

      <div className="team-chat-shell">
        {/* Left: Channels & Peers */}
        <div
          className={mobileView === 'thread' ? 'team-chat-hidden-mobile' : ''}
          style={{
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-card)',
            minHeight: 0
          }}
        >
          <div style={{ padding: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search channels or people..."
                style={{ paddingLeft: '2.1rem', fontSize: '0.8125rem' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '0.6rem 1rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Workspace Channel
            </div>
            <button
              type="button"
              onClick={() => handleSelectTarget(WORKSPACE_TARGET)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: selectedTarget?.isWorkspace ? 'var(--color-primary-light)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: 'var(--color-primary)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Hash size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>community-ops</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Shared team workspace</div>
              </div>
            </button>

            <div style={{ padding: '0.75rem 1rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Direct Messages
            </div>
            {loadingPeers ? (
              <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading team members...</p>
            ) : filteredPeers.length === 0 ? (
              <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No eligible team members found.</p>
            ) : (
              filteredPeers.map(peer => {
                const { last, unread } = getPeerMeta(peer.id);
                const isSelected = !selectedTarget?.isWorkspace && selectedTarget?.id === peer.id;
                return (
                  <button
                    key={peer.id}
                    type="button"
                    onClick={() => handleSelectTarget(peer)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.8rem 1rem',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <UserAvatar name={peer.name} avatarUrl={peer.avatar} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {peer.name}
                        </span>
                        {last && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {formatShortTime(last.created_at)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {last ? (last.body || `Attachment: ${last.attachment_name}`) : `${peer.role === 'admin' ? 'Admin' : 'Staff'}`}
                        </span>
                        {unread > 0 && (
                          <span style={{
                            minWidth: '18px', height: '18px', padding: '0 5px',
                            borderRadius: '999px', backgroundColor: 'var(--color-primary)',
                            color: '#fff', fontSize: '0.6875rem', fontWeight: 700,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Thread */}
        <div
          className={mobileView === 'list' ? 'team-chat-hidden-mobile' : ''}
          style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', minWidth: 0, minHeight: 0 }}
        >
          {!selectedTarget ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-muted)', textAlign: 'center', gap: '0.65rem' }}>
              <MessageSquare size={24} color="var(--color-primary)" />
              <p style={{ fontSize: '0.875rem' }}>Select a channel or team member to start chatting.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div style={{
                padding: '0.85rem 1.15rem',
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    className="btn btn-ghost team-chat-back-btn"
                    style={{ padding: '0.35rem', borderRadius: '8px' }}
                    title="Back to Conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  {selectedTarget.isWorkspace ? (
                    <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Hash size={16} />
                    </div>
                  ) : (
                    <UserAvatar name={selectedTarget.name} avatarUrl={selectedTarget.avatar} size={34} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {selectedTarget.isWorkspace ? '#community-ops' : selectedTarget.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: selectedTarget.isWorkspace ? 'none' : 'capitalize' }}>
                      {selectedTarget.isWorkspace ? 'Combined Admin & Staff Workspace' : `${selectedTarget.role} · ${selectedTarget.email}`}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Lock size={12} /> Encrypted
                </span>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2rem' }}>
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.sender_id === currentUser.id;
                    const isImage = msg.attachment_type?.startsWith('image/');
                    return (
                      <div
                        key={msg.id}
                        style={{
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '78%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start'
                        }}
                      >
                        {selectedTarget.isWorkspace && !isMine && msg.sender?.name && (
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px' }}>
                            {msg.sender.name}
                          </span>
                        )}
                        <div style={{
                          padding: '0.65rem 0.9rem',
                          borderRadius: isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                          backgroundColor: isMine ? 'var(--color-primary)' : 'var(--bg-card)',
                          color: isMine ? '#FFFFFF' : 'var(--text-main)',
                          border: isMine ? 'none' : '1px solid var(--border-color)',
                          boxShadow: 'var(--shadow-sm)',
                          fontSize: '0.875rem',
                          lineHeight: 1.45,
                          wordBreak: 'break-word'
                        }}>
                          {msg.attachment_path && (
                            <div style={{ marginBottom: msg.body ? '0.5rem' : 0 }}>
                              {isImage && msg.attachmentUrl ? (
                                <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={msg.attachmentUrl}
                                    alt={msg.attachment_name}
                                    style={{ maxWidth: '240px', maxHeight: '180px', borderRadius: '8px', display: 'block', objectFit: 'cover' }}
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.attachmentUrl || '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '8px',
                                    backgroundColor: isMine ? 'rgba(255,255,255,0.16)' : 'var(--bg-page)',
                                    color: isMine ? '#FFFFFF' : 'var(--text-main)',
                                    textDecoration: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 600
                                  }}
                                >
                                  <FileText size={15} />
                                  <span>{msg.attachment_name}</span>
                                  {msg.attachment_size && <span style={{ opacity: 0.75 }}>({formatBytes(msg.attachment_size)})</span>}
                                  <Download size={13} />
                                </a>
                              )}
                            </div>
                          )}
                          {msg.body && <div>{msg.body}</div>}
                        </div>

                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          <span>{formatShortTime(msg.created_at)}</span>
                          {isMine && !selectedTarget.isWorkspace && (
                            msg.read_at ? (
                              <span title="Read" style={{ display: 'inline-flex', color: '#3B82F6' }}>
                                <CheckCheck size={14} />
                              </span>
                            ) : msg.delivered_at ? (
                              <span title="Delivered" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                                <CheckCheck size={14} />
                              </span>
                            ) : (
                              <span title="Sent" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>
                                <Check size={13} />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <form
                onSubmit={handleSend}
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-card)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                {attachment && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    alignSelf: 'flex-start'
                  }}>
                    <Paperclip size={13} />
                    <span>{attachment.name} ({formatBytes(attachment.size)})</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setAttachment(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-secondary"
                    title="Attach file (max 10 MB)"
                    style={{ padding: '0.55rem 0.7rem' }}
                  >
                    <Paperclip size={16} />
                  </button>

                  <input
                    className="form-input"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder={selectedTarget.isWorkspace ? 'Message #community-ops...' : `Message ${selectedTarget.name}...`}
                    style={{ flex: 1 }}
                  />

                  <button
                    type="submit"
                    disabled={sending || (!draft.trim() && !attachment)}
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Send size={15} /> {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
