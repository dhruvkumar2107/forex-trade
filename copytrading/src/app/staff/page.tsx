'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play, Pause, Settings, Unplug, Search, X, ChevronDown, ChevronUp,
  Activity, Users, TrendingUp, AlertTriangle, RefreshCw, Wifi, WifiOff,
  BarChart3, Shield, Clock, ArrowUpRight, ArrowDownRight, Filter,
} from 'lucide-react';

interface CopyClient {
  id: string;
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  fullName: string | null;
  copyMode: string;
  lotRatio: number;
  fixedLotSize: number | null;
  maxDrawdownPercent: number;
  maxDailyLossPercent: number;
  allowedSymbols: string[];
  status: string;
  connectionHealth: string;
  healthScore: number;
  lastTradeSyncAt: string | null;
  lastHealthCheckAt: string | null;
  equityAtStart: number | null;
  currentEquity: number | null;
  currentBalance: number | null;
  totalPnL: number;
  dailyPnL: number;
  currentDrawdownPercent: number;
  drawdownLevel: string;
  tradesCopied: number;
  tradesFailed: number;
  tradesRejected: number;
  latencyMs: number | null;
  createdAt: string;
}

interface SystemHealth {
  engineRunning: boolean;
  masterConnected: boolean;
  totalClients: number;
  activePositions: number;
  todayPnL: number;
  totalExposure: number;
  totalDrawdown: number;
  failedExecutions: number;
  reconciliationExceptions: number;
  connectionIssues: number;
  riskAlerts: number;
}

type SortField = keyof CopyClient;
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  disconnected: 'Disconnected',
};

const COPY_MODE_LABELS: Record<string, string> = {
  fixed_ratio: 'Fixed Ratio',
  equity_proportional: 'Equity Prop.',
  fixed_lot: 'Fixed Lot',
};

const SORT_ICONS: Record<string, string> = {};

