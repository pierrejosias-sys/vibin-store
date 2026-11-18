// The Verify page is a client component (it holds the check/claim state), and a client page cannot export
// metadata, so the title and description live here. The root layout adds " — Vibin Apparel" to the title.
export const metadata = {
  title: 'Verify',
  description: 'Check if your Vibin piece is authentic and bank loyalty points. Scan the hang-tag QR or type your code — Vibin Apparel, Drop 01 SS26.',
}

export default function VerifyLayout({ children }) {
  return children
}
