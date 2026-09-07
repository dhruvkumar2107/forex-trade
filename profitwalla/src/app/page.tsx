import Link from 'next/link';
import { Zap, Shield, BarChart3, Lock, AlertTriangle, ChevronRight, TrendingUp, Users, Clock, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Instant Trade Mirroring',
    description: 'Trades replicate in under 200ms across all connected accounts via institutional-grade infrastructure.',
  },
  {
    icon: Shield,
    title: 'Risk-First Approach',
    description: 'Automated drawdown protection, symbol whitelisting, and per-client risk limits.',
  },
  {
    icon: BarChart3,
    title: 'Live Performance',
    description: 'Monitor your account in real-time through your own MT5 app — full transparency.',
  },
  {
    icon: Lock,
    title: 'Read-Only Access',
    description: 'We only require your Investor Password (read-only). Your trading funds stay with your broker.',
  },
];

const stats = [
  { value: '500+', label: 'Active Clients', icon: Users },
  { value: '<200ms', label: 'Execution Speed', icon: Clock },
  { value: '99.9%', label: 'Uptime', icon: CheckCircle2 },
  { value: '12+', label: 'Supported Brokers', icon: TrendingUp },
];

const performanceData = [
  { month: 'Jan', equity: 100000 },
  { month: 'Feb', equity: 104200 },
  { month: 'Mar', equity: 102800 },
  { month: 'Apr', equity: 108500 },
  { month: 'May', equity: 112300 },
  { month: 'Jun', equity: 109800 },
  { month: 'Jul', equity: 115600 },
  { month: 'Aug', equity: 119200 },
  { month: 'Sep', equity: 117400 },
  { month: 'Oct', equity: 123800 },
  { month: 'Nov', equity: 128500 },
  { month: 'Dec', equity: 134200 },
];