export default function StaffDashboard() {
  const [clients, setClients] = useState<CopyClient[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectionFilter, setConnectionFilter] = useState('all');
  const [copyModeFilter, setCopyModeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('clientRef');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedClient, setSelectedClient] = useState<CopyClient | null>(null);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editCopyMode, setEditCopyMode] = useState('');
  const [editLotRatio, setEditLotRatio] = useState(0);
  const [editMaxDrawdown, setEditMaxDrawdown] = useState(0);
  const [engineLoading, setEngineLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (connectionFilter !== 'all') params.set('health', connectionFilter);
      if (copyModeFilter !== 'all') params.set('copyMode', copyModeFilter);

      const res = await fetch(`/api/clients/list?${params}`);
      const data = await res.json();
      if (data.success) setClients(data.data);
    } catch {
      /* silent */
    }
    setLoading(false);
  }, [search, statusFilter, connectionFilter, copyModeFilter]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health/system');
      const data = await res.json();
      if (data.success) setSystemHealth(data.data);
    } catch {
      /* silent */
    }
  }, []);

  const toggleEngine = useCallback(async () => {
    setEngineLoading(true);
    try {
      const res = await fetch('/api/engine/start', { method: 'POST' });
      const data = await res.json();
      setMessage(data.success ? (data.data?.running ? 'Engine started' : 'Engine stopped') : 'Engine toggle failed');
      fetchHealth();
    } catch {
      setMessage('Engine toggle failed');
    }
    setEngineLoading(false);
    setTimeout(() => setMessage(''), 3000);
  }, [fetchHealth]);

  useEffect(() => {
    fetchClients();
    fetchHealth();
    const interval = setInterval(() => {
      fetchClients();
      fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchClients, fetchHealth]);

  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find((c) => c.id === selectedClient.id);
      if (updated) setSelectedClient(updated);
    }
  }, [clients, selectedClient]);

  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const sortedClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal ?? '');
      const bStr = String(bVal ?? '');
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
    return sorted;
  }, [clients, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => ['copying', 'healthy', 'connected'].includes(c.status)).length,
    paused: clients.filter((c) => ['paused', 'risk_paused'].includes(c.status)).length,
    healthy: clients.filter((c) => c.connectionHealth === 'healthy').length,
    degraded: clients.filter((c) => c.connectionHealth === 'degraded').length,
    disconnected: clients.filter((c) => c.connectionHealth === 'disconnected').length,
    totalTrades: clients.reduce((sum, c) => sum + c.tradesCopied, 0),
    totalPnL: clients.reduce((sum, c) => sum + c.totalPnL, 0),
  }), [clients]);

  const selectClient = useCallback((client: CopyClient) => {
    setSelectedClient(client);
    setEditCopyMode(client.copyMode);
    setEditLotRatio(client.lotRatio);
    setEditMaxDrawdown(client.maxDrawdownPercent);
  }, []);

  const updateConfig = useCallback(async () => {
    if (!selectedClient) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copyMode: editCopyMode,
          lotRatio: editLotRatio,
          maxDrawdownPercent: editMaxDrawdown,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Configuration updated');
        fetchClients();
        setSelectedClient(null);
      } else {
        setMessage(data.error || 'Update failed');
      }
    } catch {
      setMessage('Update failed');
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  }, [selectedClient, editCopyMode, editLotRatio, editMaxDrawdown, fetchClients]);

  const togglePause = useCallback(async (client: CopyClient) => {
    setActionLoading(true);
    try {
        const newStatus = ['paused', 'risk_paused'].includes(client.status) ? 'copying' : 'paused';
        const res = await fetch(`/api/clients/${client.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        const result = await res.json();
        if (result.success) {
          setMessage(newStatus === 'paused' ? 'Client paused' : 'Client resumed');
        fetchClients();
      }
    } catch { /* silent */ }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  }, [fetchClients]);

  const disconnectClient = useCallback(async (client: CopyClient) => {
    if (!confirm(`Disconnect client ${client.clientRef}? This will close all open trades.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('Client disconnected');
        fetchClients();
        setSelectedClient(null);
      }
    } catch { /* silent */ }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  }, [fetchClients]);

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-accent-teal select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-terminal-bg">
      {message && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg text-sm font-medium ${
          message.toLowerCase().includes('fail') || message.toLowerCase().includes('error')
            ? 'bg-accent-red/15 text-accent-red border border-accent-red/30'
            : 'bg-accent-green/15 text-accent-green border border-accent-green/30'
        }`}>
          {message}
        </div>
      )}

      {/* Top Status Bar */}
      <div className="border-b border-terminal-border bg-terminal-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
                <span className="text-terminal-bg font-bold text-[10px]">CT</span>
              </div>
              <div>
                <h1 className="font-heading text-sm font-bold leading-tight">Ops Dashboard</h1>
                <p className="text-[10px] text-gray-500">Copy Trading Control Room</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs">
              {/* Engine Status */}
              <button
                onClick={toggleEngine}
                disabled={engineLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${
                  systemHealth?.engineRunning
                    ? 'border-accent-green/30 bg-accent-green/10 text-accent-green'
                    : 'border-accent-red/30 bg-accent-red/10 text-accent-red'
                }`}
              >
                {systemHealth?.engineRunning ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                {engineLoading ? '...' : systemHealth?.engineRunning ? 'Running' : 'Stopped'}
              </button>

              <div className="h-5 w-px bg-terminal-border mx-1" />

              {/* Master Connection */}
              <StatusIndicator
                icon={systemHealth?.masterConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                label="Master"
                value={systemHealth?.masterConnected ? 'Connected' : 'Disconnected'}
                healthy={!!systemHealth?.masterConnected}
              />

              <StatusIndicator
                icon={<Users className="w-3 h-3" />}
                label="Clients"
                value={String(stats.active)}
                healthy={stats.active > 0}
              />

              <StatusIndicator
                icon={<BarChart3 className="w-3 h-3" />}
                label="Positions"
                value={String(systemHealth?.activePositions ?? 0)}
                healthy
              />

              <div className="h-5 w-px bg-terminal-border mx-1" />

              {/* P&L */}
              <div className="flex items-center gap-1.5 px-2">
                <span className="text-gray-500">Today</span>
                <span className={`financial-number ${(systemHealth?.todayPnL ?? 0) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  {(systemHealth?.todayPnL ?? 0) >= 0 ? '+' : ''}${(systemHealth?.todayPnL ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="h-5 w-px bg-terminal-border mx-1" />

              <StatusIndicator
                label="Exposure"
                value={`$${(systemHealth?.totalExposure ?? 0).toLocaleString()}`}
                healthy
              />

              <StatusIndicator
                label="Drawdown"
                value={`${(systemHealth?.totalDrawdown ?? 0).toFixed(1)}%`}
                healthy={(systemHealth?.totalDrawdown ?? 0) < 10}
              />

              <div className="h-5 w-px bg-terminal-border mx-1" />

              <CountBadge label="Failed" count={systemHealth?.failedExecutions ?? 0} alert />
              <CountBadge label="Recon" count={systemHealth?.reconciliationExceptions ?? 0} alert />
              <CountBadge label="Conn" count={systemHealth?.connectionIssues ?? 0} alert />
              <CountBadge label="Risk" count={systemHealth?.riskAlerts ?? 0} alert />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="border-b border-terminal-border bg-terminal-card/30">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                className="input-field pl-9 py-2 text-sm"
                placeholder="Search by name, account, or broker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                showFilters ? 'border-accent-teal/50 bg-accent-teal/10 text-accent-teal' : 'border-terminal-border text-gray-400 hover:text-gray-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{sortedClients.length} clients</span>
              <button onClick={fetchClients} className="p-1.5 rounded-md hover:bg-terminal-card text-gray-400 hover:text-accent-teal transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-terminal-border">
              <select
                className="input-field py-1.5 text-xs max-w-[150px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>

              <select
                className="input-field py-1.5 text-xs max-w-[150px]"
                value={connectionFilter}
                onChange={(e) => setConnectionFilter(e.target.value)}
              >
                <option value="all">All Connection</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="disconnected">Disconnected</option>
              </select>

              <select
                className="input-field py-1.5 text-xs max-w-[150px]"
                value={copyModeFilter}
                onChange={(e) => setCopyModeFilter(e.target.value)}
              >
                <option value="all">All Copy Mode</option>
                <option value="fixed_ratio">Fixed Ratio</option>
                <option value="equity_proportional">Equity Proportional</option>
                <option value="fixed_lot">Fixed Lot</option>
              </select>

              <button
                onClick={() => { setStatusFilter('all'); setConnectionFilter('all'); setCopyModeFilter('all'); setSearch(''); }}
                className="text-xs text-gray-500 hover:text-accent-teal transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Client Grid */}
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {loading ? (
          <div className="glass-card p-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-accent-teal" />
            Loading client data...
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="glass-card p-16 text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-3 text-gray-600" />
            No clients match the current filters
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-terminal-border">
                    <SortHeader field="clientRef" label="Client" />
                    <SortHeader field="brokerServer" label="Broker / Server" />
                    <SortHeader field="status" label="Status" />
                    <SortHeader field="connectionHealth" label="Connection" />
                    <SortHeader field="currentEquity" label="Equity" className="text-right" />
                    <SortHeader field="totalPnL" label="P&L" className="text-right" />
                    <SortHeader field="maxDrawdownPercent" label="Drawdown" className="text-right" />
                    <SortHeader field="tradesCopied" label="Trades" className="text-right" />
                    <SortHeader field="copyMode" label="Mode" />
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border">
                  {sortedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-terminal-hover/50 cursor-pointer transition-colors"
                      onClick={() => selectClient(client)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{client.clientRef}</p>
                          <p className="text-xs text-gray-500 font-mono">{client.mt5AccountNumber}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{client.brokerServer}</td>
                      <td className="px-4 py-3">
                        <span className={`status-pill ${
                          ['copying', 'healthy', 'connected'].includes(client.status) ? 'status-healthy' :
                          ['paused', 'risk_paused'].includes(client.status) ? 'status-degraded' :
                          ['disconnected', 'error'].includes(client.status) ? 'status-rejected' :
                          'status-submitted'
                        }`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            client.connectionHealth === 'healthy' ? 'bg-accent-green' :
                            client.connectionHealth === 'degraded' ? 'bg-accent-gold' : 'bg-accent-red'
                          }`} />
                          <span className="text-xs text-gray-400 capitalize">{client.connectionHealth}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="financial-number text-sm text-gray-200">
                          ${(client.currentEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`financial-number text-sm ${(client.totalPnL) >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                          {client.totalPnL >= 0 ? '+' : ''}${client.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`financial-number text-sm ${(client.maxDrawdownPercent) > 5 ? 'text-accent-gold' : 'text-gray-300'}`}>
                          {client.maxDrawdownPercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="financial-number text-sm text-gray-300">{client.tradesCopied}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">{COPY_MODE_LABELS[client.copyMode] ?? client.copyMode}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); selectClient(client); }}
                            className="p-1.5 rounded-md text-gray-500 hover:text-accent-teal hover:bg-accent-teal/10 transition-colors"
                            title="Configure"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); togglePause(client); }}
                            className={`p-1.5 rounded-md transition-colors ${
                              ['paused', 'risk_paused'].includes(client.status)
                                ? 'text-gray-500 hover:text-accent-green hover:bg-accent-green/10'
                                : 'text-gray-500 hover:text-accent-gold hover:bg-accent-gold/10'
                            }`}
                            title={['paused', 'risk_paused'].includes(client.status) ? 'Resume' : 'Pause'}
                          >
                            {['paused', 'risk_paused'].includes(client.status) ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); disconnectClient(client); }}
                            className="p-1.5 rounded-md text-gray-500 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                            title="Disconnect"
                          >
                            <Unplug className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedClient(null)} />
          <div className="relative w-full max-w-xl bg-terminal-card border-l border-terminal-border overflow-y-auto animate-slide-up">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-terminal-card/95 backdrop-blur-sm border-b border-terminal-border px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  selectedClient.connectionHealth === 'healthy' ? 'bg-accent-green' :
                  selectedClient.connectionHealth === 'degraded' ? 'bg-accent-gold' : 'bg-accent-red'
                }`} />
                <div>
                  <h2 className="font-heading font-bold text-sm">{selectedClient.clientRef}</h2>
                  <p className="text-xs text-gray-500 font-mono">MT5: {selectedClient.mt5AccountNumber}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClient(null)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-terminal-hover transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Info */}
              <Section title="Account Information" icon={<Shield className="w-3.5 h-3.5" />}>
                <InfoRow label="Client Ref" value={selectedClient.clientRef} />
                <InfoRow label="MT5 Account" value={selectedClient.mt5AccountNumber} mono />
                <InfoRow label="Broker / Server" value={selectedClient.brokerServer} />
                <InfoRow label="Connection" value={selectedClient.connectionHealth} capitalize />
                <InfoRow label="Last Sync" value={selectedClient.lastTradeSyncAt ? new Date(selectedClient.lastTradeSyncAt).toLocaleTimeString() : 'Never'} />
                <InfoRow label="Created" value={new Date(selectedClient.createdAt).toLocaleDateString()} />
              </Section>

              {/* Financial Summary */}
              <Section title="Financial Summary" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                <div className="grid grid-cols-2 gap-4">
                  <StatBlock
                    label="Equity"
                    value={`$${(selectedClient.currentEquity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    sub={`Start: $${(selectedClient.equityAtStart ?? 0).toLocaleString()}`}
                  />
                  <StatBlock
                    label="P&L"
                    value={`${selectedClient.totalPnL >= 0 ? '+' : ''}$${selectedClient.totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    valueClass={selectedClient.totalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}
                  />
                  <StatBlock
                    label="Drawdown Limit"
                    value={`${selectedClient.maxDrawdownPercent}%`}
                    valueClass={selectedClient.maxDrawdownPercent > 5 ? 'text-accent-gold' : 'text-gray-200'}
                  />
                  <StatBlock
                    label="Trades Copied"
                    value={String(selectedClient.tradesCopied)}
                  />
                </div>
              </Section>

              {/* Copy Configuration */}
              <Section title="Copy Configuration" icon={<Settings className="w-3.5 h-3.5" />}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Copy Mode</label>
                    <select
                      className="input-field text-sm py-2"
                      value={editCopyMode}
                      onChange={(e) => setEditCopyMode(e.target.value)}
                    >
                      <option value="fixed_ratio">Fixed Ratio</option>
                      <option value="equity_proportional">Equity Proportional</option>
                      <option value="fixed_lot">Fixed Lot</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Lot Ratio / Size</label>
                      <input
                        type="number"
                        className="input-field-mono text-sm py-2"
                        value={editLotRatio}
                        onChange={(e) => setEditLotRatio(Number(e.target.value))}
                        step="0.1"
                        min="0.01"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Max Drawdown %</label>
                      <input
                        type="number"
                        className="input-field-mono text-sm py-2"
                        value={editMaxDrawdown}
                        onChange={(e) => setEditMaxDrawdown(Number(e.target.value))}
                        step="1"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Symbol Whitelist */}
              {selectedClient.allowedSymbols.length > 0 && (
                <Section title="Symbol Whitelist" icon={<BarChart3 className="w-3.5 h-3.5" />}>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedClient.allowedSymbols.map((s) => (
                      <span key={s} className="text-xs bg-accent-teal/10 text-accent-teal px-2 py-1 rounded-md border border-accent-teal/20 font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button onClick={updateConfig} disabled={actionLoading} className="btn-primary w-full text-sm py-2.5">
                  {actionLoading ? 'Saving...' : 'Save Configuration'}
                </button>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => togglePause(selectedClient)}
                    className={`text-sm py-2.5 rounded-lg border transition-colors ${
                      ['paused', 'risk_paused'].includes(selectedClient.status)
                        ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                        : 'border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10'
                    }`}
                  >
                    {['paused', 'risk_paused'].includes(selectedClient.status) ? 'Resume Copying' : 'Pause Copying'}
                  </button>
                  <button onClick={() => disconnectClient(selectedClient)} className="btn-danger text-sm py-2.5">
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ icon, label, value, healthy }: { icon?: React.ReactNode; label: string; value: string; healthy: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2">
      {icon && <span className={healthy ? 'text-accent-green' : 'text-accent-red'}>{icon}</span>}
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${healthy ? 'text-gray-200' : 'text-accent-red'}`}>{value}</span>
    </div>
  );
}

function CountBadge({ label, count, alert }: { label: string; count: number; alert?: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
      alert && count > 0 ? 'bg-accent-red/10' : ''
    }`}>
      <span className="text-gray-500">{label}</span>
      <span className={`financial-number font-medium ${alert && count > 0 ? 'text-accent-red' : 'text-gray-300'}`}>
        {count}
      </span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-accent-teal">{icon}</span>}
        <h3 className="font-heading text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
      </div>
      <div className="glass-card p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, capitalize }: { label: string; value: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-200 ${mono ? 'font-mono text-xs' : ''} ${capitalize ? 'capitalize' : ''}`}>{value}</span>
    </div>
  );
}

function StatBlock({ label, value, sub, valueClass }: { label: string; value: string; sub?: string; valueClass?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`financial-number text-sm font-medium ${valueClass ?? 'text-gray-200'}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}
