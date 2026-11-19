/**
 * Vibin Verify code generator: POST /api/verify/generate (admins only).
 *
 * Generates hang-tag codes AND registers them in verify_codes in one step, so no tag can be printed
 * with a code the database doesn't know. Framework-free: the (service-role) Supabase client and the
 * random source are passed in, so tests run against fakes.
 *
 * Rules (from the Muse generator spec, Nov 18 2026):
 *   - VBN-XXXX-XXXX, crypto-random, never sequential. Same 31-character alphabet as the database's
 *     verify_random_code(): no 0, 1, I, L or O.
 *   - Duplicates are checked on the server against every code already registered (all batches,
 *     on-demand and the demo seed), and redrawn. The primary key is the final backstop.
 *   - Registration is ONE insert statement = one transaction: all codes go in, or none do.
 *     If it fails, the response carries no codes and no CSV, so nothing unregistered gets printed.
 *   - points_value is 100 (standard) or 150 (limited). batch_id 'demo' is reserved for the demo seed.
 */
import { randomInt as nodeRandomInt } from 'node:crypto'

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const MAX_QUANTITY = 500
export const VERIFY_URL = 'https://vibinapparel.com/verify?c='
const MAX_ROUNDS = 5

/** One random 4-character group from the alphabet. randomInt(n) must return a uniform integer in [0, n). */
function group(randomInt) {
  let s = ''
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return s
}

export function randomCode(randomInt = nodeRandomInt) {
  return `VBN-${group(randomInt)}-${group(randomInt)}`
}

const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

/** Checks and normalizes the request body. Returns { value } or { error }. */
export function parseGenerateInput(body, now = new Date()) {
  if (!body || typeof body !== 'object') return { error: 'Send a JSON body.' }
  const product = text(body.product, 80)
  if (!product) return { error: 'Pick a product.' }
  const mode = body.mode === 'on-demand' ? 'on-demand' : 'batch'
  const quantity = mode === 'on-demand' ? 1 : Number(body.quantity)
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    return { error: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}.` }
  }
  const points = Number(body.points ?? 100)
  if (points !== 100 && points !== 150) return { error: 'Points must be 100 (standard) or 150 (limited).' }
  const day = now.toISOString().slice(0, 10).replace(/-/g, '')
  return {
    value: {
      product,
      drop: text(body.drop, 60) || 'Drop 01 SS26',
      colorway: text(body.colorway, 60),
      size: text(body.size, 12),
      quantity,
      points,
      mode,
      day,
    },
  }
}

/** batch id: B-YYYYMMDD-XXXX for a batch, ON-DEMAND-YYYYMMDD-XXXX for a single code. Never 'demo'. */
export function batchId(mode, day, randomInt = nodeRandomInt) {
  return `${mode === 'on-demand' ? 'ON-DEMAND' : 'B'}-${day}-${group(randomInt)}`
}

const csvCell = v => {
  const s = v == null ? '' : String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Printer CSV: one row per tag, with the QR link that /verify reads (?c=CODE). */
export function toCsv(rows) {
  const head = ['code', 'product', 'drop', 'colorway', 'size', 'points', 'batch_id', 'date', 'qr_url']
  const lines = rows.map(r => [r.code, r.product, r.drop_name, r.colorway, r.size, r.points_value, r.batch_id,
    r.date, VERIFY_URL + r.code].map(csvCell).join(','))
  return [head.join(','), ...lines].join('\r\n') + '\r\n'
}

/** Codes from `candidates` that are already registered. */
async function existing(supabase, candidates) {
  const taken = new Set()
  for (let i = 0; i < candidates.length; i += 200) {
    const { data, error } = await supabase.from('verify_codes').select('code').in('code', candidates.slice(i, i + 200))
    if (error) throw new Error(error.message)
    for (const row of data || []) taken.add(row.code)
  }
  return taken
}

/**
 * POST body -> { status, body }.
 *   201 { batch_id, count, codes: [...], csv }   all codes registered
 *   400 { error }                                bad input
 *   409 { error }                                could not draw unique codes, or a code was taken meanwhile
 *   500 { error }                                registration failed: no codes, no CSV
 */
export async function handleGenerate(supabase, body, { randomInt = nodeRandomInt, now = new Date() } = {}) {
  const parsed = parseGenerateInput(body, now)
  if (parsed.error) return { status: 400, body: { error: parsed.error } }
  const input = parsed.value

  // Draw, then redraw anything that collides with itself or with a registered code.
  const codes = new Set()
  for (let round = 0; round < MAX_ROUNDS && codes.size < input.quantity; round++) {
    const fresh = new Set()
    while (codes.size + fresh.size < input.quantity) {
      const c = randomCode(randomInt)
      if (!codes.has(c)) fresh.add(c)
    }
    const taken = await existing(supabase, [...fresh])
    for (const c of fresh) if (!taken.has(c)) codes.add(c)
  }
  if (codes.size < input.quantity) {
    return { status: 409, body: { error: 'Could not draw enough unique codes. Try again.' } }
  }

  const batch_id = batchId(input.mode, input.day, randomInt)
  const rows = [...codes].map(code => ({
    code, product: input.product, drop_name: input.drop, colorway: input.colorway, size: input.size,
    points_value: input.points, batch_id,
  }))

  // One statement: every code is registered, or none is.
  const { error } = await supabase.from('verify_codes').insert(rows)
  if (error) {
    if (error.code === '23505') return { status: 409, body: { error: 'A code was registered by someone else at the same moment. Nothing was saved. Try again.' } }
    return { status: 500, body: { error: 'Registration failed. Nothing was saved and no CSV was made. Try again.' } }
  }

  const date = now.toISOString().slice(0, 10)
  const out = rows.map(r => ({ ...r, date }))
  return {
    status: 201,
    body: {
      batch_id,
      mode: input.mode,
      count: out.length,
      codes: out.map(r => ({ code: r.code, product: r.product, drop: r.drop_name, colorway: r.colorway, size: r.size, points_value: r.points_value, qr_url: VERIFY_URL + r.code })),
      csv: toCsv(out),
    },
  }
}
