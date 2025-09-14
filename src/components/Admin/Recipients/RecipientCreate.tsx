import React, { useState } from 'react';
import api from '../../../services/api';

type Recipient = {
  _id?: string;
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

const initialForm: Recipient = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  secondaryMobile: '',
  address: {
    street: '',
    city: '',
    country: ''
  }
};

const RecipientCreate: React.FC<{ onCreated: () => void }> = ({ onCreated }) => {
  const [form, setForm] = useState<Recipient>(initialForm);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validate required fields
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.mobile.trim()) {
      setError('All fields are required.');
      return;
    }
    // Validate mobile format
    const mobileRegex = /^\+[0-9]{1,4}[0-9]{9,10}$/;
    if (!mobileRegex.test(form.mobile)) {
      setError('Mobile must start with +, country code, and 9-10 digits.');
      return;
    }
    if (form.secondaryMobile && form.secondaryMobile.trim() && !mobileRegex.test(form.secondaryMobile)) {
      setError('Secondary mobile must start with +, country code, and 9-10 digits.');
      return;
    }
    // Validate address fields
    if (!form.address?.street.trim() || !form.address?.city.trim() || !form.address?.country.trim()) {
      setError('All address fields are required.');
      return;
    }
    setLoading(true);
    try {
      let payload: any = { ...form };
      await api.postWithRetry('/recipients', payload);
      setForm(initialForm);
      onCreated();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create recipient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
      <h3 style={{ gridColumn: '1 / -1', fontSize: 22, fontWeight: 600, color: '#3730a3', marginBottom: 8 }}>Add Recipient</h3>
      <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="Mobile" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="secondaryMobile" value={form.secondaryMobile} onChange={handleChange} placeholder="Secondary Mobile" style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="address.street" value={form.address?.street || ''} onChange={handleChange} placeholder="Street" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="address.city" value={form.address?.city || ''} onChange={handleChange} placeholder="City" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <input name="address.country" value={form.address?.country || ''} onChange={handleChange} placeholder="Country" required style={{ padding: 10, borderRadius: 6, border: '1px solid #c7d2fe', fontSize: 16 }} />
      <button type="submit" disabled={loading} style={{ gridColumn: '1 / -1', marginTop: 8, padding: '12px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 18, cursor: 'pointer', boxShadow: '0 1px 4px #c7d2fe' }}>Add</button>
      {error && <span style={{ gridColumn: '1 / -1', color: 'red', fontSize: 16 }}>{error}</span>}
    </form>
  );
};

export default RecipientCreate;
