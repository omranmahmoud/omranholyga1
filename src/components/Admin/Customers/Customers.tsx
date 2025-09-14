import { useEffect, useState } from 'react';
import { Users, Search, AlertTriangle, RefreshCw, Download, Info } from 'lucide-react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { LoadingSpinner } from '../../LoadingSpinner';

interface Customer {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  image?: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrder?: string;
  averageOrderValue?: number;
  phoneNumber?: string;
  whatsappOptIn?: boolean;
  lastWhatsAppContactAt?: string;
  lastWhatsAppMessagePreview?: string;
}

interface ApiResponse {
  users: Customer[];
  page: number;
  totalPages: number;
  total: number;
}

interface CustomerStatsSummary {
  totalCustomers: number;
  newCustomersPeriod: number;
  newCustomers: number;
  topSpenders: { userId: string; name: string; email: string; orderCount: number; totalSpent: number; lastOrder?: string }[];
}

export function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [waOptInFilter, setWaOptInFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [maxOrders, setMaxOrders] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'orderCount' | 'totalSpent'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState('');
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [waMessage, setWaMessage] = useState('');
  const [waLinks, setWaLinks] = useState<{url?:string; name?:string; phoneNumber?:string; skipped?:boolean; reason?:string;}[]>([]);
  const [waLoading, setWaLoading] = useState(false);
  const allVisibleSelected = customers.length>0 && customers.every(c => selectedIds.includes(c._id));
  // Stats state
  const [stats, setStats] = useState<CustomerStatsSummary | null>(null);
  const [statsDays, setStatsDays] = useState(30);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  // Column visibility
  const [visibleCols, setVisibleCols] = useState<{[k:string]:boolean}>(() => ({
    orders:true,
    totalSpent:true,
    avgOrder:true,
    lastOrder:true,
    joined:true,
    role:true,
    email:true,
    name:true
  }));
  const toggleCol = (key:string) => setVisibleCols(v => ({...v, [key]: !v[key]}));
  // Debounce search
  const [liveSearch, setLiveSearch] = useState('');

  const fetchCustomers = async (opts: { page?: number; search?: string } = {}) => {
    try {
      if (!refreshing) setLoading(true);
      setError(null);
      const currentPage = opts.page || page;
      const currentSearch = typeof opts.search === 'string' ? opts.search : search;
  const params = new URLSearchParams();
  params.set('page', String(currentPage));
  params.set('limit', String(pageSize));
  if (currentSearch) params.set('search', currentSearch);
  if (roleFilter) params.set('role', roleFilter);
  if (waOptInFilter) params.set('waOptIn', waOptInFilter);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (minOrders) params.set('minOrders', minOrders);
  if (maxOrders) params.set('maxOrders', maxOrders);
  params.set('sortBy', sortBy);
  params.set('sortDir', sortDir);
  const { data } = await api.getWithRetry(`/users?${params.toString()}`);
      const res: ApiResponse = data;
      setCustomers(res.users);
      setPage(res.page);
  setTotalPages(res.totalPages);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCustomers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statsDays]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      const { data } = await api.getWithRetry(`/users/stats/summary?days=${statsDays}`);
      setStats(data);
    } catch (e:any) {
      setStatsError(e?.response?.data?.message || 'Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  fetchCustomers({ page: 1, search });
  };

  // Keep form search state & liveSearch in sync
  useEffect(()=>{ setLiveSearch(search); },[]);
  useEffect(()=>{ setSearch(liveSearch); },[liveSearch]);
  useEffect(()=>{
    if (user?.role !== 'admin') return;
    const h = setTimeout(()=>{
      // Only auto-trigger if value changed and not empty OR was previously non-empty
      fetchCustomers({ page:1, search: liveSearch });
    }, 600);
    return ()=> clearTimeout(h);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[liveSearch, roleFilter, waOptInFilter, startDate, endDate, minOrders, maxOrders, sortBy, sortDir, pageSize]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const openCustomerDetails = async (c: Customer) => {
    setSelectedCustomer(c);
    setRecentOrders([]);
    setOrdersLoading(true);
    try {
      const { data } = await api.getWithRetry(`/users/${c._id}/orders?limit=10`);
      setRecentOrders(data);
    } catch (e) {
      setError('Failed to load recent orders');
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (minOrders) params.set('minOrders', minOrders);
      if (maxOrders) params.set('maxOrders', maxOrders);
      params.set('sortBy', sortBy);
      params.set('sortDir', sortDir);
      params.set('limit', String(pageSize));
      const response = await api.getWithRetry(`/users/export?${params.toString()}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Export failed');
    }
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(ids => ids.filter(id => !customers.some(c => c._id === id)));
    } else {
      setSelectedIds(ids => Array.from(new Set([...ids, ...customers.map(c => c._id)])));
    }
  };
  const toggleRow = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(x => x!==id) : [...ids, id]);
  };
  const performBulkRoleUpdate = async () => {
    if (!bulkRole) return;
    try {
      await api.patchWithRetry('/users/bulk-role', { userIds: selectedIds, role: bulkRole });
      setBulkRole('');
      fetchCustomers();
    } catch (e:any) {
      setError(e?.response?.data?.message || 'Bulk role update failed');
    }
  };
  const updateSingleRole = async (userId: string, newRole: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    try {
      await api.patchWithRetry(`/users/${userId}/role`, { role: newRole });
      fetchCustomers();
    } catch (er:any) {
      setError(er?.response?.data?.message || 'Role update failed');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You need admin privileges to view customers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Users className="w-6 h-6" /> Customers</h1>
          <p className="mt-1 text-sm text-gray-500">View registered customers and their signup dates</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={handleExport}
              type="button"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams();
                if (search) params.set('search', search);
                if (roleFilter) params.set('role', roleFilter);
                if (startDate) params.set('startDate', startDate);
                if (endDate) params.set('endDate', endDate);
                if (minOrders) params.set('minOrders', minOrders);
                if (maxOrders) params.set('maxOrders', maxOrders);
                params.set('sortBy', sortBy);
                params.set('sortDir', sortDir);
                params.set('limit', String(pageSize));
                const response = await api.getWithRetry(`/users/export.xlsx?${params.toString()}`, { responseType: 'blob' });
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `customers_export_${Date.now()}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (err) {
                setError('XLSX export failed');
              }
            }}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export XLSX
          </button>
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams();
                      params.set('userIds', selectedIds.join(','));
                      const response = await api.getWithRetry(`/users/export?${params.toString()}`, { responseType: 'blob' });
                      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `customers_selected_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      setError('Selected CSV export failed');
                    }
                  }}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                  title="Export only selected customers (CSV)"
                >
                  <Download className="w-4 h-4" />
                  Selected CSV
                </button>
                <button
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams();
                      params.set('userIds', selectedIds.join(','));
                      const response = await api.getWithRetry(`/users/export.xlsx?${params.toString()}`, { responseType: 'blob' });
                      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `customers_selected_${Date.now()}.xlsx`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (e) {
                      setError('Selected XLSX export failed');
                    }
                  }}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                  title="Export only selected customers (XLSX)"
                >
                  <Download className="w-4 h-4" />
                  Selected XLSX
                </button>
                <button
                  onClick={() => setShowWhatsApp(true)}
                  type="button"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100"
                  title="Generate WhatsApp links for selected customers"
                >
                  WhatsApp
                </button>
              </>
            )}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Customer Stats Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Customer Summary</h2>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500">Period:</label>
            <select value={statsDays} onChange={e=>setStatsDays(parseInt(e.target.value))} className="px-2 py-1 border border-gray-300 rounded">
              {[7,14,30,60,90,180,365].map(d => <option key={d} value={d}>{d}d</option>)}
            </select>
            <button onClick={fetchStats} disabled={statsLoading} className="px-2 py-1 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-40">Refresh</button>
          </div>
        </div>
        {statsError && <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{statsError}</div>}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-xs uppercase tracking-wide text-gray-500">Total Customers</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{statsLoading ? '...' : stats?.totalCustomers ?? '--'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-xs uppercase tracking-wide text-gray-500">New (last {statsDays}d)</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{statsLoading ? '...' : stats?.newCustomers ?? '--'}</p>
          </div>
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <p className="text-xs uppercase tracking-wide text-gray-500">Top Spender</p>
            <p className="mt-1 text-sm font-medium text-gray-900 truncate">{statsLoading ? '...' : (stats?.topSpenders?.[0]?.name || '—')}</p>
            <p className="text-xs text-gray-500">{statsLoading ? '' : (stats?.topSpenders?.[0] ? '$'+stats.topSpenders[0].totalSpent.toFixed(2) : '')}</p>
          </div>
        </div>
        {stats?.topSpenders && stats.topSpenders.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wide text-gray-600 uppercase">Top Spenders</h3>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topSpenders.map(s => (
                  <tr key={s.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-2 text-gray-600">{s.orderCount}</td>
                    <td className="px-4 py-2 text-gray-600">${s.totalSpent.toFixed(2)}</td>
                    <td className="px-4 py-2 text-gray-500">{s.lastOrder ? new Date(s.lastOrder).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

  <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={liveSearch}
            onChange={(e) => setLiveSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">WA Opt-In</label>
          <select
            value={waOptInFilter}
            onChange={(e)=> setWaOptInFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
  <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Min Orders</label>
          <input
            type="number"
            min={0}
            value={minOrders}
            onChange={e => setMinOrders(e.target.value)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Max Orders</label>
            <input
              type="number"
              min={0}
              value={maxOrders}
              onChange={e => setMaxOrders(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="createdAt">Joined</option>
            <option value="orderCount">Orders</option>
            <option value="totalSpent">Total Spent</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Direction</label>
          <select value={sortDir} onChange={e => setSortDir(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Page Size</label>
          <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            {[10,20,50,100].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >Search</button>
        <button
          type="button"
          onClick={() => { setRoleFilter(''); setWaOptInFilter(''); setStartDate(''); setEndDate(''); setSearch(''); setLiveSearch(''); setMinOrders(''); setMaxOrders(''); setSortBy('createdAt'); setSortDir('desc'); setPageSize(20); fetchCustomers({ page:1, search: ''}); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
        >Reset</button>
      </form>

      {/* Column visibility toggles */}
      <div className="flex flex-wrap gap-3 items-center text-xs bg-white border border-gray-200 rounded-lg p-3">
        <span className="font-semibold text-gray-600">Columns:</span>
        {[
          ['name','Name'],['email','Email'],['role','Role'],['phone','Phone'],['waOptIn','WA'],['orders','Orders'],['totalSpent','Total'],['avgOrder','Avg'],['lastOrder','Last'],['joined','Joined']
        ].map(([key,label]) => (
          <label key={key} className="flex items-center gap-1 cursor-pointer select-none">
            <input type="checkbox" checked={visibleCols[key]} onChange={()=>toggleCol(key)} />
            <span>{label}</span>
          </label>
        ))}
        <button type="button" className="ml-auto text-indigo-600 hover:underline" onClick={()=>setVisibleCols({name:true,email:true,role:true,phone:true,waOptIn:true,orders:true,totalSpent:true,avgOrder:true,lastOrder:true,joined:true})}>All</button>
        <button type="button" className="text-indigo-600 hover:underline" onClick={()=>setVisibleCols({name:true,email:false,role:false,phone:false,waOptIn:false,orders:true,totalSpent:true,avgOrder:true,lastOrder:true,joined:true})}>Compact</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Customers Found</h3>
          <p className="text-gray-500">Try adjusting your search or check back later.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          {/* Bulk actions bar */}
          {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
          <span className="font-medium text-indigo-800">{selectedIds.length} selected</span>
          <select value={bulkRole} onChange={e=>setBulkRole(e.target.value)} className="px-2 py-1 border border-indigo-300 rounded">
            <option value="">Set Role...</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={performBulkRoleUpdate} disabled={!bulkRole} className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-40">Apply</button>
          <button onClick={()=>setSelectedIds([])} className="px-2 py-1 text-indigo-700 hover:underline">Clear</button>
          <button onClick={()=>setShowWhatsApp(true)} className="px-3 py-1 bg-green-600 text-white rounded">WhatsApp</button>
        </div>
      )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
                </th>
                {visibleCols.name && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>}
                {visibleCols.email && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>}
                {visibleCols.role && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>}
                {visibleCols.phone && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>}
                {visibleCols.waOptIn && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WA</th>}
                {visibleCols.waLast && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WA Last</th>}
                {visibleCols.waPreview && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WA Preview</th>}
                {visibleCols.orders && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>}
                {visibleCols.totalSpent && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>}
                {visibleCols.avgOrder && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>}
                {visibleCols.lastOrder && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {customers
                .filter(c => {
                  const minOk = !minOrders || (c.orderCount ?? 0) >= parseInt(minOrders);
                  const maxOk = !maxOrders || (c.orderCount ?? 0) <= parseInt(maxOrders);
                  return minOk && maxOk;
                })
                .map(c => (
                <tr key={c._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openCustomerDetails(c)}>
                  <td className="px-3 py-4">
                    <input type="checkbox" checked={selectedIds.includes(c._id)} onChange={(e)=>{ e.stopPropagation(); toggleRow(c._id); }} />
                  </td>
                  {visibleCols.name && <td className="px-6 py-4 whitespace-nowrap flex items-center gap-3">
                    {c.image ? (
                      <img src={c.image} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-semibold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </td>}
                  {selectedIds.includes(c._id) && (
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {c.phoneNumber && c.whatsappOptIn ? 'WA✓' : ''}
                    </td>
                  )}
                  {visibleCols.email && <td className="px-6 py-4 text-sm text-gray-600">{c.email}</td>}
                  {visibleCols.role && <td className="px-6 py-4">
                    <select value={c.role} onChange={(e)=>updateSingleRole(c._id, e.target.value, e)} className={`text-xs font-medium px-2 py-1 rounded-full border ${c.role==='admin'?'bg-purple-100 text-purple-700 border-purple-200':'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>}
                  {visibleCols.phone && <td className="px-6 py-4 text-xs text-gray-600">{c.phoneNumber || '—'}</td>}
                  {visibleCols.waOptIn && <td className="px-6 py-4 text-xs">{c.whatsappOptIn ? <span className="text-green-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>}</td>}
                  {visibleCols.waLast && <td className="px-6 py-4 text-xs text-gray-600">{c.lastWhatsAppContactAt ? new Date(c.lastWhatsAppContactAt).toLocaleDateString() : '—'}</td>}
                  {visibleCols.waPreview && <td className="px-6 py-4 text-xs max-w-[160px] truncate" title={c.lastWhatsAppMessagePreview || ''}>{c.lastWhatsAppMessagePreview || '—'}</td>}
                  {visibleCols.orders && <td className="px-6 py-4"><span className="text-sm text-gray-800 font-medium">{c.orderCount ?? 0}</span></td>}
                  {visibleCols.totalSpent && <td className="px-6 py-4 text-sm text-gray-600">${(c.totalSpent ?? 0).toFixed(2)}</td>}
                  {visibleCols.avgOrder && <td className="px-6 py-4 text-sm text-gray-600">${(c.averageOrderValue ?? 0).toFixed(2)}</td>}
                  {visibleCols.lastOrder && <td className="px-6 py-4 text-sm text-gray-600">{c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : '—'}</td>}
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => fetchCustomers({ page: page - 1 })}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
              >Prev</button>
              <button
                disabled={page === totalPages}
                onClick={() => fetchCustomers({ page: page + 1 })}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedCustomer(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Info className="w-5 h-5" /> {selectedCustomer.name}</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{selectedCustomer.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p><span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${selectedCustomer.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{selectedCustomer.role}</span></p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Orders</p>
                <p className="font-medium">{selectedCustomer.orderCount ?? 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Spent</p>
                <p className="font-medium">${(selectedCustomer.totalSpent ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Avg Order Value</p>
                <p className="font-medium">${(selectedCustomer.averageOrderValue ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Order</p>
                <p className="font-medium">{selectedCustomer.lastOrder ? new Date(selectedCustomer.lastOrder).toLocaleDateString() : '—'}</p>
              </div>
              <div className="col-span-2 border-t pt-3">
                <p className="text-gray-500 mb-1">WhatsApp Contact</p>
                <ContactEditor user={selectedCustomer} onUpdated={(p)=>{ setSelectedCustomer(sc=> sc && sc._id===p._id ? {...sc, phoneNumber:p.phoneNumber, whatsappOptIn:p.whatsappOptIn}: sc); fetchCustomers(); }} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Orders</h3>
              {ordersLoading ? (
                <div className="py-6 flex justify-center"><LoadingSpinner /></div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-gray-500">No recent orders.</p>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {recentOrders.map((o: any) => (
                    <div key={o._id} className="p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">#{o.orderNumber}</span>
                        <span className="text-gray-600">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-600">{o.items?.length || 0} items</span>
                        <span className="font-medium">${o.totalAmount?.toFixed(2)} {o.currency}</span>
                      </div>
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showWhatsApp && (
        <WhatsAppModal onClose={()=>{ setShowWhatsApp(false); setWaLinks([]); }}
          customerCount={selectedIds.length}
          onGenerate={async()=>{
            setWaLoading(true);
            try {
              const { buildLinksForIds } = await import('../../../services/whatsappService');
              const res: any = await buildLinksForIds(selectedIds, waMessage, true);
              setWaLinks(res.links || []);
            } catch(e:any){ console.error(e); }
            finally { setWaLoading(false); }
          }}
          waMessage={waMessage}
          setWaMessage={setWaMessage}
          waLinks={waLinks}
          waLoading={waLoading}
        />
      )}
    </div>
  );
}

// Contact editor inline component
function ContactEditor({ user, onUpdated }:{ user: Customer; onUpdated: (u:Customer)=>void }){
  const [phone, setPhone] = useState(user.phoneNumber || '');
  const [optIn, setOptIn] = useState(!!user.whatsappOptIn);
  const [saving, setSaving] = useState(false);
  const save = async ()=>{
    setSaving(true);
    try {
      await api.patchWithRetry(`/users/${user._id}/contact`, { phoneNumber: phone, whatsappOptIn: optIn });
      onUpdated({...user, phoneNumber: phone, whatsappOptIn: optIn});
    } catch(e){ /* handle */ } finally { setSaving(false); }
  };
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-3">
      <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+15551234567" className="px-2 py-1 border rounded w-full md:w-48" />
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={optIn} onChange={e=>setOptIn(e.target.checked)} /> Opt-in
      </label>
      <button disabled={saving} onClick={save} className="px-3 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-40">{saving? 'Saving...':'Save'}</button>
    </div>
  );
}

function WhatsAppModal({ onClose, customerCount, onGenerate, waMessage, setWaMessage, waLinks, waLoading }:{ onClose:()=>void; customerCount:number; onGenerate:()=>void; waMessage:string; setWaMessage:(v:string)=>void; waLinks:any[]; waLoading:boolean; }){
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">WhatsApp Broadcast ({customerCount} selected)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <textarea value={waMessage} onChange={e=>setWaMessage(e.target.value)} placeholder="Message" rows={4} className="w-full border rounded px-3 py-2 text-sm" />
        <div className="flex items-center gap-3">
          <button onClick={onGenerate} disabled={waLoading || !waMessage.trim()} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-40">{waLoading? 'Generating...':'Generate Links'}</button>
          {waLinks.length>0 && (
            <>
              <button onClick={()=>waLinks.filter(l=>l.url).forEach((l,i)=> setTimeout(()=> window.open(l.url,'_blank'), i*400))} className="px-3 py-2 bg-emerald-600 text-white rounded text-sm">Open All ({waLinks.filter(l=>l.url).length})</button>
              <button onClick={()=> navigator.clipboard.writeText(waLinks.filter(l=>l.url).map(l=>l.url).join('\n'))} className="px-3 py-2 bg-gray-700 text-white rounded text-sm">Copy Links</button>
            </>
          )}
        </div>
        {waLinks.length>0 && (
          <div className="max-h-72 overflow-y-auto border rounded divide-y text-sm">
            {waLinks.map((l,i)=>(
              <div key={i} className="p-2 flex items-center gap-3">
                <span className="flex-1 truncate">{l.name || l.phoneNumber || 'User'}</span>
                {l.skipped ? <span className="text-xs text-red-600">Skipped: {l.reason}</span> : <a href={l.url} target="_blank" rel="noreferrer" className="text-green-600 text-xs underline">Open</a>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Customers;
