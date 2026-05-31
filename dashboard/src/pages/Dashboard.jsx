import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Radio,
  AlertTriangle,
  Package,
  Mail,
} from 'lucide-react';
import { fetchStats } from '../api/admin';

const CARDS_CONFIG = [
  {
    key: 'totalConversations',
    label: 'Total Conversations',
    icon: MessageSquare,
    color: '#5B4CDB',
    bg: 'rgba(91, 76, 219, 0.08)',
  },
  {
    key: 'activeConversations',
    label: 'Active Now',
    icon: Radio,
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
  },
  {
    key: 'escalatedConversations',
    label: 'Pending Escalations',
    icon: AlertTriangle,
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.08)',
    alertKey: true,
  },
  {
    key: 'totalProducts',
    label: 'Products',
    icon: Package,
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.08)',
  },
  {
    key: 'totalMessages',
    label: 'Messages Today',
    icon: Mail,
    color: '#6366F1',
    bg: 'rgba(99, 102, 241, 0.08)',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__spinner" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-header__title">Dashboard</h1>
        <p className="page-header__subtitle">
          Overview of your WhatsApp chatbot activity
        </p>
      </div>

      <div className="stats-grid">
        {CARDS_CONFIG.map((card) => {
          const Icon = card.icon;
          const value = stats?.[card.key] ?? 0;
          const isAlert = card.alertKey && value > 0;

          return (
            <div
              key={card.key}
              className={`stat-card ${isAlert ? 'stat-card--alert' : ''}`}
            >
              <div className="stat-card__header">
                <div
                  className="stat-card__icon"
                  style={{ background: card.bg, color: card.color }}
                >
                  <Icon />
                </div>
              </div>
              <div className="stat-card__value">{value}</div>
              <div className="stat-card__label">{card.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
