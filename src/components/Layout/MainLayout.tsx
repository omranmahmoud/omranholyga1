import React from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '../Navbar/Navbar';
import { BottomNav } from '../MobileNav/BottomNav';
import { Footer } from '../Footer/Footer';
import { ScrollToTop } from '../Common/ScrollToTop';
import { WhatsAppButton } from '../Common/WhatsAppButton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  React.useEffect(() => {
    const updatePad = () => {
      const header = document.getElementById('site-header');
      const h = header?.getBoundingClientRect().height || 0;
      document.documentElement.style.setProperty('--header-h', `${h}px`);
    };
    updatePad();
    window.addEventListener('resize', updatePad);
    // slight delay to recalc after fonts/assets
    const t = setTimeout(updatePad, 250);
    return () => { window.removeEventListener('resize', updatePad); clearTimeout(t); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
  <main className="flex-1 pb-16 lg:pb-0" style={{ paddingTop: 'var(--header-h, 0px)' }}>
        {location.pathname === '/' ? (
          <div className="home-zoom">
            <div className="home-zoom-inner">
              {children}
            </div>
          </div>
        ) : (
          children
        )}
      </main>
      <Footer />
      <BottomNav />
      <ScrollToTop />
      <WhatsAppButton />
    </div>
  );
}