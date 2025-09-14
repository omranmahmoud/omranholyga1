import React from 'react';
import Marquee from 'react-fast-marquee';
import { Star } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export function MarqueeText() {
  const { announcements } = useStore();

  if (!announcements || announcements.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
      <Marquee
        speed={50}
        gradient={true}
        gradientColor={[79, 70, 229]}
        gradientWidth={50}
      >
        {announcements.map((announcement) => (
          <span key={announcement._id} className="mx-8 py-3 inline-flex items-center">
            <Star className="w-4 h-4 mr-2" />
            {announcement.text}
          </span>
        ))}
      </Marquee>
    </div>
  );
}