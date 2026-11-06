import { getDropState, serverNow } from './drops'
import { dropStatus } from './drop-status.mjs'

/** Server-side Drop 01 status from the DB window (same source as /api/checkout). */
export async function getDrop01Status(hasEarlyToken = false) {
  const drop = await getDropState('d01')
  return dropStatus({ releaseAt: drop?.releaseAt, closesAt: drop?.closesAt, earlyAccessAt: drop?.earlyAccessAt }, serverNow(), hasEarlyToken)
}
