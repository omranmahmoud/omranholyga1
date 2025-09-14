import React from 'react';
import api from '../../services/api';
import { resolveImagePath } from '../../utils/images';
import { Link } from 'react-router-dom';

interface SideBanner { _id: string; label: string; image: string; link?: string; side: 'left'|'right'; position: number; active: boolean; }

export function HomepageSideCategoryBanners() {
  const [left, setLeft] = React.useState<SideBanner[]>([]);
  const [right, setRight] = React.useState<SideBanner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getWithRetry('/homepage/side-banners');
        if (!mounted) return;
        const data = (res.data || []) as SideBanner[];
        const active = data.filter(i => i.active);
        setLeft(active.filter(b => b.side === 'left').sort((a,b)=>a.position-b.position));
        setRight(active.filter(b => b.side === 'right').sort((a,b)=>a.position-b.position));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load side banners');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="h-32 flex items-center justify-center text-red-500 text-sm">{error}</div>;
  if (!left.length && !right.length) return null;

  const BannerCard: React.FC<{ item: SideBanner }> = ({ item }) => {
    const img = resolveImagePath(item.image) || '/placeholder-image.jpg';
    const content = (
      <div className="overflow-hidden rounded-lg">
        <img src={img} alt={item.label} className="w-full h-auto object-contain" />
      </div>
    );
    return (
      <div className="group">
        {item.link ? <Link to={item.link}>{content}</Link> : content}
        <div className="mt-2 text-sm text-gray-700 truncate">{item.label}</div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        {left.map(item => (
          <BannerCard key={item._id} item={item} />
        ))}
      </div>
      <div className="space-y-4">
        {right.map(item => (
          <BannerCard key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default HomepageSideCategoryBanners;
