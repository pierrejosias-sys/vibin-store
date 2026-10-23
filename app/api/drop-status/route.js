import { cookies } from 'next/headers'
import { getDrop01Status } from '../../lib/drop-status-server'
import { EARLY_ACCESS_COOKIE, isWellFormedToken } from '../../lib/early-access-cookie.mjs'

export const dynamic = 'force-dynamic'

// GET /api/drop-status -> Drop 01 copy + add-to-bag gate. The cookie check is only a UI hint;
// /api/checkout still validates the early-access token for real.
export async function GET() {
  const jar = await cookies()
  const status = await getDrop01Status(isWellFormedToken(jar.get(EARLY_ACCESS_COOKIE)?.value))
  return Response.json(status, { headers: { 'Cache-Control': 'no-store' } })
}
