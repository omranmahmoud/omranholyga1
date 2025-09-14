import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { resolveImagePath } from '../../utils/images';
import { useStore } from '../../context/StoreContext';

type SubCategory = { name: string; slug: string };
type NavCategory = {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  order?: number;
  subCategories?: SubCategory[];
};

type CatalogCategory = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
};

type CategoriesMegaMenuProps = {
  externalOpen?: boolean;
  externalActiveId?: string | null;
  onRequestClose?: () => void;
};

export function CategoriesMegaMenu({ externalOpen, externalActiveId, onRequestClose }: CategoriesMegaMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [navCats, setNavCats] = React.useState<NavCategory[]>([]);
  const [cats, setCats] = React.useState<CatalogCategory[]>([]);
  const [internalActiveId, setInternalActiveId] = React.useState<string | null>(null);
  const { settings } = useStore();
  const [featuredNewImg, setFeaturedNewImg] = React.useState<string | undefined>(undefined);
  const [newInAvail, setNewInAvail] = React.useState<Record<string, boolean>>({});
  const [newInImageByNav, setNewInImageByNav] = React.useState<Record<string, string | undefined>>({});
  const [topRatedAvail, setTopRatedAvail] = React.useState<Record<string, boolean>>({});
  const [topRatedImageByNav, setTopRatedImageByNav] = React.useState<Record<string, string | undefined>>({});

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const portalRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [panelTop, setPanelTop] = React.useState<number>(96);
  const [panelLeft, setPanelLeft] = React.useState<number>(16);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const [navRes, catRes] = await Promise.all([
          api.getWithRetry('/navigation'),
          api.getWithRetry('/categories')
        ]);
        const nav: NavCategory[] = (navRes.data || [])
          .filter((c: NavCategory) => c.isActive)
          .sort((a: NavCategory, b: NavCategory) => (a.order ?? 0) - (b.order ?? 0));
        const cc: CatalogCategory[] = (catRes.data || [])
          .filter((c: CatalogCategory) => c.isActive ?? true);
        setNavCats(nav);
        setCats(cc);
    if (nav.length && !(externalActiveId ?? internalActiveId)) setInternalActiveId(nav[0]._id);
      } catch (e) {
        // non-blocking
      }
    };
    fetchAll();
  }, [externalActiveId, internalActiveId]);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const open = (externalOpen ?? false) || internalOpen;
      if (!open) return;
      const t = e.target as Node;
      const insideTrigger = containerRef.current?.contains(t);
      const insidePortal = portalRef.current?.contains(t);
      if (!insideTrigger && !insidePortal) {
        if (externalOpen !== undefined && onRequestClose) {
          onRequestClose();
        } else {
          setInternalOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [externalOpen, internalOpen, onRequestClose]);

  // Position panel below trigger and constrain viewport-wise
  React.useEffect(() => {
    const recalcPosition = () => {
      if (!((externalOpen ?? false) || internalOpen)) return;
      const rect = triggerRef.current?.getBoundingClientRect();
      const margin = 16;
      const gap = 8; // small space between trigger and panel
      const top = (rect?.bottom ?? 80) + gap;
      setPanelTop(Math.max(0, Math.round(top)));
      // Provisional left at trigger start
      const provisionalLeft = Math.max(margin, Math.round(rect?.left ?? margin));
      setPanelLeft(provisionalLeft);
      // After render, clamp to viewport using panel width
      requestAnimationFrame(() => {
        const w = portalRef.current?.offsetWidth ?? 0;
        if (w > 0) {
          const vw = window.innerWidth;
          const clampedLeft = Math.min(provisionalLeft, vw - margin - w);
          setPanelLeft(Math.max(margin, clampedLeft));
        }
      });
    };

    recalcPosition();
    window.addEventListener('resize', recalcPosition);
    return () => window.removeEventListener('resize', recalcPosition);
  }, [externalOpen, internalOpen]);

  // Prefer internal active while interacting inside the panel; fall back to external
  const activeId = internalActiveId != null ? internalActiveId : externalActiveId;
  const active = navCats.find(c => c._id === activeId) || null;
  const catMap = React.useMemo(() => {
    const map = new Map<string, CatalogCategory>();
    cats.forEach(c => map.set(c.slug, c));
    return map;
  }, [cats]);

  // Normalize image path so it works in the frontend app
  const resolveImage = React.useCallback((img?: string) => resolveImagePath(img), []);

  // Load featured New In product image if configured
  React.useEffect(() => {
    const loadFeatured = async () => {
      try {
        const pid = (settings as any)?.featuredNewProductId as string | undefined | null;
        if (!pid) { setFeaturedNewImg(undefined); return; }
        const res = await api.getWithRetry(`/products/${pid}`);
        const p = res.data;
        const firstColorImage = Array.isArray(p?.colors) && p.colors.length && Array.isArray(p.colors[0]?.images) && p.colors[0].images.length
          ? p.colors[0].images[0]
          : (Array.isArray(p?.images) && p.images.length ? p.images[0] : undefined);
        setFeaturedNewImg(resolveImage(firstColorImage));
      } catch {
        setFeaturedNewImg(undefined);
      }
    };
    loadFeatured();
  }, [settings, resolveImage]);

  // Check if "New In" exists for the active navigation category (cached per nav id)
  React.useEffect(() => {
    const checkActiveNewIn = async () => {
      const navId = active?._id;
      if (!navId) return;
      if (newInAvail[navId] !== undefined) return; // already cached
      let subCatIds = (active.subCategories || [])
        .map(sc => catMap.get(sc.slug)?._id)
        .filter((id): id is string => Boolean(id));
      if (subCatIds.length === 0) {
        const fallbackId = catMap.get(active.slug)?._id;
        if (fallbackId) subCatIds = [fallbackId];
      }
      if (subCatIds.length === 0) {
        setNewInAvail(prev => ({ ...prev, [navId]: false }));
        setNewInImageByNav(prev => ({ ...prev, [navId]: undefined }));
        return;
      }
      try {
        const res = await api.getWithRetry('/products', { params: { isNew: true, categories: subCatIds.join(',') } } as any);
        const arr: any[] = Array.isArray(res.data) ? res.data : [];
        const hasAny = arr.length > 0;
        setNewInAvail(prev => ({ ...prev, [navId]: hasAny }));
        if (hasAny) {
          // Choose the latest by createdAt (fallback to first)
          let latest = arr[0];
          try {
            latest = arr.slice().sort((a, b) => {
              const da = new Date(a?.createdAt || 0).getTime();
              const db = new Date(b?.createdAt || 0).getTime();
              return db - da;
            })[0] || arr[0];
          } catch {}
          const firstColorImage = Array.isArray(latest?.colors) && latest.colors.length && Array.isArray(latest.colors[0]?.images) && latest.colors[0].images.length
            ? latest.colors[0].images[0]
            : (Array.isArray(latest?.images) && latest.images.length ? latest.images[0] : undefined);
          const img = resolveImage(firstColorImage);
          setNewInImageByNav(prev => ({ ...prev, [navId]: img }));
        } else {
          setNewInImageByNav(prev => ({ ...prev, [navId]: undefined }));
        }
      } catch {
        setNewInAvail(prev => ({ ...prev, [navId]: false }));
        setNewInImageByNav(prev => ({ ...prev, [navId]: undefined }));
      }
    };
    checkActiveNewIn();
  }, [active, catMap, newInAvail]);

  // Check if "Top Rated" exists for the active navigation category (cached per nav id)
  React.useEffect(() => {
    const checkActiveTopRated = async () => {
      const navId = active?._id;
      if (!navId) return;
      if (topRatedAvail[navId] !== undefined) return; // already cached
      let subCatIds = (active.subCategories || [])
        .map(sc => catMap.get(sc.slug)?._id)
        .filter((id): id is string => Boolean(id));
      if (subCatIds.length === 0) {
        const fallbackId = catMap.get(active.slug)?._id;
        if (fallbackId) subCatIds = [fallbackId];
      }
      if (subCatIds.length === 0) {
        setTopRatedAvail(prev => ({ ...prev, [navId]: false }));
        return;
      }
      try {
        // Fetch products in scope with rating filter and pick best image
        const res = await api.getWithRetry('/products', { params: { categories: subCatIds.join(','), minRating: 4 } } as any);
        const arr: any[] = Array.isArray(res.data) ? res.data : [];
        const hasTop = arr.length > 0;
        setTopRatedAvail(prev => ({ ...prev, [navId]: hasTop }));
        if (hasTop) {
          let best = arr[0];
          try {
            best = arr.slice().sort((a, b) => {
              const rb = (b?.rating || 0) - (a?.rating || 0);
              if (rb !== 0) return rb;
              const da = new Date(a?.createdAt || 0).getTime();
              const db = new Date(b?.createdAt || 0).getTime();
              return db - da;
            })[0] || arr[0];
          } catch {}
          const imgRaw = (Array.isArray(best?.colors) && best.colors.length && Array.isArray(best.colors[0]?.images) && best.colors[0].images.length)
            ? best.colors[0].images[0]
            : (Array.isArray(best?.images) && best.images.length ? best.images[0] : undefined);
          const img = resolveImage(imgRaw);
          setTopRatedImageByNav(prev => ({ ...prev, [navId]: img }));
        } else {
          setTopRatedImageByNav(prev => ({ ...prev, [navId]: undefined }));
        }
      } catch {
        setTopRatedAvail(prev => ({ ...prev, [navId]: false }));
        setTopRatedImageByNav(prev => ({ ...prev, [navId]: undefined }));
      }
    };
    checkActiveTopRated();
  }, [active, catMap, topRatedAvail]);

  const tiles: { key: string; name: string; to: string; image?: string }[] = React.useMemo(() => {
    const placeholder = '/placeholder-image.jpg';
    const items: { key: string; name: string; to: string; image?: string }[] = [];
    if (active) {
      // Build category-scoped links using mapped subcategory ids for the active navigation category
        let scopeCatIds = (active.subCategories || [])
          .map(sc => catMap.get(sc.slug)?._id)
          .filter((id): id is string => Boolean(id));
        if (scopeCatIds.length === 0) {
          const fallbackId = catMap.get(active.slug)?._id;
          if (fallbackId) scopeCatIds = [fallbackId];
        }
        // View All should show only products related to this category scope
        const viewAllTo = scopeCatIds.length
          ? `/products?categories=${encodeURIComponent(scopeCatIds.join(','))}`
          : `/products`;
        items.push({ key: 'view-all', name: 'View All', to: viewAllTo, image: placeholder });
        // Build category-scoped New In link using mapped category ids
        const categoriesParam = scopeCatIds.length ? `&categories=${encodeURIComponent(scopeCatIds.join(','))}` : '';
      if (newInAvail[active._id]) {
        items.push({ key: 'new-in', name: 'New In', to: `/products?isNew=true${categoriesParam}` , image: newInImageByNav[active._id] || featuredNewImg || placeholder });
      }
      if (topRatedAvail[active._id]) {
        const topRatedTo = scopeCatIds.length
          ? `/products?categories=${encodeURIComponent(scopeCatIds.join(','))}&topRated=true`
          : '/products?topRated=true';
        items.push({ key: 'top-rated', name: 'Top Rated', to: topRatedTo, image: topRatedImageByNav[active._id] || placeholder });
      }

      // Derived from subCategories
      const subs = active.subCategories || [];
      subs.forEach(sc => {
        const cat = catMap.get(sc.slug);
        // Link to products page with category filter by catalog category id
        const to = cat?._id ? `/products?category=${encodeURIComponent(cat._id)}` : '/products';
        items.push({
          key: `sc-${sc.slug}`,
          name: sc.name,
          to,
          image: resolveImage(cat?.image) || placeholder
        });
      });
    }
    return items.slice(0, 12);
  }, [active, catMap, resolveImage, featuredNewImg, newInAvail, newInImageByNav, topRatedAvail, topRatedImageByNav]);

  const headerText = React.useMemo(() => {
    if (!active) return 'SHOP BY CATEGORY';
    return active.name.toUpperCase();
  }, [active]);

  const handleMouseEnter = () => {
    // Only manage internal state if not externally controlled
    if (externalOpen === undefined) setInternalOpen(true);
  };
  const closeMenu = () => {
    if (externalOpen !== undefined) {
      onRequestClose?.();
    } else {
      setInternalOpen(false);
    }
  };

  const setActive = (id: string) => {
    setInternalActiveId(id);
    // If externally controlled, notify parent via the same nav-hover event used by top links
    if (externalOpen !== undefined) {
      const evt = new CustomEvent('nav-hover', { detail: { id } });
      window.dispatchEvent(evt);
    }
  };

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  return (
    <div className="relative" ref={containerRef}
      onMouseEnter={handleMouseEnter}
    >
      <button
        ref={triggerRef}
        className="flex items-center gap-1 hover:theme-primary font-medium py-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setInternalOpen(o => !o)}
        style={{
          color: settings?.navCategoryFontColor || undefined,
          fontSize: settings?.navCategoryFontSize === 'small' ? '0.875rem' : settings?.navCategoryFontSize === 'large' ? '1.125rem' : undefined
        }}
      >
        Categories
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mega menu panel */}
      {isOpen && createPortal(
        <div ref={portalRef} className="fixed z-[60]" style={{ top: panelTop, left: panelLeft }}>
          <div
            className="theme-background-bg rounded-2xl shadow-xl ring-1 ring-gray-200 overflow-hidden"
            style={{
              width: 'calc(100vw - 32px)',
              maxWidth: '1000px',
              maxHeight: `calc(100vh - ${panelTop + 16}px)`,
              overflowY: 'auto'
            }}
            onMouseLeave={() => { setInternalActiveId(null); closeMenu(); }}
          >
            <div className="grid grid-cols-12">
              {/* Left list */}
              <div className="col-span-4 border-r border-gray-100 p-2">
                {navCats.map(c => (
                  <button
                    key={c._id}
                    onMouseEnter={() => setActive(c._id)}
                    onFocus={() => setActive(c._id)}
                    onClick={() => setActive(c._id)}
                    className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-lg mb-1 transition-colors ${
                      c._id === activeId ? 'text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    style={{
                      color: settings?.navPanelFontColor || settings?.navCategoryFontColor || undefined,
                      backgroundColor: c._id === activeId ? (settings?.navPanelColumnActiveBgColor || '#f3f4f6') : undefined,
                      fontSize: settings?.navCategoryFontSize === 'small' ? '0.875rem' : settings?.navCategoryFontSize === 'large' ? '1.125rem' : undefined
                    }}
                  >
                    <span className="truncate">{c.name}</span>
                    <ChevronRight className="w-4 h-4" style={{ color: settings?.navPanelAccentColor || '#9ca3af' }} />
                  </button>
                ))}
              </div>

              {/* Right grid */}
              <div className="col-span-8 p-6">
                <h4 className="text-sm font-semibold tracking-wide mb-4" style={{ color: settings?.navPanelHeaderColor || undefined }}>{headerText}</h4>
                <div className="grid grid-cols-3 gap-3">
                  {tiles.map(t => {
                    const isViewAll = t.key === 'view-all';
                    return (
                      <Link key={t.key} to={t.to} className="group flex flex-col items-center gap-2">
            {isViewAll ? (
                          <div className="w-16 h-16 rounded-full bg-gray-200/80 flex items-center justify-center shadow-sm ring-1 ring-gray-200 group-hover:ring-indigo-400 transition">
                            {isViewAll && (
                              <svg className="w-6 h-6 text-gray-900 group-hover:text-indigo-600 transition-colors" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <rect x="5" y="5" width="5" height="5" rx="1" />
                                <rect x="14" y="5" width="5" height="5" rx="1" />
                                <rect x="5" y="14" width="5" height="5" rx="1" />
                                <rect x="14" y="14" width="5" height="5" rx="1" />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full overflow-hidden transition bg-gray-100" style={{ boxShadow: `inset 0 0 0 1px ${settings?.navPanelAccentColor || '#e5e7eb'}` }}>
              <img src={t.image || '/placeholder-image.jpg'} alt={t.name} className="w-full h-full object-cover" onError={(e: any) => { e.currentTarget.src = '/placeholder-image.jpg'; }} />
                          </div>
                        )}
                        <div className="text-xs text-center leading-tight hover:underline" style={{ color: settings?.navPanelFontColor || undefined }}>
                          {t.name}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default CategoriesMegaMenu;
