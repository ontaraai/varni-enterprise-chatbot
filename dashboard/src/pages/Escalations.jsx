import { useEffect, useState } from 'react';
import { Check, Send, AlertTriangle, FileText } from 'lucide-react';
import {
  fetchEscalations,
  resolveEscalation,
  fetchConversation,
  sendReply,
} from '../api/admin';

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

export default function Escalations() {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expanded, setExpanded] = useState(null);
  const [convDetail, setConvDetail] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [sending, setSending] = useState(false);

  const loadEscalations = async () => {
    try {
      const data = await fetchEscalations(filter || undefined);
      setEscalations(data);
    } catch (err) {
      console.error('Failed to load escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadEscalations();
  }, [filter]);

  const toggleExpand = async (esc) => {
    if (expanded === esc._id) {
      setExpanded(null);
      setConvDetail(null);
      return;
    }
    setExpanded(esc._id);
    try {
      const convId =
        typeof esc.conversationId === 'object'
          ? esc.conversationId._id
          : esc.conversationId;
      const data = await fetchConversation(convId);
      setConvDetail(data);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  const handleReply = async (esc) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const convId =
        typeof esc.conversationId === 'object'
          ? esc.conversationId._id
          : esc.conversationId;
      await sendReply(convId, replyText.trim());
      setReplyText('');
      
      // The backend automatically marks a pending escalation as 'in_progress' when a reply is sent.
      // Reload the escalations list so it moves to the correct tab.
      await loadEscalations();
      
      const data = await fetchConversation(convId);
      setConvDetail(data);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async (escId) => {
    try {
      await resolveEscalation(escId, resolveNotes.trim() || undefined);
      setResolveNotes('');
      setExpanded(null);
      setConvDetail(null);
      loadEscalations();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const filters = [
    { label: 'Pending', value: 'pending' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-header__title">Escalations</h1>
        <p className="page-header__subtitle">
          Conversations flagged for human attention
        </p>
      </div>

      <div className="filter-bar">
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

      {loading ? (
        <div className="loading">
          <div className="loading__spinner" />
          Loading...
        </div>
      ) : escalations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            {filter === 'pending' ? <Check /> : <FileText />}
          </div>
          <div className="empty-state__text">
            {filter === 'pending'
              ? 'No pending escalations — all clear'
              : `No ${filter.replace('_', ' ')} escalations`}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {escalations.map((esc) => (
            <div key={esc._id}>
              <div
                className={`escalation-card ${esc.status === 'resolved' ? 'escalation-card--resolved' : ''}`}
                onClick={() => toggleExpand(esc)}
              >
                <div className="escalation-card__header">
                  <div>
                    <div className="escalation-card__customer">
                      {esc.customerName || 'Unknown'}
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {esc.customerPhone}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge badge--${esc.status}`}>
                      <span className="badge__dot" />
                      {esc.status.replace('_', ' ')}
                    </span>
                    <span className="escalation-card__time">
                      {timeAgo(esc.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="escalation-card__reason">
                  <AlertTriangle size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '6px' }} />
                  {esc.reason}
                </div>

                {esc.lastCustomerMessage && (
                  <div className="escalation-card__message">
                    &ldquo;{esc.lastCustomerMessage}&rdquo;
                  </div>
                )}
              </div>

              {/* Expanded panel */}
              {expanded === esc._id && (
                <div
                  style={{
                    background: 'var(--bg-root)',
                    border: '1px solid var(--border)',
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                    padding: '20px',
                  }}
                  className="fade-in"
                >
                  {convDetail && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        Recent Messages
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
                        {convDetail.messages.slice(-8).map((msg, i) => (
                          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
                            {msg.content}
                            <div className="chat-bubble__time">{formatTime(msg.timestamp)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {esc.status !== 'resolved' && (
                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Type a reply to customer..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(esc)}
                          disabled={sending}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn--primary"
                          onClick={() => handleReply(esc)}
                          disabled={sending || !replyText.trim()}
                        >
                          <Send size={14} />
                          Reply
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Admin notes (optional)"
                          value={resolveNotes}
                          onChange={(e) => setResolveNotes(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn--success"
                          onClick={() => handleResolve(esc._id)}
                        >
                          <Check size={14} />
                          Resolve
                        </button>
                      </div>
                    </div>
                  )}

                  {esc.adminNotes && (
                    <div style={{ marginTop: '12px', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      <strong>Admin Notes:</strong> {esc.adminNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
