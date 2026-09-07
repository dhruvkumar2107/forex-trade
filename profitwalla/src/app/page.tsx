import Link from 'next/link';

const features = [
  {
    icon: '⚡',
    title: 'Instant Trade Mirroring',
    description: 'Trades replicate in under 200ms across all connected accounts via institutional-grade infrastructure.',
  },
  {
    icon: '🛡️',
    title: 'Risk-First Approach',
    description: 'Automated drawdown protection, symbol whitelisting, and per-client risk limits.',
  },
  {
    icon: '📊',
    title: 'Live Performance',
    description: 'Monitor your account in real-time through your own MT5 app — full transparency.',
  },
  {
    icon: '🔒',
    title: 'Read-Only Access',
    description: 'We only require your Investor Password (read-only). Your trading funds stay with your broker.',
  },
];

const stats = [
  { value: '500+', label: 'Active Clients' },
  { value: '<200ms', label: 'Execution Speed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '12+', label: 'Supported Brokers' },
];

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-terminal-bg/80 backdrop-blur-xl border-b border-terminal-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">P</span>
            </div>
            <span className="font-heading text-xl font-bold">Profitwalla</span>
          </div>
          <Link
            href="/book-now"
            className="btn-primary text-sm px-4 py-2"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-teal/10 border border-accent-teal/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
            <span className="text-accent-teal text-sm font-medium">Live Trading Active</span>
          </div>
          
          <h1 className="font-heading text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Professional Copy Trading,{' '}
            <span className="gradient-text">Simplified</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Connect your MT5 account to our institutional copy trading system. 
            We handle trade execution — you monitor performance through your own broker app.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book-now" className="btn-primary text-lg px-8 py-4">
              Book Your Slot
            </Link>
            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
              How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-6">
                <div className="financial-number text-3xl font-bold text-accent-teal mb-1">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6" id="how-it-works">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Why <span className="gradient-text">Profitwalla</span>?
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Institutional-grade copy trading infrastructure, now accessible to individual traders.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="glass-card-hover p-8">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-terminal-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-16">
            Getting Started is <span className="gradient-text">Easy</span>
          </h2>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Book Your Slot', desc: 'Fill out the onboarding form with your MT5 details. Takes under 3 minutes.' },
              { step: '02', title: 'Account Verification', desc: 'Our team reviews your submission and verifies your MT5 investor credentials.' },
              { step: '03', title: 'Connection & Go Live', desc: 'Your account is connected to our copy trading system. Trades mirror automatically.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start glass-card p-6">
                <div className="financial-number text-4xl font-bold text-accent-teal/30 shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-heading text-xl font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Disclosure */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 border-accent-red/20">
            <h3 className="font-heading text-lg font-semibold text-accent-red mb-3">
              ⚠️ Risk Disclosure
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Forex and CFD trading carries a high level of risk and may not be suitable for all investors. 
              Past performance is not indicative of future results. The possibility exists that you could sustain 
              a loss of some or all of your initial investment. You should be aware of all the risks associated 
              with trading and seek advice from an independent financial advisor if you have any doubts. 
              Copy trading does not guarantee profits and past performance does not guarantee future results.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-terminal-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-xs">P</span>
            </div>
            <span className="font-heading text-sm font-semibold">Profitwalla</span>
          </div>
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Profitwalla. All rights reserved. Not financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
