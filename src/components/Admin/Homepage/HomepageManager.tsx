import { useEffect, useMemo, useState } from 'react';
import api from '../../../services/api';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Link as LinkIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SliderItem { _id: string; title: string; image: string; link?: string; order: number; active: boolean; labelBgType?: LabelBgType; labelBgColor?: string; labelBgOpacity?: number; labelTextColor?: string; }
type LabelBgType = 'gradient' | 'solid' | 'none';
interface SideBanner { _id: string; label: string; image: string; link?: string; side: 'left'|'right'; position: number; active: boolean; labelBgType?: LabelBgType; labelBgColor?: string; labelBgOpacity?: number; labelTextColor?: string; }

export function HomepageManager() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [sideBanners, setSideBanners] = useState<SideBanner[]>([]);
  const [showSideBannerModal, setShowSideBannerModal] = useState(false);
  const [editingSideBanner, setEditingSideBanner] = useState<SideBanner | null>(null);
  // loading handled implicitly by UI; keep UX snappy

  const loadAll = async () => {
    try {
      const [s, b] = await Promise.all([
        api.getWithRetry('/homepage/sliders'),
        api.getWithRetry('/homepage/side-banners')
      ]);
      setSliders(s.data || []);
      setSideBanners(b.data || []);
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Failed to load homepage data');
  } finally { /* no-op */ }
  };

  useEffect(() => { loadAll(); }, []);

  const upload = async (file: File, kind: 'banners'|'side-banners') => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.postWithRetry(`/uploads/${kind}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.path as string;
  };

  const [showSliderModal, setShowSliderModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState<SliderItem | null>(null);

  const createSlider = async (payload: { file: File; title: string; link?: string; labelBgType: LabelBgType; labelBgColor: string; labelBgOpacity: number; labelTextColor: string; ctaEnabled: boolean; ctaText: string; ctaUrl: string; ctaBgColor: string; ctaTextColor: string; ctaStyle: 'solid'|'outline'; ctaRounded: boolean; ctaPosition: string; }) => {
    const image = await upload(payload.file, 'banners');
    const res = await api.postWithRetry('/homepage/sliders', { image, title: payload.title, link: payload.link, active: true, labelBgType: payload.labelBgType, labelBgColor: payload.labelBgColor, labelBgOpacity: payload.labelBgOpacity, labelTextColor: payload.labelTextColor, ctaEnabled: payload.ctaEnabled, ctaText: payload.ctaText, ctaUrl: payload.ctaUrl, ctaBgColor: payload.ctaBgColor, ctaTextColor: payload.ctaTextColor, ctaStyle: payload.ctaStyle, ctaRounded: payload.ctaRounded, ctaPosition: payload.ctaPosition });
    setSliders((prev) => [...prev, res.data]);
    toast.success('Slider added');
  };

  const updateSlider = async (id: string, payload: Partial<SliderItem>) => {
    const res = await api.putWithRetry(`/homepage/sliders/${id}`, payload);
    setSliders(prev => prev.map(x => x._id === id ? res.data : x));
    toast.success('Updated');
  };

  const SliderModal = () => {
    const isEdit = !!editingSlider;
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState(editingSlider?.title || '');
    const [link, setLink] = useState(editingSlider?.link || '');
  const [labelBgType, setLabelBgType] = useState<LabelBgType>(editingSlider?.labelBgType || 'gradient');
    const [labelBgColor, setLabelBgColor] = useState<string>(editingSlider?.labelBgColor || '#000000');
    const [labelBgOpacity, setLabelBgOpacity] = useState<number>(editingSlider?.labelBgOpacity ?? 60);
    const [labelTextColor, setLabelTextColor] = useState<string>(editingSlider?.labelTextColor || '#FFFFFF');
  const [ctaEnabled, setCtaEnabled] = useState<boolean>((editingSlider as any)?.ctaEnabled ?? false);
  const [ctaText, setCtaText] = useState<string>((editingSlider as any)?.ctaText || 'Shop Now');
  const [ctaUrl, setCtaUrl] = useState<string>((editingSlider as any)?.ctaUrl || '');
  const [ctaBgColor, setCtaBgColor] = useState<string>((editingSlider as any)?.ctaBgColor || '#111827');
  const [ctaTextColor, setCtaTextColor] = useState<string>((editingSlider as any)?.ctaTextColor || '#FFFFFF');
  const [ctaStyle, setCtaStyle] = useState<'solid'|'outline'>(((editingSlider as any)?.ctaStyle as 'solid'|'outline') || 'solid');
  const [ctaRounded, setCtaRounded] = useState<boolean>((editingSlider as any)?.ctaRounded ?? true);
  const [ctaPosition, setCtaPosition] = useState<string>((editingSlider as any)?.ctaPosition || 'bottom-left');

    const onClose = () => { setShowSliderModal(false); setEditingSlider(null); };
    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isEdit && editingSlider) {
          await updateSlider(editingSlider._id, { title, link, labelBgType, labelBgColor, labelBgOpacity, labelTextColor, ...(ctaEnabled ? { ctaEnabled, ctaText, ctaUrl, ctaBgColor, ctaTextColor, ctaStyle, ctaRounded, ctaPosition } : { ctaEnabled: false }) });
        } else {
          if (!file) { toast.error('Please select an image'); return; }
          await createSlider({ file, title, link, labelBgType, labelBgColor, labelBgOpacity, labelTextColor, ctaEnabled, ctaText, ctaUrl, ctaBgColor, ctaTextColor, ctaStyle, ctaRounded, ctaPosition });
        }
        onClose();
      } catch { toast.error('Failed to save'); }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <form onSubmit={onSubmit} className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Banner' : 'Add Banner'}</h3>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
              <input value={link} onChange={(e)=>setLink(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Label Appearance</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Background Type</label>
                <select value={labelBgType} onChange={(e)=>setLabelBgType(e.target.value as LabelBgType)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Background Color</label>
                <input type="color" value={labelBgColor} onChange={(e)=>setLabelBgColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Opacity: {labelBgOpacity}%</label>
                <input type="range" min={0} max={100} step={1} value={labelBgOpacity} onChange={(e)=>setLabelBgOpacity(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Text Color</label>
                <input type="color" value={labelTextColor} onChange={(e)=>setLabelTextColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
            </div>
            <div className="mt-6 border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Button (CTA)</div>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={ctaEnabled} onChange={(e)=>setCtaEnabled(e.target.checked)} /> Enable
                </label>
              </div>
              {ctaEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Text</label>
                    <input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">URL</label>
                    <input value={ctaUrl} onChange={(e)=>setCtaUrl(e.target.value)} className="w-full border rounded px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Button Style</label>
                    <select value={ctaStyle} onChange={(e)=>setCtaStyle(e.target.value as 'solid'|'outline')} className="w-full border rounded px-3 py-2 text-sm">
                      <option value="solid">Solid</option>
                      <option value="outline">Outline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Rounded</label>
                    <select value={ctaRounded ? 'yes':'no'} onChange={(e)=>setCtaRounded(e.target.value==='yes')} className="w-full border rounded px-3 py-2 text-sm">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Button BG</label>
                    <input type="color" value={ctaBgColor} onChange={(e)=>setCtaBgColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Button Text</label>
                    <input type="color" value={ctaTextColor} onChange={(e)=>setCtaTextColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium mb-1">Position</label>
                    <select value={ctaPosition} onChange={(e)=>setCtaPosition(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="middle-left">Middle Left</option>
                      <option value="center">Center</option>
                      <option value="middle-right">Middle Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-right">Bottom Right</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Preview</div>
              <div className="relative w-full max-w-[911px] h-[200px] bg-gray-100 rounded-lg overflow-hidden">
                {isEdit ? (
                  <img src={editingSlider?.image} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : file ? (
                  <img src={URL.createObjectURL(file)} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <div className="absolute inset-0 flex items-center">
                  <span className="ml-3 px-3 py-1 rounded-lg text-base font-semibold" style={{
                    ...(labelBgType==='none' ? { backgroundColor: 'transparent', color: labelTextColor, border: '1px solid #e5e7eb' } : {}),
                    ...(labelBgType==='solid' ? { backgroundColor: hexToRgba(labelBgColor, labelBgOpacity/100), color: labelTextColor } : {}),
                    ...(labelBgType==='gradient' ? { background: `linear-gradient(to right, ${hexToRgba(labelBgColor, labelBgOpacity/100)} 0%, ${hexToRgba(labelBgColor, 0)} 100%)`, color: labelTextColor } : {}),
                  } as any}>
                    {title || 'Banner Title'}
                  </span>
                  {ctaEnabled && (
                    <span
                      className={`ml-3 px-3 py-1 text-sm font-medium ${ctaRounded ? 'rounded-full':'rounded'} ${ctaStyle==='outline'?'border':''}`}
                      style={{
                        backgroundColor: ctaStyle==='solid' ? ctaBgColor : 'transparent',
                        color: ctaTextColor,
                        borderColor: ctaStyle==='outline' ? ctaBgColor : undefined,
                      }}
                    >{ctaText || 'Shop Now'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">{isEdit ? 'Save Changes' : 'Add'}</button>
          </div>
        </form>
      </div>
    );
  };

  const updateSideBanner = async (id: string, payload: Partial<SideBanner>) => {
    const res = await api.putWithRetry(`/homepage/side-banners/${id}`, payload);
    setSideBanners(prev => prev.map(x => x._id === id ? res.data : x));
    toast.success('Updated');
  };

  const hexToRgba = (hex: string, alpha: number) => {
    try {
      const clean = hex.replace('#','');
      const bigint = parseInt(clean.length===3 ? clean.split('').map(c=>c+c).join('') : clean, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch { return `rgba(0,0,0,${alpha})`; }
  };

  const LabelPreview = ({ b }: { b: SideBanner }) => {
    const type: LabelBgType = b.labelBgType || 'gradient';
    const color = b.labelBgColor || '#000000';
    const opacity = (b.labelBgOpacity ?? 60) / 100;
    const text = b.labelTextColor || '#FFFFFF';
    const style = useMemo(() => {
      if (type === 'none') return { backgroundColor: 'transparent', color: text, border: '1px solid #e5e7eb' };
      if (type === 'solid') return { backgroundColor: hexToRgba(color, opacity), color: text };
      return { background: `linear-gradient(to right, ${hexToRgba(color, opacity)} 0%, ${hexToRgba(color, 0)} 100%)`, color: text };
    }, [type, color, opacity, text]);
    return (
      <div className="ml-3 px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2" style={style as any}>
        <GripVertical className="w-4 h-4" /> {b.label}
      </div>
    );
  };

  const SideBannerModal = () => {
    const isEdit = !!editingSideBanner;
    const [file, setFile] = useState<File | null>(null);
    const [label, setLabel] = useState(editingSideBanner?.label || '');
    const [side, setSide] = useState<'left'|'right'>(editingSideBanner?.side || 'left');
    const [link, setLink] = useState(editingSideBanner?.link || '');
    const [labelBgType, setLabelBgType] = useState<LabelBgType>(editingSideBanner?.labelBgType || 'gradient');
    const [labelBgColor, setLabelBgColor] = useState<string>(editingSideBanner?.labelBgColor || '#000000');
    const [labelBgOpacity, setLabelBgOpacity] = useState<number>(editingSideBanner?.labelBgOpacity ?? 60);
    const [labelTextColor, setLabelTextColor] = useState<string>(editingSideBanner?.labelTextColor || '#FFFFFF');

    const onClose = () => { setShowSideBannerModal(false); setEditingSideBanner(null); };

    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isEdit && editingSideBanner) {
          await updateSideBanner(editingSideBanner._id, { label, link, side, labelBgType, labelBgColor, labelBgOpacity, labelTextColor });
        } else {
          if (!file) { toast.error('Please select an image'); return; }
          const image = await upload(file, 'side-banners');
          const res = await api.postWithRetry('/homepage/side-banners', { image, label, side, link, active: true, labelBgType, labelBgColor, labelBgOpacity, labelTextColor });
          setSideBanners(prev => [...prev, res.data]);
          toast.success('Side banner added');
        }
        onClose();
      } catch {
        toast.error('Failed to save');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <form onSubmit={onSubmit} className="relative bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Category Box' : 'Add Category Box'}</h3>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input value={label} onChange={(e)=>setLabel(e.target.value)} className="w-full border rounded px-3 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Side</label>
              <select value={side} onChange={(e)=>setSide(e.target.value as 'left'|'right')} className="w-full border rounded px-3 py-2">
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Link URL (optional)</label>
              <input value={link} onChange={(e)=>setLink(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-2">Label Appearance</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Background Type</label>
                <select value={labelBgType} onChange={(e)=>setLabelBgType(e.target.value as LabelBgType)} className="w-full border rounded px-3 py-2 text-sm">
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Background Color</label>
                <input type="color" value={labelBgColor} onChange={(e)=>setLabelBgColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Opacity: {labelBgOpacity}%</label>
                <input type="range" min={0} max={100} step={1} value={labelBgOpacity} onChange={(e)=>setLabelBgOpacity(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Text Color</label>
                <input type="color" value={labelTextColor} onChange={(e)=>setLabelTextColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Preview</div>
              <div className="relative w-full max-w-md aspect-[3/1] bg-gray-100 rounded-lg overflow-hidden">
                <img src={isEdit ? editingSideBanner?.image : (file ? URL.createObjectURL(file) : '')} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center">
                  <div className="ml-3 px-3 py-1 rounded-lg text-sm inline-flex items-center gap-2" style={{
                    ...(labelBgType==='none' ? { backgroundColor: 'transparent', color: labelTextColor, border: '1px solid #e5e7eb' } : {}),
                    ...(labelBgType==='solid' ? { backgroundColor: hexToRgba(labelBgColor, labelBgOpacity/100), color: labelTextColor } : {}),
                    ...(labelBgType==='gradient' ? { background: `linear-gradient(to right, ${hexToRgba(labelBgColor, labelBgOpacity/100)} 0%, ${hexToRgba(labelBgColor, 0)} 100%)`, color: labelTextColor } : {}),
                  } as any}>
                    <GripVertical className="w-4 h-4" /> {label || 'Category Label'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white">{isEdit ? 'Save Changes' : 'Add'}</button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage Manager</h1>
        <p className="text-sm text-gray-500">Manage sliders and side category banners</p>
      </div>

      {/* Sliders */}
      <section className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sliders</h2>
          <button onClick={()=>{ setEditingSlider(null); setShowSliderModal(true); }} className="inline-flex items-center gap-2 cursor-pointer text-indigo-600 hover:text-indigo-700">
            <Plus className="w-4 h-4" /> Add Banner
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sliders.sort((a,b)=>a.order-b.order).map((s)=> (
            <div key={s._id} className="border rounded-lg overflow-hidden bg-white group">
              <div className="relative aspect-[16/9] bg-gray-100">
                <img src={s.image} alt={s.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-2 left-2 inline-flex items-center gap-2 bg-black/50 text-white px-2 py-1 rounded">
                  <GripVertical className="w-4 h-4" />
                  <span className="text-xs">Order: {s.order}</span>
                </div>
                <button
                  onClick={async()=>{ await api.putWithRetry(`/homepage/sliders/${s._id}`, { active: !s.active }); setSliders(prev=>prev.map(x=>x._id===s._id?{...x,active:!x.active}:x)); }}
                  className={`absolute top-2 right-2 p-2 rounded ${s.active?'bg-green-600':'bg-gray-400'} text-white`}
                  title={s.active?'Active':'Inactive'}
                >{s.active?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
              </div>
              <div className="p-3 space-y-2">
                <div className="font-medium truncate">{s.title || 'Untitled'}</div>
                <div className="text-xs text-gray-500 truncate inline-flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {s.link || '—'}</div>
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={()=>{ setEditingSlider(s); setShowSliderModal(true); }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded inline-flex items-center gap-1"
                  ><Pencil className="w-4 h-4"/> Edit</button>
                  <button
                    onClick={async()=>{ if(!confirm('Delete banner?')) return; await api.deleteWithRetry(`/homepage/sliders/${s._id}`); setSliders(prev=>prev.filter(x=>x._id!==s._id)); toast.success('Deleted'); }}
                    className="px-3 py-1 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded inline-flex items-center gap-1"
                  ><Trash2 className="w-4 h-4"/> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

  {/* Side Category Banners */}
      <section className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Side Category Banners</h2>
          <button onClick={()=>{ setEditingSideBanner(null); setShowSideBannerModal(true); }} className="inline-flex items-center gap-2 cursor-pointer text-indigo-600 hover:text-indigo-700">
            <Plus className="w-4 h-4" /> Add Category Box
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['left','right'] as const).map((side)=> (
            <div key={side}>
              <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">{side} column</h3>
              <div className="space-y-4">
                {sideBanners.filter(b=>b.side===side).sort((a,b)=>a.position-b.position).map((b)=> (
                  <div key={b._id} className="relative rounded-xl overflow-hidden border group">
                    <div className="aspect-[3/1] bg-gray-100">
                      <img src={b.image} alt={b.label} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute inset-0 flex items-center">
                      <LabelPreview b={b} />
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        onClick={async()=>{ await api.putWithRetry(`/homepage/side-banners/${b._id}`, { active: !b.active }); setSideBanners(prev=>prev.map(x=>x._id===b._id?{...x,active:!x.active}:x)); }}
                        className={`p-2 rounded ${b.active?'bg-green-600':'bg-gray-400'} text-white`}
                        title={b.active?'Active':'Inactive'}
                      >{b.active?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
                      <button
                        onClick={()=>{ setEditingSideBanner(b); setShowSideBannerModal(true); }}
                        className="p-2 bg-white/80 hover:bg-white rounded"
                        title="Edit"
                      ><Pencil className="w-4 h-4"/></button>
                      <button
                        onClick={async()=>{ if(!confirm('Delete item?')) return; await api.deleteWithRetry(`/homepage/side-banners/${b._id}`); setSideBanners(prev=>prev.filter(x=>x._id!==b._id)); toast.success('Deleted'); }}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                        title="Delete"
                      ><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

  {showSideBannerModal && <SideBannerModal />}
  {showSliderModal && <SliderModal />}

    </div>
  );
}

export default HomepageManager;
