import { buildMeta } from '../../lib/seo'
import { getDropState, getDropInventory, isReleased } from '../../lib/drops'
import DropClient from '../DropClient'

export const dynamic = 'force-dynamic'

export const metadata = buildMeta({
  title: 'Drop 01: The Foundation — Vibin Apparel',
  description: 'Drop 01: The Foundation. 50 numbered pieces per style. Hoodies, cargo joggers, windbreakers and nylon shorts from Vibin Apparel, Jacksonville.',
  path: '/drop/01',
  image: '/og-drop01.jpg'
})

export default async function Drop01Page() {
  let drop = await getDropState('d01')
  const released = isReleased(drop.releaseAt)
  if (released) drop = await getDropInventory(drop)
  return <DropClient drop={drop} released={released} serverNow={Date.now()} />
}
