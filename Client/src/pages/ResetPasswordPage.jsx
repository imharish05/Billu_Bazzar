import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';
import { validatePassword } from '../utils/validation';
import Footer from '../components/Footer';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPw] = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errors, setErrors]             = useState({});
  const [success, setSuccess]           = useState(false);
  const [invalidLink, setInvalidLink]   = useState(false);

  // Validate that the URL has the required params
  useEffect(() => {
    if (!token || !email) setInvalidLink(true);
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const pv = validatePassword(password);
    if (!pv.isValid) newErrors.password = pv.message;

    if (!confirmPassword) {
      newErrors.confirm = 'Please confirm your new password.';
    } else if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, email, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      // Redirect to account login after 3s
      setTimeout(() => navigate('/account'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired reset link.';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setInvalidLink(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid / expired link ──────────────────────────────────────────────────
  if (invalidLink) {
    return (
      <>
        <main id="main-content" className="bg-[#FDFDFB] min-h-[80vh] flex items-center justify-center py-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white border border-neutral-100 p-8 md:p-10 shadow-sm rounded-lg text-center"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-400" strokeWidth={1.5} />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-neutral-900 mb-3">Link expired</h1>
            <p className="text-sm text-neutral-500 mb-6">
              This password reset link is invalid or has expired. Reset links are valid for <strong>1 hour</strong>.
            </p>
            <Link
              to="/account"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg"
              id="request-new-link-btn"
            >
              Request a new link
            </Link>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <>
        <main id="main-content" className="bg-[#FDFDFB] min-h-[80vh] flex items-center justify-center py-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-white border border-neutral-100 p-8 md:p-10 shadow-sm rounded-lg text-center"
          >
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-green-500" strokeWidth={1.5} />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-neutral-900 mb-3">Password reset!</h1>
            <p className="text-sm text-neutral-500 mb-2">
              Your password has been reset successfully. Redirecting you to sign in…
            </p>
            <div className="h-1 bg-neutral-100 rounded mt-6 overflow-hidden">
              <div className="h-full bg-brand-gold animate-[shrink_3s_linear_forwards]" style={{ width: '100%', animation: 'shrink 3s linear forwards' }} />
            </div>
          </motion.div>
        </main>
        <Footer />
      </>
    );
  }

  // ── Reset password form ─────────────────────────────────────────────────────
  return (
    <>
      <main id="main-content" className="bg-[#FDFDFB] min-h-[80vh] flex items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white border border-neutral-100 p-8 md:p-10 shadow-sm rounded-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-neutral-950 flex items-center justify-center mx-auto mb-4 text-brand-gold">
              <Lock size={22} strokeWidth={1.5} />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-neutral-900">Set new password</h1>
            <p className="text-xs text-neutral-500 mt-2">
              Resetting password for <span className="font-semibold text-neutral-700">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="reset-password">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-neutral-400"><Lock size={16} /></span>
                <input
                  id="reset-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      const v = validatePassword(e.target.value);
                      setErrors(prev => ({ ...prev, password: v.isValid ? '' : v.message }));
                    }
                  }}
                  placeholder="Min. 6 characters"
                  className={`w-full border ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5" htmlFor="reset-confirm">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-neutral-400"><Lock size={16} /></span>
                <input
                  id="reset-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => {
                    setConfirmPw(e.target.value);
                    if (errors.confirm) {
                      setErrors(prev => ({ ...prev, confirm: e.target.value === password ? '' : 'Passwords do not match.' }));
                    }
                  }}
                  placeholder="Repeat your new password"
                  className={`w-full border ${errors.confirm ? 'border-red-400 focus:border-red-500' : 'border-neutral-200/80 focus:border-brand-gold'} rounded-lg pl-10 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/30 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-lg flex items-center justify-center font-semibold text-sm transition-transform active:scale-[0.98] mt-2"
              id="reset-submit-btn"
            >
              {loading
                ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Reset Password'}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link to="/account" className="text-xs text-brand-gold hover:underline font-semibold" id="back-to-login-from-reset">
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </>
  );
};

export default ResetPasswordPage;
