// Fix #14: /print is an orphan page with no nav links pointing to it.
// Redirect users to /shop to prevent confusion and lost traffic.
import { redirect } from 'next/navigation'

export default function PrintPage() {
  redirect('/shop')
}

export const metadata = {
  title: 'Vibin Apparel — Shop',
  robots: { index: false, follow: false },
}
