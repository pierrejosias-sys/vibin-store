/**
 * VibinLoader — Brand spinner inspired by the Perplexity orbital loader.
 * The Vibin mark (V + red dot) sits static at the center while two arcs orbit around it.
 *
 * Usage:
 *   <VibinLoader />                     — default 44px, dark
 *   <VibinLoader size={72} />           — large
 *   <VibinLoader size={20} theme="light" />  — small, light bg
 *   <VibinLoader size={64} overlay />   — full-page blur overlay
 *   <VibinLoader size={18} inline />    — inside a button
 */

export default function VibinLoader({
  size = 44,
  theme = 'dark',   // 'dark' | 'light'
  overlay = false,  // true = full-page backdrop
  inline = false,   // true = no pulse, minimal (for buttons)
  label = 'Loading',
}) {
  const isDark = theme === 'dark';

  // Scale-dependent values
  const strokeWidth = size < 28 ? 4 : size < 50 ? 2.5 : 2;
  const dotR = size < 28 ? 0 : size < 50 ? 3 : 4;        // orbit dot radius
  const markSize = size * 0.65;
  const showMark = size >= 28;         // no V text below 28px — too small
  const showDot = size >= 36;          // no orbit dot below 36px
  const showRingInner = size >= 44;    // inner ring border on mark only at 44+
  const accentRed = '#ff4a3d';
  const trackColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(10,10,10,0.1)';
  const markColor = isDark ? 'white' : '#0a0a0a';
  const arcColor = accentRed;

  // Arc length tuned for a clean leading-edge sweep
  const dashArray = size < 28 ? '28 108' : '42 96';

  const spinnerEl = (
    <span
      aria-label={label}
      role="status"
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      {/* ── Outer arc spinner ── */}
      <svg
        viewBox="0 0 50 50"
        fill="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          animation: 'vibin-spin 1.2s cubic-bezier(0.4,0,0.2,1) infinite',
        }}
      >
        {/* Track */}
        <circle cx="25" cy="25" r="22" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Arc */}
        <circle
          cx="25" cy="25" r="22"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
        />
      </svg>

      {/* ── Orbit dot (counter-rotates for depth) ── */}
      {showDot && (
        <svg
          viewBox="0 0 50 50"
          fill="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            animation: 'vibin-spin-rev 2s cubic-bezier(0.4,0,0.2,1) infinite',
          }}
        >
          <circle cx="25" cy={3 + dotR} r={dotR} fill={accentRed} opacity="0.8" />
        </svg>
      )}

      {/* ── Center mark ── */}
      {showMark && (
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 50 50"
          fill={markColor}
          style={{
            position: 'relative',
            zIndex: 2,
            animation: !inline ? 'vibin-pulse 1.8s ease-in-out infinite' : undefined,
          }}
        >
          {showRingInner && (
            <circle
              cx="25" cy="25" r="22"
              fill="none"
              stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(10,10,10,0.12)'}
              strokeWidth="1.5"
            />
          )}
          <text
            x="25" y="34"
            fontFamily="'Arial Black', Helvetica, sans-serif"
            fontSize="22"
            fontWeight="900"
            textAnchor="middle"
            letterSpacing="-1"
            fill={markColor}
          >
            V
          </text>
          {/* Red accent dot — signature brand mark */}
          <circle cx="38" cy="12" r="4.5" fill={accentRed} />
        </svg>
      )}

      <style>{`
        @keyframes vibin-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vibin-spin-rev {
          to { transform: rotate(-360deg); }
        }
        @keyframes vibin-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*='vibin-spin'],
          [style*='vibin-pulse'] {
            animation: none !important;
          }
        }
      `}</style>
    </span>
  );

  if (!overlay) return spinnerEl;

  // ── Full-page overlay variant ──
  return (
    <div
      aria-busy="true"
      aria-label={label}
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
      }}
    >
      {spinnerEl}
      <span
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          fontFamily: 'Arial, sans-serif',
          animation: 'vibin-pulse 1.8s ease-in-out infinite',
        }}
      >
        {label}
      </span>
    </div>
  );
}
