'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Scale,
} from 'lucide-react';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function RiskDisclosurePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="section pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-red/5 rounded-full blur-3xl" />
        <div className="section-container relative z-10">
          <AnimatedSection className="section-header">
            <p className="section-label">Legal</p>
            <h1 className="section-title">
              Risk <span className="text-gradient">Disclosure</span>
            </h1>
            <p className="section-subtitle">
              Important information about the risks associated with trading and copy-trading services.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Risk Disclosure Content */}
      <section className="section">
        <div className="section-container max-w-4xl">
          <AnimatedSection>
            <div className="card p-8 md:p-12 space-y-8">
              {/* General Trading Risk */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-red" />
                  <h2 className="text-xl font-heading font-bold text-white">General Trading Risk</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Trading financial instruments, including forex, contracts for difference (CFDs), and other derivative products, carries a high level of risk and may not be suitable for all investors. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
                  </p>
                  <p>
                    There is a possibility that you could sustain a loss of some or all of your initial investment, and therefore you should not invest money that you cannot afford to lose. You should be aware of all the risks associated with trading and seek advice from an independent financial advisor if you have any doubts.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Forex/CFD Risk */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-accent-gold" />
                  <h2 className="text-xl font-heading font-bold text-white">Forex & CFD Specific Risk</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    The forex market and CFD trading involve significant risk and are not suitable for all investors. The leveraged nature of forex and CFD trading means that any market movement will have an equally proportional effect on your deposited funds. This may work against you as well as for you.
                  </p>
                  <p>
                    Factors include but are not limited to: changes in political and economic policies, natural disasters, pandemics, market volatility, currency fluctuations, interest rate changes, and geopolitical events. These factors can cause rapid and unpredictable price movements.
                  </p>
                  <p>
                    CFDs are complex instruments and come with a high risk of losing money rapidly due to leverage. You should consider whether you understand how CFDs work and whether you can afford to take the high risk of losing your money.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Copy Trading Risk */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-red" />
                  <h2 className="text-xl font-heading font-bold text-white">Copy Trading Risk</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Copy trading involves replicating the trades of a signal provider. While copy trading can provide convenience, it does not guarantee profits. Past performance of any trader or strategy is not indicative of future results.
                  </p>
                  <p>
                    By using copy-trading services, you are authorizing the execution of trades in your account based on the activity of another trader. You remain fully responsible for all trading decisions and outcomes, even when trades are executed automatically.
                  </p>
                  <p>
                    The signal provider may experience periods of significant drawdown or losses. Copy trading does not eliminate the risks inherent in trading financial instruments. You should only copy trades with funds you can afford to lose.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Leverage Risk */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-gold" />
                  <h2 className="text-xl font-heading font-bold text-white">Leverage Risk</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Leverage allows you to control a larger position with a smaller amount of capital. While leverage can amplify profits, it can also amplify losses. The use of leverage increases the risk of significant financial loss.
                  </p>
                  <p>
                    High leverage ratios (e.g., 1:500) mean that even small market movements can result in substantial gains or losses relative to your margin deposit. You may be required to deposit additional margin funds to maintain your positions, and failure to do so may result in forced liquidation of your positions at a loss.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Past Performance */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-teal" />
                  <h2 className="text-xl font-heading font-bold text-white">Past Performance Disclaimer</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Past performance is not a reliable indicator of future results. Any historical returns, expected returns, or probability projections may not reflect actual future performance. All securities involve risk and may result in partial or total loss.
                  </p>
                  <p>
                    While the data provided by Profitwalla is obtained from sources believed to be reliable, we make no representation or warranty as to its accuracy, completeness, or timeliness. The information is provided &quot;as is&quot; without warranty of any kind.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* No Guaranteed Returns */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-red" />
                  <h2 className="text-xl font-heading font-bold text-white">No Guaranteed Returns</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    No representation is being made that any account will or is likely to achieve profits or losses similar to those shown. In fact, there are frequently sharp differences between hypothetical performance results and the actual results subsequently achieved by any particular trading program.
                  </p>
                  <p>
                    Hypothetical performance results do not represent actual trading. Also, since the trades have not been executed, the results may have under- or over-compensated for the impact of certain market factors, such as lack of liquidity.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Technical Risk */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-accent-gold" />
                  <h2 className="text-xl font-heading font-bold text-white">Technical Risk</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Copy-trading systems rely on technology infrastructure, internet connectivity, and broker APIs. Technical failures, connectivity issues, or system outages may result in delayed, missed, or incorrectly executed trades.
                  </p>
                  <p>
                    While Profitwalla implements redundancy and monitoring measures, we cannot guarantee uninterrupted service. You should be aware that technical issues may occur at any time and may impact your trading activity.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Regulatory Notice */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="w-5 h-5 text-accent-blue" />
                  <h2 className="text-xl font-heading font-bold text-white">Regulatory Notice</h2>
                </div>
                <div className="space-y-3 text-sm text-gray-400 leading-relaxed">
                  <p>
                    Profitwalla provides copy-trading infrastructure technology. We are not a broker, investment advisor, or financial institution. We do not provide investment advice, trading recommendations, or financial planning services.
                  </p>
                  <p>
                    Trading in financial instruments is subject to the laws and regulations of the jurisdiction in which you reside. It is your responsibility to ensure that your use of copy-trading services complies with all applicable laws and regulations in your jurisdiction.
                  </p>
                  <p>
                    By using Profitwalla&apos;s services, you acknowledge that you have read, understood, and agree to this risk disclosure. You confirm that you are aware of the risks involved and accept full responsibility for your trading decisions.
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Acknowledgment */}
              <div className="bg-surface-100 rounded-xl p-6">
                <p className="text-sm text-gray-300 leading-relaxed text-center">
                  By using Profitwalla&apos;s services, you acknowledge that you have read and understood this risk disclosure, and you accept full responsibility for your trading decisions and any resulting gains or losses.
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-container">
          <AnimatedSection>
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/security" className="btn-primary btn-lg">
                  Security & Trust
                </Link>
                <Link href="/contact" className="btn-secondary btn-lg">
                  Have Questions?
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
