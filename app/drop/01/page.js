import { buildMeta } from '../../lib/seo'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getDropState, getDropInventory, serverNow } from '../../lib/drops'
import { accessPhase, EARLY_ACCESS_COOKIE } from '../../lib/early-access.mjs'
import { isValidEarlyAccessToken } from '../../lib/waitlist.mjs'

async function hasEarlyAccess() {
  const token = (await cookies()).get(EARLY_ACCESS_COOKIE)?.value
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!token || !url || !key) return false
  return isValidEarlyAccessToken(createClient(url, key, { auth: { persistSession: false } }), token)
}
import DropClient from '../DropClient'

export const dynamic = 'force-dynamic'

export const metadata = buildMeta({
  title: 'Drop 01: The Foundation — Vibin Apparel',
  description: 'Drop 01: The Foundation. Numbered pre-order Thu Nov 12 – Sun Nov 15 (ET), ships by Dec 11–17. The VOL 01 Hoodie from Vibin Apparel, Jacksonville.',
  path: '/drop/01',
  image: '/og-drop01.jpg'
})

export default async function Drop01Page() {
  let drop = await getDropState('d01')
  const now = serverNow()
  const raw = accessPhase(drop, now)
  // During the early-access hour, waitlist members (valid cookie) shop as if open.
  const early = raw === 'early' && await hasEarlyAccess()
  const phase = raw === 'early' ? (early ? 'open' : 'upcoming') : raw
  if (phase === 'open') drop = await getDropInventory(drop)
  return <DropClient drop={drop} phase={phase} earlyAccess={early} serverNow={now} />
}
