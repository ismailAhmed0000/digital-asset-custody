// frontend/src/pages/NewDeposit.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';

const EMPTY = { customer_id: '', metal_id: '', storage_type: 'unallocated', quantity_kg: '', serial_number: '', vault_id: '' };

export default function NewDeposit() {
  const [form, setForm]       = useState(EMPTY);
  const [customers, setCustomers] = useState([]);
  const [metals, setMetals]   = useState([]);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [params]              = useSearchParams();

  useEffect(() => {
    Promise.all([client.get('/customers'), client.get('/metals')]).then(([c, m]) => {
      setCustomers(c.data.customers);
      setMetals(m.data.metals);
    });
    // Pre-fill customer_id from URL query param if navigated from CustomerDetail
    const cid = params.get('customer_id');
    if (cid) setForm(f => ({ ...f, customer_id: cid }));
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await client.post('/deposits', {
        ...form,
        customer_id: Number(form.customer_id),
        metal_id:    Number(form.metal_id),
        quantity_kg: Number(form.quantity_kg),
        vault_id:    form.vault_id ? Number(form.vault_id) : undefined,
        serial_number: form.storage_type === 'allocated' ? form.serial_number : undefined,
      });
      setSuccess(`Deposit created: ${res.data.deposit.deposit_number}`);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Something went wrong');
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">New Deposit</h1>

      {error   && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}
      {success && <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">{success}</p>}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {/* Customer */}
        <SelectField label="Customer" name="customer_id" value={form.customer_id} onChange={handleChange}>
          <option value="">Select customer...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.type})</option>)}
        </SelectField>

        {/* Metal */}
        <SelectField label="Metal" name="metal_id" value={form.metal_id} onChange={handleChange}>
          <option value="">Select metal...</option>
          {metals.map(m => <option key={m.id} value={m.id}>{m.name} — ${m.spot_price_usd}/kg</option>)}
        </SelectField>

        {/* Storage type */}
        <SelectField label="Storage Type" name="storage_type" value={form.storage_type} onChange={handleChange}>
          <option value="unallocated">Unallocated (pool)</option>
          <option value="allocated">Allocated (specific bar)</option>
        </SelectField>

        {/* Quantity */}
        <NumberField label="Quantity (kg)" name="quantity_kg" value={form.quantity_kg} onChange={handleChange} />

        {/* Serial number — only shown for allocated */}
        {form.storage_type === 'allocated' && (
          <div>
            <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">Bar Serial Number</label>
            <input
              type="text"
              name="serial_number"
              value={form.serial_number}
              onChange={handleChange}
              placeholder="e.g. BAR-AU-0001"
              required
              className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-amber-500"
            />
            <p className="text-amber-700 text-xs mt-1">Required for allocated deposits — must be globally unique</p>
          </div>
        )}

        <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg w-full transition-colors">
          Submit Deposit
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

function NumberField({ label, name, value, onChange }) {
  return (
    <div>
      <label className="block text-slate-500 text-xs uppercase tracking-widest mb-1">{label}</label>
      <input type="number" name={name} value={value} onChange={onChange} min="0.000001" step="any" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:outline-none focus:border-amber-500" />
    </div>
  );
}