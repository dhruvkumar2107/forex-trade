'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  Search,
  Download,
  X,
  Eye,
  EyeOff,
  Shield,
  FileText,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  MapPin,
  Briefcase,
  Building2,
  DollarSign,
  Phone,
  User,
  Lock,
  Undo2,
  Ban,
  CheckCheck,
} from 'lucide-react';

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

interface ClientDetail extends Client {
  tradingPassword: string;
}

interface PaginatedData {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}

interface Stats {
  total: number;
  submitted: number;
  reviewing: number;
  approved: number;
  pushed: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  submitted: { label: 'Submitted', color: 'bg-accent-blue/10 text-accent-blue border-accent-blue/20', dot: 'bg-accent-blue' },
  reviewing: { label: 'Reviewing', color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20', dot: 'bg-accent-gold' },
  approved: { label: 'Approved', color: 'bg-accent-green/10 text-accent-green border-accent-green/20', dot: 'bg-accent-green' },
  pushed: { label: 'Pushed to CT', color: 'bg-accent-purple/10 text-accent-purple border-accent-purple/20', dot: 'bg-accent-purple' },
  connected: { label: 'Connected', color: 'bg-accent-teal/10 text-accent-teal border-accent-teal/20', dot: 'bg-accent-teal' },
  rejected: { label: 'Rejected', color: 'bg-accent-red/10 text-accent-red border-accent-red/20', dot: 'bg-accent-red' },
};

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'approved', label: 'Approved' },
  { value: 'pushed', label: 'Pushed' },
  { value: 'rejected', label: 'Rejected' },
];

