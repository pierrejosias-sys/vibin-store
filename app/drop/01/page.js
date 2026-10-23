import { buildMeta } from '../../lib/seo'
import { getDropState, getDropInventory, dropPhase, serverNow } from '../../lib/drops'
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
  const phase = dropPhase(drop.releaseAt, drop.closesAt, now)
  if (phase === 'open') drop = await getDropInventory(drop)
  return <DropClient drop={drop} phase={phase} serverNow={now} />
}
