'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Shield,
  Activity,
  Globe,
  BarChart3,
  Settings,
  RefreshCw,
  Wifi,
  Eye,
  ArrowRight,
  Check,
  X as XIcon,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Lock,
  Server,
  Users,
  Target,
  AlertTriangle,
  Ban,
  EyeOff,
  FileCheck,
  MonitorCheck,
  Search,
  DollarSign,
  Clock,
  AlertCircle,
  Mail,
  Play,
  Pause,
  Unplug,
  Layers,
  Database,
  Cpu,
  Network,
  ArrowLeftRight,
  ShieldCheck,
  UserCheck,
  Key,
  FileSearch,
  Siren,
  ClipboardList,
  Terminal,
  BookOpen,
  Scale,
  HeartHandshake,
  Fingerprint,
  HardDrive,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeUpSmall = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerContainerSlow = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

/* ══════════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ══════════════════════════════════════════════════════ */

function AnimatedSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({
  target,
  suffix = '',
  decimals = 0,
  prefix = '',
}: {
  target: number;
  suffix?: string;
  decimals?: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const end = target;
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span
      ref={ref}
      className="financial-number text-3xl md:text-4xl font-bold text-white"
    >
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

function SectionDivider() {
  return (
    <div className="section-container">
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DATA CONSTANTS
   ══════════════════════════════════════════════════════ */

const performanceStats = [
  { value: 200, suffix: 'ms', decimals: 0, label: 'Execution Speed', prefix: '<', sublabel: 'Average trade replication' },
  { value: 99.9, suffix: '%', decimals: 1, label: 'Infrastructure Uptime', prefix: '', sublabel: 'System availability' },
  { value: 14, suffix: '+', decimals: 0, label: 'Supported Brokers', prefix: '', sublabel: 'Major MT5 brokers' },
  { value: 24, suffix: '/7', decimals: 0, label: 'Automated Monitoring', prefix: '', sublabel: 'Continuous system checks' },
];

const howItWorksSteps = [
  {
    number: '01',
    title: 'Book Your Slot',
    description: 'Submit your onboarding information through our streamlined booking process. Provide your initial details and requirements so we can prepare your account configuration.',
    detail: 'Takes approximately 5 minutes',
  },
  {
    number: '02',
    title: 'Connect Your MT5 Account',
    description: 'Provide your broker name and MT5 account details. We establish a secure connection using your Trading Password (read-only, no withdrawal access).',
    detail: 'Secure MT5 integration',
  },
  {
    number: '03',
    title: 'Configure Risk',
    description: 'Set your account-level risk parameters including maximum drawdown limits, exposure caps, position sizing rules, and instrument whitelists or blacklists.',
    detail: 'Full control over your risk',
  },
  {
    number: '04',
    title: 'Start Copying',
    description: 'Trades from the master account are automatically mirrored to your MT5 account through your broker. You monitor all activity directly in your MT5 terminal.',
    detail: 'Automated from day one',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Ultra-Fast Trade Mirroring',
    description:
      'Automatically replicate trades from the master account with optimized execution across all connected accounts. Our infrastructure processes trade signals in real-time and pushes them to your broker with minimal latency.',
  },
  {
    icon: Shield,
    title: 'Automated Risk Controls',
    description:
      'Configure account-level risk parameters including maximum drawdown limits, exposure caps, and position size rules. The system enforces these automatically without manual intervention.',
  },
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description:
      'Monitor your accounts and all trading activity live through your own MT5 broker platform. Every copied trade appears in your terminal exactly as if you had placed it manually.',
  },
  {
    icon: Globe,
    title: 'Broker Connectivity',
    description:
      'Support for multiple major MT5 brokers with reliable connection infrastructure. We maintain redundant connections to ensure consistent trade delivery across all supported brokers.',
  },
  {
    icon: Target,
    title: 'Symbol Controls',
    description:
      'Configure which instruments can be copied on a per-account basis. Whitelist specific symbols for copying or blacklist instruments you prefer to manage manually.',
  },
  {
    icon: Settings,
    title: 'Account-Level Configuration',
    description:
      'Independent settings per client account for tailored risk and copy parameters. Each account operates with its own configuration, ensuring personalized trade replication.',
  },
  {
    icon: RefreshCw,
    title: 'Trade Synchronization',
    description:
      'Keep source and connected accounts in sync with continuous state monitoring. The system tracks open positions and ensures consistency between the master and your account.',
  },
  {
    icon: Wifi,
    title: 'Connection Monitoring',
    description:
      'Detect disconnections and system issues with real-time health checks. Our infrastructure continuously monitors broker connectivity and alerts when attention is needed.',
  },
  {
    icon: Eye,
    title: 'Transparent Performance',
    description:
      'Monitor your performance directly through your own broker platform. No hidden dashboards — all results are visible in your MT5 terminal with full trade history.',
  },
];

const mockTrades = [
  {
    symbol: 'XAUUSD',
    type: 'BUY',
    lots: 0.50,
    open: '2,345.20',
    current: '2,361.45',
    pnl: '+$812.50',
    status: 'Open',
    time: '14:32:05',
  },
  {
    symbol: 'EURUSD',
    type: 'SELL',
    lots: 1.00,
    open: '1.0842',
    current: '1.0818',
    pnl: '+$240.00',
    status: 'Open',
    time: '14:28:18',
  },
  {
    symbol: 'BTCUSD',
    type: 'BUY',
    lots: 0.10,
    open: '67,420.00',
    current: '67,890.00',
    pnl: '+$470.00',
    status: 'Open',
    time: '14:15:42',
  },
  {
    symbol: 'GBPUSD',
    type: 'BUY',
    lots: 0.80,
    open: '1.2720',
    current: '1.2695',
    pnl: '-$200.00',
    status: 'Open',
    time: '13:55:31',
  },
  {
    symbol: 'AUDUSD',
    type: 'SELL',
    lots: 1.20,
    open: '0.6540',
    current: '0.6518',
    pnl: '+$264.00',
    status: 'Open',
    time: '13:42:09',
  },
];

const mockAccountCards = [
  { label: 'Balance', value: '$24,850.00', subtext: 'Last updated: Just now', color: '' },
  { label: 'Equity', value: '$25,312.50', subtext: 'Real-time value', color: '' },
  { label: 'Unrealized P/L', value: '+$462.50', subtext: '5 open positions', color: 'positive' },
  { label: 'Drawdown', value: '2.1%', subtext: 'Max allowed: 5%', color: 'text-accent-gold' },
  { label: 'Free Margin', value: '$18,420.00', subtext: 'Available for trading', color: '' },
];

const brokerList = [
  { name: 'Exness', region: 'Global' },
  { name: 'IC Markets', region: 'Global' },
  { name: 'FP Markets', region: 'Global' },
  { name: 'Pepperstone', region: 'Global' },
  { name: 'XM', region: 'Global' },
  { name: 'Tickmill', region: 'Global' },
  { name: 'RoboForex', region: 'Global' },
  { name: 'FXTM', region: 'Global' },
  { name: 'Octa', region: 'Global' },
  { name: 'Alpari', region: 'Global' },
  { name: 'Admiral Markets', region: 'Global' },
];

const riskFeatures = [
  {
    icon: AlertTriangle,
    title: 'Maximum Drawdown Protection',
    description: 'Automatically pause copying when your account drawdown reaches the configured threshold.',
  },
  {
    icon: Ban,
    title: 'Account-Level Risk Configuration',
    description: 'Each connected account has its own independent risk settings tailored to the account holder.',
  },
  {
    icon: EyeOff,
    title: 'Symbol Whitelist / Blacklist',
    description: 'Choose exactly which instruments are allowed to be copied to your account.',
  },
  {
    icon: Settings,
    title: 'Position Size Control',
    description: 'Configure lot sizing rules to ensure copied positions match your risk appetite.',
  },
  {
    icon: BarChart3,
    title: 'Exposure Limits',
    description: 'Set maximum total exposure across all open positions to manage overall risk.',
  },
  {
    icon: Siren,
    title: 'Emergency Pause',
    description: 'Instantly stop all copy trading activity with a single action. Existing positions remain unaffected.',
  },
];

const comparisonData = [
  { feature: 'Real-time monitoring', traditional: false, signal: 'Limited', profitwalla: true },
  { feature: 'Automated copying', traditional: false, signal: true, profitwalla: true },
  { feature: 'Risk controls', traditional: 'Manual', signal: 'Basic', profitwalla: 'Advanced' },
  { feature: 'Broker connectivity', traditional: 'Single', signal: 'Varies', profitwalla: 'Multi-broker' },
  { feature: 'Account access', traditional: 'Full', signal: 'None', profitwalla: 'Full (via broker)' },
  { feature: 'Configuration', traditional: 'Manual', signal: 'None', profitwalla: 'Per-account' },
  { feature: 'Professional infrastructure', traditional: false, signal: false, profitwalla: true },
  { feature: 'Human support', traditional: 'Varies', signal: false, profitwalla: true },
];

const trustPoints = [
  {
    icon: Lock,
    title: 'Funds remain with broker',
    description:
      'Your capital never leaves your broker account. Profitwalla does not hold, custody, or manage client funds at any point.',
  },
  {
    icon: Eye,
    title: 'Monitor directly through MT5',
    description:
      'View all copied trades and account activity directly in your MetaTrader 5 terminal — the same platform you already use.',
  },
  {
    icon: ShieldCheck,
    title: 'No custody of funds',
    description:
      'Our system is connected for trade execution only. We never have withdrawal access or the ability to move your funds.',
  },
  {
    icon: Settings,
    title: 'Configurable risk',
    description:
      'Set your own drawdown limits, exposure caps, and position rules. You control exactly how much risk your account takes.',
  },
  {
    icon: ClipboardList,
    title: 'Clear onboarding',
    description:
      'A straightforward, transparent process to get started. No hidden steps, no unexpected requirements.',
  },
  {
    icon: BarChart3,
    title: 'Transparent performance',
    description:
      'All results are visible through your broker account. No cherry-picked statistics — every trade is in your terminal.',
  },
  {
    icon: Users,
    title: 'Professional support',
    description:
      'Dedicated assistance for account setup, configuration, and ongoing operation. Real people available when you need help.',
  },
];

const pricingTiers = [
  {
    name: 'Individual Traders',
    subtitle: 'Personal trading accounts',
    description:
      'Designed for individual traders who want automated copy trading with full risk control and broker-level transparency.',
    features: [
      'Custom account configuration',
      'Risk parameter setup and optimization',
      'MT5 broker connection and testing',
      'Ongoing technical support',
      'Real-time performance monitoring',
      'Symbol whitelist / blacklist setup',
      'Emergency pause capability',
    ],
    note: 'No upfront platform fee. Performance-based pricing.',
  },
  {
    name: 'Professional & Partners',
    subtitle: 'Portfolio managers & prop firms',
    description:
      'Built for portfolio managers, proprietary trading firms, and high-volume operations managing multiple accounts.',
    features: [
      'Custom volume-based plans',
      'Multi-account management dashboard',
      'Dedicated account support representative',
      'Priority onboarding and setup',
      'Advanced configuration options',
      'Custom risk engine parameters',
      'Bulk account provisioning',
    ],
    note: 'Custom pricing based on volume and requirements.',
  },
];

const securityConcepts = [
  {
    icon: Lock,
    title: 'Broker-held funds',
    description:
      'All client funds remain in the client\'s own broker account at all times. Profitwalla has no ability to access, move, or manage your money.',
  },
  {
    icon: Layers,
    title: 'Account isolation',
    description:
      'Each connected account operates independently with its own parameters. Changes to one account never affect another.',
  },
  {
    icon: ShieldCheck,
    title: 'Access controls',
    description:
      'Limited credential access restricted to trade execution only. Our system cannot perform withdrawals, deposits, or account modifications.',
  },
  {
    icon: Key,
    title: 'Secure credential handling',
    description:
      'Broker credentials are encrypted at rest and in transit. Access is restricted to authorized systems only.',
  },
  {
    icon: MonitorCheck,
    title: 'Continuous monitoring',
    description:
      'Real-time system health checks and connection monitoring ensure trade delivery reliability and rapid issue detection.',
  },
  {
    icon: FileCheck,
    title: 'Full auditability',
    description:
      'Complete trade history is visible through your broker platform. Every copied trade appears in your MT5 terminal with full details.',
  },
];

const faqData = [
  {
    question: 'How does Profitwalla work?',
    answer:
      'Profitwalla is a professional copy-trading infrastructure service. Once onboarded, your MT5 account is securely connected to our system. When the master account executes a trade, our infrastructure detects the new position and replicates it to your account through your broker. You maintain full access to your broker account at all times and can monitor every trade directly in your MT5 terminal. The entire process is automated — once configured, no manual intervention is required.',
  },
  {
    question: 'How are trades copied?',
    answer:
      'Trades are copied in real-time through a direct connection to your broker\'s MT5 server. When a trade is executed on the master account, our system detects the new position within milliseconds and immediately replicates it to your account. The copy respects your configured lot sizing rules, risk parameters, and symbol whitelist. If your account has restrictions that prevent a specific trade (insufficient margin, blacklisted symbol, etc.), the system logs the event and continues monitoring.',
  },
  {
    question: 'Where is my money held?',
    answer:
      'Your funds remain in your own MT5 broker account at all times. Profitwalla does not custody, hold, or manage client funds. We never have withdrawal access to your account. Our system is connected using your Trading Password, which only grants trade-execution permissions. You can verify this by logging into your broker account at any time — all funds stay where they are.',
  },
  {
    question: 'Can Profitwalla withdraw my funds?',
    answer:
      'No. Profitwalla does not have withdrawal access to your broker account. Our connection is established using the Trading Password (also known as the Investor or Read-Only Password), which is an industry-standard MT5 feature that grants trade-execution permissions only. Withdrawals, deposits, and account modifications are not possible through our connection. You retain full control over your funds and can withdraw at any time directly through your broker.',
  },
  {
    question: 'What is the Trading Password?',
    answer:
      'The Trading Password (also called the Investor Password or Read-Only Password in some MT5 configurations) is a separate credential you provide during onboarding. It grants trade-execution access to your account — meaning our system can open and close positions on your behalf. It does not provide withdrawal, deposit, or account modification access. This is a built-in security feature of the MetaTrader 5 platform that brokers implement for exactly this purpose.',
  },
  {
    question: 'Which brokers are supported?',
    answer:
      'Profitwalla currently supports major MT5 brokers including Exness, IC Markets, FP Markets, Pepperstone, XM, Tickmill, RoboForex, FXTM, Octa, Alpari, and Admiral Markets. We are continuously expanding our broker compatibility. If your broker is not listed, please contact us — we can often add support for new brokers based on demand and technical compatibility.',
  },
  {
    question: 'How long does onboarding take?',
    answer:
      'The standard onboarding process takes 1-3 business days. This includes initial account verification, MT5 connection setup and testing, risk parameter configuration, and a brief connectivity validation period. The exact timeline depends on how quickly your broker processes the connection request and the complexity of your risk configuration. Most accounts are fully operational within 48 hours.',
  },
  {
    question: 'Can I pause copying?',
    answer:
      'Yes. You can pause copying at any time through your account settings or by contacting support. When paused, no new trades will be copied to your account. Existing open positions remain unaffected — they stay open in your account exactly as they are. You can resume copying whenever you choose, and the system will begin monitoring for new trades from the master account immediately.',
  },
  {
    question: 'Can I disconnect?',
    answer:
      'Yes. You can disconnect your account from the copy-trading system at any time with no lock-in period. Upon disconnection, existing open positions remain in your account and you retain full control over them. You can manage, close, or hold these positions manually through your MT5 terminal. There are no penalties or fees for disconnecting.',
  },
  {
    question: 'What happens during a broker disconnection?',
    answer:
      'If your broker experiences temporary downtime or connectivity issues, our system detects the disconnection automatically and pauses copying to your account. No trades will be attempted while the connection is down. Once connectivity is restored, the system resumes normal operation and begins copying new trades from the master account. Please note that any trades executed on the master account during the disconnection window may not be replicated to your account.',
  },
  {
    question: 'How is risk managed?',
    answer:
      'Risk management is configured independently for each account. During onboarding, you set parameters including maximum drawdown limits, exposure caps, position size rules, and symbol whitelists or blacklists. Our system enforces these parameters automatically on every copied trade. If your account drawdown reaches the configured threshold, the system can trigger an automatic pause. You also have access to an emergency stop feature for immediate action.',
  },
  {
    question: 'What happens if a copied trade fails?',
    answer:
      'If a trade fails to execute on your account — due to insufficient margin, symbol restrictions, broker-specific limitations, or temporary connectivity issues — our system logs the failure event and continues monitoring. Existing open positions are not affected by a failed copy attempt. You can review trade execution history and any failed events through your account records. Our support team can help investigate specific failures if needed.',
  },
  {
    question: 'Are profits guaranteed?',
    answer:
      'No. Copy trading involves significant financial risk, and there is no guarantee of profit. Past performance of the master account does not guarantee future results. Markets can move against positions at any time, and losses are possible — including the potential loss of your entire invested capital. You should only trade with funds you can afford to lose and should carefully consider your financial situation before participating in copy trading.',
  },
  {
    question: 'What fees do you charge?',
    answer:
      'Profitwalla operates on a performance-based fee model. There is no upfront platform fee or monthly subscription charge. Pricing is customized based on your account size, trading volume, and specific requirements. This ensures our interests are aligned with yours — we succeed when you succeed. Contact us for a detailed discussion of applicable fees for your specific situation.',
  },
  {
    question: 'Is copy trading risky?',
    answer:
      'Yes. Copy trading carries the same risks as manual trading, including the potential for significant financial loss. Forex and CFD trading involves leverage, which amplifies both profits and losses. Additional risks specific to copy trading include dependency on the master account\'s performance, potential execution delays, and broker-specific factors. You should understand all risks thoroughly before participating and never trade with money you cannot afford to lose.',
  },
];

const comparisonColumns = [
  { key: 'traditional', label: 'Traditional Trading' },
  { key: 'signal', label: 'Signal Services' },
  { key: 'profitwalla', label: 'Profitwalla', highlighted: true },
];

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  }, []);

  return (
    <main className="min-h-screen">
      {/* ═══════════════════════════════════════════════════
          SECTION 1: HERO
          ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28 lg:pt-36 lg:pb-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-accent-teal/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent-blue/5 rounded-full blur-[100px]" />

        <div className="section-container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-teal/10 border border-accent-teal/20 mb-8">
                <span className="status-dot-green" />
                <span className="text-xs font-medium text-accent-teal">
                  Live Trading Infrastructure Active
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-[1.1] tracking-tight">
                Professional Copy Trading.{' '}
                <span className="text-gradient">Built for Precision.</span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl">
                Connect your MT5 account to Profitwalla&rsquo;s professional
                copy-trading infrastructure and monitor your trading activity
                through your own broker account.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/book-now" className="btn-primary btn-lg group">
                  Book Your Slot
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a href="/#how-it-works" className="btn-secondary btn-lg">
                  Explore How It Works
                </a>
              </div>

              {/* Trust indicators below CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-accent-teal/60" />
                  <span>No fund custody</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-accent-teal/60" />
                  <span>Secure MT5 integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-accent-teal/60" />
                  <span>Full broker transparency</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Infrastructure Visualization */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full aspect-square max-w-lg mx-auto">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-radial from-accent-teal/5 to-transparent rounded-full" />

                {/* Master Account Node */}
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-40 z-10">
                  <div className="card-glass p-4 text-center shadow-card">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-accent-teal/15 flex items-center justify-center mb-2">
                      <Server className="h-5 w-5 text-accent-teal" />
                    </div>
                    <p className="text-xs font-medium text-white">Master Account</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">MT5 Source</p>
                    <div className="mt-2 flex justify-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                      <span className="text-[9px] text-accent-green">Active</span>
                    </div>
                  </div>
                </div>

                {/* Connection Lines - SVG */}
                <svg
                  className="absolute inset-0 w-full h-full z-0"
                  viewBox="0 0 520 520"
                  fill="none"
                >
                  <defs>
                    <linearGradient id="heroLineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00D4AA" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="heroLineGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#F0B90B" stopOpacity="0.5" />
                    </linearGradient>
                    <linearGradient id="heroLineGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F0B90B" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#22C55E" stopOpacity="0.5" />
                    </linearGradient>
                  </defs>

                  {/* Master to Copy Engine - 3 lines */}
                  <line x1="110" y1="260" x2="210" y2="175" stroke="url(#heroLineGrad1)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="110" y1="260" x2="210" y2="260" stroke="url(#heroLineGrad1)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="110" y1="260" x2="210" y2="345" stroke="url(#heroLineGrad1)" strokeWidth="1.5" strokeDasharray="6 4" />

                  {/* Copy Engine to Risk Engine */}
                  <line x1="270" y1="175" x2="320" y2="215" stroke="url(#heroLineGrad2)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="270" y1="260" x2="320" y2="260" stroke="url(#heroLineGrad2)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="270" y1="345" x2="320" y2="305" stroke="url(#heroLineGrad2)" strokeWidth="1.5" strokeDasharray="6 4" />

                  {/* Risk Engine to Client */}
                  <line x1="380" y1="215" x2="430" y2="175" stroke="url(#heroLineGrad3)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="380" y1="260" x2="430" y2="260" stroke="url(#heroLineGrad3)" strokeWidth="1.5" strokeDasharray="6 4" />
                  <line x1="380" y1="305" x2="430" y2="345" stroke="url(#heroLineGrad3)" strokeWidth="1.5" strokeDasharray="6 4" />

                  {/* Animated data flow dots */}
                  <circle r="3" fill="#00D4AA" opacity="0.8">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M110,260 L210,260" />
                  </circle>
                  <circle r="3" fill="#3B82F6" opacity="0.8">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M270,260 L320,260" />
                  </circle>
                  <circle r="3" fill="#22C55E" opacity="0.8">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M380,260 L430,260" />
                  </circle>
                </svg>

                {/* Copy Engine Node */}
                <div className="absolute top-[28%] left-[40%] -translate-x-1/2 w-36 z-10">
                  <div className="card-glass p-3 text-center shadow-card">
                    <div className="w-9 h-9 mx-auto rounded-lg bg-accent-blue/15 flex items-center justify-center mb-1.5">
                      <Cpu className="h-4 w-4 text-accent-blue" />
                    </div>
                    <p className="text-[11px] font-medium text-white">Copy Engine</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">Real-time replication</p>
                  </div>
                </div>

                {/* Risk Engine Node */}
                <div className="absolute top-1/2 left-[62%] -translate-x-1/2 -translate-y-1/2 w-36 z-10">
                  <div className="card-glass p-3 text-center border-accent-gold/20 shadow-card">
                    <div className="w-9 h-9 mx-auto rounded-lg bg-accent-gold/15 flex items-center justify-center mb-1.5">
                      <Shield className="h-4 w-4 text-accent-gold" />
                    </div>
                    <p className="text-[11px] font-medium text-white">Risk Engine</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">Auto-enforced rules</p>
                  </div>
                </div>

                {/* Client Accounts Node */}
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-44 z-10">
                  <div className="card-glass p-4 text-center shadow-card">
                    <div className="w-10 h-10 mx-auto rounded-lg bg-accent-green/15 flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-accent-green" />
                    </div>
                    <p className="text-xs font-medium text-white">Client MT5 Accounts</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Connected brokers</p>
                    <div className="mt-2.5 flex justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                      <span
                        className="w-2 h-2 rounded-full bg-accent-green animate-pulse"
                        style={{ animationDelay: '0.3s' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-accent-green animate-pulse"
                        style={{ animationDelay: '0.6s' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ambient particles */}
                <div className="absolute top-[12%] left-[18%]">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-accent-teal/30 animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                </div>
                <div className="absolute bottom-[18%] right-[22%]">
                  <div
                    className="w-1.5 h-1.5 rounded-full bg-accent-blue/30 animate-ping"
                    style={{ animationDuration: '4s' }}
                  />
                </div>
                <div className="absolute top-[60%] left-[8%]">
                  <div
                    className="w-1 h-1 rounded-full bg-accent-gold/30 animate-ping"
                    style={{ animationDuration: '5s' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2: PERFORMANCE STRIP
          ═══════════════════════════════════════════════════ */}
      <section className="py-14 border-y border-white/5 bg-surface-100/50">
        <div className="section-container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12"
          >
            {performanceStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUpSmall}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-0.5">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    decimals={stat.decimals}
                    prefix={stat.prefix}
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-white">{stat.label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{stat.sublabel}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3: HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section id="how-it-works" className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">How It Works</p>
              <h2 className="section-title">How Profitwalla Works</h2>
              <p className="section-subtitle">
                A straightforward four-step process to connect your MT5 account
                and start copy trading with full risk control.
              </p>
            </div>
          </AnimatedSection>

          {/* Steps Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {howItWorksSteps.map((step, i) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="card card-hover p-6 relative group"
              >
                <span className="financial-number text-5xl font-bold text-accent-teal/10 absolute top-3 right-4 select-none group-hover:text-accent-teal/20 transition-colors">
                  {step.number}
                </span>
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center mb-4 group-hover:bg-accent-teal/20 transition-colors">
                    <span className="financial-number text-sm font-bold text-accent-teal">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-accent-teal/70">
                    <Clock className="h-3 w-3" />
                    {step.detail}
                  </span>
                </div>
                {/* Connector arrow on desktop */}
                {i < 3 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-20">
                    <ArrowRight className="h-4 w-4 text-white/20" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Flow Diagram */}
          <AnimatedSection className="mt-16">
            <div className="card p-6 md:p-8 overflow-x-auto">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-6 text-center">
                Trade Flow Architecture
              </p>
              <div className="flex items-center justify-between gap-2 min-w-[720px]">
                {[
                  { label: 'MASTER ACCOUNT', sublabel: 'Signal source', icon: Server, color: 'text-accent-teal', bgColor: 'bg-accent-teal/10' },
                  { label: 'COPY ENGINE', sublabel: 'Real-time sync', icon: Cpu, color: 'text-accent-blue', bgColor: 'bg-accent-blue/10' },
                  { label: 'RISK ENGINE', sublabel: 'Auto-enforced', icon: Shield, color: 'text-accent-gold', bgColor: 'bg-accent-gold/10' },
                  { label: 'BROKER GATEWAY', sublabel: 'MT5 protocol', icon: Network, color: 'text-accent-purple', bgColor: 'bg-accent-purple/10' },
                  { label: 'CLIENT MT5', sublabel: 'Your account', icon: MonitorCheck, color: 'text-accent-green', bgColor: 'bg-accent-green/10' },
                ].map((node, i) => (
                  <div key={node.label} className="flex items-center gap-2 flex-1">
                    <div className="flex-1 text-center">
                      <div
                        className={`w-12 h-12 mx-auto rounded-xl ${node.bgColor} flex items-center justify-center mb-2`}
                      >
                        <node.icon className={`h-5 w-5 ${node.color}`} />
                      </div>
                      <p className="text-[10px] md:text-xs font-semibold text-white whitespace-nowrap">
                        {node.label}
                      </p>
                      <p className="text-[9px] text-gray-500 mt-0.5 whitespace-nowrap">
                        {node.sublabel}
                      </p>
                    </div>
                    {i < 4 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="w-4 md:w-10 h-px bg-gradient-to-r from-white/20 to-white/10" />
                        <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white/20" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 4: FEATURES
          ═══════════════════════════════════════════════════ */}
      <section id="features" className="section bg-surface-100/30">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Features</p>
              <h2 className="section-title">Built for Professional Traders</h2>
              <p className="section-subtitle">
                Every component of the Profitwalla infrastructure is designed for
                reliability, speed, and complete control over your copy-trading
                experience.
              </p>
            </div>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="card-glass p-6 card-hover group"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-teal/10 flex items-center justify-center mb-4 group-hover:bg-accent-teal/20 transition-colors duration-300">
                  <feature.icon className="h-5 w-5 text-accent-teal" />
                </div>
                <h3 className="text-base font-heading font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5: PLATFORM PREVIEW
          ═══════════════════════════════════════════════════ */}
      <section id="platform" className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Platform</p>
              <h2 className="section-title">One Infrastructure. Complete Control.</h2>
              <p className="section-subtitle">
                Monitor your portfolio through your own broker account with full
                transparency. Every trade, every metric, visible in your MT5
                terminal.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="card overflow-hidden shadow-card">
              {/* Browser Chrome */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-surface-100">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-accent-red/60" />
                    <span className="w-3 h-3 rounded-full bg-accent-gold/60" />
                    <span className="w-3 h-3 rounded-full bg-accent-green/60" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-surface/50 border border-white/5">
                    <Lock className="h-3 w-3 text-gray-500" />
                    <span className="text-xs font-mono text-gray-500">
                      profitwalla.com/dashboard
                    </span>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium px-2 py-1 rounded bg-surface/50">
                  Demonstration Data
                </span>
              </div>

              <div className="p-6">
                {/* Account Overview Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Account Overview</h3>
                    <p className="text-xs text-gray-500">MT5 Account #40821567 &middot; Exness</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-dot-green" />
                    <span className="text-xs text-accent-green">Connected</span>
                  </div>
                </div>

                {/* Account Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                  {mockAccountCards.map((item) => (
                    <div
                      key={item.label}
                      className="bg-surface-100 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">
                        {item.label}
                      </p>
                      <p
                        className={`financial-number text-lg font-semibold ${item.color || 'text-white'}`}
                      >
                        {item.value}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-1">{item.subtext}</p>
                    </div>
                  ))}
                </div>

                {/* Trade Table */}
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-medium text-white">Open Positions</h4>
                  <span className="text-xs text-gray-500">{mockTrades.length} trades</span>
                </div>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Type</th>
                        <th>Lots</th>
                        <th>Open Price</th>
                        <th>Current</th>
                        <th>P/L</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTrades.map((trade) => (
                        <tr key={trade.symbol}>
                          <td className="font-mono text-white font-medium">{trade.symbol}</td>
                          <td>
                            <span
                              className={
                                trade.type === 'BUY' ? 'badge-green' : 'badge-red'
                              }
                            >
                              {trade.type === 'BUY' ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {trade.type}
                            </span>
                          </td>
                          <td className="financial-number text-gray-300">
                            {trade.lots.toFixed(2)}
                          </td>
                          <td className="financial-number text-gray-300">{trade.open}</td>
                          <td className="financial-number text-white">{trade.current}</td>
                          <td>
                            <span
                              className={`financial-number font-medium ${
                                trade.pnl.startsWith('+') ? 'positive' : 'negative'
                              }`}
                            >
                              {trade.pnl}
                            </span>
                          </td>
                          <td className="financial-number text-gray-500 text-xs">
                            {trade.time}
                          </td>
                          <td>
                            <span className="badge-blue">{trade.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 6: RISK MANAGEMENT
          ═══════════════════════════════════════════════════ */}
      <section id="risk" className="section bg-surface-100/30">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Risk Management</p>
              <h2 className="section-title">Built With Risk Management at the Core</h2>
              <p className="section-subtitle">
                Every account is configured with independent risk parameters. Your
                risk settings are enforced automatically on every copied trade.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Risk Control Visualization */}
            <AnimatedSection>
              <div className="card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-lg bg-accent-gold/10 flex items-center justify-center">
                    <Shield className="h-4.5 w-4.5 text-accent-gold" />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-white">
                    Risk Configuration
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Risk Level */}
                  <div>
                    <p className="label">Risk Level</p>
                    <div className="flex gap-2">
                      {['Low', 'Moderate', 'Custom'].map((level) => (
                        <button
                          key={level}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            level === 'Moderate'
                              ? 'bg-accent-teal/15 text-accent-teal border border-accent-teal/30 shadow-glow-sm'
                              : 'bg-surface-100 text-gray-400 border border-white/5 hover:border-white/10 hover:text-gray-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Maximum Drawdown */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="label mb-0">Maximum Drawdown</p>
                      <span className="financial-number text-sm font-semibold text-accent-teal">
                        5%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: '33%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-accent-teal to-accent-blue rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-gray-500">0%</span>
                      <span className="text-[10px] text-gray-500">Max: 15%</span>
                    </div>
                  </div>

                  {/* Maximum Exposure */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <p className="label mb-0">Maximum Exposure</p>
                    <span className="badge-green">
                      <Check className="h-3 w-3" />
                      Configured
                    </span>
                  </div>

                  {/* Copy Ratio */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <p className="label mb-0">Copy Ratio</p>
                    <div className="flex items-center gap-2">
                      <span className="financial-number text-lg font-semibold text-white">
                        1.0x
                      </span>
                      <span className="text-[10px] text-gray-500">1:1 replication</span>
                    </div>
                  </div>

                  {/* Lot Sizing */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <p className="label mb-0">Lot Sizing</p>
                    <span className="badge-teal">Proportional</span>
                  </div>

                  {/* Emergency Stop */}
                  <div className="flex items-center justify-between py-2 border-t border-white/5">
                    <p className="label mb-0">Emergency Stop</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-accent-green font-medium">Enabled</span>
                      <div className="w-10 h-5 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-end px-0.5">
                        <span className="w-4 h-4 rounded-full bg-accent-green shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right: Risk Features Grid */}
            <AnimatedSection>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainerSlow}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                {riskFeatures.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={fadeUpSmall}
                    transition={{ duration: 0.4 }}
                    className="card-glass p-5"
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center flex-shrink-0 mb-3">
                      <feature.icon className="h-5 w-5 text-accent-gold" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1.5">{feature.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7: BROKER SUPPORT
          ═══════════════════════════════════════════════════ */}
      <section id="brokers" className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Brokers</p>
              <h2 className="section-title">Connect With Your Broker</h2>
              <p className="section-subtitle">
                Profitwalla supports multiple major MT5 brokers for reliable
                connectivity. We are continuously expanding our broker network.
              </p>
            </div>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {brokerList.map((broker) => (
              <motion.div
                key={broker.name}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="card-glass p-5 flex items-center justify-center text-center card-hover group"
              >
                <div>
                  <div className="w-10 h-10 mx-auto rounded-lg bg-white/5 group-hover:bg-accent-teal/10 flex items-center justify-center mb-3 transition-colors">
                    <Globe className="h-5 w-5 text-gray-400 group-hover:text-accent-teal transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-white">{broker.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{broker.region}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection className="mt-10 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-surface-200/50 border border-white/5">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-400">
                Don&rsquo;t see your broker?{' '}
                <a
                  href="mailto:contact@profitwalla.com"
                  className="text-accent-teal hover:text-accent-teal/80 transition-colors underline underline-offset-4"
                >
                  Contact us
                </a>{' '}
                to discuss compatibility.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 8: SECURITY
          ═══════════════════════════════════════════════════ */}
      <section className="section bg-surface-100/30">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Security</p>
              <h2 className="section-title">Your Capital Stays With Your Broker</h2>
              <p className="section-subtitle">
                Profitwalla does not custody client funds. Your capital remains in
                your broker account at all times, giving you complete control and
                visibility over your money.
              </p>
            </div>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {securityConcepts.map((concept) => (
              <motion.div
                key={concept.title}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="card-glass p-6"
              >
                <div className="w-11 h-11 rounded-xl bg-accent-green/10 flex items-center justify-center mb-4">
                  <concept.icon className="h-5 w-5 text-accent-green" />
                </div>
                <h3 className="text-base font-heading font-semibold text-white mb-2">
                  {concept.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {concept.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 9: WHY PROFITWALLA (COMPARISON)
          ═══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Comparison</p>
              <h2 className="section-title">Why Traders Choose Profitwalla</h2>
              <p className="section-subtitle">
                See how Profitwalla compares to traditional manual trading and
                basic signal-based services across every key dimension.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="card overflow-hidden">
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-1/4">Feature</th>
                      {comparisonColumns.map((col) => (
                        <th
                          key={col.key}
                          className={`w-1/4 text-center ${
                            col.highlighted
                              ? 'bg-accent-teal/5 border-b-2 border-accent-teal/30 text-accent-teal'
                              : ''
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row) => (
                      <tr key={row.feature}>
                        <td className="font-medium text-white">{row.feature}</td>
                        <td className="text-center">
                          {typeof row.traditional === 'boolean' ? (
                            row.traditional ? (
                              <Check className="h-4 w-4 text-accent-green mx-auto" />
                            ) : (
                              <XIcon className="h-4 w-4 text-accent-red/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-400">{row.traditional}</span>
                          )}
                        </td>
                        <td className="text-center">
                          {typeof row.signal === 'boolean' ? (
                            row.signal ? (
                              <Check className="h-4 w-4 text-accent-green mx-auto" />
                            ) : (
                              <XIcon className="h-4 w-4 text-accent-red/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm text-gray-400">{row.signal}</span>
                          )}
                        </td>
                        <td className="text-center bg-accent-teal/5">
                          {typeof row.profitwalla === 'boolean' ? (
                            row.profitwalla ? (
                              <Check className="h-4 w-4 text-accent-teal mx-auto" />
                            ) : (
                              <XIcon className="h-4 w-4 text-accent-red/50 mx-auto" />
                            )
                          ) : (
                            <span className="text-sm font-medium text-accent-teal">
                              {row.profitwalla}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 10: PRICING
          ═══════════════════════════════════════════════════ */}
      <section className="section bg-surface-100/30">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Pricing</p>
              <h2 className="section-title">Simple, Transparent Pricing</h2>
              <p className="section-subtitle">
                Performance-based model with no upfront platform fee. Pricing is
                customized based on your requirements and account size.
              </p>
            </div>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {pricingTiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="card-glass p-8 flex flex-col"
              >
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-accent-teal mb-2">
                    {tier.subtitle}
                  </p>
                  <h3 className="text-xl font-heading font-bold text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-400">{tier.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-accent-teal mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-gray-500 mb-4">{tier.note}</p>

                <a
                  href="mailto:contact@profitwalla.com"
                  className="btn-primary w-full justify-center group"
                >
                  Talk to Profitwalla
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-200/50 border border-white/5">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <p className="text-sm text-gray-400">
                Pricing is customized based on your requirements. Contact us for
                details.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 11: TRUST
          ═══════════════════════════════════════════════════ */}
      <section id="trust" className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">Trust</p>
              <h2 className="section-title">
                Built for Traders Who Want Transparency
              </h2>
              <p className="section-subtitle">
                Every aspect of Profitwalla is designed to give you visibility,
                control, and confidence in the copy-trading process.
              </p>
            </div>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {trustPoints.map((point) => (
              <motion.div
                key={point.title}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="card-glass p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-accent-teal/10 flex items-center justify-center flex-shrink-0">
                  <point.icon className="h-5 w-5 text-accent-teal" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">{point.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {point.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 12: FAQ
          ═══════════════════════════════════════════════════ */}
      <section id="faq" className="section bg-surface-100/30">
        <div className="section-container">
          <AnimatedSection>
            <div className="section-header">
              <p className="section-label">FAQ</p>
              <h2 className="section-title">Frequently Asked Questions</h2>
              <p className="section-subtitle">
                Common questions about Profitwalla&rsquo;s copy-trading
                infrastructure, risk management, and account setup.
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection className="max-w-3xl mx-auto">
            <div className="space-y-2">
              {faqData.map((faq, index) => (
                <div
                  key={index}
                  className={`card overflow-hidden transition-colors ${
                    openFaq === index ? 'border-white/10' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/[0.02] transition-colors group"
                    aria-expanded={openFaq === index}
                  >
                    <span className="text-sm font-medium text-white pr-4 group-hover:text-accent-teal transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? 'rotate-180 text-accent-teal' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {openFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 pt-0">
                          <div className="h-px bg-white/5 mb-4" />
                          <p className="text-sm text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 13: RISK DISCLOSURE
          ═══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="card p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-accent-gold" />
                  </div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Risk Disclosure
                  </h2>
                </div>

                <div className="space-y-5 text-sm text-gray-400 leading-relaxed">
                  <p>
                    <strong className="text-gray-300">General Risk Warning:</strong>{' '}
                    Trading foreign exchange, contracts for differences (CFDs), and
                    other financial instruments on margin carries a high level of risk
                    and may not be suitable for all investors. The high degree of
                    leverage can work against you as well as for you. Before deciding to
                    trade, you should carefully consider your investment objectives,
                    level of experience, and risk appetite.
                  </p>
                  <p>
                    There is a possibility that you could sustain a loss of some or all
                    of your initial investment, and therefore you should not invest money
                    that you cannot afford to lose. You should be aware of all the risks
                    associated with trading and seek advice from an independent financial
                    advisor if you have any doubts.
                  </p>
                  <p>
                    <strong className="text-gray-300">Copy Trading Risks:</strong>{' '}
                    Copy trading involves the replication of trades from a master account
                    to connected client accounts. Past performance of the master account
                    is not indicative of future results. Copy trading does not guarantee
                    profits and may result in losses. Market conditions, liquidity,
                    execution delays, and broker-specific factors can all affect trade
                    outcomes. The master account may perform differently in the future
                    than it has in the past.
                  </p>
                  <p>
                    <strong className="text-gray-300">Market Risks:</strong>{' '}
                    Forex and CFD markets are subject to rapid price movements influenced
                    by economic events, geopolitical developments, central bank policies,
                    and market sentiment. Slippage, gaps, and volatility can result in
                    trades being executed at prices different from expected. These market
                    conditions may result in losses that exceed initial expectations.
                  </p>
                  <p>
                    <strong className="text-gray-300">No Guarantee of Accuracy:</strong>{' '}
                    The information on this website is not directed at residents of
                    certain jurisdictions where such distribution or use would be
                    contrary to local law or regulation. Profitwalla does not accept
                    applications from residents of countries where such distribution or
                    use would be contrary to local law or regulation.
                  </p>
                  <p>
                    <strong className="text-gray-300">Regulatory Notice:</strong>{' '}
                    Profitwalla is a technology service provider and does not provide
                    financial advice, manage investments, or act as a broker-dealer. All
                    trading activity occurs through your own broker account. Profitwalla
                    does not have custody of client funds and does not execute trades on
                    behalf of clients as a principal.
                  </p>
                  <p>
                    <strong className="text-gray-300">Performance Data:</strong>{' '}
                    Any performance figures or statistics presented on this website or in
                    marketing materials are for illustrative purposes only and should not
                    be considered as a guarantee of future performance. Actual results
                    may vary significantly from simulated or historical performance data.
                    Variable spreads, commission structures, and execution differences
                    between accounts may affect copy-trading outcomes.
                  </p>
                  <p>
                    <strong className="text-gray-300">Technical Risks:</strong>{' '}
                    Copy-trading infrastructure relies on technology systems, internet
                    connectivity, and broker server availability. System failures,
                    connectivity interruptions, or broker downtime may result in trades
                    not being copied or being copied with delays. While Profitwalla
                    maintains redundant systems, technical issues cannot be entirely
                    eliminated.
                  </p>
                  <p>
                    By using Profitwalla&rsquo;s services, you acknowledge that you
                    understand these risks and agree to trade at your own risk. You are
                    solely responsible for your trading decisions and should ensure that
                    you fully understand the risks involved before participating in copy
                    trading.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════════════════════════════════════════════════
          SECTION 14: FINAL CTA
          ═══════════════════════════════════════════════════ */}
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 bg-accent-teal/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-accent-teal/8 rounded-full blur-[120px]" />

        <div className="section-container relative z-10">
          <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-teal/10 border border-accent-teal/20 mb-8">
                <span className="status-dot-green" />
                <span className="text-xs font-medium text-accent-teal">
                  Infrastructure Active
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-4">
                Ready to Start?
              </h2>
              <p className="text-lg text-gray-400 mb-10 leading-relaxed">
                Join Profitwalla&rsquo;s professional copy-trading infrastructure.
                Connect your MT5 account and start copying with full risk control
                and broker-level transparency.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/book-now"
                  className="btn-primary btn-lg group"
                >
                  Book Your Slot
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a
                  href="mailto:contact@profitwalla.com"
                  className="btn-secondary btn-lg"
                >
                  <Mail className="h-4 w-4" />
                  Contact Us
                </a>
              </div>

              {/* Trust strip below CTA */}
              <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-accent-teal/50" />
                  <span>No fund custody</span>
                </div>
                <span className="text-white/10">|</span>
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-accent-teal/50" />
                  <span>Secure integration</span>
                </div>
                <span className="text-white/10">|</span>
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-accent-teal/50" />
                  <span>Full transparency</span>
                </div>
                <span className="text-white/10">|</span>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent-teal/50" />
                  <span>Professional support</span>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
