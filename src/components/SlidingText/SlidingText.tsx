import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Truck, Sparkles, Clock, CreditCard, Star, Gift, Heart, Tag } from 'lucide-react';
import api from '../../services/api';

interface Announcement {
  _id: string;
  text: string;
  url?: string;
  icon: string;
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  isActive: boolean;
}

const iconMap = {
  Truck,
  Sparkles,
  Clock,
  CreditCard,
  Star,
  Gift,
  Heart,
  Tag
};

export function SlidingText() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
  const response = await api.getWithRetry('/announcements/active?platform=web');
        setAnnouncements(response.data);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
  }, []);

  // Ensure layout updates header padding after announcements change the header height
  useEffect(() => {
    // trigger MainLayout's resize handler to recalc --header-h
    try { window.dispatchEvent(new Event('resize')); } catch {}
  }, [announcements.length]);

  // Decide a unified bar background; if all equal, use that; otherwise use the first one's color
  const barBg = useMemo(() => {
    if (!announcements.length) return '#4F46E5';
    const first = announcements[0]?.backgroundColor || '#4F46E5';
    const allSame = announcements.every(a => (a.backgroundColor || first) === first);
    return allSame ? first : first;
  }, [announcements]);

  if (announcements.length === 0) return null;

  return (
    <div className="overflow-hidden" style={{ background: barBg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {announcements.length > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {announcements.map((a, idx) => {
              const Icon = iconMap[a.icon as keyof typeof iconMap] || Star;
              const color = a.textColor || '#FFFFFF';
              const fontSize = a.fontSize || 'sm';
              const content = (
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className={`text-${fontSize} font-medium whitespace-nowrap`} style={{ color }}>
                    {a.text}
                  </span>
                  {a.url && <ArrowRight className="w-4 h-4" style={{ color }} />}
                </div>
              );
              return (
                <div key={`${a._id}-${idx}`} className="flex items-center">
                  {a.url ? (
                    <a href={a.url} className="no-underline" style={{ color }}>
                      {content}
                    </a>
                  ) : (
                    content
                  )}
                  {idx < announcements.length - 1 && (
                    <span className="mx-3 opacity-40 select-none" style={{ color }}>|</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {(() => {
              const a = announcements[0];
              const Icon = iconMap[a.icon as keyof typeof iconMap] || Star;
              const color = a.textColor || '#FFFFFF';
              return (
                <>
                  <Icon className="w-4 h-4" style={{ color }} />
                  {a.url ? (
                    <a
                      href={a.url}
                      className={`no-underline text-${a.fontSize || 'sm'} font-medium`}
                      style={{ color }}
                    >
                      {a.text}
                    </a>
                  ) : (
                    <span className={`text-${a.fontSize || 'sm'} font-medium`} style={{ color }}>
                      {a.text}
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}