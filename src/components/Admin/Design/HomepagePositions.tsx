import { useEffect, useState, useCallback } from 'react';
import api from '../../../services/api';
import { ArrowUp, ArrowDown, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SliderItem { _id: string; title?: string; image: string; order: number; active: boolean; }
interface SideBanner { _id: string; label: string; image: string; side: 'left'|'right'; position: number; active: boolean; }

export function HomepagePositions() {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [left, setLeft] = useState<SideBanner[]>([]);
  const [right, setRight] = useState<SideBanner[]>([]);
  // light-weight, no explicit loading state needed

  const load = useCallback(async () => {
  try {
      const [s, b] = await Promise.all([
        api.getWithRetry('/homepage/sliders'),
        api.getWithRetry('/homepage/side-banners')
      ]);
      const slidersData = (s.data || []) as SliderItem[];
      const bannersData = (b.data || []) as SideBanner[];
      setSliders(slidersData.sort((a,b)=>a.order-b.order));
      setLeft(bannersData.filter(x=>x.side==='left').sort((a,b)=>a.position-b.position));
      setRight(bannersData.filter(x=>x.side==='right').sort((a,b)=>a.position-b.position));
    } catch (e:any) {
      toast.error(e?.response?.data?.message || 'Failed to load positions');
  } finally { /* no-op */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const move = <T extends { [k: string]: any }>(arr: T[], index: number, dir: -1 | 1) => {
    const next = [...arr];
    const ni = index + dir;
    if (ni < 0 || ni >= next.length) return arr;
    const tmp = next[index];
    next[index] = next[ni];
    next[ni] = tmp;
    return next;
  };

  const saveSliders = async () => {
    try {
      const payload = sliders.map((s, idx) => ({ id: s._id, order: idx + 1 }));
      await api.putWithRetry('/homepage/sliders/reorder', { order: payload });
      toast.success('Sliders order saved');
      await load();
    } catch { toast.error('Failed to save sliders order'); }
  };

  const saveSide = async (side: 'left'|'right') => {
    try {
      const list = side === 'left' ? left : right;
      const payload = list.map((b, idx) => ({ id: b._id, position: idx + 1 }));
      await api.putWithRetry('/homepage/side-banners/reorder', { side, order: payload });
      toast.success(`${side} column order saved`);
      await load();
    } catch { toast.error('Failed to save order'); }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Homepage Positions</h4>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded">
          <RefreshCw className="w-4 h-4"/> Refresh
        </button>
      </div>

      {/* Sliders order */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-gray-700">Sliders Order</div>
          <button onClick={saveSliders} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
            <Save className="w-4 h-4"/> Save Order
          </button>
        </div>
        <ul className="divide-y rounded border">
          {sliders.map((s, idx) => (
            <li key={s._id} className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex w-6 h-6 items-center justify-center text-xs bg-gray-100 rounded">{idx+1}</span>
                <div className="text-sm text-gray-800">{s.title || 'Untitled'}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={()=>setSliders(prev=>move(prev, idx, -1))} className="p-1.5 rounded hover:bg-gray-100" title="Up"><ArrowUp className="w-4 h-4"/></button>
                <button onClick={()=>setSliders(prev=>move(prev, idx, 1))} className="p-1.5 rounded hover:bg-gray-100" title="Down"><ArrowDown className="w-4 h-4"/></button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Side banners order */}
      <div className="grid md:grid-cols-2 gap-6">
        {(['left','right'] as const).map((side) => (
          <div key={side}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-700 capitalize">{side} Column</div>
              <button onClick={()=>saveSide(side)} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
                <Save className="w-4 h-4"/> Save {side}
              </button>
            </div>
            <ul className="divide-y rounded border">
              {(side==='left'?left:right).map((b, idx) => (
                <li key={b._id} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex w-6 h-6 items-center justify-center text-xs bg-gray-100 rounded">{idx+1}</span>
                    <div className="text-sm text-gray-800">{b.label}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=> (side==='left'? setLeft(prev=>move(prev, idx, -1)) : setRight(prev=>move(prev, idx, -1)))} className="p-1.5 rounded hover:bg-gray-100" title="Up"><ArrowUp className="w-4 h-4"/></button>
                    <button onClick={()=> (side==='left'? setLeft(prev=>move(prev, idx, 1)) : setRight(prev=>move(prev, idx, 1)))} className="p-1.5 rounded hover:bg-gray-100" title="Down"><ArrowDown className="w-4 h-4"/></button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomepagePositions;