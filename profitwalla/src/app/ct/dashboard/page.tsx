'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TradeEvent {
  id: string;
  masterTradeId: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  status: string;
  executionLatencyMs: number | null;
  error: string | null;
  createdAt: string;
  client: { mt5AccountNumber: string; clientRef: string };
}

interface Alert {
  id: string;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
  createdAt: string;
  client: { mt5AccountNumber: string; clientRef: string };
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [tradesRes, alertsRes] = await Promise.all([
      fetch('/ct/api/trades'), fetch('/ct/api/alerts?resolved=false'),
    ]);
    const tradesData = await tradesRes.json();
    if (tradesData.success) setTrades(tradesData.data);
    const alertsData = await alertsRes.json();
    if (alertsData.success) setAlerts(alertsData.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const openTrades = trades.filter((t) => t.status === 'open');
  const avgLatency = trades.length > 0 ? Math.round(trades.reduce((sum, t) => sum + (t.executionLatencyMs || 0), 0) / trades.length) : 0;

  return (
    <div className="min-h-screen bg-terminal-bg">
      <div className="border-b border-terminal-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/ct/staff" className="text-gray-400 hover:text-white text-sm">← Staff</Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">CT</span>
            </div>
            <h1 className="font-heading text-lg font-bold">Trade Monitor</h1>
          </div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" /><span className="text-xs text-gray-400">Live</span></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Open Trades', value: openTrades.length, color: 'text-accent-teal' },
            { label: 'Total Copied', value: trades.length, color: 'text-accent-gold' },
            { label: 'Avg Latency', value: `${avgLatency}ms`, color: 'text-accent-blue' },
            { label: 'Errors', value: trades.filter((t) => t.status === 'error').length, color: 'text-accent-red' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-4">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className={`financial-number text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card">
            <div className="px-5 py-4 border-b border-terminal-border flex items-center justify-between">
              <h2 className="font-heading font-semibold">Live Trade Feed</h2>
              <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" /><span className="text-xs text-gray-400">Streaming</span></div>
            </div>
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-terminal-card">
                  <tr className="border-b border-terminal-border">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Time</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Symbol</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Type</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Volume</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Price</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-400">Latency</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : trades.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No trades yet</td></tr>
                  ) : (
                    trades.slice(0, 50).map((trade) => (
                      <tr key={trade.id} className="border-b border-terminal-border hover:bg-terminal-border/30 transition-colors">
                        <td className="px-4 py-2 text-xs text-gray-400 font-mono">{new Date(trade.createdAt).toLocaleTimeString('en-IN')}</td>
                        <td className="px-4 py-2 text-sm font-semibold">{trade.symbol}</td>
                        <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${trade.type === 'buy' ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}>{trade.type.toUpperCase()}</span></td>
                        <td className="px-4 py-2 text-right financial-number text-sm">{trade.volume}</td>
                        <td className="px-4 py-2 text-right financial-number text-sm">{trade.openPrice}</td>
                        <td className="px-4 py-2 text-right text-xs text-gray-400">{trade.executionLatencyMs ? `${trade.executionLatencyMs}ms` : '—'}</td>
                        <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${trade.status === 'open' ? 'bg-accent-teal/10 text-accent-teal' : trade.status === 'closed' ? 'bg-gray-500/10 text-gray-400' : 'bg-accent-red/10 text-accent-red'}`}>{trade.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="glass-card">
            <div className="px-5 py-4 border-b border-terminal-border">
              <h2 className="font-heading font-semibold">Active Alerts</h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No active alerts</div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="px-5 py-3 border-b border-terminal-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-accent-red' : alert.severity === 'warning' ? 'bg-accent-gold' : 'bg-accent-blue'}`} />
                      <span className="font-mono text-xs text-gray-400">{alert.client.mt5AccountNumber}</span>
                      <span className="text-xs text-gray-500 ml-auto">{new Date(alert.createdAt).toLocaleTimeString('en-IN')}</span>
                    </div>
                    <p className="text-sm text-gray-300">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
