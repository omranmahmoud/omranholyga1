import { useState, useEffect, useRef } from 'react';
import { NavLinks } from './NavLinks';
import { NavActions } from './NavActions';
import { MobileMenu } from './MobileMenu';
import { Link } from 'react-router-dom';
import { Logo } from '../Logo';
import { useStore } from '../../context/StoreContext';
import { CategoriesMegaMenu } from './CategoriesMegaMenu';
import HeaderSearchBox from './HeaderSearchBox';
import { SlidingText } from '../SlidingText/SlidingText';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [megaActiveId, setMegaActiveId] = useState<string | null>(null);
  const [hideOnScroll, setHideOnScroll] = useState(false);
  // Prevent immediate reopen on accidental hover after closing
  const suppressUntilRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const { settings } = useStore();

  const layout = settings?.headerLayout || 'modern';

  useEffect(() => {
    // initial measure to set --header-h for main padding
    const measure = () => {
      const el = document.getElementById('site-header');
      const h = el?.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    measure();
    const id = window.setTimeout(measure, 150);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const THRESHOLD = 8;
    const handleScroll = () => {
      const y = window.scrollY || 0;
      const last = lastYRef.current || 0;
      const delta = y - last;
      const goingDown = delta > 0;
      // Hide when scrolling down beyond header, show when scrolling up
      if (goingDown && delta > THRESHOLD && y > 64) {
        setHideOnScroll(true);
      } else if (!goingDown && -delta > THRESHOLD) {
        setHideOnScroll(false);
      }
      setIsScrolled(y > 0);
      lastYRef.current = y;
    };

    window.addEventListener('scroll', handleScroll, { passive: true } as any);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Open mega menu when any top nav item is hovered
  useEffect(() => {
    const handler = (e: any) => {
      if (Date.now() < suppressUntilRef.current) return;
      const id = e?.detail?.id as string | undefined;
      if (id) setMegaActiveId(id);
      setMegaOpen(true);
    };
    window.addEventListener('nav-hover', handler);
    return () => window.removeEventListener('nav-hover', handler);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Compute header classes based on selected layout
  const baseHeader = 'fixed top-0 inset-x-0 z-50 transition-transform duration-300 will-change-transform theme-font';
  const modernHeader = isScrolled
    ? 'theme-background-bg/80 backdrop-blur-lg shadow-sm'
    : 'bg-transparent';
  const classicHeader = 'theme-background-bg border-b shadow-sm';
  const minimalHeader = 'bg-transparent';

  const motion = hideOnScroll ? '-translate-y-full' : 'translate-y-0';
  const headerClass = `${baseHeader} ${motion} ${
    layout === 'classic' ? classicHeader : layout === 'minimal' ? minimalHeader : modernHeader
  }`;

  const headerStyle: React.CSSProperties = {
    backgroundColor: settings?.headerBackgroundColor || undefined,
    color: settings?.headerTextColor || undefined
  };

  return (
  <header id="site-header" className={headerClass} style={headerStyle}>
      {/* Announcement bar sits above navigation inside the fixed header */}
      <SlidingText />
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center gap-4 h-16 lg:h-20">
          {/* Left: mobile menu + logo */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <div className="relative w-6 h-6">
                <span
                  className={`absolute left-0 block w-6 h-0.5 transform transition-all duration-300 ease-out theme-text-bg ${
                    isMobileMenuOpen 
                      ? 'rotate-45 translate-y-0 top-3' 
                      : '-translate-y-1 top-3'
                  }`}
                />
                <span
                  className={`absolute left-0 top-3 block w-6 h-0.5 theme-text-bg transition-opacity duration-300 ${
                    isMobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 block w-6 h-0.5 transform transition-all duration-300 ease-out theme-text-bg ${
                    isMobileMenuOpen 
                      ? '-rotate-45 translate-y-0 top-3' 
                      : 'translate-y-1 top-3'
                  }`}
                />
              </div>
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 lg:ml-0 flex items-center">
              <Link to="/" className="flex items-center gap-2 group">
                <Logo className="h-12 w-auto theme-text group-hover:theme-primary transition-colors" />
              </Link>
            </div>
          </div>

          {/* Center search (desktop) */}
          <div className="hidden lg:flex items-center">
            <div className="w-full max-w-2xl mx-auto">
              <HeaderSearchBox />
            </div>
          </div>

          {/* Right: actions only */}
          <div className="flex items-center justify-end gap-2">
            <NavActions />
          </div>
        </div>
        {/* Nav links row under the search (desktop) */}
  <div className="hidden lg:flex items-center justify-start gap-8 mt-2">
          <CategoriesMegaMenu
            externalOpen={megaOpen}
            externalActiveId={megaActiveId}
            onRequestClose={() => {
              setMegaOpen(false);
              suppressUntilRef.current = Date.now() + 200;
            }}
          />
          <NavLinks />
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
  </header>
  );
}