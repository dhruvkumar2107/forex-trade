'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

interface TradeEvent {
  id: string;
  masterTradeId: string;
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  slippage: number | null;
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

type StatusFilter = 'all' | 'executed' | 'failed' | 'risk_blocked' | 'retrying';
type TimeRange = '5m' | '15m' | '1h' | '6h' | '24h';

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

function formatMs(ms: number | null): string {
  if (ms === null || ms === undefined) return '—';
  return `${ms}`;
}

function latencyColor(ms: number | null): string {
  if (ms === null) return 'text-gray-500';
  if (ms < 500) return 'text-accent-green';
  if (ms <= 2000) return 'text-accent-gold';
  return 'text-accent-red';
}

function latencyBg(ms: number | null): string {
  if (ms === null) return 'bg-gray-500/10';
  if (ms < 500) return 'bg-accent-green/10';
  if (ms <= 2000) return 'bg-accent-gold/10';
  return 'bg-accent-red/10';
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    executed: 'bg-accent-green/10 text-accent-green border-accent-green/20',
    failed: 'bg-accent-red/10 text-accent-red border-accent-red/20',
    risk_blocked: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20',
    retrying: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20',
  };
  return styles[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}

function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'border-l-accent-red bg-accent-red/5',
    warning: 'border-l-accent-gold bg-accent-gold/5',
    info: 'border-l-accent-blue bg-accent-blue/5',
  };
  return colors[severity] || 'border-l-gray-500 bg-gray-500/5';
}

function severityBadge(severity: string): string {
  const styles: Record<string, string> = {
    critical: 'text-accent-red',
    warning: 'text-accent-gold',
    info: 'text-accent-blue',
  };
  return styles[severity] || 'text-gray-400';
}

function timeRangeMs(range: TimeRange): number {
  const map: Record<TimeRange, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  };
  return map[range];
}

