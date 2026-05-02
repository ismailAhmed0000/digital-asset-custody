// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Dashboard() {
  const [metals, setMetals]     = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/metals'),
      client.get('/customers'),
    ]).then(([metalsRes, customersRes]) => {
      setMetals(metalsRes.data.metals);
      setCustomers(customersRes.data.customers);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card label="Total Customers" value={customers.length} />
        <Card label="Metals Tracked" value={metals.length} />
        <Card label="Platform" value="BareMetal v1" />
      </div>

      {/* Metal prices table */}
      <section>
        <h2 className="text-slate-600 text-sm uppercase tracking-widest mb-3">
          Spot Prices
        </h2>
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Metal</th>
              <th className="text-right px-4 py-3">Spot Price (USD/kg)</th>
            </tr>
          </thead>
          <tbody>
            {metals.map(m => (
              <tr key={m.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">
                  ${parseFloat(m.spot_price_usd).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-slate-900 text-2xl font-bold">{value}</p>
    </div>
  );
}