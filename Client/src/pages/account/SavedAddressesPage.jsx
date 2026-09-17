import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Plus, Pencil, Trash2, Check } from 'lucide-react';
import api from '../../services/api';
import PhoneInput from '../../components/PhoneInput';

const blank = { label: 'Home', name: '', phone: '', email: '', address: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '', country: 'India', isDefault: false };
const fields = [
  ['name', 'Full name', true, 120], ['email', 'Email address', false, 180],
  ['address', 'Street / house number', true, 255], ['addressLine2', 'Apartment / area', false, 255],
  ['landmark', 'Landmark', false, 120], ['city', 'City', true, 100], ['state', 'State / region', true, 100],
  ['pincode', 'Postal code', true, 20], ['country', 'Country', true, 100],
];
export default function SavedAddressesPage() {
  const { customer } = useSelector(state => state.auth);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const firstInput = useRef(null);
  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/customers/addresses'); setAddresses(data.addresses || []); }
    catch (err) { setError(err.response?.data?.message || 'Unable to load saved addresses. Please retry.'); }
    finally { setLoading(false); }
  }, [customer?.id]);
  useEffect(() => { setAddresses([]); setForm(null); setError(''); load(); }, [load]);
  useEffect(() => { if (form) firstInput.current?.focus(); }, [!!form, editing]);
  const open = row => {
    setEditing(row?.id || null); setDeleting(null); setError(''); setMessage('');
    setForm(row ? Object.fromEntries(Object.keys(blank).map(key => [key, row[key] ?? blank[key]])) : { ...blank, name: customer?.name || '', phone: customer?.phone || '', email: customer?.email || '' });
  };
  const perform = async (work, text) => {
    setBusy(true); setError(''); setMessage('');
    try { await work(); setForm(null); setDeleting(null); setMessage(text); window.dispatchEvent(new Event('saved-addresses-changed')); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Unable to update this address. Please retry.'); }
    finally { setBusy(false); }
  };
  const save = event => {
    event.preventDefault();
    perform(() => editing ? api.put(`/customers/addresses/${editing}`, form) : api.post('/customers/addresses', form), editing ? 'Address updated.' : 'Address saved.');
  };
  const isExistingDefault = addresses.some(row => row.id === editing && row.isDefault);
  return <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="font-playfair text-xl font-semibold text-brand-text">Saved Addresses</h1><p className="mt-1 text-sm text-brand-grey">Keep your delivery details ready for a faster checkout.</p></div>
      {!form && <button type="button" onClick={() => open()} disabled={busy} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs"><Plus size={15} /> Add address</button>}
    </div>
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error} <button type="button" onClick={load} disabled={busy} className="underline">Reload</button></p>}
    {message && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-green-700"><Check size={16} />{message}</p>}
    {form && <form onSubmit={save} className="mb-6 rounded-lg border border-brand-gold/40 bg-brand-light/30 p-4 md:p-5">
      <h2 className="mb-4 font-playfair text-lg font-semibold">{editing ? 'Edit address' : 'New address'}</h2>
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-brand-text">Label<input ref={firstInput} value={form.label} required maxLength={40} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="Home or Work" className="mt-1.5 w-full rounded border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-brand-gold focus:outline-none" /></label>
        <PhoneInput id="saved-address-phone" label="Phone number" value={form.phone} onChange={phone => setForm(previous => ({ ...previous, phone }))} required />
        {fields.map(([key, label, required, maxLength]) => <label key={key} className={`block text-xs font-medium text-brand-text ${key === 'address' ? 'sm:col-span-2' : ''}`}>{label}{required ? ' *' : ''}
          <input type={key === 'email' ? 'email' : 'text'} value={form[key]} required={required} maxLength={maxLength} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1.5 w-full rounded border border-neutral-200 bg-white px-3 py-2.5 text-sm focus:border-brand-gold focus:outline-none" />
        </label>)}
        <label className="flex items-center gap-2 text-xs text-brand-grey sm:col-span-2"><input type="checkbox" checked={form.isDefault} disabled={isExistingDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="accent-brand-gold" />{isExistingDefault ? 'This is your default address. Select another card to change it.' : 'Make this my default address'}</label>
        <div className="flex gap-3 sm:col-span-2"><button type="submit" className="btn-primary px-5 py-2.5 text-xs">{busy ? 'Saving...' : 'Save address'}</button><button type="button" onClick={() => setForm(null)} className="btn-outline px-5 py-2.5 text-xs">Cancel</button></div>
      </fieldset>
    </form>}
    {loading ? <p role="status" className="py-8 text-center text-sm text-brand-grey">Loading saved addresses...</p> : addresses.length === 0 ? <div className="rounded-lg border border-dashed border-neutral-200 px-5 py-12 text-center"><MapPin className="mx-auto mb-3 text-brand-gold" size={32} strokeWidth={1.5} /><h2 className="font-playfair text-lg">Your addresses, all in one place</h2><p className="mt-2 text-sm text-brand-grey">Add a Home or Work address to select it at checkout.</p></div> : <div className="grid gap-4 lg:grid-cols-2">
      {addresses.map(row => <article key={row.id} className={`rounded-lg border p-4 ${row.isDefault ? 'border-brand-gold bg-brand-light/20' : 'border-neutral-200'}`}>
        <div className="mb-2 flex items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><MapPin size={15} className="text-brand-gold" />{row.label}</h2>{row.isDefault && <span className="rounded bg-brand-gold/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-gold">Default</span>}</div>
        <p className="text-sm font-medium">{row.name}</p><p className="mt-1 break-words text-sm leading-6 text-brand-grey">{[row.address, row.addressLine2, row.landmark, row.city, row.state, row.pincode, row.country].filter(Boolean).join(', ')}</p><p className="mt-2 text-xs text-brand-grey">{row.phone}</p>
        {deleting === row.id ? <div className="mt-4 border-t border-neutral-200 pt-3"><p className="mb-3 text-xs text-brand-grey">Delete this saved address? Past orders will keep their address details.</p><div className="flex gap-4"><button type="button" disabled={busy} onClick={() => perform(() => api.delete(`/customers/addresses/${row.id}`), 'Address deleted.')} className="text-xs font-semibold text-red-600">Confirm delete</button><button type="button" disabled={busy} onClick={() => setDeleting(null)} className="text-xs text-brand-grey">Cancel</button></div></div> : <div className="mt-4 flex flex-wrap gap-4 border-t border-neutral-200 pt-3">
          <button type="button" disabled={busy} onClick={() => open(row)} className="flex items-center gap-1 text-xs font-medium text-brand-text"><Pencil size={13} /> Edit</button>
          <button type="button" disabled={busy} onClick={() => setDeleting(row.id)} className="flex items-center gap-1 text-xs text-red-600"><Trash2 size={13} /> Delete</button>
          {!row.isDefault && <button type="button" disabled={busy} onClick={() => perform(() => api.put(`/customers/addresses/${row.id}/default`), 'Default address updated.')} className="ml-auto text-xs font-semibold text-brand-gold">Set as default</button>}
        </div>}
      </article>)}
    </div>}
  </section>;
}
