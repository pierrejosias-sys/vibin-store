/**
 * PageLoader — Drop this into your Next.js layout or any async page.
 * Shows the Vibin full-page overlay while `isLoading` is true.
 *
 * Usage in a page:
 *   const [loading, setLoading] = useState(true);
 *   useEffect(() => { fetchData().then(() => setLoading(false)); }, []);
 *   return <PageLoader isLoading={loading}><YourPageContent /></PageLoader>
 *
 * Usage in layout.js for route transitions:
 *   Wrap children in <PageLoader isLoading={isNavigating} />
 */

'use client';
import { useEffect, useState } from 'react';
import VibinLoader from './VibinLoader';

export default function PageLoader({ isLoading, children, label = 'Loading' }) {
  const [visible, setVisible] = useState(isLoading);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!isLoading && visible) {
      // Fade out before unmounting
      setFading(true);
      const t = setTimeout(() => {
        setVisible(false);
        setFading(false);
      }, 350);
      return () => clearTimeout(t);
    }
    if (isLoading) setVisible(true);
  }, [isLoading]);

  return (
    <>
      {children}
      {visible && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            background: 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: 'opacity 350ms ease',
            opacity: fading ? 0 : 1,
          }}
        >
          <VibinLoader size={68} />
          <span
            style={{
              color: 'rgba(255,255,255,0.38)',
              fontSize: 11,
              letterSpacing: '0.35em',
              textTransform: 'uppercase',
              fontFamily: 'Arial, sans-serif',
              animation: 'vibin-pulse 1.8s ease-in-out infinite',
            }}
          >
            {label}
          </span>
          <style>{`
            @keyframes vibin-pulse {
              0%,100%{opacity:1} 50%{opacity:0.4}
            }
          `}</style>
        </div>
      )}
    </>
  );
}
