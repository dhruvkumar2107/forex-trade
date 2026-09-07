'use client';

import { useState, useEffect } from 'react';

interface CopyClient {
  id: string;
  clientRef: string;
  mt5AccountNumber: string;
  brokerServer: string;
  copyMode: string;
  lotRatio: number;
  maxDrawdownPercent: number;
  symbolWhitelist: string[];
  isActive: boolean;
  isPaused: boolean;
  connectionHealth: string;
  lastTradeSyncAt: string | null;
  equityAtStart: number | null;
  currentEquity: number | null;
  totalPnL: number;
  tradesCopied: number;
  createdAt: string;
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'status-healthy',
  degraded: 'status-degraded',
  disconnected: 'status-disconnected',
  error: 'status-disconnected',
};

export default function StaffDashboard() {
  const [clients, setClients] = useState<CopyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<CopyClient | null>(null);
  const [message, setMessage] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Config edit state
  const [editCopyMode, setEditCopyMode] = useState('');
  const [editLotRatio, setEditLotRatio] = useState(0);
  const [editMaxDrawdown, setEditMaxDrawdown] = useState(0);

  const fetchClients = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (healthFilter !== 'all') params.set('health', healthFilter);

    const res = await fetch(`/api/clients/list?${params}`);
    const data = await res.json();
    if (data.success) {
      setClients(data.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, [search, healthFilter]);

  const selectClient = (client: CopyClient) => {
    setSelectedClient(client);
    setEditCopyMode(client.copyMode);
    setEditLotRatio(client.lotRatio);
    setEditMaxDrawdown(client.maxDrawdownPercent);
  };

  const updateConfig = async () => {
    if (!selectedClient) return;
    setActionLoading(true);

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
      setMessage(data.error);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const togglePause = async (client: CopyClient) => {
    setActionLoading(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaused: !client.isPaused }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(client.isPaused ? 'Client resumed' : 'Client paused');
      fetchClients();
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const disconnectClient = async (client: CopyClient) => {
    if (!confirm(`Disconnect client ${client.clientRef}? This will close all open trades.`)) return;
    setActionLoading(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setMessage('Client disconnected');
      fetchClients();
      setSelectedClient(null);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const stats = {
    total: clients.length,
    healthy: clients.filter((c) => c.connectionHealth === 'healthy').length,
    paused: clients.filter((c) => c.isPaused).length,
    totalTrades: clients.reduce((sum, c) => sum + c.tradesCopied, 0),
  };

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="border-b border-terminal-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">CT</span>
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold">Copy Trading Dashboard</h1>
              <p className="text-gray-500 text-xs">Trade Mirroring Management</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-gray-400">Active: </span>
              <span className="financial-number text-accent-green">{stats.healthy}</span>
            </div>
            <div>
              <span className="text-gray-400">Paused: </span>
              <span className="financial-number text-accent-gold">{stats.paused}</span>
            </div>
            <div>
              <span className="text-gray-400">Total Trades: </span>
              <span className="financial-number text-accent-teal">{stats.totalTrades}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('error') ? 'bg-accent-red/10 text-accent-red border border-accent-red/20' : 'bg-accent-green/10 text-accent-green border border-accent-green/20'
          }`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            className="input-field max-w-xs"
            placeholder="Search by ref or MT5 account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input-field max-w-[200px]"
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value)}
          >
            <option value="all">All Health</option>
            <option value="healthy">Healthy</option>
            <option value="degraded">Degraded</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>

        {/* Client Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-3 glass-card p-12 text-center text-gray-500">Loading...</div>
          ) : clients.length === 0 ? (
            <div className="col-span-3 glass-card p-12 text-center text-gray-500">No clients found</div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                className="glass-card-hover p-5 cursor-pointer"
                onClick={() => selectClient(client)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      client.connectionHealth === 'healthy' ? 'bg-accent-green' :
                      client.connectionHealth === 'degraded' ? 'bg-accent-gold' :
                      'bg-accent-red'
                    }`} />
                    <span className="font-mono text-xs text-gray-400">#{client.clientRef.slice(0, 8)}</span>
                  </div>
                  <span className={HEALTH_COLORS[client.connectionHealth]}>
                    {client.connectionHealth}
                  </span>
                </div>

                <p className="font-mono text-sm mb-1">MT5: {client.mt5AccountNumber}</p>
                <p className="text-xs text-gray-400 mb-3">{client.brokerServer}</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Equity</p>
                    <p className="financial-number text-sm">
                      ${(client.currentEquity || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">P/L</p>
                    <p className={`financial-number text-sm ${client.totalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {client.totalPnL >= 0 ? '+' : ''}${client.totalPnL.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Trades</p>
                    <p className="financial-number text-sm">{client.tradesCopied}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Drawdown Limit</p>
                    <p className="financial-number text-sm">{client.maxDrawdownPercent}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-terminal-border">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    client.isPaused ? 'bg-accent-gold/10 text-accent-gold' : 'bg-accent-teal/10 text-accent-teal'
                  }`}>
                    {client.isPaused ? 'Paused' : 'Active'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePause(client);
                    }}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      client.isPaused
                        ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                        : 'border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10'
                    }`}
                  >
                    {client.isPaused ? 'Resume' : 'Pause'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Client Detail Panel */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedClient(null)} />
          <div className="relative w-full max-w-lg bg-terminal-card border-l border-terminal-border overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-terminal-card border-b border-terminal-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-heading font-bold">Client Configuration</h2>
              <button onClick={() => setSelectedClient(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div className="glass-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`w-3 h-3 rounded-full ${
                    selectedClient.connectionHealth === 'healthy' ? 'bg-accent-green' : 'bg-accent-red'
                  }`} />
                  <span className="font-mono text-sm">MT5: {selectedClient.mt5AccountNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Equity</p>
                    <p className="financial-number">${(selectedClient.currentEquity || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">P/L</p>
                    <p className={`financial-number ${selectedClient.totalPnL >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                      {selectedClient.totalPnL >= 0 ? '+' : ''}${selectedClient.totalPnL.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Config */}
              <div>
                <h3 className="font-heading text-sm font-semibold mb-3">Copy Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Copy Mode</label>
                    <select
                      className="input-field text-sm"
                      value={editCopyMode}
                      onChange={(e) => setEditCopyMode(e.target.value)}
                    >
                      <option value="fixed_ratio">Fixed Ratio</option>
                      <option value="equity_proportional">Equity Proportional</option>
                      <option value="fixed_lot">Fixed Lot</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Lot Ratio / Fixed Lot Size</label>
                    <input
                      type="number"
                      className="input-field-mono text-sm"
                      value={editLotRatio}
                      onChange={(e) => setEditLotRatio(Number(e.target.value))}
                      step="0.1"
                      min="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Drawdown %</label>
                    <input
                      type="number"
                      className="input-field-mono text-sm"
                      value={editMaxDrawdown}
                      onChange={(e) => setEditMaxDrawdown(Number(e.target.value))}
                      step="1"
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
              </div>

              {/* Symbol Whitelist */}
              <div>
                <h3 className="font-heading text-sm font-semibold mb-2">Symbol Whitelist</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.symbolWhitelist.map((s) => (
                    <span key={s} className="text-xs bg-accent-teal/10 text-accent-teal px-2 py-1 rounded-full border border-accent-teal/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={updateConfig}
                  disabled={actionLoading}
                  className="btn-primary w-full text-sm"
                >
                  {actionLoading ? 'Saving...' : 'Save Configuration'}
                </button>
                <button
                  onClick={() => togglePause(selectedClient)}
                  className={`w-full text-sm py-3 rounded-lg border transition-colors ${
                    selectedClient.isPaused
                      ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                      : 'border-accent-gold/30 text-accent-gold hover:bg-accent-gold/10'
                  }`}
                >
                  {selectedClient.isPaused ? 'Resume Copying' : 'Pause Copying'}
                </button>
                <button
                  onClick={() => disconnectClient(selectedClient)}
                  className="btn-danger w-full text-sm"
                >
                  Disconnect Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
