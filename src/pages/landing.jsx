import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Mic, FileText, Calendar, Clock, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [healthStatus, setHealthStatus] = useState('checking');
  const [messages, setMessages] = useState([]);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const response = await fetch('/api/health');
        if (!mounted) return;
        setHealthStatus(response.ok ? 'connected' : 'disconnected');
      } catch {
        if (mounted) setHealthStatus('disconnected');
      }
    }
    checkHealth();
    return () => {
      mounted = false;
    };
  }, []);

  async function askAI() {
    const trimmedQuery = searchQuery.trim();
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

  const quickActions = [
    { label: 'View Payslip', icon: FileText },
    { label: 'Check Leave Balance', icon: Calendar },
    { label: 'Apply Leave', icon: Clock },
    { label: 'Performance Review', icon: TrendingUp },
  ];

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
            <span className={`landing-status landing-status-${healthStatus}`}>
              API: {healthStatus}
            </span>
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
                <button key={action.label} className="landing-action-button" type="button">
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
              <span className="landing-chat-meta">Replies powered by Llama 3 (Groq)</span>
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
                    {message.content}
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
        {loading && <p className="landing-thinking">Thinking...</p>}
        {apiError && <p className="landing-error">{apiError}</p>}
        <div className="landing-footer-note">
          <p className="landing-footer-text">Need help? Contact HR administrator.</p>
        </div>
      </main>
    </div>
  );
}