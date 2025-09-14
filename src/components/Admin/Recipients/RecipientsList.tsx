

import RecipientRow from './RecipientRow';
import RecipientCreate from './RecipientCreate';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../services/api';

type Recipient = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  secondaryMobile?: string;
  address?: {
    street: string;
    city: string;
    country: string;
  };
};

const RecipientsList = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<string[]>([]); // selected recipient IDs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [countryFilter, setCountryFilter] = useState('');
  const [hasMobile, setHasMobile] = useState('all'); // 'all', 'yes', 'no'
  const pageSize = 10;

  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await api.getWithRetry('/recipients');
        setRecipients(res.data);
      } catch (err) {
        setError('Failed to fetch recipients');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipients();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  // Get unique countries for filter dropdown
  const uniqueCountries = Array.from(new Set(recipients.map(r => r.address?.country).filter(Boolean))).sort();

  // Filter recipients by search and advanced filters
  const filteredRecipients = recipients.filter(r => {
    const matchesSearch =
      r.firstName.toLowerCase().includes(search.toLowerCase()) ||
      r.lastName.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter ? r.address?.country === countryFilter : true;
    const matchesMobile =
      hasMobile === 'all' ? true :
      hasMobile === 'yes' ? !!r.mobile :
      hasMobile === 'no' ? !r.mobile : true;
    return matchesSearch && matchesCountry && matchesMobile;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRecipients.length / pageSize) || 1;
  const paginatedRecipients = filteredRecipients.slice((page - 1) * pageSize, page * pageSize);

  // Selection logic (must be after paginatedRecipients is defined)
  const allOnPageSelected = paginatedRecipients.length > 0 && paginatedRecipients.every(r => selected.includes(r._id));
  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected(selected.filter(id => !paginatedRecipients.some(r => r._id === id)));
    } else {
      setSelected([...new Set([...selected, ...paginatedRecipients.map(r => r._id)])]);
    }
  }
  function toggleSelect(id: string) {
    setSelected(selected => selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }
  function clearSelection() {
    setSelected([]);
  }

  // Reset to first page on search
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', background: '#f8fafc', borderRadius: 12, boxShadow: '0 2px 8px #e0e7ef', padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {selected.length > 0 && (
          <div style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: 8, padding: '10px 18px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600 }}>{selected.length} recipient{selected.length > 1 ? 's' : ''} selected</span>
            <button onClick={clearSelection} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
            <button
              onClick={async () => {
                if (!window.confirm(`Delete ${selected.length} selected recipient(s)?`)) return;
                try {
                  await Promise.all(selected.map(id => api.deleteWithRetry(`/recipients/${id}`)));
                  setRecipients(recipients.filter(r => !selected.includes(r._id)));
                  setSelected([]);
                  toast.success('Selected recipients deleted!');
                } catch (err) {
                  toast.error('Failed to delete selected recipients');
                }
              }}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 16px', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
            >Delete Selected</button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#3730a3', letterSpacing: 0.5 }}>Recipients</h2>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearchChange}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #c7d2fe', fontSize: 16, minWidth: 220, marginRight: 8 }}
          />
          <button
            style={{ padding: '10px 22px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 1px 4px #c7d2fe' }}
            onClick={() => setShowCreate(v => !v)}
          >
            {showCreate ? 'Close' : 'Add Recipient'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 500, color: '#3730a3' }}>
            Country:
            <select
              value={countryFilter}
              onChange={e => { setCountryFilter(e.target.value); setPage(1); }}
              style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 15 }}
            >
              <option value="">All</option>
              {uniqueCountries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label style={{ fontWeight: 500, color: '#3730a3' }}>
            Has Mobile:
            <select
              value={hasMobile}
              onChange={e => { setHasMobile(e.target.value); setPage(1); }}
              style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 15 }}
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
      </div>
      {showCreate && (
        <div style={{ marginBottom: 32, background: '#eef2ff', borderRadius: 8, padding: 24, boxShadow: '0 1px 4px #e0e7ef' }}>
          <RecipientCreate onCreated={() => {
            setLoading(true);
            setShowCreate(false);
            toast.success('Recipient created!');
            api.getWithRetry('/recipients').then((res: any) => setRecipients(res.data)).finally(() => setLoading(false));
          }} />
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #e0e7ef', padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 600 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#6366f1', fontWeight: 600 }}>
              <th style={{ padding: '14px 8px', textAlign: 'center', borderTopLeftRadius: 8 }}>
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleSelectAll} />
              </th>
              <th style={{ padding: '14px 8px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '14px 8px', textAlign: 'left' }}>Email</th>
              <th style={{ padding: '14px 8px', textAlign: 'left' }}>Mobile</th>
              <th style={{ padding: '14px 8px', textAlign: 'left' }}>Address</th>
              <th style={{ padding: '14px 8px', textAlign: 'left', borderTopRightRadius: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecipients.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b', fontSize: 18 }}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
                    <span style={{fontSize:48,opacity:0.2}}>👤</span>
                    No recipients found.
                  </div>
                </td>
              </tr>
            )}
            {paginatedRecipients.map(r => (
              <RecipientRow
                key={r._id}
                recipient={r}
                selected={selected.includes(r._id)}
                onSelect={() => toggleSelect(r._id)}
                onUpdated={() => {
                  setLoading(true);
                  toast.success('Recipient updated!');
                  api.getWithRetry('/recipients').then((res: any) => setRecipients(res.data)).finally(() => setLoading(false));
                }}
                onDeleted={() => {
                  setRecipients(recipients.filter(x => x._id !== r._id));
                  toast.success('Recipient deleted!');
                }}
              />
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 24, gap: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #c7d2fe', background: page === 1 ? '#e5e7eb' : '#6366f1', color: page === 1 ? '#a1a1aa' : '#fff', fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          >Prev</button>
          <span style={{ fontWeight: 600, color: '#3730a3', fontSize: 16 }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid #c7d2fe', background: page === totalPages ? '#e5e7eb' : '#6366f1', color: page === totalPages ? '#a1a1aa' : '#fff', fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
          >Next</button>
        </div>
      )}
    </div>
  );
};

export default RecipientsList;
