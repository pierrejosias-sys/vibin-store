/**
 * ButtonLoader — Wraps any button to show the Vibin spinner when loading.
 *
 * Usage:
 *   <ButtonLoader loading={isSubmitting} onClick={handleCheckout}>
 *     Checkout
 *   </ButtonLoader>
 */

import VibinLoader from './VibinLoader';

export default function ButtonLoader({
  loading = false,
  children,
  onClick,
  disabled,
  className = '',
  style = {},
  theme = 'dark',  // 'dark' (white spinner) | 'light' (dark spinner)
  ...props
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: loading ? 0.75 : 1,
        transition: 'opacity 200ms ease',
        cursor: loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading && (
        <VibinLoader size={18} theme={theme} inline />
      )}
      {children}
    </button>
  );
}
