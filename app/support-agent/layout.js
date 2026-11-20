import { redirect } from 'next/navigation'
import { requireAdmin } from '../lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata = {
  robots: { index: false, follow: false },
  title: 'Vibin Support Agent',
}

export default async function SupportAgentLayout({ children }) {
  const admin = await requireAdmin()
  if (!admin) redirect('/admin/login?next=/support-agent')
  return children
}
