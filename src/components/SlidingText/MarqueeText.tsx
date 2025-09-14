import React, { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import { Star } from 'lucide-react';
import { useStore } from '../../context/store';

// Local extension to optionally include styling fields if backend sends them
type ExtendedAnnouncement = ReturnType<typeof useStore>['announcements'][number] & {
  fontSize?: string;
  textColor?: string;
  backgroundColor?: string;
  description?: string;
};

export function MarqueeText() {
  const { announcements } = useStore();
  const [activeAnnouncements, setActiveAnnouncements] = useState<ExtendedAnnouncement[]>([]);

  useEffect(() => {
    if (Array.isArray(announcements) && announcements.length > 0) {
      setActiveAnnouncements(announcements.filter(a => a.isActive) as ExtendedAnnouncement[]);
    }
  }, [announcements]);

  if (!activeAnnouncements.length) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
      style={{
        backgroundColor: activeAnnouncements[0]?.backgroundColor || 'rgb(79, 70, 229)'
      }}
    >
  <Marquee speed={50} gradient={false}>
        {activeAnnouncements.map((announcement) => (
          <span
            key={announcement._id}
            className="mx-8 py-3 inline-flex items-center"
            style={{
              color: (announcement as any).textColor || '#FFFFFF',
              fontSize: (() => {
                const fs = (announcement as any).fontSize;
                switch (fs) {
                  case 'xs': return '0.75rem';
                  case 'sm': return '0.875rem';
                  case 'base': return '1rem';
                  case 'lg': return '1.125rem';
                  case 'xl': return '1.25rem';
                  default: return '0.875rem';
                }
              })()
            }}
          >
            <Star className="w-4 h-4 mr-2" />
            {announcement.text}
            {(announcement as any).description && (
              <span className="ml-2 opacity-80 text-xs">{(announcement as any).description}</span>
            )}
          </span>
        ))}
      </Marquee>
    </div>
  );
}