export default function DashboardPage() {
  const [trades, setTrades] = useState<TradeEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const [filterClient, setFilterClient] = useState('');
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [filterTime, setFilterTime] = useState<TimeRange>('1h');

  const fetchTrades = async () => {
    try {
      const res = await fetch('/api/trades');
      const data = await res.json();
      if (data.success) setTrades(data.data);
    } catch {
      /* ignore */
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.success) setAlerts(data.data);
    } catch {
      /* ignore */
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTrades(), fetchAlerts()]);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const tradeInterval = setInterval(fetchTrades, 5000);
    const alertInterval = setInterval(fetchAlerts, 10000);
    return () => {
      clearInterval(tradeInterval);
      clearInterval(alertInterval);
    };
  }, []);

  const filteredTrades = useMemo(() => {
    const cutoff = Date.now() - timeRangeMs(filterTime);
    return trades.filter((t) => {
      const created = new Date(t.createdAt).getTime();
      if (created < cutoff) return false;
      if (filterClient && !t.client.clientRef.toLowerCase().includes(filterClient.toLowerCase()) && !t.client.mt5AccountNumber.includes(filterClient)) return false;
      if (filterSymbol && !t.symbol.toLowerCase().includes(filterSymbol.toLowerCase())) return false;
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      return true;
    }).slice(0, 50);
  }, [trades, filterClient, filterSymbol, filterStatus, filterTime]);

  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTrades = trades.filter((t) => new Date(t.createdAt) >= todayStart);
    const executed = todayTrades.filter((t) => t.status === 'executed').length;
    const failed = todayTrades.filter((t) => t.status === 'failed').length;
    const riskBlocked = todayTrades.filter((t) => t.status === 'risk_blocked').length;
    const openPositions = trades.filter((t) => t.status === 'executed').length;
    const avgLatency = todayTrades.length > 0
      ? Math.round(todayTrades.reduce((sum, t) => sum + (t.executionLatencyMs || 0), 0) / todayTrades.length)
      : 0;

    return {
      totalToday: todayTrades.length,
      executed,
      failed,
      avgLatency,
      riskBlocked,
      openPositions,
    };
  }, [trades]);

  const uniqueClients = useMemo(() => {
    const set = new Set(trades.map((t) => `${t.client.clientRef} (${t.client.mt5AccountNumber})`));
    return Array.from(set).sort();
  }, [trades]);

  const unresolvedAlerts = useMemo(() => alerts.filter((a) => !a.resolved), [alerts]);

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="border-b border-terminal-border px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">CT</span>
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold">Trade Monitor</h1>
              <p className="text-[10px] text-gray-500">Live copy execution feed</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-gray-400">Live</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">
              {lastRefresh.toLocaleTimeString('en-IN')}
            </div>
            <button
              onClick={fetchAll}
              className="p-1.5 rounded-md bg-terminal-card border border-terminal-border hover:bg-terminal-hover"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Stats Row */}
        <div className="grid grid-cols-6 gap-3 mb-4">
          {[
            { label: 'Total Trades Today', value: stats.totalToday, icon: Activity, color: 'text-white' },
            { label: 'Successful', value: stats.executed, icon: CheckCircle, color: 'text-accent-green' },
            { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-accent-red' },
            { label: 'Avg Latency', value: `${stats.avgLatency}ms`, icon: Zap, color: 'text-accent-blue' },
            { label: 'Risk Blocked', value: stats.riskBlocked, icon: Shield, color: 'text-accent-gold' },
            { label: 'Active Positions', value: stats.openPositions, icon: TrendingUp, color: 'text-accent-teal' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </div>
              <p className={`financial-number text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-terminal-card border border-terminal-border rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent-teal"
          >
            <option value="">All Clients</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Symbol..."
            value={filterSymbol}
            onChange={(e) => setFilterSymbol(e.target.value)}
            className="bg-terminal-card border border-terminal-border rounded px-2.5 py-1.5 text-xs text-gray-300 w-28 focus:outline-none focus:border-accent-teal placeholder:text-gray-600"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StatusFilter)}
            className="bg-terminal-card border border-terminal-border rounded px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent-teal"
          >
            <option value="all">All Status</option>
            <option value="executed">Executed</option>
            <option value="failed">Failed</option>
            <option value="risk_blocked">Risk Blocked</option>
            <option value="retrying">Retrying</option>
          </select>
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {(['5m', '15m', '1h', '6h', '24h'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setFilterTime(range)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  filterTime === range
                    ? 'bg-accent-teal/20 text-accent-teal border border-accent-teal/30'
                    : 'bg-terminal-card border border-terminal-border text-gray-400 hover:text-gray-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-4">
          {/* Live Trade Feed */}
          <div className="glass-card">
            <div className="px-4 py-3 border-b border-terminal-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-sm">Live Trade Feed</h2>
                <span className="text-[10px] text-gray-500 font-mono">{filteredTrades.length} trades</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
                <span className="text-[10px] text-gray-400">Streaming</span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-terminal-card z-10">
                  <tr className="border-b border-terminal-border">
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Time</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Client</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Symbol</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Direction</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-400">Volume</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Status</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-400">Latency</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-400">Slippage</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-400">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        Loading trades...
                      </td>
                    </tr>
                  ) : filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                        No trades match current filters
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((trade) => {
                      const isFailed = trade.status === 'failed';
                      const isBlocked = trade.status === 'risk_blocked';
                      const highlight = isFailed || isBlocked;
                      return (
                        <tr
                          key={trade.id}
                          className={`border-b border-terminal-border transition-colors ${
                            highlight
                              ? isFailed
                                ? 'bg-accent-red/5 hover:bg-accent-red/10'
                                : 'bg-accent-gold/5 hover:bg-accent-gold/10'
                              : 'hover:bg-terminal-hover'
                          }`}
                        >
                          <td className="px-3 py-2 font-mono text-gray-400 whitespace-nowrap">
                            {formatTime(trade.createdAt)}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="text-gray-300">{trade.client.clientRef}</span>
                            <span className="text-gray-600 ml-1">#{trade.client.mt5AccountNumber}</span>
                          </td>
                          <td className="px-3 py-2 font-semibold text-gray-200 whitespace-nowrap">
                            {trade.symbol}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              trade.type === 'buy'
                                ? 'bg-accent-green/10 text-accent-green'
                                : 'bg-accent-red/10 text-accent-red'
                            }`}>
                              {trade.type === 'buy'
                                ? <TrendingUp className="w-2.5 h-2.5" />
                                : <TrendingDown className="w-2.5 h-2.5" />
                              }
                              {trade.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right financial-number whitespace-nowrap">
                            {trade.volume.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${statusBadge(trade.status)}`}>
                              {trade.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${latencyColor(trade.executionLatencyMs)} ${latencyBg(trade.executionLatencyMs)}`}>
                              {formatMs(trade.executionLatencyMs)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right financial-number text-gray-400 whitespace-nowrap">
                            {trade.slippage !== null ? `${trade.slippage}` : '—'}
                          </td>
                          <td className="px-3 py-2 max-w-[200px] truncate">
                            {trade.error && (
                              <span className="text-accent-red text-[10px] truncate block" title={trade.error}>
                                {trade.error}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alerts Panel */}
          <div className="glass-card flex flex-col">
            <div className="px-4 py-3 border-b border-terminal-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-semibold text-sm">System Alerts</h2>
                {unresolvedAlerts.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-red/10 text-accent-red border border-accent-red/20">
                    {unresolvedAlerts.length}
                  </span>
                )}
              </div>
              <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="flex-1 overflow-y-auto max-h-[640px] p-3 space-y-2">
              {unresolvedAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CheckCircle className="w-6 h-6 mb-2 text-accent-green/50" />
                  <p className="text-xs">No active alerts</p>
                </div>
              ) : (
                unresolvedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded border-l-2 border border-terminal-border ${severityColor(alert.severity)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-medium uppercase tracking-wider ${severityBadge(alert.severity)}`}>
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        #{alert.client.mt5AccountNumber}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {formatTime(alert.createdAt)}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {alert.client.clientRef}
                      </span>
                    </div>
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
