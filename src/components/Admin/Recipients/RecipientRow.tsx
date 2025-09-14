import React, { useState } from 'react';
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

type Props = {
  recipient: Recipient;
  selected: boolean;
  onSelect: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
};

const RecipientRow: React.FC<Props> = ({ recipient, selected, onSelect, onUpdated, onDeleted }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(recipient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      setForm({
        ...form,
        address: {
          street: name === 'address.street' ? value : form.address?.street || '',
          city: name === 'address.city' ? value : form.address?.city || '',
          country: name === 'address.country' ? value : form.address?.country || ''
        }
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
  await api.putWithRetry(`/recipients/${recipient._id}`, form);
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError('Failed to update recipient');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this recipient?')) return;
    setLoading(true);
    setError('');
    try {
  await api.deleteWithRetry(`/recipients/${recipient._id}`);
      onDeleted();
    } catch (err) {
      setError('Failed to delete recipient');
    } finally {
      setLoading(false);
    }
  };

  if (editing) {
    return (
      <tr style={{ background: selected ? '#e0e7ff' : undefined }}>
        <td style={{ textAlign: 'center' }}>
          <input type="checkbox" checked={selected} onChange={onSelect} />
        </td>
        <td>
          <input name="firstName" value={form.firstName} onChange={handleChange} />
          <input name="lastName" value={form.lastName} onChange={handleChange} />
        </td>
        <td><input name="email" value={form.email} onChange={handleChange} /></td>
        <td><input name="mobile" value={form.mobile} onChange={handleChange} /></td>
        <td>
          <input name="address.street" value={form.address?.street || ''} onChange={handleChange} placeholder="Street" />
          <input name="address.city" value={form.address?.city || ''} onChange={handleChange} placeholder="City" />
          <input name="address.country" value={form.address?.country || ''} onChange={handleChange} placeholder="Country" />
        </td>
        <td style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSave} disabled={loading} title="Save" style={{ background: '#4ade80', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer' }}>
            💾
          </button>
          <button onClick={() => setEditing(false)} disabled={loading} title="Cancel" style={{ background: '#fbbf24', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer' }}>
            ✖️
          </button>
        </td>
        <td>{error && <span style={{color:'red'}}>{error}</span>}</td>
      </tr>
    );
  }

  return (
    <tr style={{ background: selected ? '#e0e7ff' : undefined }}>
      <td style={{ textAlign: 'center' }}>
        <input type="checkbox" checked={selected} onChange={onSelect} />
      </td>
      <td>{recipient.firstName} {recipient.lastName}</td>
      <td>{recipient.email}</td>
      <td>{recipient.mobile}</td>
      <td>{recipient.address?.street}, {recipient.address?.city}, {recipient.address?.country}</td>
      <td style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setEditing(true)} title="Edit" style={{ background: '#e0e7ff', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
        </button>
        <button onClick={handleDelete} disabled={loading} title="Delete" style={{ background: '#fee2e2', border: 'none', borderRadius: 4, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
        </button>
      </td>
      <td>{error && <span style={{color:'red'}}>{error}</span>}</td>
    </tr>
  );
};

export default RecipientRow;
