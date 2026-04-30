import Link from 'next/link'
const products = [
  {id:'1',name:'Foundation Tee',price:45},
  {id:'2',name:'Move Different Tee',price:45},
  {id:'3',name:'VOL 01 Hoodie',price:75},
]
export default function Shop() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8 tracking-widest">SHOP</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white/5 p-6 border border-white/10">
            <h2 className="font-bold">{p.name}</h2>
            <p className="text-2xl font-bold mt-2">${p.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
