import { serviceClient } from '../_client.mjs'
import { applicationRow, ambassadorEmailExists } from '../../../lib/ambassador-apply.mjs'

// Creates a pending application. Status, commission and code are set here, never by the browser.
export async function POST(request) {
  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid request.' }, { status: 400 }) }
  const { row, error } = applicationRow(body)
  if (error) return Response.json({ error }, { status: 400 })
  const db = serviceClient()
  if (!db) return Response.json({ error: 'Temporarily unavailable.' }, { status: 503 })
  try {
    if (await ambassadorEmailExists(db, row.email)) return Response.json({ exists: true }, { status: 409 })
    const { error: insErr } = await db.from('ambassadors').insert(row)
    if (insErr) {
      if (insErr.code === '23505') return Response.json({ exists: true }, { status: 409 })
      throw new Error(insErr.message)
    }
    return Response.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('ambassador apply failed:', err.message)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
