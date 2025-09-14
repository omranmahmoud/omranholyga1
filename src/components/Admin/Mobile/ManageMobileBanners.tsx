import React, { useEffect, useState, ChangeEvent } from 'react';

// Backend public base for image previews. Derive from current origin and default to port 5000.
function getBackendBaseFromOrigin() {
  try {
    const origin = window.location.origin; // e.g., http://localhost:5173
    const u = new URL(origin);
    const port = '5000';
    return `${u.protocol}//${u.hostname}:${port}`;
  } catch {
    return 'https://omraneva.onrender.com';
  }
}
const BACKEND_PUBLIC_BASE = getBackendBaseFromOrigin();

function resolveImageUrl(img: string): string {
  if (!img) return '';
  img = img.trim();
  // If it's already absolute and points to the dev server port, rewrite to backend port
  try {
    const u = new URL(img);
    if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && (u.port === '5173' || u.port === '5174')) {
      return `${BACKEND_PUBLIC_BASE}${u.pathname}${u.search}${u.hash}`;
    }
    return img; // already absolute and not the dev server
  } catch {
    // Not a full URL; if it's a server-served path like /uploads/...
  if (img.startsWith('/')) return `${BACKEND_PUBLIC_BASE}${img}`;
    return img;
  }
}

export function ManageMobileBanners() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ image: '', title: '', subtitle: '', cta: '', link: '', navigationCategory: '' });
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ image: '', title: '', subtitle: '', cta: '', link: '', navigationCategory: '' });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    // Load categories and banners in parallel
    fetch('/api/navigation')
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setCategories(data) : setCategories([]))
      .catch(() => setCategories([]));
    fetch('/api/mobile-banners')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setBanners(data);
        } else {
          setBanners([]);
          setError(data?.message || 'Failed to load banners');
        }
      })
      .catch(() => setError('Failed to load banners'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    let imageUrl = form.image;
    // Frontend validation: require image URL or file
    if (!formImageFile && (!form.image || !form.image.trim())) {
      setFormError('Please upload an image or provide an image URL.');
      return;
    }
    setSubmitting(true);
    try {
      // If a file is selected, upload it first
  if (formImageFile) {
        const data = new FormData();
        data.append('image', formImageFile);
        const uploadRes = await fetch('/api/mobile-banners/upload', {
          method: 'POST',
          body: data
        });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
    // Prefer storing relative path so mobile and web can resolve against their base
    imageUrl = uploadData.path || uploadData.url;
      }
      if (!imageUrl) {
        setFormError('Image is required');
        setSubmitting(false);
        return;
      }
  const finalImage = resolveImageUrl(imageUrl).startsWith('http') ? (imageUrl.startsWith('/uploads') ? imageUrl : imageUrl) : imageUrl;
  console.log('imageUrl (raw):', imageUrl);
  console.log('image preview resolved:', resolveImageUrl(imageUrl));
  console.log('Submitting banner (image stored as):', finalImage);
      const res = await fetch('/api/mobile-banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Store relative path if it's a server path; else store absolute URL
        body: JSON.stringify({
          ...form,
          image: (imageUrl || '').trim().startsWith('/uploads') ? (imageUrl || '').trim() : (imageUrl || '').trim(),
          navigationCategory: form.navigationCategory || undefined
        })
      });
      if (!res.ok) throw new Error('Failed to create banner');
      const newBanner = await res.json();
      setBanners([newBanner, ...banners]);
  setForm({ image: '', title: '', subtitle: '', cta: '', link: '', navigationCategory: '' });
      setFormImageFile(null);
    } catch (err: any) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else if (err && typeof err === 'object' && 'message' in err) {
        setFormError((err as any).message);
      } else {
        setFormError('Failed to create banner');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ...existing code...

  const handleEditClick = (banner: any) => {
    setEditId(banner._id);
    setEditForm({
      image: banner.image || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      cta: banner.cta || '',
  link: banner.link || '',
  navigationCategory: banner.navigationCategory?._id || banner.navigationCategory || ''
    });
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    if (!editForm.image) {
      setEditError('Image URL is required');
      return;
    }
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/mobile-banners/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, navigationCategory: editForm.navigationCategory || null })
      });
      if (!res.ok) throw new Error('Failed to update banner');
      const updated = await res.json();
      setBanners(banners.map(b => (b._id === editId ? updated : b)));
      setEditId(null);
    } catch (err) {
      setEditError('Failed to update banner');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const res = await fetch(`/api/mobile-banners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setBanners(banners.filter(b => b._id !== id));
    } catch {
      alert('Failed to delete banner');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Manage Mobile Banners</h1>
      <p style={{ marginTop: 16, color: '#64748b', fontSize: 18 }}>
        Here you can add, edit, or remove banners for your mobile app home screen.
      </p>

  <form onSubmit={handleSubmit} style={{ marginTop: 32, marginBottom: 32, maxWidth: 480 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16 }}>Add New Banner</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Image (upload or URL)*</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            style={{ marginBottom: 8 }}
          />
          <input
            type="text"
            name="image"
            placeholder="Image URL"
            value={form.image}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            disabled={!!formImageFile}
          />
          {formImageFile && <div style={{ color: '#0284c7', fontSize: 13, marginTop: 4 }}>{formImageFile.name}</div>}
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            name="subtitle"
            placeholder="Subtitle"
            value={form.subtitle}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            name="cta"
            placeholder="CTA Text"
            value={form.cta}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            name="link"
            placeholder="Link URL"
            value={form.link}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Navigation Category (optional)</label>
          <select
            name="navigationCategory"
            value={form.navigationCategory}
            onChange={handleSelectChange}
            style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          >
            <option value="">— None —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        {formError && <div style={{ color: 'red', marginBottom: 8 }}>{formError}</div>}
        <button type="submit" disabled={submitting} style={{ padding: '8px 24px', borderRadius: 4, background: '#ff9800', color: '#fff', fontWeight: 600, border: 'none' }}>
          {submitting ? 'Adding...' : 'Add Banner'}
        </button>
      </form>

      {loading && <p>Loading banners...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div style={{ marginTop: 32 }}>
          {banners.length === 0 ? (
            <p>No banners found.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {banners.map(banner => (
                <li key={banner._id} style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 8, padding: 16, position: 'relative' }}>
                  {editId === banner._id ? (
                    <form onSubmit={handleEditSubmit} style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          name="image"
                          placeholder="Image URL*"
                          value={editForm.image}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                          required
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ display: 'block', marginBottom: 4 }}>Navigation Category</label>
                        <select
                          name="navigationCategory"
                          value={editForm.navigationCategory}
                          onChange={handleEditSelectChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        >
                          <option value="">— None —</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          name="title"
                          placeholder="Title"
                          value={editForm.title}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          name="subtitle"
                          placeholder="Subtitle"
                          value={editForm.subtitle}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          name="cta"
                          placeholder="CTA Text"
                          value={editForm.cta}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="text"
                          name="link"
                          placeholder="Link URL"
                          value={editForm.link}
                          onChange={handleEditChange}
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                        />
                      </div>
                      {editError && <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div>}
                      <button type="submit" disabled={editSubmitting} style={{ marginRight: 8, padding: '6px 18px', borderRadius: 4, background: '#0284c7', color: '#fff', fontWeight: 600, border: 'none' }}>
                        {editSubmitting ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditId(null)} style={{ padding: '6px 18px', borderRadius: 4, background: '#64748b', color: '#fff', fontWeight: 600, border: 'none' }}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <img src={resolveImageUrl(banner.image)} alt={banner.title || 'Banner'} style={{ width: 320, height: 120, objectFit: 'cover', borderRadius: 8 }} />
                      <div style={{ marginTop: 8 }}>
                        <strong>{banner.title}</strong>
                        <div>{banner.subtitle}</div>
                        <div>CTA: {banner.cta}</div>
                        <div>Link: {banner.link}</div>
                        <div>Category: {banner.navigationCategory?.name || '—'}</div>
                      </div>
                      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
                        <button onClick={() => handleEditClick(banner)} style={{ padding: '4px 12px', borderRadius: 4, background: '#0284c7', color: '#fff', border: 'none', fontWeight: 600 }}>Edit</button>
                        <button onClick={() => handleDelete(banner._id)} style={{ padding: '4px 12px', borderRadius: 4, background: '#ef4444', color: '#fff', border: 'none', fontWeight: 600 }}>Delete</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
