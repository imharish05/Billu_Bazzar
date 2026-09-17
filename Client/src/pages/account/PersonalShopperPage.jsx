import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, CheckCircle2, Loader2, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import PhoneInput from '../../components/PhoneInput';
import { validatePhoneNumber } from '../../utils/validation';

/**
 * PersonalShopperPage — /account/personal-shopper
 * Customer styling assistance request form connected to DB & Admin panel
 */
const PersonalShopperPage = () => {
  const { customer } = useSelector((s) => s.auth || {});

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    occasion: '',
    budget: '',
    style: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (customer) {
      setForm((f) => ({
        ...f,
        name: f.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: f.email || customer.email || '',
        phone: f.phone || customer.phone || '',
      }));
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.occasion.trim() || !form.budget.trim()) {
      toast.error('Please specify occasion and budget');
      return;
    }
    if (form.phone && form.phone.trim()) {
      const phoneVal = validatePhoneNumber(form.phone, { required: false });
      if (!phoneVal.isValid) {
        toast.error(phoneVal.message);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.post('/personal-shopper', form);
      if (res.data?.success) {
        setSubmitted(true);
        toast.success(res.data.message || 'Styling request sent — our stylist will reach out within 24h');
      } else {
        toast.error(res.data?.message || 'Failed to submit styling request');
      }
    } catch (err) {
      console.error('Personal shopper request error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit styling request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full">
        {/* Top Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <Gift size={22} className="text-brand-gold" />
            <h1 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900 uppercase tracking-tight">
              Personal Shopper
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Our personal stylists will curate a luxury collection tailored specifically for you based on your preferences, occasion, and budget.
          </p>
        </div>

        <div className="bg-white border border-neutral-200/80 rounded-lg p-10 text-center shadow-xs">
          <CheckCircle2 size={44} className="text-brand-gold mx-auto mb-3" strokeWidth={1.5} />
          <h2 className="font-playfair text-xl font-semibold mb-2 text-neutral-900">Request Received</h2>
          <p className="text-neutral-500 text-sm mb-6 max-w-sm mx-auto">
            A Billu Bazaar personal stylist will review your preferences and reach out with a curated selection soon.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-outline text-xs px-5 py-2.5 rounded-lg"
            id="shopper-new-request"
          >
            Submit Another Request
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full">
      {/* Top Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-1">
          <Gift size={22} className="text-brand-gold" />
          <h1 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900 uppercase tracking-tight">
            Personal Shopper
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Our personal stylists will curate a luxury collection tailored specifically for you based on your preferences, occasion, and budget.
        </p>
      </div>

      {/* Feature Highlights Row — matching stats row in My Reviews & Loyalty */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <Sparkles size={18} className="text-brand-gold mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">Bespoke Curation</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Handpicked luxury styling</p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <Clock size={18} className="text-blue-600 mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">24-Hour Outreach</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Dedicated stylist contact</p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <ShieldCheck size={18} className="text-emerald-600 mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">Complimentary</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Free service for members</p>
        </div>
      </div> */}

      {/* Form Container */}
      <div className="bg-white border border-neutral-200/80 rounded-lg p-5 sm:p-7 shadow-xs">
        <div className="border-b border-neutral-100 pb-3 mb-5">
          <h2 className="font-playfair text-sm sm:text-base font-bold text-neutral-900 uppercase tracking-tight">
            Consultation Preferences
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share your style preferences, budget, and occasion so our stylists can prepare your personalized selection.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-name">
                Your Name <span className="text-brand-gold">*</span>
              </label>
              <input
                id="shopper-name"
                type="text"
                required
                placeholder="Full Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold bg-neutral-50/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-email">
                Email Address <span className="text-brand-gold">*</span>
              </label>
              <input
                id="shopper-email"
                type="email"
                required
                placeholder="Email Address"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold bg-neutral-50/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <PhoneInput
                id="shopper-phone"
                name="phone"
                label="Phone Number"
                value={form.phone}
                onChange={(val) => setForm((f) => ({ ...f, phone: val }))}
                className="w-full"
                inputClassName="py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-occasion">
                Occasion <span className="text-brand-gold">*</span>
              </label>
              <input
                id="shopper-occasion"
                type="text"
                required
                placeholder="Wedding, Birthday, Gala, Festival..."
                value={form.occasion}
                onChange={(e) => setForm((f) => ({ ...f, occasion: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold bg-neutral-50/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-budget">
                Budget (₹) <span className="text-brand-gold">*</span>
              </label>
              <input
                id="shopper-budget"
                type="text"
                required
                placeholder="e.g. 10,000 – 50,000"
                value={form.budget}
                onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold bg-neutral-50/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-style">
                Style Preference
              </label>
              <input
                id="shopper-style"
                type="text"
                placeholder="Traditional, Royal Bridal, Fusion, Contemporary..."
                value={form.style}
                onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold bg-neutral-50/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="shopper-notes">
              Additional Details / Specific Requirements
            </label>
            <textarea
              id="shopper-notes"
              rows={3}
              placeholder="Preferred colors, fabric choices, date of event, or anything else your personal stylist should know..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold resize-none bg-neutral-50/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm transition-transform active:scale-[0.99] shadow-2xs"
            id="shopper-submit"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Submitting Request...
              </>
            ) : (
              'Request Styling Consultation'
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default PersonalShopperPage;