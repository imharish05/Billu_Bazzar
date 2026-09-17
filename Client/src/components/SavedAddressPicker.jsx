import { useEffect, useState, useRef } from 'react';
import { MapPin, Plus, Check, Edit3 } from 'lucide-react';
import api from '../services/api';

const formAddress = (row, customer) => ({
  fullName: row.name || '',
  phone: row.phone || '',
  email: row.email || customer?.email || '',
  flatHouse: [row.address, row.addressLine2].filter(Boolean).join(', '),
  landmark: row.landmark || '',
  city: row.city || '',
  state: row.state || '',
  pincode: row.pincode || '',
  country: row.country || '',
});

export default function SavedAddressPicker({
  customer,
  value,
  onChange,
  onModeChange,
  delivery = false,
}) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState('Home');
  const [makeDefault, setMakeDefault] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const [selectedId, setSelectedId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const initializedRef = useRef(false);

  const allowed = (row) => !delivery || ['india', 'in', 'ind'].includes((row.country || '').trim().toLowerCase());

  // Fetch saved addresses from server
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    api.get('/customers/addresses')
      .then(({ data }) => {
        if (!active) return;
        const list = data.addresses || [];
        setAddresses(list);

        if (list.length > 0) {
          // Check if value already matches a saved address in the list
          const matched = list.find(row =>
            (value?.flatHouse && (value.flatHouse || '').trim() === [row.address, row.addressLine2].filter(Boolean).join(', ').trim()) ||
            (value?.phone && (value.phone || '').trim() === (row.phone || '').trim() && (value.pincode || '').trim() === (row.pincode || '').trim())
          );

          if (matched && allowed(matched)) {
            setSelectedId(matched.id);
            onModeChange?.({ isSaved: true, isEditing: false, hasSaved: true, selectedAddress: matched, loaded: true });
          } else {
            // Check if value is basically empty (initial landing on checkout)
            const isValueEmpty = !value?.flatHouse && !value?.city && !value?.pincode;
            if (isValueEmpty || !initializedRef.current) {
              const defaultAddr = list.find(r => r.isDefault && allowed(r)) || list.find(allowed) || list[0];
              if (defaultAddr) {
                setSelectedId(defaultAddr.id);
                onChange(formAddress(defaultAddr, customer));
                onModeChange?.({ isSaved: true, isEditing: false, hasSaved: true, selectedAddress: defaultAddr, loaded: true });
              } else {
                setSelectedId('new');
                onModeChange?.({ isSaved: false, isEditing: false, hasSaved: true, selectedAddress: null, loaded: true });
              }
            } else {
              setSelectedId('new');
              onModeChange?.({ isSaved: false, isEditing: false, hasSaved: true, selectedAddress: null, loaded: true });
            }
          }
        } else {
          setSelectedId('new');
          onModeChange?.({ isSaved: false, isEditing: false, hasSaved: false, selectedAddress: null, loaded: true });
        }
        initializedRef.current = true;
      })
      .catch(() => {
        if (active) {
          setError('Saved addresses could not be loaded. You can enter an address below.');
          onModeChange?.({ isSaved: false, isEditing: false, hasSaved: false, selectedAddress: null, loaded: true });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [customer?.id, refresh]);

  // Reload when addresses change in account settings
  useEffect(() => {
    const reload = () => setRefresh(n => n + 1);
    window.addEventListener('saved-addresses-changed', reload);
    return () => window.removeEventListener('saved-addresses-changed', reload);
  }, []);

  const selectedAddress = addresses.find(r => r.id === selectedId);

  const handleSelectAddress = (row) => {
    if (!allowed(row)) return;
    setSelectedId(row.id);
    setIsEditing(false);
    setError('');
    setMessage('');
    onChange(formAddress(row, customer));
    onModeChange?.({ isSaved: true, isEditing: false, hasSaved: true, selectedAddress: row, loaded: true });
  };

  const handleSelectNew = () => {
    setSelectedId('new');
    setIsEditing(false);
    setError('');
    setMessage('');
    onChange({
      fullName: customer?.name || '',
      phone: customer?.phone || '',
      email: customer?.email || '',
      flatHouse: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: delivery ? 'India' : '',
    });
    onModeChange?.({ isSaved: false, isEditing: false, hasSaved: true, selectedAddress: null, loaded: true });
  };

  const handleToggleEditing = () => {
    const next = !isEditing;
    setIsEditing(next);
    onModeChange?.({ isSaved: true, isEditing: next, hasSaved: true, selectedAddress, loaded: true });
  };

  const save = async () => {
    if (!value?.fullName || !value?.flatHouse || !value?.city || !value?.pincode) {
      setError('Please fill in the required address fields below before saving.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/customers/addresses', {
        label,
        name: value.fullName,
        phone: value.phone,
        email: value.email,
        address: value.flatHouse,
        landmark: value.landmark || '',
        city: value.city,
        state: value.state,
        pincode: value.pincode,
        country: value.country,
        isDefault: makeDefault,
      });
      setAddresses(prev => [
        ...prev.map(row => data.address.isDefault ? { ...row, isDefault: false } : row),
        data.address
      ]);
      setSelectedId(data.address.id);
      setIsEditing(false);
      onModeChange?.({ isSaved: true, isEditing: false, hasSaved: true, selectedAddress: data.address, loaded: true });
      setMessage('Address saved successfully for your next order.');
      window.dispatchEvent(new Event('saved-addresses-changed'));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this address. Check the address fields.');
    } finally {
      setSaving(false);
    }
  };

  // If loading and no addresses yet
  if (loading && addresses.length === 0) {
    return (
      <div className="mb-4">
        <p role="status" className="text-xs text-neutral-400 animate-pulse">Loading saved addresses...</p>
      </div>
    );
  }

  // If no saved addresses exist for this customer, don't show the saved addresses picker
  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 min-w-0">
      {/* Section Sub-header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={13} className="text-brand-gold shrink-0" />
          Select {delivery ? 'Delivery' : 'Billing'} Address
        </span>
      </div>

      {/* Grid of Address Tiles - Compact & Proportional */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map(row => {
          const isSelected = selectedId === row.id;
          const isRowAllowed = allowed(row);

          return (
            <div
              key={row.id}
              onClick={() => isRowAllowed && handleSelectAddress(row)}
              className={`relative rounded-lg p-3 sm:p-3.5 transition-all select-none ${
                !isRowAllowed
                  ? 'cursor-not-allowed opacity-50 bg-neutral-50 border border-neutral-200'
                  : 'cursor-pointer'
              } ${
                isSelected
                  ? 'bg-amber-50/25 border border-brand-gold/90 shadow-2xs ring-1 ring-brand-gold/15'
                  : 'bg-white border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/30'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-colors shrink-0 ${
                    isSelected ? 'border-brand-gold bg-brand-gold text-white' : 'border-neutral-300 bg-white'
                  }`}>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span className="font-semibold text-[13px] text-brand-text truncate">
                    {row.label || 'Address'}
                  </span>
                  {row.isDefault && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded shrink-0">
                      Default
                    </span>
                  )}
                </div>

                {isSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleEditing();
                    }}
                    className={`text-xs font-medium px-2 py-0.5 rounded transition-all flex items-center gap-1 shrink-0 ${
                      isEditing
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-2xs'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-brand-gold hover:text-brand-gold shadow-2xs'
                    }`}
                    id={`edit-saved-${delivery ? 'delivery' : 'billing'}-btn`}
                    title={isEditing ? 'Done editing' : 'Edit address for this order'}
                  >
                    <Edit3 size={11} />
                    <span>{isEditing ? 'Done' : 'Edit'}</span>
                  </button>
                )}
              </div>

              <div className="pl-5.5 space-y-0.5">
                <p className="font-semibold text-neutral-800 text-xs leading-tight">{row.name}</p>
                <p className="text-xs text-neutral-600 leading-snug break-words line-clamp-2">
                  {[row.address, row.addressLine2, row.city, row.state, row.pincode].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-neutral-500 pt-0.5">{row.country} • {row.phone}</p>
                {!isRowAllowed && (
                  <p className="text-[11px] text-red-600 font-medium pt-0.5">Delivery is available within India only.</p>
                )}
              </div>
            </div>
          );
        })}

        {/* + Use a new address tile */}
        <div
          onClick={handleSelectNew}
          className={`rounded-lg p-3 sm:p-3.5 transition-all cursor-pointer select-none flex flex-row sm:flex-col items-center justify-center text-center gap-2 sm:gap-1.5 min-h-[50px] sm:min-h-[96px] border border-dashed ${
            selectedId === 'new'
              ? 'bg-amber-50/25 border border-brand-gold/90 shadow-2xs ring-1 ring-brand-gold/15'
              : 'bg-white border-neutral-300 hover:border-brand-gold/60 hover:bg-neutral-50/30 text-neutral-600'
          }`}
        >
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
            selectedId === 'new' ? 'bg-brand-gold text-white' : 'bg-neutral-100 text-neutral-600'
          }`}>
            <Plus size={14} />
          </div>
          <div className="text-left sm:text-center">
            <span className="font-medium text-[13px] text-neutral-800 block">Use a new address</span>
            <span className="text-xs text-neutral-500 hidden sm:block">Enter different address details below</span>
          </div>
        </div>
      </div>

      {/* Active Address editing helper alert */}
      {selectedAddress && selectedId !== 'new' && isEditing && (
        <div className="mt-2.5 p-2 sm:p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg text-[11px] text-amber-900 flex items-center justify-between gap-2 animate-in fade-in">
          <span className="flex items-center gap-1.5 font-medium">
            <Edit3 size={11} className="text-brand-gold shrink-0" />
            Editing address for this order only (saved profile remains unchanged).
          </span>
          <button
            type="button"
            onClick={handleToggleEditing}
            className="text-[11px] font-semibold text-brand-gold hover:underline shrink-0"
          >
            Close
          </button>
        </div>
      )}

      {/* When user selected to enter a new address - clean inline options */}
      {selectedId === 'new' && (
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-600">
          <span className="font-medium text-neutral-700">
            Fill in your new {delivery ? 'delivery' : 'billing'} address below:
          </span>
          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={makeDefault}
                onChange={e => setMakeDefault(e.target.checked)}
                className="accent-brand-gold w-3 h-3"
              />
              <span>Save to profile</span>
            </label>
            {makeDefault && (
              <>
                <select
                  aria-label={delivery ? 'Delivery address label' : 'Billing address label'}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10.5px] focus:border-brand-gold focus:outline-none"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="text-[10.5px] text-brand-gold hover:underline font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save now'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {message && (
        <p role="status" className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <Check size={14} className="text-emerald-600" /> {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setRefresh(n => n + 1)} className="underline font-semibold ml-2">
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
