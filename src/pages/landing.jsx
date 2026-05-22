import { useEffect, useState } from 'react';
import { Search, Mic, FileText, Calendar, Clock, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');

  const fullText = 'A smart assistant to help you navigate Workday, access your data, and complete tasks effortlessly.';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullText.length) {
        setDisplayedText(fullText.slice(0, index));
        index += 1;
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { label: 'View Payslip', icon: FileText },
    { label: 'Check Leave Balance', icon: Calendar },
    { label: 'Apply Leave', icon: Clock },
    { label: 'Performance Review', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500" />
            <span className="font-semibold text-gray-900">Workday Navigator</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            <a href="/landing" className="text-gray-700 transition-colors hover:text-gray-900">
              Home
            </a>
            <a href="#" className="text-gray-700 transition-colors hover:text-gray-900">
              Help
            </a>
            <a href="#" className="text-gray-700 transition-colors hover:text-gray-900">
              Profile
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-16 pt-20">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-orange-500 bg-clip-text text-transparent">
              Workday
            </span>{' '}
            Navigator & Communicator
          </h1>
          <p className="mx-auto min-h-[3.5rem] max-w-2xl text-lg leading-relaxed text-gray-600">
            {displayedText}
            <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-gray-600" />
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <h2 className="mb-6 text-center text-sm font-medium text-gray-500">Quick Actions</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.label}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-700 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 hover:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-10">
          <div
            className={`relative rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
              isFocused
                ? 'border-blue-400 shadow-lg shadow-blue-100/50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center px-6 py-4">
              <Search className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ask anything… e.g., Show my payslip, Apply leave, Open performance review"
                className="flex-1 text-base text-gray-900 outline-none placeholder:text-gray-400"
              />
              <button className="ml-3 rounded-lg p-2 transition-colors hover:bg-gray-100">
                <Mic className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact your HR administrator or visit our{' '}
            <a href="#" className="text-blue-600 underline hover:text-blue-700">
              Help Center
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}