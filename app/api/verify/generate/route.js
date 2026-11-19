import { handleGenerate } from '../../../lib/verify-generate.mjs'
import { serviceClient, json, readJson } from '../../../lib/verify-server.mjs'
import { requireAdmin, forbidden } from '../../../lib/admin-auth'

export const dynamic = 'force-dynamic'

// POST /api/verify/generate   (admins only: a signed-in profile with is_admin)
//   body { product, drop?, colorway?, size?, quantity, points: 100 | 150, mode?: 'batch' | 'on-demand' }
//   201 { batch_id, count, codes, csv }   codes are already registered in verify_codes
//   ?format=csv returns the same tags as a CSV download for the printer.
// The service-role key stays on the server. The browser never writes to Supabase.
export async function POST(request) {
  const admin = await requireAdmin().catch(() => null)
  if (!admin) return forbidden()
  const supabase = serviceClient()
  if (!supabase) return json({ error: 'Code registration is not configured.' }, 503)
  try {
    const { status, body } = await handleGenerate(supabase, await readJson(request))
    if (status === 201 && new URL(request.url).searchParams.get('format') === 'csv') {
      return new Response(body.csv, {
        status: 201,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${body.batch_id}.csv"`,
          'Cache-Control': 'no-store',
        },
      })
    }
    return json(body, status)
  } catch (err) {
    console.error('verify generate failed:', err.message)
    return json({ error: 'Registration failed. Nothing was saved and no CSV was made. Try again.' }, 500)
  }
}
