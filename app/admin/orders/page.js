'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const STATUS_ORDER = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLES = {
  pending:   'bg-yellow-900/40 text-yellow-300 border border-yellow-700',
  paid:      'bg-blue-900/40 text-blue-300 border border-blue-700',
  shipped:   'bg-green-900/40 text-green-300 border border-green-700',
  delivered: 'bg-purple-900/40 text-purple-300 border border-purple-700',
  cancelled: 'bg-red-900/40 text-red-300 border border-red-700',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [toast, setToast] = useState(null);

  // Auth guard
  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/admin/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!profile?.is_admin) router.push('/');
    };
    check();
  }, [router, supabase]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setOrders(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating(true);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);
    if (error) {
      showToast('Failed to update status', 'error');
    } else {
      showToast(`Order marked as ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selected?.id === orderId) setSelected(prev => ({ ...prev, status: newStatus }));
    }
    setUpdating(false);
  };

  const saveTrackingAndStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    const updates = { tracking_number: trackingInput, notes: notesInput };
    if (trackingInput && selected.status === 'paid') updates.status = 'shipped';
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', selected.id);
    if (error) {
      showToast('Failed to save changes', 'error');
    } else {
      showToast('Order updated');
      await fetchOrders();
      setSelected(prev => ({ ...prev, ...updates }));
    }
    setUpdating(false);
  };

  const openOrder = (order) => {
    setSelected(order);
    setTrackingInput(order.tracking_number || '');
    setNotesInput(order.notes || '');
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">ORDERS</h1>
            <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
          </div>
          <button
            onClick={fetchOrders}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            ALL ({orders.length})
          </button>
          {STATUS_ORDER.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-white text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {s.toUpperCase()} {counts[s] > 0 && `(${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-24 text-gray-500">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-500">No {filter !== 'all' ? filter : ''} orders found.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-800">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  {['ORDER', 'CUSTOMER', 'ITEMS', 'TOTAL', 'STATUS', 'DATE', 'ACTIONS'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map(order => {
                  const items = Array.isArray(order.items) ? order.items : [];
                  const itemSummary = items.map(i => `${i.name || i.product_name || 'Item'} x${i.quantity || 1}`).join(', ');
                  const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(order.status) + 1];
                  return (
                    <tr key={order.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-4 py-4">
                        <span className="font-mono text-sm">{order.order_number}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-300">{order.customer_email}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-gray-400 max-w-[200px] block truncate">{itemSummary || '—'}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium">${Number(order.total || 0).toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                          {(order.status || 'pending').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2 items-center">
                          <button
                            onClick={() => openOrder(order)}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors"
                          >
                            VIEW
                          </button>
                          {nextStatus && nextStatus !== 'cancelled' && (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextStatus)}
                              disabled={updating}
                              className="text-xs bg-white text-black hover:bg-gray-200 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                            >
                              → {nextStatus.toUpperCase()}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-40"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold">{selected.order_number}</h2>
                <p className="text-gray-500 text-sm mt-0.5">{selected.customer_email}</p>
              </div>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${STATUS_STYLES[selected.status] || STATUS_STYLES.pending}`}>
                {(selected.status || 'pending').toUpperCase()}
              </span>
            </div>

            {/* Items */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</h3>
              <div className="space-y-2">
                {(Array.isArray(selected.items) ? selected.items : []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm bg-gray-800 rounded-lg px-3 py-2">
                    <span>{item.name || item.product_name || 'Item'} {item.size && `(${item.size})`} x{item.quantity || 1}</span>
                    <span className="text-gray-400">${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-1 px-3">
                  <span>Total</span>
                  <span>${Number(selected.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            {selected.shipping_address && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Ship To</h3>
                <div className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2 leading-6">
                  {selected.shipping_address.name && <div>{selected.shipping_address.name}</div>}
                  <div>{selected.shipping_address.line1 || selected.shipping_address.street}</div>
                  {selected.shipping_address.line2 && <div>{selected.shipping_address.line2}</div>}
                  <div>{selected.shipping_address.city}, {selected.shipping_address.state} {selected.shipping_address.postal_code || selected.shipping_address.zip}</div>
                  {selected.shipping_address.country && <div>{selected.shipping_address.country}</div>}
                </div>
              </div>
            )}

            {/* Tracking Number */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                placeholder="e.g. 1Z999AA10123456784"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
              />
              {trackingInput && selected.status === 'paid' && (
                <p className="text-xs text-green-400 mt-1">Saving this will automatically mark the order as Shipped.</p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Admin Notes
              </label>
              <textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                placeholder="Internal notes..."
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
              />
            </div>

            {/* Status Controls */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Change Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map(s => (
                  <button
                    key={s}
                    disabled={selected.status === s || updating}
                    onClick={() => updateOrderStatus(selected.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${selected.status === s ? 'bg-white text-black cursor-default' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'}`}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
              >
                CLOSE
              </button>
              <button
                onClick={saveTrackingAndStatus}
                disabled={updating}
                className="flex-1 py-2.5 rounded-lg bg-white text-black hover:bg-gray-200 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {updating ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