const faqs = [
  {
    q: 'How does copy trading work?',
    a: 'We connect to your MT5 account using your read-only Investor Password. When our master account places a trade, it is automatically replicated in your account at your configured ratio. You maintain full control and can disconnect at any time.',
  },
  {
    q: 'Is my money safe? Can I lose more than I deposit?',
    a: 'Your funds remain with your broker at all times. We never take custody of your money. Copy trading carries risk — you can lose part of your investment, but automated drawdown protection pauses copying if losses exceed your configured threshold.',
  },
  {
    q: 'What are the fees?',
    a: 'There are no upfront fees. We charge a performance-based fee only on profits generated. If you don\'t profit, you don\'t pay. Details are shared during onboarding.',
  },
  {
    q: 'How do I withdraw my money?',
    a: 'Your funds are always in your broker account. You can withdraw directly from your broker anytime — we have no control over your withdrawals. The copy trading system only mirrors trades, not funds.',
  },
  {
    q: 'Which brokers do you support?',
    a: 'We support 12+ major brokers including Exness, IC Markets, FP Markets, Pepperstone, XM, Tickmill, RoboForex, HotForex, FXTM, OctaFX, Alpari, and Admiral Markets. Contact us if your broker isn\'t listed.',
  },
  {
    q: 'What is the Investor Password and why do you need it?',
    a: 'The Investor Password is a read-only password provided by your broker. It allows us to view your account and place copy trades, but cannot be used to withdraw funds. We never have access to your trading or withdrawal password.',
  },
  {
    q: 'How long does onboarding take?',
    a: 'The form takes under 3 minutes. Once submitted, your account is connected and trades start mirroring immediately.',
  },
  {
    q: 'Can I pause or stop copy trading anytime?',
    a: 'Yes. You can request a pause or disconnect at any time through our support. Your existing positions remain open until you choose to close them manually in your MT5 app.',
  },
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
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors hidden sm:block">
              Client Login
            </Link>
            <Link href="/book-now" className="btn-primary text-sm px-4 py-2">
              Get Started
            </Link>
          </div>
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
                <stat.icon className="w-5 h-5 text-accent-teal mb-3" />
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
                <feature.icon className="w-8 h-8 text-accent-teal mb-4" />
                <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Dashboard Preview */}
      <section className="py-20 px-6 bg-terminal-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Track Your <span className="gradient-text">Performance</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Real-time equity tracking. Full transparency through your own MT5 broker app.
            </p>
          </div>

          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-heading text-lg font-semibold">Portfolio Equity Curve</h3>
                <p className="text-gray-500 text-sm">Demonstration data — your actual results are tracked live</p>
              </div>
              <div className="text-right">
                <div className="financial-number text-2xl font-bold text-accent-green">+34.2%</div>
                <div className="text-gray-500 text-xs">YTD Return</div>
              </div>
            </div>

            {/* Simple SVG chart instead of recharts for SSR compatibility */}
            <div className="relative h-64 w-full">
              <svg viewBox="0 0 800 250" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="0" y1={i * 62.5} x2="800" y2={i * 62.5} stroke="#1E2633" strokeWidth="1" />
                ))}
                {/* Equity line */}
                <polyline
                  fill="none"
                  stroke="#00D4AA"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  points={performanceData.map((d, i) => {
                    const x = (i / (performanceData.length - 1)) * 780 + 10;
                    const minEq = 100000;
                    const maxEq = 140000;
                    const y = 250 - ((d.equity - minEq) / (maxEq - minEq)) * 240;
                    return `${x},${y}`;
                  }).join(' ')}
                />
                {/* Gradient fill */}
                <defs>
                  <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#equityGradient)"
                  points={`10,250 ${performanceData.map((d, i) => {
                    const x = (i / (performanceData.length - 1)) * 780 + 10;
                    const minEq = 100000;
                    const maxEq = 140000;
                    const y = 250 - ((d.equity - minEq) / (maxEq - minEq)) * 240;
                    return `${x},${y}`;
                  }).join(' ')} 790,250`}
                />
                {/* Data points */}
                {performanceData.map((d, i) => {
                  const x = (i / (performanceData.length - 1)) * 780 + 10;
                  const minEq = 100000;
                  const maxEq = 140000;
                  const y = 250 - ((d.equity - minEq) / (maxEq - minEq)) * 240;
                  return (
                    <circle key={i} cx={x} cy={y} r="3" fill="#00D4AA" stroke="#0A0E14" strokeWidth="2" />
                  );
                })}
              </svg>
              {/* Month labels */}
              <div className="flex justify-between mt-2 px-2">
                {performanceData.filter((_, i) => i % 2 === 0).map((d) => (
                  <span key={d.month} className="text-gray-600 text-xs">{d.month}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-terminal-border">
              <div className="text-center">
                <div className="financial-number text-lg font-bold text-accent-green">$134,200</div>
                <div className="text-gray-500 text-xs">Current Equity</div>
              </div>
              <div className="text-center">
                <div className="financial-number text-lg font-bold text-accent-teal">68%</div>
                <div className="text-gray-500 text-xs">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="financial-number text-lg font-bold text-accent-gold">1.8</div>
                <div className="text-gray-500 text-xs">Profit Factor</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-16">
            Getting Started is <span className="gradient-text">Easy</span>
          </h2>

          <div className="space-y-8">
            {[
              { step: '01', title: 'Book Your Slot', desc: 'Fill out the onboarding form with your MT5 details. Takes under 3 minutes.' },
              { step: '02', title: 'Connection & Go Live', desc: 'Your account is connected to our copy trading system. Trades mirror automatically.' },
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

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-terminal-card/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know before getting started.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="glass-card group">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <h3 className="font-heading text-sm font-semibold text-gray-200 pr-4">{faq.q}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-500 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-6 -mt-2">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Risk Disclosure */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-8 border-accent-red/20">
            <h3 className="font-heading text-lg font-semibold text-accent-red mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Disclosure
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

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold mb-6">
            Ready to Start <span className="gradient-text">Copying</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Join 500+ traders already using Profitwalla for automated copy trading.
          </p>
          <Link href="/book-now" className="btn-primary text-lg px-8 py-4 inline-flex items-center gap-2">
            Book Your Slot <ChevronRight className="w-5 h-5" />
          </Link>
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

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/919999999999?text=Hi%2C%20I%20want%20to%20know%20more%20about%20Profitwalla"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BD5A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 transition-all duration-200 hover:scale-110"
        aria-label="Chat on WhatsApp"
      >
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
