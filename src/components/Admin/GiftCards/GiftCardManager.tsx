import React, { useState, useEffect } from 'react';
import { Gift, Search, PlusCircle, Download, X, Clipboard } from 'lucide-react';
import { GiftCardList } from './GiftCardList';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { formatPrice, type CurrencyCode } from '../../..//utils/currency';
import { formatDistanceToNow } from 'date-fns';

export function GiftCardManager() {
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'redeemed' | 'expired' | 'cancelled'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'balance_asc'>('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: '',
    message: '',
    currency: 'USD',
  expiryDate: '' as string, // optional (YYYY-MM-DD)
  });

  // Details modal state
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  useEffect(() => {
    fetchGiftCards();
  }, []);

  const fetchGiftCards = async () => {
    try {
  const response = await api.getWithRetry('/gift-cards/all');
      setGiftCards(response.data);
    } catch (error) {
      toast.error('Failed to fetch gift cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGiftCard = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this gift card?')) {
      return;
    }

    try {
  await api.putWithRetry(`/gift-cards/${id}/cancel`);
      toast.success('Gift card cancelled successfully');
      fetchGiftCards();
    } catch (error) {
      toast.error('Failed to cancel gift card');
    }
  };

  const filteredGiftCards = giftCards
    .filter((card: any) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        card.code.toLowerCase().includes(q) ||
        card.purchasedBy?.name?.toLowerCase().includes(q) ||
        card.purchasedBy?.email?.toLowerCase().includes(q) ||
        (card.recipient?.name && card.recipient.name.toLowerCase().includes(q)) ||
        (card.recipient?.email && card.recipient.email.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' ? true : card.status === statusFilter;

      const created = card.createdAt ? new Date(card.createdAt) : null;
      const fromOk = fromDate ? (created ? created >= new Date(fromDate) : false) : true;
      const toOk = toDate ? (created ? created <= new Date(toDate + 'T23:59:59') : false) : true;

      return matchQuery && matchStatus && fromOk && toOk;
    })
    .sort((a: any, b: any) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_desc':
          return (b.initialBalance || 0) - (a.initialBalance || 0);
        case 'balance_asc':
          return (a.currentBalance || 0) - (b.currentBalance || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const total = filteredGiftCards.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedGiftCards = filteredGiftCards.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPagination = () => setPage(1);

  const onExportCSV = () => {
    const rows = filteredGiftCards.map((c: any) => ({
      Code: c.code,
      Amount: c.initialBalance,
      Balance: c.currentBalance,
      Currency: c.currency,
      Status: c.status,
      Expiry: c.expiryDate ? new Date(c.expiryDate).toISOString().slice(0, 10) : '',
      PurchasedBy: c.purchasedBy ? `${c.purchasedBy.name} <${c.purchasedBy.email}>` : '',
      Recipient: c.recipient ? `${c.recipient.name} <${c.recipient.email}>` : 'Self',
      CreatedAt: c.createdAt
    }));

    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => {
      const s = String(v ?? '');
      return /[,"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gift-cards-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) < 10) {
      toast.error('Amount must be at least 10');
      return;
    }
    // Optional expiry validation
    if (form.expiryDate) {
      const d = new Date(form.expiryDate);
      const today = new Date();
      // zero time portion of today for accurate comparison against date input
      today.setHours(0,0,0,0);
      if (isNaN(d.getTime())) {
        toast.error('Invalid expiry date');
        return;
      }
      if (d < today) {
        toast.error('Expiry date must be today or in the future');
        return;
      }
    }
    try {
      setCreating(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 20000);
      const payload: any = { ...form, amount: Number(form.amount) };
      if (!form.expiryDate) {
        delete payload.expiryDate; // let server default (1 year)
      }
      const { data: newCard } = await api.postWithRetry(
        '/gift-cards/purchase',
        payload,
        { signal: controller.signal }
      );
      window.clearTimeout(timeoutId);
      toast.success('Gift card created');
      setShowCreate(false);
      setForm({ amount: '', recipientName: '', recipientEmail: '', message: '', currency: 'USD', expiryDate: '' });
      // Optimistically update list to avoid slow refetch
      setGiftCards((prev: any[]) => [newCard, ...prev]);
    } catch (error: any) {
      // interceptor already toasts; add fallback
      if (error?.name === 'CanceledError' || error?.message === 'canceled') {
        toast.error('Request timed out. Please try again.');
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create gift card');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track gift cards across your store.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            onClick={onExportCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setShowCreate(true)}
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Gift Card
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search gift cards..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); resetPagination(); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); resetPagination(); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_desc">Amount: High to Low</option>
          <option value="balance_asc">Balance: Low to High</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); resetPagination(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); resetPagination(); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        <select
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); resetPagination(); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm ml-auto"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {giftCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Gift Cards Found</h3>
          <p className="text-gray-500">No gift cards have been purchased yet.</p>
        </div>
      ) : (
        <GiftCardList
          giftCards={paginatedGiftCards}
          onCancel={handleCancelGiftCard}
          onView={(card) => { setSelectedCard(card); setShowDetails(true); }}
        />
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Gift Card Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6 relative">
            <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={() => setShowCreate(false)}>
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold mb-4">Create Gift Card</h3>
            <form onSubmit={handleCreateGiftCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Amount</label>
                <input name="amount" type="number" min={10} required value={form.amount} onChange={handleFormChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient Name</label>
                <input name="recipientName" value={form.recipientName} onChange={handleFormChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient Email</label>
                <input name="recipientEmail" type="email" value={form.recipientEmail} onChange={handleFormChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea name="message" value={form.message} onChange={handleFormChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Currency</label>
                <select name="currency" value={form.currency} onChange={handleFormChange} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date (optional)</label>
                <input
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  min={new Date().toISOString().slice(0,10)}
                  onChange={handleFormChange}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty to default to 1 year from today.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Card Details Modal */}
      {showDetails && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl p-6 relative">
            <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600" onClick={() => setShowDetails(false)}>
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gift Card Details</h3>
              <span className="text-xs text-gray-500">Created {selectedCard.createdAt ? formatDistanceToNow(new Date(selectedCard.createdAt), { addSuffix: true }) : '—'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Unique Code</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg">{selectedCard.code}</span>
                  <button
                    className="p-1 text-gray-500 hover:text-gray-800"
                    onClick={() => navigator.clipboard?.writeText(selectedCard.code)}
                    title="Copy code"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-400">Length: {String(selectedCard.code || '').length} chars</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border">
                  {selectedCard.status}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Initial Balance</div>
                <div className="text-lg font-semibold">{formatPrice(selectedCard.initialBalance, selectedCard.currency as CurrencyCode)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Remaining Balance</div>
                <div className="text-lg font-semibold">{formatPrice(selectedCard.currentBalance, selectedCard.currency as CurrencyCode)}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Expiry Date</div>
                <div className="text-lg">{selectedCard.expiryDate ? new Date(selectedCard.expiryDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '—'}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Last Used</div>
                <div className="text-lg">{selectedCard.lastUsed ? formatDistanceToNow(new Date(selectedCard.lastUsed), { addSuffix: true }) : '—'}</div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">Purchase & Usage History</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Amount</th>
                      <th className="px-4 py-2 text-left">Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2">{selectedCard.createdAt ? new Date(selectedCard.createdAt).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2">Purchase</td>
                      <td className="px-4 py-2">{formatPrice(selectedCard.initialBalance, selectedCard.currency as CurrencyCode)}</td>
                      <td className="px-4 py-2">—</td>
                    </tr>
                    {Array.isArray(selectedCard.redemptions) && selectedCard.redemptions.length > 0 ? (
                      selectedCard.redemptions.map((r: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">{r.date ? new Date(r.date).toLocaleString() : '—'}</td>
                          <td className="px-4 py-2">Redemption</td>
                          <td className="px-4 py-2">-{formatPrice(r.amount, selectedCard.currency as CurrencyCode)}</td>
                          <td className="px-4 py-2">{r.order ? String(r.order).slice(-6) : '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t">
                        <td className="px-4 py-3 text-gray-500" colSpan={4}>No redemptions yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}