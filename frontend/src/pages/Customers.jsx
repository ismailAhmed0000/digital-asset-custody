// frontend/src/pages/Customers.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const EMPTY = { full_name: '', email: '', type: 'retail' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm]           = useState(EMPTY);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);

  const fetchCustomers = () =>
    client.get('/customers').then(r => setCustomers(r.data.customers)).finally(() => setLoading(false));

  useEffect(() => { fetchCustomers(); }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      await client.post('/customers', form);
      setForm(EMPTY);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong');
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Customers</h1>

      {/* Create form */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 max-w-lg">
        <h2 className="text-slate-600 text-sm uppercase tracking-widest mb-4">New Customer</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full Name"    name="full_name" value={form.full_name} onChange={handleChange} />
          <Field label="Email"        name="email"     value={form.email}     onChange={handleChange} type="email" />
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm"
            >
              <option value="retail">Retail (Unallocated)</option>
              <option value="institutional">Institutional (Allocated)</option>
            </select>
          </div>
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg w-full transition-colors"
          >
            Create Customer
          </button>
        </form>
      </section>

      {/* Customer list */}
      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : (
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">ID</th>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} className="border-t border-slate-200 hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500 font-mono">{c.id}</td>
                <td className="px-4 py-3 text-slate-900">{c.full_name}</td>
                <td className="px-4 py-3 text-slate-400">{c.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${c.type === 'institutional' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                    {c.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/customers/${c.id}`} className="text-amber-400 hover:text-amber-300 text-xs underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-amber-500"
      />
    </div>
  );
}