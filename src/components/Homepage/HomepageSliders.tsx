import React from 'react';
import api from '../../services/api';
import { resolveImagePath } from '../../utils/images';
import { Link } from 'react-router-dom';

interface SliderItem { _id: string; title?: string; image: string; link?: string; order: number; active: boolean; }

export function HomepageSliders() {
  const [items, setItems] = React.useState<SliderItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getWithRetry('/homepage/sliders');
        if (!mounted) return;
        const data = (res.data || []) as SliderItem[];
        setItems(data.filter(i => i.active).sort((a,b)=>a.order-b.order));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load sliders');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="h-40 flex items-center justify-center text-red-500 text-sm">{error}</div>;
  if (!items.length) return null;

  // Simple responsive slider (no external deps). Could be enhanced later.
  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => {
          const img = resolveImagePath(item.image) || '/placeholder-image.jpg';
          const content = (
            <img src={img} alt={item.title || 'Banner'} className="w-full h-auto object-contain rounded-lg" />
          );
          return (
            <div key={item._id} className="group">
              {item.link ? (
                <Link to={item.link}>{content}</Link>
              ) : content}
              {item.title && (
                <div className="mt-2 text-sm text-gray-700 truncate">{item.title}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HomepageSliders;
