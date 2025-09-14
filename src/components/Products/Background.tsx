import React from 'react';

export function Background() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top gradient */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent" />
      
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl" />
      <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl" />
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-white to-transparent" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMiAyaDU2djU2SDJ6IiBzdHJva2U9IiNFMkU4RjAiIHN0cm9rZS13aWR0aD0iMiIvPjwvZz48L3N2Zz4=')] opacity-[0.03]" />
    </div>
  );
}