import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { resolveImagePath } from '../../utils/images';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SliderItem = { _id: string; title?: string; image: string; link?: string; order: number; active: boolean; labelBgType?: 'gradient'|'solid'|'none'; labelBgColor?: string; labelBgOpacity?: number; labelTextColor?: string };
type SideBanner = { _id: string; label?: string; image: string; link?: string; side: 'left'|'right'; position: number; active: boolean; labelBgType?: 'gradient'|'solid'|'none'; labelBgColor?: string; labelBgOpacity?: number; labelTextColor?: string };

export interface CarouselWithSideBannersSettings {
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  intervalMs?: number; // autoplay interval
  showArrows?: boolean;
  showDots?: boolean;
  centerHeight?: 'sm'|'md'|'lg';
  // label appearance
  labelBgType?: 'gradient' | 'solid' | 'none';
  labelBgColor?: string; // hex color
  labelBgOpacity?: number; // 0..100
  labelTextColor?: string; // hex color
  // per-item overrides by banner/slide _id
  labelStylesById?: Record<string, {
    bgType?: 'gradient' | 'solid' | 'none';
    bgColor?: string;
    bgOpacity?: number;
    textColor?: string;
  }>;
}

interface Props {
  settings?: CarouselWithSideBannersSettings;
}

export const CarouselWithSideBanners: React.FC<Props> = ({ settings }) => {
  const navigate = useNavigate();
  const [slides, setSlides] = React.useState<SliderItem[]>([]);
  const [left, setLeft] = React.useState<SideBanner[]>([]);
  const [right, setRight] = React.useState<SideBanner[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [index, setIndex] = React.useState(0);

  const autoPlay = settings?.autoPlay ?? true;
  const intervalMs = settings?.intervalMs ?? 4000;
  const showArrows = settings?.showArrows ?? true;
  const showDots = settings?.showDots ?? true;
  // centerHeight kept for backward compatibility in settings but not used when images are auto-sized

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, b] = await Promise.all([
          api.getWithRetry('/homepage/sliders'),
          api.getWithRetry('/homepage/side-banners')
        ]);
        if (!mounted) return;
        const sData: SliderItem[] = (s.data || [])
          .filter((x: SliderItem)=>x.active)
          .sort((a: SliderItem, b: SliderItem)=>a.order-b.order);
        const bData: SideBanner[] = (b.data || []).filter((x: SideBanner)=>x.active);
        setSlides(sData);
        setLeft(bData.filter(x=>x.side==='left').sort((a,b)=>a.position-b.position).slice(0,3));
        setRight(bData.filter(x=>x.side==='right').sort((a,b)=>a.position-b.position).slice(0,3));
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load homepage content');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    if (!autoPlay || slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [autoPlay, intervalMs, slides.length]);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  if (loading) return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>;
  if (error) return <div className="h-48 flex items-center justify-center text-red-500 text-sm">{error}</div>;
  if (!slides.length && !left.length && !right.length) return null;

  // No fixed heights; let images define their own height. CenterHeight kept for legacy but unused here.

  const BannerCard: React.FC<{ item: SideBanner }> = ({ item }) => {
    const img = resolveImagePath(item.image) || '/placeholder-image.jpg';
  const override = settings?.labelStylesById?.[item._id];
  const bgOpacity = Math.max(0, Math.min(100, (override?.bgOpacity ?? item.labelBgOpacity ?? settings?.labelBgOpacity ?? 60)));
  const color = (override?.bgColor || item.labelBgColor || settings?.labelBgColor || '#000000');
  const textColor = (override?.textColor || item.labelTextColor || settings?.labelTextColor || '#FFFFFF');
  const bgType: 'gradient'|'solid'|'none' = (override?.bgType || item.labelBgType || settings?.labelBgType || 'gradient');
    const rgba = (hex: string, alphaPct: number) => {
      const h = hex.replace('#','');
      const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const a = Math.round((alphaPct/100)*100)/100;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
    const child = (
      <div className="relative overflow-hidden rounded-xl h-[96px] w-[340px]">
        <img src={img} alt={item.label || 'Banner'} className="w-full h-full object-cover" />
        {item.label && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <span
              className="font-semibold drop-shadow-sm px-3 py-1 rounded-lg"
              style={{
                color: textColor,
                ...(bgType === 'none' ? {} : {}),
                ...(bgType === 'solid' ? { backgroundColor: rgba(color, bgOpacity) } : {}),
                ...(bgType === 'gradient' ? { background: `linear-gradient(90deg, ${rgba(color, bgOpacity)} 0%, ${rgba(color, Math.max(0, bgOpacity*0.6))} 70%, ${rgba(color, 0)} 100%)` } : {}),
              }}
            >
              {item.label}
            </span>
          </div>
        )}
      </div>
    );
    return (
      <div className="group">
        {item.link ? <Link to={item.link}>{child}</Link> : child}
      </div>
    );
  };

  const Slide: React.FC<{ item: SliderItem }> = ({ item }) => {
    const img = resolveImagePath(item.image) || '/placeholder-image.jpg';
  const override = settings?.labelStylesById?.[item._id];
  const bgOpacity = Math.max(0, Math.min(100, (override?.bgOpacity ?? item.labelBgOpacity ?? settings?.labelBgOpacity ?? 60)));
  const color = (override?.bgColor || item.labelBgColor || settings?.labelBgColor || '#000000');
  const textColor = (override?.textColor || item.labelTextColor || settings?.labelTextColor || '#FFFFFF');
  const bgType: 'gradient'|'solid'|'none' = (override?.bgType || item.labelBgType || settings?.labelBgType || 'gradient');
    const rgba = (hex: string, alphaPct: number) => {
      const h = hex.replace('#','');
      const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      const a = Math.round((alphaPct/100)*100)/100;
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };
    const inner = (
      <div className="relative w-full h-full">
        <img src={img} alt={item.title || 'Slide'} className="w-full h-full object-cover" />
        {item.title && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10">
            <span
              className="font-semibold drop-shadow-sm text-xl sm:text-2xl lg:text-3xl px-3 py-1 rounded-lg"
              style={{
                color: textColor,
                ...(bgType === 'none' ? {} : {}),
                ...(bgType === 'solid' ? { backgroundColor: rgba(color, bgOpacity) } : {}),
                ...(bgType === 'gradient' ? { background: `linear-gradient(90deg, ${rgba(color, bgOpacity)} 0%, ${rgba(color, Math.max(0, bgOpacity*0.6))} 70%, ${rgba(color, 0)} 100%)` } : {}),
              }}
            >
              {item.title}
            </span>
          </div>
        )}
        {/* CTA Button */}
        {(item as any).ctaEnabled && (item as any).ctaText && (
          <div className={`absolute z-10 ${(()=>{
            const pos = (item as any).ctaPosition || 'bottom-left';
            const map: Record<string, string> = {
              'top-left': 'top-4 left-4', 'top-center': 'top-4 left-1/2 -translate-x-1/2', 'top-right': 'top-4 right-4',
              'middle-left': 'top-1/2 -translate-y-1/2 left-4', 'center': 'top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2', 'middle-right': 'top-1/2 -translate-y-1/2 right-4',
              'bottom-left': 'bottom-4 left-4', 'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2', 'bottom-right': 'bottom-4 right-4'
            };
            return map[pos] || map['bottom-left'];
          })()}`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const href = String((item as any).ctaUrl || '').trim();
                if (!href) return;
                if (href.startsWith('/')) {
                  navigate(href);
                } else if (href.startsWith('http://') || href.startsWith('https://')) {
                  window.open(href, '_blank', 'noopener');
                } else if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('sms:')) {
                  window.location.href = href;
                } else {
                  // Fallback: try navigation
                  try { navigate(href); } catch { window.location.href = href; }
                }
              }}
              className={`inline-block px-4 py-2 text-sm font-medium ${((item as any).ctaRounded ? 'rounded-full' : 'rounded')} ${((item as any).ctaStyle === 'outline' ? 'border' : '')}`}
              style={{
                backgroundColor: ((item as any).ctaStyle === 'solid') ? (item as any).ctaBgColor : 'transparent',
                color: (item as any).ctaTextColor,
                borderColor: ((item as any).ctaStyle === 'outline') ? (item as any).ctaBgColor : undefined,
              }}
            >{(item as any).ctaText}</button>
          </div>
        )}
      </div>
    );
    return item.link ? <Link to={item.link}>{inner}</Link> : inner;
  };

  return (
    <section className="py-4">
      {(settings?.title || settings?.subtitle) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3">
          {settings?.title && <h2 className="text-xl font-semibold text-gray-900">{settings.title}</h2>}
          {settings?.subtitle && <p className="text-sm text-gray-500">{settings.subtitle}</p>}
        </div>
      )}
      <div className="max-w-none lg:max-w-[1647px] mx-auto px-2 sm:px-4 lg:px-0">
  <div className="grid grid-cols-1 gap-3 lg:grid-cols-[340px_911px_340px] lg:justify-center">
          {/* Left side banners */}
          <div className="hidden lg:flex flex-col gap-3 items-center">
            {left.slice(0,3).map((b) => (<BannerCard key={b._id} item={b} />))}
          </div>

          {/* Center carousel (exact 911x343 on desktop) */}
          <div className="relative overflow-hidden rounded-xl bg-gray-100 w-full lg:w-[911px] h-auto lg:h-[343px]">
            <div
              className="whitespace-nowrap transition-transform duration-500 h-full w-full"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {slides.map((s) => (
                <div key={s._id} className="inline-block align-top w-full h-full">
                  <Slide item={s} />
                </div>
              ))}
            </div>

            {showArrows && slides.length > 1 && (
              <>
                <button aria-label="Previous" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button aria-label="Next" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {showDots && slides.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setIndex(i)} className={`w-2.5 h-2.5 rounded-full ${i===index? 'bg-white shadow ring-1 ring-black/10' : 'bg-black/30 hover:bg-black/40'}`} />
                ))}
              </div>
            )}
          </div>

          {/* Right side banners */}
          <div className="hidden lg:flex flex-col gap-3 items-center">
            {right.slice(0,3).map((b) => (<BannerCard key={b._id} item={b} />))}
          </div>

          {/* Mobile layout for side banners with label overlay */}
          <div className="lg:hidden grid grid-cols-2 gap-3 mt-3">
            {[...left, ...right].slice(0,6).map((b) => {
              const img = resolveImagePath(b.image) || '/placeholder-image.jpg';
              const override = settings?.labelStylesById?.[b._id];
              const bgOpacity = Math.max(0, Math.min(100, (override?.bgOpacity ?? b.labelBgOpacity ?? settings?.labelBgOpacity ?? 60)));
              const color = (override?.bgColor || b.labelBgColor || settings?.labelBgColor || '#000000');
              const textColor = (override?.textColor || b.labelTextColor || settings?.labelTextColor || '#FFFFFF');
              const bgType: 'gradient'|'solid'|'none' = (override?.bgType || b.labelBgType || settings?.labelBgType || 'gradient');
              const rgba = (hex: string, alphaPct: number) => {
                const h = hex.replace('#','');
                const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                const a = Math.round((alphaPct/100)*100)/100;
                return `rgba(${r}, ${g}, ${b}, ${a})`;
              };
              const inner = (
                <div className="relative overflow-hidden rounded-xl">
                  <img src={img} alt={b.label || 'Banner'} className="w-full h-auto object-cover" />
                  {b.label && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                      <span
                        className="font-semibold drop-shadow-sm text-sm px-2.5 py-1 rounded-lg"
                        style={{
                          color: textColor,
                          ...(bgType === 'none' ? {} : {}),
                          ...(bgType === 'solid' ? { backgroundColor: rgba(color, bgOpacity) } : {}),
                          ...(bgType === 'gradient' ? { background: `linear-gradient(90deg, ${rgba(color, bgOpacity)} 0%, ${rgba(color, Math.max(0, bgOpacity*0.6))} 70%, ${rgba(color, 0)} 100%)` } : {}),
                        }}
                      >
                        {b.label}
                      </span>
                    </div>
                  )}
                </div>
              );
              return b.link ? (
                <Link key={b._id} to={b.link} className="block">{inner}</Link>
              ) : (
                <div key={b._id}>{inner}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CarouselWithSideBanners;