function StatusPill({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export default function AdminPanel() {
  const [data, setData] = useState<PaginatedData>({ clients: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetail, setClientDetail] = useState<ClientDetail | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newNote, setNewNote] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // Reveal password state
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealPassword, setRevealPassword] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState('');

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchClients = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', String(page));
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/clients/list?${params}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        showToast('error', result.error || 'Failed to load clients');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    }

    setLoading(false);
    setRefreshing(false);
  }, [statusFilter, debouncedSearch, page, showToast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const fetchClientDetails = useCallback(async (clientId: string) => {
    setDetailsLoading(true);
    setPasswordRevealed(false);
    setRevealPassword('');
    setRevealError('');
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) {
        showToast('error', `Failed to load details (HTTP ${res.status})`);
        setDetailsLoading(false);
        return;
      }
      const result = await res.json();
      if (result.success && result.data) {
        setClientDetail(result.data);
      } else {
        showToast('error', result.error || 'Failed to load client details');
      }
    } catch {
      showToast('error', 'Failed to load client details');
    }
    setDetailsLoading(false);
  }, [showToast]);

  const selectClient = useCallback((client: Client) => {
    setSelectedClient(client);
    setNewNote('');
    setClientDetail(null);
    fetchClientDetails(client.id);
  }, [fetchClientDetails]);

  const closeDrawer = useCallback(() => {
    setSelectedClient(null);
    setClientDetail(null);
    setPasswordRevealed(false);
  }, []);

  const updateStatus = useCallback(async (clientId: string, newStatus: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', `Client status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
        closeDrawer();
        fetchClients(true);
      } else {
        showToast('error', result.error || 'Failed to update status');
      }
    } catch {
      showToast('error', 'Failed to update status');
    }
    setActionLoading(false);
  }, [showToast, closeDrawer, fetchClients]);

  const pushToCopyTrading = useCallback(async (clientId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/clients/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'Client pushed to copy trading system successfully');
        closeDrawer();
        fetchClients(true);
      } else {
        showToast('error', result.error || 'Failed to push to copy trading');
      }
    } catch {
      showToast('error', 'Failed to push to copy trading');
    }
    setActionLoading(false);
  }, [showToast, closeDrawer, fetchClients]);

  const saveNote = useCallback(async (clientId: string) => {
    if (!newNote.trim()) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: newNote }),
      });
      const result = await res.json();
      if (result.success) {
        showToast('success', 'Note saved successfully');
        setNewNote('');
        fetchClients(true);
        if (selectedClient) {
          setClientDetail((prev) => prev ? { ...prev, adminNotes: newNote } : prev);
        }
      } else {
        showToast('error', result.error || 'Failed to save note');
      }
    } catch {
      showToast('error', 'Failed to save note');
    }
    setNoteSaving(false);
  }, [newNote, showToast, fetchClients, selectedClient]);

  const handleRevealPassword = useCallback(async (clientId: string) => {
    if (!revealPassword.trim()) {
      setRevealError('Password is required');
      return;
    }
    setRevealLoading(true);
    setRevealError('');
    try {
      const res = await fetch('/api/clients/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, adminPassword: revealPassword }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setPasswordRevealed(true);
        setShowRevealModal(false);
        setRevealPassword('');
        // Update the detail to include the revealed password
        setClientDetail((prev) => prev ? { ...prev, tradingPassword: result.data.investorPassword } : prev);
        showToast('success', 'Credential access granted');
      } else {
        setRevealError(result.error || 'Invalid credentials');
      }
    } catch {
      setRevealError('Network error. Please try again.');
    }
    setRevealLoading(false);
  }, [revealPassword, showToast]);

  const exportCSV = useCallback(() => {
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
    showToast('success', 'CSV exported successfully');
  }, [data.clients, showToast]);

  const stats: Stats = {
    total: data.total,
    submitted: data.clients.filter((c) => c.status === 'submitted').length,
    reviewing: data.clients.filter((c) => c.status === 'reviewing').length,
    approved: data.clients.filter((c) => c.status === 'approved').length,
    pushed: data.clients.filter((c) => c.status === 'pushed').length,
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-4 left-1/2 z-[100] pointer-events-auto"
          >
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg border ${
              toast.type === 'success'
                ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                : 'bg-accent-red/10 text-accent-red border-accent-red/20'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-white/5 bg-surface/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="section-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-teal to-accent-blue flex items-center justify-center">
              <span className="text-surface font-bold text-sm font-heading">P</span>
            </div>
            <div>
              <h1 className="font-heading text-base font-bold text-white leading-tight">Profitwalla Admin</h1>
              <p className="text-xs text-gray-500">Operations Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => fetchClients(true)}
            disabled={refreshing}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="section-container py-6 space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Clients',
              value: stats.total,
              icon: Users,
              color: 'text-white',
              bgColor: 'bg-surface-200/50',
              iconColor: 'text-gray-400',
            },
            {
              label: 'Pending Review',
              value: stats.submitted,
              icon: Clock,
              color: 'text-accent-gold',
              bgColor: 'bg-accent-gold/5',
              iconColor: 'text-accent-gold',
              badge: 'badge-gold',
            },
            {
              label: 'Approved',
              value: stats.approved,
              icon: CheckCircle2,
              color: 'text-accent-green',
              bgColor: 'bg-accent-green/5',
              iconColor: 'text-accent-green',
              badge: 'badge-green',
            },
            {
              label: 'Pushed to CT',
              value: stats.pushed,
              icon: Send,
              color: 'text-accent-blue',
              bgColor: 'bg-accent-blue/5',
              iconColor: 'text-accent-blue',
              badge: 'badge-blue',
            },
          ].map((stat) => (
            <div key={stat.label} className={`card p-4 flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <p className={`financial-number text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  {stat.badge && (
                    <span className={stat.badge}>{stat.value}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Search by name, mobile, or MT5 account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select max-w-[180px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <button onClick={exportCSV} className="btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Client Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-[280px]">Client</th>
                <th>MT5 Account</th>
                <th>Broker</th>
                <th className="text-right">Equity</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-accent-teal animate-spin" />
                      <span className="text-sm text-gray-500">Loading clients...</span>
                    </div>
                  </td>
                </tr>
              ) : data.clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-8 h-8 text-gray-600" />
                      <span className="text-sm text-gray-500">No clients found</span>
                      {(search || statusFilter !== 'all') && (
                        <button
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="text-xs text-accent-teal hover:text-accent-teal/80"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                data.clients.map((client) => (
                  <tr
                    key={client.id}
                    className="cursor-pointer group"
                    onClick={() => selectClient(client)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center shrink-0">
                          <span className="text-accent-teal font-bold text-xs">
                            {client.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-white truncate group-hover:text-accent-teal transition-colors">
                            {client.fullName}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.mobile}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-sm text-gray-300">{client.mt5AccountNumber}</span>
                    </td>
                    <td>
                      <span className="text-sm text-gray-400">{client.brokerServer}</span>
                    </td>
                    <td className="text-right">
                      <span className="financial-number text-sm text-white">
                        ${client.startingEquity.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <StatusPill status={client.status} />
                    </td>
                    <td>
                      <span className="text-xs text-gray-500">
                        {new Date(client.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => selectClient(client)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-accent-teal hover:bg-accent-teal/10 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {client.status === 'approved' && !client.pushedToCopyTrading && (
                          <button
                            onClick={() => pushToCopyTrading(client.id)}
                            disabled={actionLoading}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-accent-blue hover:bg-accent-blue/10 transition-colors disabled:opacity-50"
                            title="Push to Copy Trading"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-500">
              Showing {((data.page - 1) * 20) + 1}–{Math.min(data.page * 20, data.total)} of {data.total.toLocaleString()} clients
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="p-2 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(data.totalPages, 7) }, (_, i) => {
                const start = Math.max(1, Math.min(data.page - 3, data.totalPages - 6));
                const pageNum = start + i;
                if (pageNum > data.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                      pageNum === data.page
                        ? 'bg-accent-teal text-surface'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="p-2 rounded-lg border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Client Detail Drawer */}
      <AnimatePresence>
        {selectedClient && (
          <Fragment>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={closeDrawer}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface-200 border-l border-white/5 z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-teal/20 to-accent-blue/20 border border-accent-teal/20 flex items-center justify-center">
                    <span className="text-accent-teal font-bold text-sm">
                      {selectedClient.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-white text-sm">{selectedClient.fullName}</h2>
                    <p className="text-xs text-gray-500">{selectedClient.mobile}</p>
                  </div>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {detailsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-6 h-6 text-accent-teal animate-spin" />
                    <span className="text-sm text-gray-500">Loading client details...</span>
                  </div>
                ) : clientDetail ? (
                  <Fragment>
                    {/* Status Banner */}
                    <div className={`rounded-xl p-4 border ${
                      clientDetail.status === 'approved' ? 'bg-accent-green/5 border-accent-green/20' :
                      clientDetail.status === 'rejected' ? 'bg-accent-red/5 border-accent-red/20' :
                      clientDetail.status === 'pushed' ? 'bg-accent-purple/5 border-accent-purple/20' :
                      clientDetail.status === 'connected' ? 'bg-accent-teal/5 border-accent-teal/20' :
                      'bg-accent-gold/5 border-accent-gold/20'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Status</p>
                          <StatusPill status={clientDetail.status} />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Applied</p>
                          <p className="text-xs text-gray-300">
                            {new Date(clientDetail.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="card p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        Personal Information
                      </h3>
                      <div className="space-y-3">
                        {[
                          { icon: User, label: 'Full Name', value: clientDetail.fullName },
                          { icon: Phone, label: 'Mobile', value: clientDetail.mobile },
                          { icon: Briefcase, label: 'Occupation', value: clientDetail.occupation },
                          { icon: MapPin, label: 'Location', value: `${clientDetail.city}, ${clientDetail.state}` },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2 text-gray-400">
                              <item.icon className="w-3.5 h-3.5" />
                              <span className="text-sm">{item.label}</span>
                            </div>
                            <span className="text-sm text-white font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trading Info */}
                    <div className="card p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        Trading Information
                      </h3>
                      <div className="space-y-3">
                        {[
                          { label: 'MT5 Account', value: clientDetail.mt5AccountNumber, mono: true },
                          { label: 'Broker Server', value: clientDetail.brokerServer },
                          { label: 'Starting Equity', value: `$${clientDetail.startingEquity.toLocaleString()}`, financial: true },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                            <span className="text-sm text-gray-400">{item.label}</span>
                            <span className={`text-sm font-medium ${item.mono ? 'font-mono text-gray-300' : item.financial ? 'financial-number text-accent-gold' : 'text-white'}`}>
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trading Password */}
                    <div className="card p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5" />
                        Trading Password
                      </h3>
                      <div className="bg-surface-100 rounded-xl p-4">
                        {passwordRevealed ? (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-accent-green flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Access Granted
                              </span>
                              <button
                                onClick={() => setPasswordRevealed(false)}
                                className="text-xs text-gray-500 hover:text-gray-300"
                              >
                                Hide
                              </button>
                            </div>
                            <p className="font-mono text-sm text-accent-gold break-all leading-relaxed">
                              {clientDetail.tradingPassword}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400 mb-3">Password is encrypted and protected</p>
                            <button
                              onClick={() => setShowRevealModal(true)}
                              className="btn-secondary btn-sm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Reveal with Admin Password
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="card p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" />
                        Admin Notes
                      </h3>
                      {clientDetail.adminNotes && (
                        <p className="text-sm text-gray-300 mb-3 bg-surface-100 rounded-lg p-3 leading-relaxed">
                          {clientDetail.adminNotes}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input text-sm flex-1"
                          placeholder="Add a note..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newNote.trim()) saveNote(clientDetail.id);
                          }}
                        />
                        <button
                          onClick={() => saveNote(clientDetail.id)}
                          disabled={!newNote.trim() || noteSaving}
                          className="btn-secondary btn-sm shrink-0"
                        >
                          {noteSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Actions</h3>

                      {clientDetail.status === 'submitted' && (
                        <Fragment>
                          <button
                            onClick={() => updateStatus(clientDetail.id, 'reviewing')}
                            disabled={actionLoading}
                            className="btn-secondary w-full justify-start"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
                            Mark as Reviewing
                          </button>
                          <button
                            onClick={() => updateStatus(clientDetail.id, 'approved')}
                            disabled={actionLoading}
                            className="btn-primary w-full justify-start"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve Client
                          </button>
                          <button
                            onClick={() => updateStatus(clientDetail.id, 'rejected')}
                            disabled={actionLoading}
                            className="btn-danger w-full justify-start"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            Reject Client
                          </button>
                        </Fragment>
                      )}

                      {clientDetail.status === 'reviewing' && (
                        <Fragment>
                          <button
                            onClick={() => updateStatus(clientDetail.id, 'approved')}
                            disabled={actionLoading}
                            className="btn-primary w-full justify-start"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Approve Client
                          </button>
                          <button
                            onClick={() => updateStatus(clientDetail.id, 'rejected')}
                            disabled={actionLoading}
                            className="btn-danger w-full justify-start"
                          >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                            Reject Client
                          </button>
                        </Fragment>
                      )}

                      {clientDetail.status === 'approved' && !clientDetail.pushedToCopyTrading && (
                        <button
                          onClick={() => pushToCopyTrading(clientDetail.id)}
                          disabled={actionLoading}
                          className="btn-primary w-full justify-start"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                          Push to Copy Trading System
                        </button>
                      )}

                      {clientDetail.status === 'pushed' && (
                        <div className="bg-accent-purple/5 border border-accent-purple/20 rounded-xl p-4 text-center">
                          <Send className="w-5 h-5 text-accent-purple mx-auto mb-2" />
                          <p className="text-sm text-accent-purple font-medium">Pushed to Copy Trading</p>
                          <p className="text-xs text-gray-500 mt-1">Awaiting live connection status</p>
                        </div>
                      )}

                      {clientDetail.status === 'connected' && (
                        <div className="bg-accent-teal/5 border border-accent-teal/20 rounded-xl p-4 text-center">
                          <CheckCircle2 className="w-5 h-5 text-accent-teal mx-auto mb-2" />
                          <p className="text-sm text-accent-teal font-medium">Connected — Trades Mirroring Live</p>
                          <p className="text-xs text-gray-500 mt-1">Copy trading is active</p>
                        </div>
                      )}

                      {clientDetail.status === 'rejected' && (
                        <div className="bg-accent-red/5 border border-accent-red/20 rounded-xl p-4 text-center">
                          <Ban className="w-5 h-5 text-accent-red mx-auto mb-2" />
                          <p className="text-sm text-accent-red font-medium">Client Rejected</p>
                          <p className="text-xs text-gray-500 mt-1">This application has been declined</p>
                        </div>
                      )}
                    </div>
                  </Fragment>
                ) : null}
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>

      {/* Reveal Password Modal */}
      <AnimatePresence>
        {showRevealModal && (
          <Fragment>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
              onClick={() => { setShowRevealModal(false); setRevealPassword(''); setRevealError(''); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-[60]"
            >
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent-gold" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white text-sm">Admin Authentication</h3>
                    <p className="text-xs text-gray-500">Enter your password to reveal credentials</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="label text-xs">Admin Password</label>
                    <input
                      type="password"
                      className="input text-sm"
                      placeholder="Enter your admin password"
                      value={revealPassword}
                      onChange={(e) => { setRevealPassword(e.target.value); setRevealError(''); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedClient) handleRevealPassword(selectedClient.id);
                      }}
                      autoFocus
                    />
                  </div>

                  {revealError && (
                    <p className="text-xs text-accent-red flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {revealError}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setShowRevealModal(false); setRevealPassword(''); setRevealError(''); }}
                      className="btn-secondary btn-sm flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => selectedClient && handleRevealPassword(selectedClient.id)}
                      disabled={revealLoading || !revealPassword.trim()}
                      className="btn-primary btn-sm flex-1"
                    >
                      {revealLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                      Reveal
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
