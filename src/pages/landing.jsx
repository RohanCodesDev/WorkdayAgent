import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Mic,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  User,
  Briefcase,
  Shield,
  BarChart3,
} from 'lucide-react';
import knowledgeBase from '../data/workdayKnowledge.json';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [messages, setMessages] = useState([]);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function normalizeContent(text) {
    return String(text || '')
      .replace(/<\/?strong>/gi, '')
      .replace(/\*\*/g, '');
  }

  function renderMessageContent(content) {
    const normalized = normalizeContent(content);
    return normalized.split('\n').map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={`line-${index}`} />;
      }

      const arrowIndex = trimmed.indexOf('->');
      if (arrowIndex === -1) {
        const taskMatch = trimmed.match(/^(.+?)\s+is\s+where\b/i);
        if (taskMatch) {
          const task = taskMatch[1];
          const remainder = trimmed.slice(task.length);
          return (
            <p key={`line-${index}`}>
              <strong>{task}</strong>
              {remainder}
            </p>
          );
        }

        const pathIndex = trimmed.toLowerCase().indexOf('path:');
        if (pathIndex !== -1) {
          const before = trimmed.slice(0, pathIndex);
          const after = trimmed.slice(pathIndex + 5).trimStart();
          return (
            <p key={`line-${index}`}>
              {before}
              <strong>Path:</strong> {after}
            </p>
          );
        }

        return <p key={`line-${index}`}>{trimmed}</p>;
      }

      const left = trimmed.slice(0, arrowIndex).trimEnd();
      const right = trimmed.slice(arrowIndex + 2).trimStart();
      const match = left.match(/^(\d+\.)\s*(.*)$/);
      if (match) {
        const [, number, label] = match;
        return (
          <p key={`line-${index}`}>
            {number} <strong>{label || left}</strong> {'->'} {right}
          </p>
        );
      }

      return (
        <p key={`line-${index}`}>
          <strong>{left}</strong> {'->'} {right}
        </p>
      );
    });
  }

  const fullText =
    'A smart assistant to help you navigate Workday, access your data, and complete tasks effortlessly.';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) setDisplayedText(fullText.slice(0, index));
      else clearInterval(interval);
      index += 1;
    }, 20);
    return () => clearInterval(interval);
  }, []);


  async function askAI(queryOverride) {
    const trimmedQuery = String(queryOverride ?? searchQuery).trim();
    if (!trimmedQuery) return;
    const historySnapshot = messages;
    setLoading(true);
    setApiError('');
    setSearchQuery('');
    setMessages((prev) => [...prev, { role: 'user', content: trimmedQuery }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedQuery, chatHistory: historySnapshot }),
      });

      const data = await response.json();
      if (!response.ok) {
        setApiError(data.detail ? `${data.error || 'Chat request failed.'} ${data.detail}` : data.error || 'Chat request failed.');
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply || 'No response generated.' },
        ]);
      }
    } catch (error) {
      console.error(error);
      setApiError('Could not connect AI.');
    }

    setLoading(false);
  }

  const iconByModule = {
    Personal: User,
    Job: Briefcase,
    Manager: Clock,
    HR: Calendar,
    Compensation: FileText,
    Reporting: BarChart3,
    Security: Shield,
  };

  const quickActions = knowledgeBase.slice(0, 6).map((item) => ({
    label: item.task,
    query: item.task,
    icon: iconByModule[item.module] || TrendingUp,
  }));

  const searchPanelClassName = isFocused
    ? 'landing-search-panel landing-search-panel-active'
    : 'landing-search-panel';

  return (
    <div className="landing-root">
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-brand-wrap">
            <div className="landing-brand-logo" />
            <span className="landing-brand-name">Workday Navigator</span>
          </div>
          <nav className="landing-nav">
            <Link href="/landing" className="landing-nav-link">
              Home
            </Link>
            <a href="#" className="landing-nav-link">
              Help
            </a>
            <a href="#" className="landing-nav-link">
              Profile
            </a>
          </nav>
        </div>
      </header>
      <main className="landing-main">
        <div className="landing-hero">
          <h1 className="landing-title">
            <span className="landing-title-highlight">Workday</span> Navigator & Communicator
          </h1>
          <p className="landing-subtitle">
            {displayedText}
            <span className="landing-cursor" />
          </p>
        </div>
        <section className="landing-actions-section">
          <h2 className="landing-actions-title">Quick Actions</h2>
          <div className="landing-actions-grid">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  className="landing-action-button"
                  type="button"
                  onClick={() => askAI(action.query)}
                >
                  <Icon className="landing-action-icon" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </section>
        <div className="landing-search-wrap">
          <div className="landing-chat-panel">
            <div className="landing-chat-header">
              <h3 className="landing-chat-title">Assistant Chat</h3>
            </div>
            <div className="landing-chat-log">
              {messages.length === 0 ? (
                <p className="landing-chat-empty">Ask a question to start the conversation.</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`landing-chat-bubble landing-chat-${message.role}`}
                  >
                    {renderMessageContent(message.content)}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className={searchPanelClassName}>
            <div className="landing-search-row">
              <Search className="landing-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && askAI()}
                placeholder="Ask Workday anything..."
                className="landing-search-input"
              />
              <button
                className="landing-mic-button"
                type="button"
                onClick={askAI}
                aria-label="Ask the assistant"
              >
                {loading ? '...' : <Mic className="landing-mic-icon" />}
              </button>
            </div>
          </div>
        </div>
        {loading && (
          <p className="landing-thinking">
            <span className="landing-typing">Assistant is typing</span>
            <span className="landing-typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </p>
        )}
        {apiError && <p className="landing-error">{apiError}</p>}
        <div className="landing-footer-note">
          <p className="landing-footer-text">Need help? Contact HR administrator.</p>
        </div>
      </main>
    </div>
  );
}