// frontend/src/pages/NewWithdrawal.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';

const EMPTY = { customer_id: '', metal_id: '', storage_type: 'unallocated', quantity_oz: '', bar_id: '' };

export default function NewWithdrawal() {
  const [form, setForm]       = useState(EMPTY);
  const [customers, setCustomers] = useState([]);
  const [metals, setMetals]   = useState([]);
  const [balance, setBalance] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [params]              = useSearchParams();

  useEffect(() => {
    Promise.all([client.get('/customers'), client.get('/metals')]).then(([c, m]) => {
      setCustomers(c.data.customers);
      setMetals(m.data.metals);
    });
    const cid = params.get('customer_id');
    if (cid) setForm(f => ({ ...f, customer_id: cid }));
  }, []);

  // Live balance check whenever customer + metal + storage_type changes
  useEffect(() => {
    const { customer_id, metal_id, storage_type } = form;
    if (!customer_id || !metal_id || storage_type !== 'unallocated') {
      setBalance(null);
      return;
    }
    client.get(`/accounts/${customer_id}/portfolio`)
      .then(res => {
        const holding = res.data.portfolio.unallocated.find(
          h => String(h.metal_id) === String(metal_id)
        );
        setBalance(holding ? holding.net_oz : 0);
      })
      .catch(() => setBalance(null));
  }, [form.customer_id, form.metal_id, form.storage_type]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await client.post('/withdrawals', {
        ...form,
        customer_id: Number(form.customer_id),
        metal_id:    Number(form.metal_id),
        quantity_oz: Number(form.quantity_oz),
        bar_id:      form.storage_type === 'allocated' && form.bar_id ? Number(form.bar_id) : undefined,
      });
      setSuccess('Withdrawal recorded successfully.');
      setForm(EMPTY);
      setBalance(null);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">New Withdrawal</h1>

      {error   && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      {success && <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <SelectField label="Customer" name="customer_id" value={form.customer_id} onChange={handleChange}>
          <option value="">Select customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
        </SelectField>

        <SelectField label="Metal" name="metal_id" value={form.metal_id} onChange={handleChange}>
          <option value="">Select metal...</option>
          {metals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </SelectField>

        <SelectField label="Storage Type" name="storage_type" value={form.storage_type} onChange={handleChange}>
          <option value="unallocated">Unallocated</option>
          <option value="allocated">Allocated (by Bar ID)</option>
        </SelectField>

        {/* Live balance display for unallocated */}
        {form.storage_type === 'unallocated' && balance !== null && (
          <div className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 flex justify-between">
            <span className="text-slate-600">Available balance</span>
            <span className="text-emerald-400 font-mono font-semibold">{balance} oz</span>
          </div>
        )}

        {/* Bar ID — only for allocated */}
        {form.storage_type === 'allocated' && (
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">Bar ID</label>
            <input type="number" name="bar_id" value={form.bar_id} onChange={handleChange} placeholder="Bar ID from allocation" required className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900 text-sm" />
          </div>
        )}

        <div>
          <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">Quantity (oz)</label>
          <input type="number" name="quantity_oz" value={form.quantity_oz} onChange={handleChange} min="0.000001" step="any" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm" />
        </div>

        <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm px-4 py-2 rounded-lg w-full transition-colors">
          Submit Withdrawal
        </button>
      </form>
    </div>
  );
}

function SelectField({ label, name, value, onChange, children }) {
  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</label>
      <select name={name} value={value} onChange={onChange} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm">
        {children}
      </select>
    </div>
  );
}