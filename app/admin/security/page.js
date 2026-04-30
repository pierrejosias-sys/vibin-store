'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../styles.css';

const mockEvents = [
  { id: 1, type: 'login', user: 'john@email.com', ip: '192.168.1.1', location: 'Jacksonville, FL', time: '2026-04-29 14:32', status: 'success', device: 'Chrome/iPhone' },
  { id: 2, type: 'login', user: 'admin@email.com', ip: '10.0.0.1', location: 'Mami, FL', time: '2026-04-29 13:15', status: 'failed', device: 'Safari/Mac' },
  { id: 3, type: 'password', user: 'jane@email.com', ip: '172.16.0.5', location: 'Tampa, FL', time: '2026-04-29 12:00', status: 'changed', device: 'Firefox/Windows' },
  { id: 4, type: 'login', user: 'unknown@hack.com', ip: '45.33.99.12', location: 'Moscow, RU', time: '2026-04-29 11:45', status: 'blocked', device: 'Bot' },
];

const checks = [
  { name: 'SSL Certificate', status: 'valid', detail: 'Expires 2026-08-15' },
  { name: 'Admin Password', status: 'strong', detail: 'Changed 30 days ago' },
  { name: '2FA Enabled', status: 'disabled', detail: 'Not configured' },
  { name: 'Failed Login Lock', status: 'active', detail: '3 attempts, 15min lockout' },
  { name: 'API Rate Limit', status: 'active', detail: '100 requests/hr' },
  { name: 'Session Timeout', status: 'active', detail: '30 minutes' },
  { name: 'Audit Logs', status: 'enabled', detail: '90 days retention' },
  { name: 'Secure Headers', status: 'enabled', detail: 'CSP, HSTS active' },
];

export default function SecurityPage() {
  const [tab, setTab] = useState('overview');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
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

  const events = filter === 'all' ? mockEvents : mockEvents.filter(e => e.status === filter);

  const statusColor = (s) => ({
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    blocked: 'bg-red-600 text-white',
    changed: 'bg-blue-100 text-blue-800'
  })[s] || 'bg-gray-100';

  const iconColor = (s) => s === 'valid' || s === 'strong' || s === 'active' || s === 'enabled' ? 'text-green-500' : 'text-red-500';

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">SECURITY AUDITOR</h1>
          <div className="flex gap-4">
            {['overview', 'logs', 'checks'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded ${tab === t ? 'bg-white text-black' : 'bg-gray-800'}`}>
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-3xl font-bold">{mockEvents.filter(e => e.status === 'success').length}</div>
              <div className="text-gray-400">Successful</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-500">{mockEvents.filter(e => e.status === 'blocked').length}</div>
              <div className="text-gray-400">Blocked</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-3xl font-bold">{checks.filter(c => c.status !== 'disabled').length}/{checks.length}</div>
              <div className="text-gray-400">Checks Pass</div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <div className="text-3xl font-bold">90</div>
              <div className="text-gray-400">Days Retention</div>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div>
            <div className="flex gap-2 mb-4">
              {['all', 'success', 'failed', 'blocked'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded text-sm ${filter === f ? 'bg-white text-black' : 'bg-gray-800'}`}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <table className="w-full bg-gray-900 rounded-lg overflow-hidden">
              <thead className="bg-gray-800">
                <tr>
                  <th className="p-4 text-left">TYPE</th>
                  <th className="p-4 text-left">USER</th>
                  <th className="p-4 text-left">IP/LOCATION</th>
                  <th className="p-4 text-left">STATUS</th>
                  <th className="p-4 text-left">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-t border-gray-800 hover:bg-gray-800">
                    <td className="p-4 capitalize">{e.type}</td>
                    <td className="p-4">{e.user}</td>
                    <td className="p-4">{e.ip}<br/><span className="text-gray-500 text-sm">{e.location}</span></td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded text-sm ${statusColor(e.status)}`}>
                        {e.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <button onClick={() => setSelected(e)} className="bg-white text-black px-3 py-1 rounded text-sm">
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selected && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full" onClick={(ev) => ev.stopPropagation()}>
                  <h2 className="text-2xl font-bold mb-4">EVENT DETAILS</h2>
                  <div className="space-y-3">
                    <div><strong>Type:</strong> {selected.type}</div>
                    <div><strong>User:</strong> {selected.user}</div>
                    <div><strong>IP:</strong> {selected.ip}</div>
                    <div><strong>Location:</strong> {selected.location}</div>
                    <div><strong>Device:</strong> {selected.device}</div>
                    <div><strong>Status:</strong> <span className={statusColor(selected.status)}>{selected.status.toUpperCase()}</span></div>
                    {selected.status === 'blocked' && (
                      <button className="w-full bg-red-600 text-white py-2 rounded">BLOCK IP</button>
                    )}
                    <button onClick={() => setSelected(null)} className="w-full bg-gray-700 py-2 rounded mt-2">CLOSE</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'checks' && (
          <div className="grid grid-cols-2 gap-4">
            {checks.map((c, i) => (
              <div key={i} className="bg-gray-900 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold">{c.name}</div>
                  <div className="text-gray-500 text-sm">{c.detail}</div>
                </div>
                <div className={`text-2xl ${iconColor(c.status)}`}>
                  {c.status === 'valid' || c.status === 'strong' || c.status === 'active' || c.status === 'enabled' ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
