export default function Shipping() {
  return (
    <div className="min- h- screen bg- black text- white p-6">
      <h1 className="text-3xl font- bold mb-8">SHIPPING</h1>
      <div className="space- y-4 max- w-2xl">
        <div className="bg- white/5 p-6"><h2 className="font- bold">USPS Priority</h2><p className="mt-2 text- white/70">5-7 days - $8</p></div>
        <div className="bg- white/5 p-6"><h2 className="font- bold">USPS Express</h2><p className="mt-2 text- white/70">2-3 days - $25</p></div>
        <div className="bg- white/5 p-6"><h2 className="font- bold">International</h2><p className="mt-2 text- white/70">10-14 days - rates vary</p></div>
      </div>
    </div>
  )
}
