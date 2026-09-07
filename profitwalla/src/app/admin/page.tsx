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

const STATUS_COLORS: Record<string, string> = {
  submitted: 'status-submitted',
  reviewing: 'status-reviewing',
  approved: 'status-approved',
  connected: 'status-connected',
  rejected: 'status-rejected',
};

export default function AdminPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [newNote, setNewNote] = useState('');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await fetch(`/api/clients/list?${params}`);
    const data = await res.json();
    if (data.success) {
      setClients(data.data.clients);
    }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const updateStatus = async (clientId: string, status: string) => {
    setActionLoading(true);
    const res = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setMessage(`Client ${status}`);
      fetchClients();
      setSelectedClient(null);
    } else {
      setMessage(data.error);
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
    const data = await res.json();
    if (data.success) {
      setMessage('Client pushed to copy trading successfully!');
      fetchClients();
      setSelectedClient(null);
    } else {
      setMessage(data.error);
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
    const data = await res.json();
    if (data.success) {
      setMessage('Note added successfully');
      setNewNote('');
      fetchClients();
    } else {
      setMessage(data.error);
    }
    setActionLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const revealCredentials = async () => {
    if (!selectedClient) return;
    setActionLoading(true);
    const res = await fetch('/api/clients/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClient.id, adminPassword: revealPassword }),
    });
    const data = await res.json();
    if (data.success) {
      setRevealedPassword(data.data.investorPassword);
      setShowRevealModal(false);
      setRevealPassword('');
    } else {
      setMessage(data.error);
    }
    setActionLoading(false);
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
            <p className="text-sm font-medium">{clients.length} Clients</p>
            <p className="text-gray-500 text-xs">
              {clients.filter((c) => c.status === 'submitted').length} pending review
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('success') ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
          }`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            className="input-field max-w-xs"
            placeholder="Search name, mobile, MT5..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input-field max-w-[200px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="connected">Connected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-terminal-border">
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
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-terminal-border hover:bg-terminal-hover cursor-pointer transition-colors"
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{client.fullName}</p>
                        <p className="text-gray-500 text-xs">{client.mobile}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{client.mt5AccountNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{client.brokerServer}</td>
                      <td className="px-4 py-3 text-right financial-number text-sm">
                        ${client.startingEquity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={STATUS_COLORS[client.status]}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
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
                            Push to Copy Trading
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
      </div>

      {/* Client Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setSelectedClient(null); setRevealedPassword(''); }} />
          <div className="relative w-full max-w-md bg-terminal-card border-l border-terminal-border overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-terminal-card border-b border-terminal-border px-6 py-4 flex items-center justify-between">
              <h2 className="font-heading font-bold">Client Details</h2>
              <button
                onClick={() => { setSelectedClient(null); setRevealedPassword(''); }}
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

              {/* Credential Reveal */}
              <div className="glass-card p-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Investor Password</span>
                  <span className="flex items-center gap-1 text-xs text-accent-teal">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Encrypted
                  </span>
                </div>
                {revealedPassword ? (
                  <div className="bg-terminal-bg rounded-lg p-3 font-mono text-sm text-accent-gold break-all">
                    {revealedPassword}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRevealModal(true)}
                    className="btn-secondary w-full text-sm py-2"
                  >
                    Reveal Password (Re-auth Required)
                  </button>
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
                {selectedClient.pushedToCopyTrading && (
                  <div className="bg-accent-green/10 border border-accent-green/20 rounded-lg p-3 text-center text-accent-green text-sm">
                    ✓ Connected to Copy Trading
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Modal */}
      {showRevealModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowRevealModal(false)} />
          <div className="relative glass-card p-6 max-w-sm w-full mx-4">
            <h3 className="font-heading font-bold mb-2">Re-authenticate</h3>
            <p className="text-gray-400 text-sm mb-4">
              Enter your admin password to reveal the investor password. This action will be logged.
            </p>
            <input
              type="password"
              className="input-field mb-4"
              placeholder="Admin password"
              value={revealPassword}
              onChange={(e) => setRevealPassword(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRevealModal(false)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={revealCredentials}
                disabled={!revealPassword || actionLoading}
                className="btn-primary flex-1 text-sm disabled:opacity-50"
              >
                {actionLoading ? 'Revealing...' : 'Reveal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
