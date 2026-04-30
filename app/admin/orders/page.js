'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
const mockOrders = [
  { id: 'ORD-001', customer: 'John Doe', email: 'john@email.com', product: 'VIBIN Foundation Tee', size: 'M', color: 'Black', quantity: 1, total: 45, status: 'pending', date: '2026-04-29', address: { street: '123 Main St', city: 'Jacksonville', state: 'FL', zip: '32256' } },
  { id: 'ORD-002', customer: 'Jane Smith', email: 'jane@email.com', product: 'Move Different Tee', size: 'L', color: 'Black', quantity: 2, total: 90, status: 'paid', date: '2026-04-28', address: { street: '456 Oak Ave', city: 'Miami', state: 'FL', zip: '33101' } },
  { id: 'ORD-003', customer: 'Mike Johnson', email: 'mike@email.com', product: 'VOL 01 Hoodie', size: 'XL', color: 'Black', quantity: 1, total: 75, status: 'shipped', date: '2026-04-27', tracking: '1Z999AA10123456784', address: { street: '789 Pine Rd', city: 'Tampa', state: 'FL', zip: '33601' } },
];
export default function AdminOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('vibin_user');
    if (!savedUser) {
      router.push('/admin/login');
      return;
    }
    const user = JSON.parse(savedUser);
    if (!user.is_admin) {
      router.push('/login');
    }
  }, [router]);

  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const filtered = filter === 'all' ? mockOrders : mockOrders.filter(o => o.status === filter);
  const statusColor = (s) => ({ pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-blue-100 text-blue-800', shipped: 'bg-green-100 text-green-800' })[s] || 'bg-gray-100 text-gray-800';
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">PENDING ORDERS</h1>
          <div className="flex gap-4">
            {['all', 'pending', 'paid', 'shipped'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded ${filter === f ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
          <thead className="bg-gray-800">
            <tr><th className="p-4 text-left">ORDER</th><th className="p-4 text-left">CUSTOMER</th><th className="p-4 text-left">PRODUCT</th><th className="p-4 text-left">TOTAL</th><th className="p-4 text-left">STATUS</th><th className="p-4 text-left">ACTIONS</th></tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-gray-800 hover:bg-gray-800">
                <td className="p-4">{o.id}<br/><span className="text-gray-500 text-sm">{o.date}</span></td>
                <td className="p-4">{o.customer}<br/><span className="text-gray-500 text-sm">{o.email}</span></td>
                <td className="p-4">{o.product}<br/><span className="text-gray-500 text-sm">{o.size}/{o.color}/Qty{o.quantity}</span></td>
                <td className="p-4">${o.total}</td>
                <td className="p-4"><span className={`px-3 py-1 rounded text-sm ${statusColor(o.status)}`}>{o.status.toUpperCase()}</span></td>
                <td className="p-4">
                  <button onClick={() => setSelected(o)} className="bg-white text-black px-3 py-1 rounded text-sm mr-2">VIEW</button>
                  {o.status === 'paid' && <button className="bg-green-600 text-white px-3 py-1 rounded text-sm">BUY LABEL</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selected && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4">ORDER {selected.id}</h2>
              <div className="space-y-3">
                <div><strong>Customer:</strong> {selected.customer}</div>
                <div><strong>Email:</strong> {selected.email}</div>
                <div><strong>Product:</strong> {selected.product} ({selected.size}, {selected.color}) x{selected.quantity}</div>
                <div><strong>Total:</strong> ${selected.total}</div>
                <div><strong>Ship To:</strong><br/>{selected.address.street}<br/>{selected.address.city}, {selected.address.state} {selected.address.zip}</div>
                {selected.tracking && <div><strong>Tracking:</strong> {selected.tracking}</div>}
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setSelected(null)} className="flex-1 bg-gray-700 py-2 rounded">CLOSE</button>
                  <button className="flex-1 bg-white text-black py-2 rounded">BUY SHIPPING LABEL</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
