import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireAdmin } from '../lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Vibin Admin',
}

export default async function AdminLayout({ children }) {
  const path = (await headers()).get('x-vibin-pathname') || ''
  if (path === '/admin/login' || path.startsWith('/admin/login?')) {
    return children
  }
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login')
  return children
}
