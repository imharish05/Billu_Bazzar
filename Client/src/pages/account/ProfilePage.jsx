import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3, Save, X, Lock, Key, Eye, EyeOff, User, Award, Star, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { updateProfile } from '../../redux/slices/authSlice';
import api from '../../services/api';
import { validatePassword, validatePhoneNumber } from '../../utils/validation';
import PhoneInput from '../../components/PhoneInput';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { customer, profileLoading } = useSelector(s => s.auth);

  // ── Profile Edit State ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
  });

  const startEdit = () => {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    if (form.phone && form.phone.trim()) {
      const phoneVal = validatePhoneNumber(form.phone, { required: false });
      if (!phoneVal.isValid) {
        toast.error(phoneVal.message);
        return;
      }
    }
    const result = await dispatch(updateProfile({ name: form.name.trim(), phone: form.phone ? form.phone.trim() : '' }));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully.');
      setEditing(false);
    } else {
      toast.error(result.payload || 'Failed to update profile.');
    }
  };

  // ── Password Change State ───────────────────────────────────────────────────
  const [showChangePw, setShowChangePw]       = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw]     = useState(false);
  const [showNewPw, setShowNewPw]             = useState(false);
  const [showConfirmPw, setShowConfirmPw]     = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changeErrors, setChangeErrors]       = useState({});

  const resetPasswordForm = () => {
    setShowChangePw(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setChangeErrors({});
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    const pv = validatePassword(newPassword);
    if (!pv.isValid) {
      errors.newPassword = pv.message;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setChangeErrors(errors);
      return;
    }

    setChangeErrors({});
    setChangePwLoading(true);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        toast.success('Password updated successfully!');
        resetPasswordForm();
      } else {
        toast.error(res.data.message || 'Failed to update password.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your current password.';
      toast.error(msg);
      if (msg.toLowerCase().includes('current password')) {
        setChangeErrors({ currentPassword: msg });
      }
    } finally {
      setChangePwLoading(false);
    }
  };

  // Display fallback values safely
  const display = {
    name: customer?.name || '—',
    email: customer?.email || '—',
    phone: customer?.phone || 'Not added',
    memberSince: customer?.createdAt
      ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900 uppercase tracking-tight">
            My Profile
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your personal information, contact details, and account security.
          </p>
        </div>

        {editing ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={cancelEdit}
              disabled={profileLoading}
              className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all flex items-center gap-1.5"
              id="cancel-profile-btn"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={profileLoading}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-neutral-950 text-white hover:bg-brand-gold transition-all flex items-center gap-1.5 shadow-2xs"
              id="save-profile-btn"
            >
              {profileLoading
                ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save size={13} />}
              {profileLoading ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <button
            onClick={startEdit}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
            id="edit-profile-btn"
          >
            <Edit3 size={13} /> Edit Profile
          </button>
        )}
      </div>

      {/* Stats / Overview Row — matching My Reviews & Loyalty */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <Award size={18} className="text-brand-gold mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">
            {(customer?.loyaltyPoints || 0) >= 1000 ? 'Gold Member' : (customer?.loyaltyPoints || 0) >= 500 ? 'Silver Member' : 'Bronze Member'}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Membership Tier</p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <Star size={18} className="fill-brand-gold text-brand-gold mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">{customer?.loyaltyPoints || 0} pts</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Reward Points Balance</p>
        </div>
        <div className="bg-white border border-neutral-200/80 rounded-lg p-3.5 sm:p-4 text-center shadow-xs flex flex-col items-center justify-center">
          <ShieldCheck size={18} className="text-emerald-600 mb-1" />
          <p className="text-xs sm:text-sm font-bold text-neutral-900">Verified Account</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Member since {display.memberSince}</p>
        </div>
      </div> */}

      {/* Personal Information Card */}
      <div className="bg-white border border-neutral-200/80 rounded-lg p-5 sm:p-6 shadow-xs mb-6">
        <div className="border-b border-neutral-100 pb-3 mb-5">
          <h2 className="font-playfair text-sm sm:text-base font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-2">
            <User size={16} className="text-brand-gold" /> Personal Information
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Your name and contact details used for orders and shipping updates.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Full Name</label>
            {editing ? (
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-neutral-200/80 px-3.5 py-2.5 text-sm focus:outline-none focus:border-brand-gold rounded-lg bg-neutral-50/20"
                id="profile-name"
                aria-label="Full Name"
              />
            ) : (
              <p className="font-medium text-sm text-neutral-800 break-words py-2 px-3 bg-neutral-50/50 rounded-lg border border-neutral-100">{display.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Email Address <span className="text-neutral-400 font-normal">(cannot be changed)</span></label>
            <p className="font-medium text-sm text-neutral-500 break-all py-2 px-3 bg-neutral-50/50 rounded-lg border border-neutral-100">{display.email}</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Phone Number</label>
            {editing ? (
              <PhoneInput
                id="profile-phone"
                name="phone"
                value={form.phone}
                onChange={(val) => setForm(f => ({ ...f, phone: val }))}
                className="w-full"
                inputClassName="py-2.5 text-sm"
              />
            ) : (
              <p className="font-medium text-sm text-neutral-800 break-words py-2 px-3 bg-neutral-50/50 rounded-lg border border-neutral-100">{display.phone}</p>
            )}
          </div>

          {/* Member Since */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Member Since</label>
            <p className="font-medium text-sm text-neutral-700 py-2 px-3 bg-neutral-50/50 rounded-lg border border-neutral-100">{display.memberSince}</p>
          </div>
        </div>
      </div>

      {/* Security & Password Card */}
      <div className="bg-white border border-neutral-200/80 rounded-lg p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-5">
          <div>
            <h2 className="font-playfair text-sm sm:text-base font-bold text-neutral-900 uppercase tracking-tight flex items-center gap-2">
              <Lock size={16} className="text-brand-gold" /> Account Security
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Keep your account secure by using a strong password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowChangePw(!showChangePw);
              if (showChangePw) resetPasswordForm();
            }}
            className="text-xs font-semibold uppercase tracking-wider text-brand-gold hover:underline flex items-center gap-1.5 shrink-0"
            id="profile-change-password-trigger"
          >
            <Key size={13} /> {showChangePw ? 'Close' : 'Change Password'}
          </button>
        </div>

        {!showChangePw ? (
          <div className="flex items-center justify-between py-2 px-3 bg-neutral-50/50 rounded-lg border border-neutral-100">
            <div>
              <span className="text-xs font-medium text-neutral-500 block mb-0.5">Password</span>
              <span className="text-sm font-medium tracking-widest text-neutral-700">••••••••••••</span>
            </div>
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 size={12} /> Active
            </span>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleChangePassword}
            className="space-y-4"
            noValidate
          >
            <div className="grid sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1.5 font-medium" htmlFor="profile-current-password">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value);
                      if (changeErrors.currentPassword) setChangeErrors(p => ({ ...p, currentPassword: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full border ${changeErrors.currentPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-brand-gold'} px-3 py-2.5 pr-9 text-sm rounded-lg focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1.5 font-medium" htmlFor="profile-new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      if (changeErrors.newPassword) {
                        const v = validatePassword(e.target.value);
                        setChangeErrors(p => ({ ...p, newPassword: v.isValid ? '' : v.message }));
                      }
                    }}
                    placeholder="Min. 6 characters"
                    className={`w-full border ${changeErrors.newPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-brand-gold'} px-3 py-2.5 pr-9 text-sm rounded-lg focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showNewPw ? 'Hide password' : 'Show password'}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs text-neutral-600 mb-1.5 font-medium" htmlFor="profile-confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (changeErrors.confirmPassword) {
                        setChangeErrors(p => ({ ...p, confirmPassword: e.target.value === newPassword ? '' : 'Passwords do not match.' }));
                      }
                    }}
                    placeholder="Repeat new password"
                    className={`w-full border ${changeErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-brand-gold'} px-3 py-2.5 pr-9 text-sm rounded-lg focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetPasswordForm}
                disabled={changePwLoading}
                className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all flex items-center justify-center gap-1.5"
                id="cancel-change-pw-btn"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="submit"
                disabled={changePwLoading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg bg-neutral-950 text-white hover:bg-brand-gold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                id="save-change-pw-btn"
              >
                {changePwLoading ? (
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {changePwLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </motion.div>
  );
};

export default ProfilePage;