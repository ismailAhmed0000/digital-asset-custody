// frontend/src/pages/CustomerDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData]     = useState(null);
  const [tab, setTab]       = useState('portfolio');
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    Promise.all([
      client.get(`/accounts/${id}/portfolio`),
      client.get(`/accounts/${id}/transactions`),
    ]).then(([portRes, txRes]) => {
      setData({ portfolio: portRes.data, transactions: txRes.data.transactions });
    }).catch(() => setError('Failed to load account'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-slate-500">Loading...</p>;
  if (error)   return <p className="text-red-400">{error}</p>;

  const { portfolio, transactions } = data;
  const { customer, portfolio: port } = portfolio;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/customers" className="text-slate-500 text-sm hover:text-slate-700">← Customers</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{customer.full_name}</h1>
          <p className="text-slate-600 text-sm">{customer.email} · <span className="capitalize">{customer.type}</span></p>
        </div>
        <div className="flex gap-2">
          <Link to={`/deposits/new?customer_id=${id}`} className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            + Deposit
          </Link>
          <Link to={`/withdrawals/new?customer_id=${id}`} className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Withdraw
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {['portfolio', 'transactions'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Portfolio tab */}
      {tab === 'portfolio' && (
        <div className="space-y-6">
          {/* Unallocated */}
          {port.unallocated.length > 0 && (
            <section>
              <h2 className="text-slate-600 text-xs uppercase tracking-widest mb-3">Unallocated Pool</h2>
              <div className="grid gap-3">
                {port.unallocated.map(h => (
                  <div key={h.metal_id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-slate-900 font-semibold">{h.metal_code}</p>
                      <p className="text-slate-600 text-sm">{h.net_kg} kg · Pool share: {h.pool_percentage}</p>
                    </div>
                    <p className="text-emerald-400 font-mono font-bold text-lg">
                      ${h.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Allocated bars */}
          {port.allocated.length > 0 && (
            <section>
              <h2 className="text-slate-600 text-xs uppercase tracking-widest mb-3">Allocated Bars</h2>
              {port.allocated.map(h => (
                <div key={h.metal_id} className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
                  <div className="flex justify-between mb-3">
                    <p className="text-slate-900 font-semibold">{h.metal_code} — {h.total_fine_kg} kg total</p>
                    <p className="text-emerald-400 font-mono font-bold">
                      ${h.usd_value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <table className="w-full text-xs text-slate-600">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left pb-1">Serial</th>
                        <th className="text-right pb-1">Fine kg</th>
                        <th className="text-right pb-1">Purity</th>
                        <th className="text-right pb-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.bars.map(b => (
                        <tr key={b.bar_id} className="border-t border-slate-100">
                          <td className="py-1 font-mono text-slate-700">{b.serial_number}</td>
                          <td className="py-1 text-right">{b.fine_weight_kg}</td>
                          <td className="py-1 text-right">{(b.purity * 100).toFixed(2)}%</td>
                          <td className="py-1 text-right">
                            <span className="text-emerald-400">{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </section>
          )}

          {port.unallocated.length === 0 && port.allocated.length === 0 && (
            <p className="text-slate-500">No holdings yet.</p>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Reference</th>
              <th className="text-left px-4 py-3">Metal</th>
              <th className="text-left px-4 py-3">Storage</th>
              <th className="text-right px-4 py-3">Qty (kg)</th>
              <th className="text-right px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, i) => (
              <tr key={i} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{tx.reference ?? '—'}</td>
                <td className="px-4 py-3 text-slate-700">{tx.metal_code}</td>
                <td className="px-4 py-3 text-slate-600 capitalize">{tx.storage_type}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-800">{tx.quantity_kg}</td>
                <td className="px-4 py-3 text-right text-slate-500 text-xs">
                  {new Date(tx.event_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}