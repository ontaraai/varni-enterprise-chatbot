import { useEffect, useState, useRef } from 'react';
import { X, Send, MessageSquare, ArrowLeft } from 'lucide-react';
import { fetchConversations, fetchConversation, sendReply } from '../api/admin';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatTime(date) {
  return new Date(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  });
}

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const loadConversations = async () => {
    try {
      const data = await fetchConversations(filter || undefined);
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadConversations();
  }, [filter]);

  const openConversation = async (id) => {
    setSelected(id);
    try {
      const data = await fetchConversation(id);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const closeChat = () => {
    setSelected(null);
    setDetail(null);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const updated = await sendReply(selected, replyText.trim());
      setDetail(updated);
      setReplyText('');
      loadConversations();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detail?.messages]);

  const filters = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Escalated', value: 'escalated' },
    { label: 'Resolved', value: 'resolved' },
  ];

  return (
    <div className="fade-in">
      {/* Page header — hidden on mobile when chat is open */}
      <div className={`page-header ${detail ? 'hide-on-mobile' : ''}`}>
        <h1 className="page-header__title">Conversations</h1>
        <p className="page-header__subtitle">
          View and manage customer conversations
        </p>
      </div>

      <div className={`filter-bar ${detail ? 'hide-on-mobile' : ''}`}>
        <div className="filter-bar__tabs">
          {filters.map((f) => (
            <button
              key={f.value}
              className={`filter-bar__tab ${filter === f.value ? 'filter-bar__tab--active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="conversations-layout">
        {/* Conversation List — hidden on mobile when chat is open */}
        <div className={`conversations-list ${detail ? 'hide-on-mobile' : ''}`}>
          {loading ? (
            <div className="loading">
              <div className="loading__spinner" />
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><MessageSquare /></div>
              <div className="empty-state__text">No conversations found</div>
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th className="hide-on-mobile">Status</th>
                    <th className="hide-on-mobile">Last Message</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {conversations.map((conv) => (
                    <tr
                      key={conv._id}
                      onClick={() => openConversation(conv._id)}
                      style={{
                        background: selected === conv._id ? 'var(--bg-sidebar-active)' : undefined,
                      }}
                    >
                      <td>
                        <div className="data-table__name">
                          {conv.customerName || 'Unknown'}
                        </div>
                        <div className="data-table__phone">{conv.phoneNumber}</div>
                      </td>
                      <td className="hide-on-mobile">
                        <span className={`badge badge--${conv.status}`}>
                          <span className="badge__dot" />
                          {conv.status}
                        </span>
                      </td>
                      <td className="hide-on-mobile">
                        <div className="data-table__preview">
                          {conv.lastMessagePreview}
                        </div>
                      </td>
                      <td>
                        <span className="data-table__secondary">
                          {timeAgo(conv.lastMessageAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chat Panel — full screen on mobile */}
        {detail && (
          <div className="conversations-chat">
            <div className="chat-panel">
              <div className="chat-panel__header">
                <div className="chat-panel__customer">
                  <button
                    className="btn btn--ghost show-on-mobile"
                    onClick={closeChat}
                    aria-label="Back to list"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div className="chat-panel__avatar">
                    {(detail.customerName || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="chat-panel__name">
                      {detail.customerName || 'Unknown'}
                    </div>
                    <div className="chat-panel__phone">{detail.phoneNumber}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge badge--${detail.status}`}>
                    <span className="badge__dot" />
                    {detail.status}
                  </span>
                  <button
                    className="btn btn--ghost hide-on-mobile"
                    onClick={closeChat}
                    aria-label="Close panel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="chat-panel__messages">
                {detail.messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
                    {msg.content}
                    <div className="chat-bubble__time">{formatTime(msg.timestamp)}</div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {(detail.status === 'escalated' || detail.status === 'active') && (
                <div className="chat-panel__input">
                  <input
                    type="text"
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                    disabled={sending}
                  />
                  <button
                    className="btn btn--primary"
                    onClick={handleReply}
                    disabled={sending || !replyText.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
