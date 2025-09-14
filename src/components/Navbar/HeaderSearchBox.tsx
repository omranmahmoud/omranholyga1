import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function HeaderSearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState<string>('');
  const [suggestion, setSuggestion] = React.useState<string>('');
  const [showPlaceholder, setShowPlaceholder] = React.useState<boolean>(true);
  const [catNames, setCatNames] = React.useState<string[]>([]);
  const [, setCycleIndex] = React.useState<number>(0);
  const intervalRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const shuffle = (arr: string[]) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const loadCategories = async () => {
      try {
        const res = await api.getWithRetry('/categories');
        const cats = Array.isArray(res.data) ? res.data : [];
        const activeNames = cats
          .filter((c: any) => c?.isActive ?? true)
          .map((c: any) => String(c?.name || ''))
          .filter(Boolean);
        if (mounted && activeNames.length) {
          const randomized = shuffle(activeNames);
          setCatNames(randomized);
          setCycleIndex(0);
          setSuggestion(randomized[0] || '');
        }
      } catch (_) {
        // fallback handled by default placeholder
      }
    };
    loadCategories();
    return () => { mounted = false; };
  }, []);

  // Cycle placeholder while not typing and placeholder is shown
  React.useEffect(() => {
    const shouldCycle = showPlaceholder && !query && catNames.length > 1;
    if (!shouldCycle) {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current == null) {
      intervalRef.current = window.setInterval(() => {
        setCycleIndex(prev => {
          const next = (prev + 1) % catNames.length;
          setSuggestion(catNames[next] || '');
          return next;
        });
      }, 3000); // change every 3s
    }
    return () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [showPlaceholder, query, catNames]);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
  <div className="bg-transparent p-4 w-full">
    <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
        <input
          type="search"
          value={query}
      onChange={(e) => setQuery(e.target.value)}
      onFocus={() => setShowPlaceholder(false)}
      onBlur={() => { if (!query) setShowPlaceholder(true); }}
      placeholder={showPlaceholder ? (suggestion || 'Search products...') : ''}
          className="w-full pl-4 pr-16 py-3 bg-white text-gray-900 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 placeholder:text-gray-500 text-sm"
          aria-label="Search products"
        />
        <button
          type="submit"
          title="Search"
          aria-label="Search"
          className="absolute right-2 top-2 bottom-2 px-4 rounded-md bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}