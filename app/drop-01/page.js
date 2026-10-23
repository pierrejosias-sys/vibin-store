import { permanentRedirect } from 'next/navigation'

// Legacy URL — Drop 01 now lives at /drop/01.
export default function Drop01Legacy() {
  permanentRedirect('/drop/01')
}
