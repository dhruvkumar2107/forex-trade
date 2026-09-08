'use client';

import { useState, useEffect, useCallback } from 'react';

interface Client {
  id: string;
  fullName: string;
  mobile: string;
  occupation: string;
  mt5AccountNumber: string;
  brokerServer: string;
  startingEquity: number;
  city: string;
  state: string;
  status: string;
  pushedToCopyTrading: boolean;
  adminNotes: string | null;
  createdAt: string;
}

interface PaginatedData {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'status-submitted',
  reviewing: 'status-reviewing',
  approved: 'status-approved',
  pushed: 'status-connected',
  connected: 'status-connected',
  rejected: 'status-rejected',
};

const STATUS_OPTIONS = ['submitted', 'reviewing', 'approved', 'rejected'] as const;

export default function AdminPanel() {
  const [data, setData] = useState<PaginatedData>({ clients: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetails, setClientDetails] = useState<{ tradingPassword: string } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', '20');

    const res = await fetch(`/api/clients/list?${params}`);
    const result = await res.json();
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [statusFilter, search]);

  const fetchClientDetails = async (clientId: string) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) {
        setClientDetails({ tradingPassword: `(HTTP ${res.status})` });
        setDetailsLoading(false);
        return;
      }
      const result = await res.json();
      if (result.success && result.data) {
        setClientDetails({ tradingPassword: result.data.tradingPassword || '(empty)' });
      } else {
        setClientDetails({ tradingPassword: result.error || '(unknown error)' });
      }
    } catch (e) {
      setClientDetails({ tradingPassword: `(fetch error: ${(e as Error).message})` });
    }
    setDetailsLoading(false);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setClientDetails(null);
    fetchClientDetails(client.id);
  };

  const updateStatus = async (clientId: string, status: string) => {
    setActionLoading(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (result.success) {
      setMessage(`Client ${status}`);
      fetchClients();
      setSelectedClient(null);
    } else {
      setMessage(result.error);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const pushToCopyTrading = async (clientId: string) => {
    setActionLoading(true);
    const res = await fetch('/api/clients/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    const result = await res.json();
    if (result.success) {
      setMessage('Client pushed to copy trading successfully!');
      fetchClients();
      setSelectedClient(null);
    } else {
      setMessage(result.error);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const addNote = async (clientId: string) => {
    if (!newNote.trim()) return;
    setActionLoading(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNotes: newNote }),
    });
    const result = await res.json();
    if (result.success) {
      setMessage('Note added successfully');
      setNewNote('');
      fetchClients();
    } else {
      setMessage(result.error);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.clients.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selectedIds);
    const res = await fetch('/api/clients/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status }),
    });
    const result = await res.json();
    if (result.success) {
      setMessage(`${result.data.updated} clients ${status}`);
    } else {
      setMessage(result.error);
    }
    setSelectedIds(new Set());
    fetchClients();
    setBulkLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Mobile', 'MT5 Account', 'Broker', 'Equity', 'City', 'State', 'Status', 'Pushed', 'Date'];
    const rows = data.clients.map((c) => [
      c.fullName,
      c.mobile,
      c.mt5AccountNumber,
      c.brokerServer,
      String(c.startingEquity),
      c.city,
      c.state,
      c.status,
      String(c.pushedToCopyTrading),
      new Date(c.createdAt).toLocaleDateString('en-IN'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profitwalla-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Header */}
      <div className="border-b border-terminal-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-gold flex items-center justify-center">
              <span className="text-terminal-bg font-bold text-sm">P</span>
            </div>
            <div>
              <h1 className="font-heading text-lg font-bold">Profitwalla Admin</h1>
              <p className="text-gray-500 text-xs">Client Management</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{data.total} Clients</p>
            <p className="text-gray-500 text-xs">
              {data.clients.filter((c) => c.status === 'submitted').length} pending review
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('success') || message.includes('/')
              ? 'bg-accent-green/10 text-accent-green border border-accent-green/20'
              : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
          }`}>
            {message}
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total', value: data.total, color: 'text-white' },
            { label: 'Submitted', value: data.clients.filter((c) => c.status === 'submitted').length, color: 'text-accent-blue' },
            { label: 'Reviewing', value: data.clients.filter((c) => c.status === 'reviewing').length, color: 'text-accent-gold' },
            { label: 'Approved', value: data.clients.filter((c) => c.status === 'approved').length, color: 'text-accent-green' },
            { label: 'Rejected', value: data.clients.filter((c) => c.status === 'rejected').length, color: 'text-accent-red' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-3">
              <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className={`financial-number text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters & Actions Bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            className="input-field max-w-xs"
            placeholder="Search name, mobile, MT5..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input-field max-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="pushed">Pushed</option>
            <option value="connected">Connected</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={exportCSV} className="btn-secondary text-sm px-4 py-2">
            Export CSV
          </button>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex gap-2 items-center ml-auto">
              <span className="text-xs text-gray-400">{selectedIds.size} selected</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => bulkUpdateStatus(s)}
                  disabled={bulkLoading}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    s === 'approved'
                      ? 'border-accent-green/30 text-accent-green hover:bg-accent-green/10'
                      : s === 'rejected'
                      ? 'border-accent-red/30 text-accent-red hover:bg-accent-red/10'
                      : 'border-terminal-border text-gray-400 hover:bg-terminal-hover'
                  }`}
                >
                  {bulkLoading ? '...' : `Bulk ${s}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-terminal-border bg-terminal-bg text-accent-teal focus:ring-accent-teal/50"
                      checked={selectedIds.size === data.clients.length && data.clients.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">MT5 Account</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Broker</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Equity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : data.clients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  data.clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-terminal-border hover:bg-terminal-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-terminal-border bg-terminal-bg text-accent-teal focus:ring-accent-teal/50"
                          checked={selectedIds.has(client.id)}
                          onChange={() => toggleSelect(client.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        <p className="font-medium text-sm">{client.fullName}</p>
                        <p className="text-gray-500 text-xs">{client.mobile}</p>
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-sm cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        {client.mt5AccountNumber}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-gray-400 cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        {client.brokerServer}
                      </td>
                      <td
                        className="px-4 py-3 text-right financial-number text-sm cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        ${client.startingEquity.toLocaleString()}
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        <span className={STATUS_COLORS[client.status]}>
                          {client.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-gray-400 cursor-pointer"
                        onClick={() => selectClient(client)}
                      >
                        {new Date(client.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {client.status === 'approved' && !client.pushedToCopyTrading && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              pushToCopyTrading(client.id);
                            }}
                            className="text-xs bg-accent-teal/10 text-accent-teal px-3 py-1 rounded-full hover:bg-accent-teal/20 transition-colors"
                          >
                            Push to CT
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-gray-500">
              Showing {((data.page - 1) * 20) + 1}-{Math.min(data.page * 20, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(data.page - 2, data.totalPages - 4));
                const pageNum = start + i;
                if (pageNum > data.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      pageNum === data.page
                        ? 'bg-accent-teal text-terminal-bg border-accent-teal font-bold'
                        : 'border-terminal-border text-gray-400 hover:bg-terminal-hover'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedClient(null); setClientDetails(null); }} />
          <div className="relative w-full max-w-md bg-terminal-card border-l border-terminal-border overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-terminal-card border-b border-terminal-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-heading font-bold">Client Details</h2>
              <button
                onClick={() => { setSelectedClient(null); setClientDetails(null); }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center">
                  <span className="text-accent-teal font-bold text-lg">
                    {selectedClient.fullName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-bold">{selectedClient.fullName}</h3>
                  <p className="text-gray-400 text-sm">{selectedClient.mobile}</p>
                </div>
              </div>

              {[
                { label: 'Occupation', value: selectedClient.occupation },
                { label: 'MT5 Account', value: selectedClient.mt5AccountNumber, mono: true },
                { label: 'Broker Server', value: selectedClient.brokerServer },
                { label: 'Starting Equity', value: `$${selectedClient.startingEquity.toLocaleString()}`, mono: true },
                { label: 'City / State', value: `${selectedClient.city}, ${selectedClient.state}` },
                { label: 'Status', value: selectedClient.status, pill: true },
                { label: 'Applied', value: new Date(selectedClient.createdAt).toLocaleString('en-IN') },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-terminal-border">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className={`text-sm ${item.mono ? 'font-mono' : ''} ${item.pill ? STATUS_COLORS[item.value] : ''}`}>
                    {item.pill ? item.value : item.value}
                  </span>
                </div>
              ))}

              {/* Trading Password */}
              <div className="glass-card p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Trading Password</span>
                  <span className="flex items-center gap-1 text-xs text-accent-teal">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Decrypted
                  </span>
                </div>
                {detailsLoading ? (
                  <div className="bg-terminal-bg rounded-lg p-3 text-sm text-gray-500 animate-pulse">
                    Loading...
                  </div>
                ) : (
                  <div className="bg-terminal-bg rounded-lg p-3 font-mono text-sm text-accent-gold break-all">
                    {clientDetails?.tradingPassword || '(unavailable)'}
                  </div>
                )}
              </div>

              {/* Admin Note */}
              <div className="glass-card p-4 mt-4">
                <span className="text-sm text-gray-400 block mb-2">Admin Note</span>
                {selectedClient.adminNotes ? (
                  <p className="text-sm text-gray-300 mb-2">{selectedClient.adminNotes}</p>
                ) : (
                  <p className="text-xs text-gray-500 mb-2">No notes yet</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-field text-sm flex-1"
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <button
                    onClick={() => addNote(selectedClient.id)}
                    disabled={!newNote.trim() || actionLoading}
                    className="btn-secondary text-sm px-4 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 mt-6">
                {selectedClient.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'reviewing')}
                      disabled={actionLoading}
                      className="btn-secondary w-full text-sm"
                    >
                      Mark as Reviewing
                    </button>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'approved')}
                      disabled={actionLoading}
                      className="btn-primary w-full text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'rejected')}
                      disabled={actionLoading}
                      className="btn-danger w-full text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedClient.status === 'reviewing' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'approved')}
                      disabled={actionLoading}
                      className="btn-primary w-full text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'rejected')}
                      disabled={actionLoading}
                      className="btn-danger w-full text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedClient.status === 'approved' && !selectedClient.pushedToCopyTrading && (
                  <button
                    onClick={() => pushToCopyTrading(selectedClient.id)}
                    disabled={actionLoading}
                    className="btn-primary w-full text-sm"
                  >
                    {actionLoading ? 'Pushing...' : 'Push to Copy Trading System'}
                  </button>
                )}
                {selectedClient.pushedToCopyTrading && selectedClient.status === 'pushed' && (
                  <div className="space-y-3">
                    <div className="bg-accent-gold/10 border border-accent-gold/20 rounded-lg p-3 text-center text-accent-gold text-sm">
                      Pushed to Copy Trading — awaiting live connection
                    </div>
                    <button
                      onClick={() => updateStatus(selectedClient.id, 'connected')}
                      disabled={actionLoading}
                      className="btn-primary w-full text-sm"
                    >
                      {actionLoading ? 'Updating...' : 'Mark as Connected'}
                    </button>
                  </div>
                )}
                {selectedClient.status === 'connected' && (
                  <div className="bg-accent-green/10 border border-accent-green/20 rounded-lg p-3 text-center text-accent-green text-sm">
                    Connected — Trades Mirroring Live
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
