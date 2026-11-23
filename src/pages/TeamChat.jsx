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
  markChatMessagesRead,
  togglePinChatMessage,
  toggleChatReaction,
  deleteChatMessageForMe,
  deleteChatMessageForEveryone
} from '../lib/supabaseService.js';
import { UserAvatar } from '../components/common/UserAvatar.jsx';
import { CustomSelect } from '../components/common/CustomSelect.jsx';
import { Modal } from '../components/common/Modal.jsx';
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
  Lock,
  Hash,
  ChevronLeft,
  Pin,
  MoreVertical,
  Smile,
  Trash2,
  Image as ImageIcon,
  Camera,
  Ban,
  Reply,
  MessageSquarePlus
} from 'lucide-react';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const WORKSPACE_TARGET = { id: 'workspace', name: 'Community Workspace', isWorkspace: true };

function formatShortTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatLastSeen(ts) {
  if (!ts) return 'Offline';
  const diffMin = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diffMin < 2) return 'Last seen just now';
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;
  if (diffMin < 1440) return `Last seen ${Math.floor(diffMin / 60)}h ago`;
  return `Last seen ${new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export const TeamChat = () => {
  const { currentUser, onlineUserIds = [] } = useAuth();
  const { refreshChatUnreadCount } = useNotifications() || {};
  const [peers, setPeers] = useState([]);
  const [overview, setOverview] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(WORKSPACE_TARGET);
  const [mobileView, setMobileView] = useState('list');
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [readFilter, setReadFilter] = useState('all');
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loadingPeers, setLoadingPeers] = useState(true);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showPeoplePanel, setShowPeoplePanel] = useState(false);
  const [peopleSearch, setPeopleSearch] = useState('');
  const [openMenuMsgId, setOpenMenuMsgId] = useState(null);
  const [openReactMsgId, setOpenReactMsgId] = useState(null);
  const [deleteModalMsg, setDeleteModalMsg] = useState(null);
  const [deletingMsg, setDeletingMsg] = useState(false);
  const longPressTimerRef = useRef(null);
  const [pinnedConvIds, setPinnedConvIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`pavilion_pinned_chats_${currentUser?.id || 'anon'}`);
      return saved ? JSON.parse(saved) : ['workspace'];
    } catch {
      return ['workspace'];
    }
  });

  const bottomRef = useRef(null);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const selectedRef = useRef(selectedTarget);

  useEffect(() => {
    selectedRef.current = selectedTarget;
  }, [selectedTarget]);

  useEffect(() => {
    const closeMenus = () => {
      setOpenMenuMsgId(null);
      setOpenReactMsgId(null);
    };
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  const togglePinConversation = (e, id) => {
    e.stopPropagation();
    setPinnedConvIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem(`pavilion_pinned_chats_${currentUser?.id || 'anon'}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

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
  }, [currentUser?.id, refreshChatUnreadCount]);

  useEffect(() => { loadPeersAndOverview(); }, [loadPeersAndOverview]);

  useEffect(() => {
    if (selectedTarget) loadConversation(selectedTarget);
  }, [selectedTarget, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, loadConversation]);

  const handleSelectTarget = (target) => {
    setSelectedTarget(target);
    setMobileView('thread');
    setShowAttachMenu(false);
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
      file: attachment,
      replyToId: replyingTo?.id || null
    });
    setSending(false);

    if (sendErr) {
      setError(sendErr.message);
      return;
    }

    setDraft('');
    setAttachment(null);
    setReplyingTo(null);
    setShowAttachMenu(false);
    if (data) {
      setMessages(prev => [...prev, {
        ...data,
        replyTo: replyingTo || null,
        sender: { id: currentUser.id, name: currentUser.name, role: currentUser.role, avatar: currentUser.avatar }
      }]);
      setOverview(prev => [data, ...prev]);
    }
  };

  const handleReact = async (msg, emoji) => {
    setOpenReactMsgId(null);
    setOpenMenuMsgId(null);
    const { data } = await toggleChatReaction(msg.id, emoji, currentUser.id, msg.reactions);
    if (data) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, reactions: data.reactions } : m));
    }
  };

  const handlePinMsg = async (msg) => {
    setOpenMenuMsgId(null);
    const { data } = await togglePinChatMessage(msg.id, msg.is_pinned);
    if (data) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: data.is_pinned } : m));
    }
  };

  const handleDeleteForMe = async (msg) => {
    setDeletingMsg(true);
    const { error: delErr } = await deleteChatMessageForMe(msg.id, currentUser.id, msg.deleted_for);
    setDeletingMsg(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setDeleteModalMsg(null);
    setMessages(prev => prev.filter(m => m.id !== msg.id));
  };

  const handleDeleteForEveryone = async (msg) => {
    setDeletingMsg(true);
    const { data, error: delErr } = await deleteChatMessageForEveryone(msg.id);
    setDeletingMsg(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setDeleteModalMsg(null);
    if (data) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, ...data, attachmentUrl: null } : m));
    }
  };

  const startLongPress = (msg) => {
    if (msg.deleted_for_all) return;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      setOpenReactMsgId(msg.id);
      setOpenMenuMsgId(msg.id);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const getPeerMeta = (peerId) => {
    const threadMsgs = overview.filter(m =>
      m.channel !== 'workspace' &&
      !(m.deleted_for || []).includes(currentUser.id) &&
      ((m.sender_id === currentUser.id && m.recipient_id === peerId) ||
       (m.sender_id === peerId && m.recipient_id === currentUser.id))
    );
    const last = threadMsgs[0] || null;
    const unread = threadMsgs.filter(m => m.sender_id === peerId && m.recipient_id === currentUser.id && !m.read_at).length;
    return { last, unread };
  };

  const filteredPeers = peers
    .filter(p => {
      const { last, unread } = getPeerMeta(p.id);
      const isActiveSelection = !selectedTarget?.isWorkspace && selectedTarget?.id === p.id;
      if (!last && !isActiveSelection) return false;

      const matchesSearch = !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (readFilter === 'all') return true;
      return readFilter === 'unread' ? unread > 0 : unread === 0;
    })
    .sort((a, b) => {
      const aPin = pinnedConvIds.includes(a.id) ? 1 : 0;
      const bPin = pinnedConvIds.includes(b.id) ? 1 : 0;
      return bPin - aPin;
    });

  const modalPeople = peers.filter(p =>
    !peopleSearch.trim() ||
    p.name.toLowerCase().includes(peopleSearch.toLowerCase()) ||
    p.email.toLowerCase().includes(peopleSearch.toLowerCase()) ||
    p.role.toLowerCase().includes(peopleSearch.toLowerCase())
  );

  const visibleMessages = messages.filter(m => !(m.deleted_for || []).includes(currentUser.id));
  const pinnedMessages = visibleMessages.filter(m => m.is_pinned && !m.deleted_for_all);
  const latestPinned = pinnedMessages[pinnedMessages.length - 1] || null;

  const isPeerOnline = selectedTarget && !selectedTarget.isWorkspace && onlineUserIds.includes(selectedTarget.id);

  if (currentUser?.role === 'super_admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="page-header-container">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>Team Chat</h2>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="page-header-container">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Team Chat
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Workspace channel &amp; encrypted direct messages with live presence, reactions, and pinned messages.
          </p>
        </div>
      </div>

      {error && (
        <ErrorBanner type="error" title="Messaging Notice" message={error} onRetry={loadPeersAndOverview} />
      )}

      <div className="team-chat-shell">
        {/* Left: Chats List OR WhatsApp-style People in Workspace Panel */}
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
          {showPeoplePanel ? (
            <>
              <div style={{
                padding: '0.75rem 0.85rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowPeoplePanel(false); setPeopleSearch(''); }}
                    className="btn btn-ghost"
                    style={{ padding: '0.3rem', borderRadius: '50%' }}
                    title="Back to Chats"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    New Chat
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    value={peopleSearch}
                    onChange={e => setPeopleSearch(e.target.value)}
                    placeholder="Search Admin & Staff..."
                    style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '0.55rem 1rem 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  People in Workspace ({modalPeople.length})
                </div>
                {modalPeople.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '1.5rem 1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    No matching workspace members found.
                  </p>
                ) : (
                  modalPeople.map(person => {
                    const online = onlineUserIds.includes(person.id);
                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          handleSelectTarget(person);
                          setShowPeoplePanel(false);
                          setPeopleSearch('');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderBottom: '1px solid var(--border-color)',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <UserAvatar name={person.name} src={person.avatar} size={38} />
                          <span style={{
                            position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px',
                            borderRadius: '50%', backgroundColor: online ? '#22C55E' : '#94A3B8',
                            border: '2px solid var(--bg-card)'
                          }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {person.name}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: online ? '#16A34A' : 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {person.role} · {online ? 'Online' : formatLastSeen(person.last_seen)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
          <div style={{ padding: '0.75rem 0.85rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chats..."
                  style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-page)' }}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPeoplePanel(true)}
                className="btn btn-primary"
                title="People in Workspace / New Chat"
                style={{ padding: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', flexShrink: 0 }}
              >
                <MessageSquarePlus size={16} />
              </button>
            </div>
            <CustomSelect
              value={readFilter}
              onChange={setReadFilter}
              options={[
                { value: 'all', label: 'All Chats' },
                { value: 'unread', label: 'Unread' },
                { value: 'read', label: 'Read' }
              ]}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ padding: '0.55rem 1rem 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Workspace
            </div>
            <div
              onClick={() => handleSelectTarget(WORKSPACE_TARGET)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                backgroundColor: selectedTarget?.isWorkspace ? 'var(--color-primary-light)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Hash size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>community-ops</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Shared Admin &amp; Staff room</div>
              </div>
              <button
                type="button"
                onClick={(e) => togglePinConversation(e, 'workspace')}
                title={pinnedConvIds.includes('workspace') ? 'Unpin' : 'Pin'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: pinnedConvIds.includes('workspace') ? 'var(--color-primary)' : 'var(--text-muted)', padding: '4px' }}
              >
                <Pin size={14} />
              </button>
            </div>

            <div style={{ padding: '0.65rem 1rem 0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Direct Messages
            </div>
            {loadingPeers ? (
              <p style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading team...</p>
            ) : filteredPeers.length === 0 ? (
              <div style={{ padding: '1.25rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <p style={{ marginBottom: '0.6rem' }}>No chat history yet.</p>
                <button
                  type="button"
                  onClick={() => setShowPeoplePanel(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <MessageSquarePlus size={14} /> Start a Chat
                </button>
              </div>
            ) : (
              filteredPeers.map(peer => {
                const { last, unread } = getPeerMeta(peer.id);
                const isSelected = !selectedTarget?.isWorkspace && selectedTarget?.id === peer.id;
                const online = onlineUserIds.includes(peer.id);
                const isPinned = pinnedConvIds.includes(peer.id);

                return (
                  <div
                    key={peer.id}
                    onClick={() => handleSelectTarget(peer)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <UserAvatar name={peer.name} src={peer.avatar} size={38} />
                      <span
                        title={online ? 'Online' : formatLastSeen(peer.last_seen)}
                        style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: '10px', height: '10px', borderRadius: '50%',
                          backgroundColor: online ? '#22C55E' : '#94A3B8',
                          border: '2px solid var(--bg-card)'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {peer.name}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                          {last ? formatShortTime(last.created_at) : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {last ? (last.deleted_for_all ? 'Message deleted' : (last.body || `Attachment: ${last.attachment_name}`)) : (online ? 'Online' : formatLastSeen(peer.last_seen))}
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          {unread > 0 && (
                            <span style={{
                              minWidth: '18px', height: '18px', padding: '0 5px', borderRadius: '999px',
                              backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '0.6875rem',
                              fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {unread}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => togglePinConversation(e, peer.id)}
                            title={isPinned ? 'Unpin chat' : 'Pin chat'}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: isPinned ? 'var(--color-primary)' : 'var(--text-muted)', padding: '2px', opacity: isPinned ? 1 : 0.45 }}
                          >
                            <Pin size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
            </>
          )}
        </div>

        {/* Right: Active Thread (iPhone-style clean layout on mobile) */}
        <div
          className={mobileView === 'list' ? 'team-chat-hidden-mobile' : ''}
          style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', minWidth: 0, minHeight: 0, position: 'relative' }}
        >
          {/* iOS / WhatsApp-style Header */}
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--bg-card)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
              <button
                type="button"
                onClick={() => setMobileView('list')}
                className="btn btn-ghost team-chat-back-btn"
                style={{ padding: '0.3rem 0.4rem', borderRadius: '999px', color: 'var(--color-primary)' }}
                title="Back"
              >
                <ChevronLeft size={22} />
              </button>
              {selectedTarget.isWorkspace ? (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Hash size={17} />
                </div>
              ) : (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar name={selectedTarget.name} src={selectedTarget.avatar} size={36} />
                  <span style={{
                    position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px',
                    borderRadius: '50%', backgroundColor: isPeerOnline ? '#22C55E' : '#94A3B8',
                    border: '2px solid var(--bg-card)'
                  }} />
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedTarget.isWorkspace ? '#community-ops' : selectedTarget.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: isPeerOnline ? '#16A34A' : 'var(--text-muted)', fontWeight: isPeerOnline ? 600 : 400 }}>
                  {selectedTarget.isWorkspace ? 'Combined Admin & Staff Workspace' : (isPeerOnline ? 'Online' : formatLastSeen(selectedTarget.last_seen))}
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <Lock size={12} /> Encrypted
            </span>
          </div>

          {/* Pinned Message Banner */}
          {latestPinned && (
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-primary-light)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <Pin size={13} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: 'var(--color-primary)', flexShrink: 0 }}>Pinned:</span>
                <span style={{ color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latestPinned.body || latestPinned.attachment_name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handlePinMsg(latestPinned)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.72rem' }}
              >
                Unpin
              </button>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visibleMessages.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '2rem' }}>
                No messages yet. Start the conversation!
              </p>
            ) : (
              visibleMessages.map((msg, idx) => {
                const isMine = msg.sender_id === currentUser.id;
                const isImage = msg.attachment_type?.startsWith('image/');
                const reactionEntries = Object.entries(msg.reactions || {}).filter(([, arr]) => Array.isArray(arr) && arr.length > 0);
                const openDownward = idx < 2;
                const senderName = msg.sender?.name || (isMine ? currentUser.name : selectedTarget?.name);
                const senderAvatar = msg.sender?.avatar || (isMine ? currentUser.avatar : selectedTarget?.avatar);

                return (
                  <div
                    key={msg.id}
                    className="chat-msg-row"
                    style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMine ? 'flex-end' : 'flex-start',
                      position: 'relative',
                      zIndex: (openMenuMsgId === msg.id || openReactMsgId === msg.id) ? 40 : 1
                    }}
                  >
                    {selectedTarget.isWorkspace && !isMine && senderName && (
                      <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '2px', marginLeft: '34px' }}>
                        {senderName}
                      </span>
                    )}

                    <div
                      onTouchStart={() => startLongPress(msg)}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      style={{ display: 'flex', alignItems: 'flex-end', gap: '0.45rem', flexDirection: isMine ? 'row-reverse' : 'row', position: 'relative' }}
                    >
                      {!isMine && (
                        <UserAvatar name={senderName} src={senderAvatar} size={26} style={{ flexShrink: 0 }} />
                      )}
                      {/* Bubble */}
                      <div style={{
                        padding: '0.6rem 0.9rem',
                        borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: msg.deleted_for_all ? 'var(--bg-card)' : (isMine ? 'var(--color-primary)' : 'var(--bg-card)'),
                        color: msg.deleted_for_all ? 'var(--text-muted)' : (isMine ? '#FFFFFF' : 'var(--text-main)'),
                        border: (msg.deleted_for_all || !isMine) ? '1px solid var(--border-color)' : 'none',
                        boxShadow: 'var(--shadow-sm)',
                        fontSize: '0.875rem',
                        lineHeight: 1.45,
                        overflowWrap: 'break-word',
                        wordBreak: 'normal'
                      }}>
                        {msg.deleted_for_all ? (
                          <span style={{ fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem' }}>
                            <Ban size={13} /> This message was deleted
                          </span>
                        ) : (
                          <>
                            {msg.replyTo && (
                              <div style={{
                                padding: '0.35rem 0.55rem',
                                marginBottom: '0.4rem',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${isMine ? '#93C5FD' : 'var(--color-primary)'}`,
                                backgroundColor: isMine ? 'rgba(255,255,255,0.14)' : 'var(--bg-page)',
                                fontSize: '0.74rem'
                              }}>
                                <div style={{ fontWeight: 700, opacity: 0.9 }}>
                                  {msg.replyTo.sender?.name || (msg.replyTo.sender_id === currentUser.id ? 'You' : selectedTarget?.name)}
                                </div>
                                <div style={{ opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '210px' }}>
                                  {msg.replyTo.deleted_for_all ? 'This message was deleted' : (msg.replyTo.body || msg.replyTo.attachment_name)}
                                </div>
                              </div>
                            )}
                            {msg.is_pinned && (
                              <div style={{ fontSize: '0.65rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '3px' }}>
                                <Pin size={10} /> Pinned
                              </div>
                            )}
                            {msg.attachment_path && (
                              <div style={{ marginBottom: msg.body ? '0.45rem' : 0 }}>
                                {isImage && msg.attachmentUrl ? (
                                  <a href={msg.attachmentUrl} target="_blank" rel="noreferrer">
                                    <img src={msg.attachmentUrl} alt={msg.attachment_name} style={{ maxWidth: '230px', maxHeight: '180px', borderRadius: '10px', display: 'block', objectFit: 'cover' }} />
                                  </a>
                                ) : (
                                  <a
                                    href={msg.attachmentUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                                      padding: '0.45rem 0.65rem', borderRadius: '10px',
                                      backgroundColor: isMine ? 'rgba(255,255,255,0.16)' : 'var(--bg-page)',
                                      color: isMine ? '#FFFFFF' : 'var(--text-main)',
                                      textDecoration: 'none', fontSize: '0.78rem', fontWeight: 600
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
                          </>
                        )}
                      </div>

                      {/* Hover Actions: Emoji + 3-Dots */}
                      {!msg.deleted_for_all && (
                        <div
                          className="chat-msg-actions"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '2px',
                            opacity: (openMenuMsgId === msg.id || openReactMsgId === msg.id) ? 1 : 0,
                            pointerEvents: (openMenuMsgId === msg.id || openReactMsgId === msg.id) ? 'auto' : 'none',
                            transition: 'opacity 0.14s ease',
                            position: 'relative'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => { setOpenReactMsgId(openReactMsgId === msg.id ? null : msg.id); setOpenMenuMsgId(null); }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="React"
                          >
                            <Smile size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setOpenMenuMsgId(openMenuMsgId === msg.id ? null : msg.id); setOpenReactMsgId(null); }}
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
                            title="More options"
                          >
                            <MoreVertical size={13} />
                          </button>

                          {/* Emoji Reaction Picker Popover */}
                          {openReactMsgId === msg.id && (
                            <div style={{
                              position: 'absolute',
                              [openDownward ? 'top' : 'bottom']: '32px',
                              [isMine ? 'right' : 'left']: 0,
                              zIndex: 50,
                              backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: '999px', padding: '4px 8px', boxShadow: 'var(--shadow-dropdown)',
                              display: 'flex', gap: '4px', animation: 'popUpMenu 0.14s ease-out'
                            }}>
                              {REACTION_EMOJIS.map(em => (
                                <button
                                  key={em}
                                  type="button"
                                  onClick={() => handleReact(msg, em)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '2px 4px', borderRadius: '50%' }}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* 3-Dots Dropdown */}
                          {openMenuMsgId === msg.id && (
                            <div style={{
                              position: 'absolute',
                              [openDownward ? 'top' : 'bottom']: '32px',
                              [isMine ? 'right' : 'left']: 0,
                              zIndex: 50,
                              minWidth: '175px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                              borderRadius: '10px', padding: '4px', boxShadow: 'var(--shadow-dropdown)',
                              display: 'flex', flexDirection: 'column', animation: 'popUpMenu 0.14s ease-out'
                            }}>
                              <button
                                type="button"
                                onClick={() => { setReplyingTo(msg); setOpenMenuMsgId(null); }}
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', gap: '8px', width: '100%' }}
                              >
                                <Reply size={13} /> Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePinMsg(msg)}
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', gap: '8px', width: '100%' }}
                              >
                                <Pin size={13} /> {msg.is_pinned ? 'Unpin Message' : 'Pin Message'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setDeleteModalMsg(msg); setOpenMenuMsgId(null); setOpenReactMsgId(null); }}
                                className="btn btn-ghost btn-sm"
                                style={{ justifyContent: 'flex-start', gap: '8px', width: '100%', color: '#DC2626' }}
                              >
                                <Trash2 size={13} /> Delete Message
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions Pills */}
                    {reactionEntries.length > 0 && !msg.deleted_for_all && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                        {reactionEntries.map(([emoji, users]) => {
                          const reactedByMe = users.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleReact(msg, emoji)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '3px',
                                padding: '1px 7px', borderRadius: '999px', fontSize: '0.72rem',
                                backgroundColor: reactedByMe ? 'var(--color-primary-light)' : 'var(--bg-card)',
                                border: `1px solid ${reactedByMe ? 'var(--color-primary)' : 'var(--border-color)'}`,
                                color: 'var(--text-main)', cursor: 'pointer'
                              }}
                            >
                              <span>{emoji}</span>
                              <span style={{ fontWeight: 700, fontSize: '0.68rem' }}>{users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Timestamp + Delivery / Read Receipt */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      <span>{formatShortTime(msg.created_at)}</span>
                      {isMine && !selectedTarget.isWorkspace && !msg.deleted_for_all && (
                        msg.read_at ? (
                          <span title="Read" style={{ display: 'inline-flex', color: '#3B82F6' }}><CheckCheck size={14} /></span>
                        ) : msg.delivered_at ? (
                          <span title="Delivered" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}><CheckCheck size={14} /></span>
                        ) : (
                          <span title="Sent" style={{ display: 'inline-flex', color: 'var(--text-muted)' }}><Check size={13} /></span>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* WhatsApp-Style Animated Attachment Menu + iOS Pill Composer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: '0.65rem 0.9rem',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              position: 'relative'
            }}
          >
            {showAttachMenu && (
              <div style={{
                position: 'absolute', bottom: '62px', left: '12px', zIndex: 25,
                backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '14px', padding: '0.55rem', boxShadow: 'var(--shadow-dropdown)',
                display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: '190px',
                animation: 'popUpMenu 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}>
                <button
                  type="button"
                  onClick={() => { photoInputRef.current?.click(); setShowAttachMenu(false); }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.65rem', padding: '0.5rem 0.65rem' }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.14)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={15} />
                  </span>
                  <span>Photos &amp; Videos</span>
                </button>
                <button
                  type="button"
                  onClick={() => { docInputRef.current?.click(); setShowAttachMenu(false); }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.65rem', padding: '0.5rem 0.65rem' }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.14)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={15} />
                  </span>
                  <span>Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => { cameraInputRef.current?.click(); setShowAttachMenu(false); }}
                  className="btn btn-ghost btn-sm"
                  style={{ justifyContent: 'flex-start', gap: '0.65rem', padding: '0.5rem 0.65rem' }}
                >
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(16,185,129,0.14)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={15} />
                  </span>
                  <span>Camera</span>
                </button>
              </div>
            )}

            {replyingTo && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem',
                padding: '0.45rem 0.75rem', borderRadius: '10px',
                borderLeft: '3px solid var(--color-primary)',
                backgroundColor: 'var(--bg-page)', fontSize: '0.78rem'
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    Replying to {replyingTo.sender?.name || (replyingTo.sender_id === currentUser.id ? 'yourself' : selectedTarget?.name)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {replyingTo.body || replyingTo.attachment_name}
                  </div>
                </div>
                <button type="button" onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                  <X size={15} />
                </button>
              </div>
            )}

            {attachment && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.65rem', borderRadius: '999px',
                backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                fontSize: '0.78rem', fontWeight: 600, alignSelf: 'flex-start'
              }}>
                <Paperclip size={13} />
                <span>{attachment.name} ({formatBytes(attachment.size)})</span>
                <button type="button" onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input ref={photoInputRef} type="file" hidden accept="image/*" onChange={e => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />
              <input ref={docInputRef} type="file" hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={e => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />
              <input ref={cameraInputRef} type="file" hidden accept="image/*" capture="environment" onChange={e => { if (e.target.files?.[0]) setAttachment(e.target.files[0]); e.target.value = ''; }} />

              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="btn btn-secondary"
                title="Attach"
                style={{ padding: '0.55rem', borderRadius: '50%', width: '38px', height: '38px', flexShrink: 0 }}
              >
                <Paperclip size={16} />
              </button>

              <input
                className="form-input"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder={selectedTarget.isWorkspace ? 'Message #community-ops...' : `Message ${selectedTarget.name}...`}
                style={{ flex: 1, minWidth: 0, borderRadius: 'var(--radius-md)' }}
              />

              <button
                type="submit"
                disabled={sending || (!draft.trim() && !attachment)}
                className="btn btn-primary"
                style={{ padding: '0.55rem', borderRadius: '50%', width: '38px', height: '38px', flexShrink: 0 }}
                title="Send"
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Message Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalMsg}
        onClose={deletingMsg ? () => {} : () => setDeleteModalMsg(null)}
        title="Delete Message?"
        maxWidth="400px"
      >
        {deleteModalMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Choose how you would like to remove this message. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {deleteModalMsg.sender_id === currentUser.id && !deleteModalMsg.deleted_for_all && (
                <button
                  type="button"
                  disabled={deletingMsg}
                  onClick={() => handleDeleteForEveryone(deleteModalMsg)}
                  className="btn btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {deletingMsg ? 'Deleting...' : 'Delete for Everyone'}
                </button>
              )}
              <button
                type="button"
                disabled={deletingMsg}
                onClick={() => handleDeleteForMe(deleteModalMsg)}
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Delete for Me
              </button>
              <button
                type="button"
                disabled={deletingMsg}
                onClick={() => setDeleteModalMsg(null)}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
