export default function QA() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">Q&A</h1>
      <div className="space-y-4 max-w-2xl">
        <details className="bg-white/5 p-4 border border-white/10">
          <summary className="font-bold cursor-pointer">Sizing Guide</summary>
          <p className="mt-2 text-white/70">TTS - size up for oversized fit</p>
        </details>
        <details className="bg-white/5 p-4 border border-white/10">
          <summary className="font-bold cursor-pointer">Shipping</summary>
          <p className="mt-2 text-white/70">5-7 days domestic</p>
        </details>
      </div>
    </div>
  )
}
