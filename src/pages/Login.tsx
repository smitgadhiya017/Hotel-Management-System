import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Crown, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login, isAuthenticated, quickLogin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');
  const [email, setEmail]               = useState('admin@grandstay.in');
  const [password, setPassword]         = useState('admin123');
  const [rememberMe, setRememberMe]     = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      toast.success(res.message || 'Welcome back, Administrator!');
      navigate(from, { replace: true });
    } else {
      setErrorMsg(res.message || 'Invalid credentials. Please try again.');
      toast.error('Sign In Failed', { description: res.message });
    }
  };

  const handleQuickLogin = () => {
    quickLogin('admin@grandstay.in', 'Administrator', 'Rajeshwar Rao');
    toast.success('Signed in as Administrator');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans relative overflow-hidden">

      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md z-10">

        {/* ── Logo / Brand ───────────────────────── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#172554] to-[#1e3a8a] shadow-lg shadow-blue-900/20 mb-4">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">The GrandStay Palace</h1>
          <p className="text-sm text-slate-500 mt-1">Hotel &amp; Resort Management System</p>
        </div>

        {/* ── Card ───────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200 p-8">

          {/* Card header */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Administrator Sign In</h2>
              <p className="text-xs text-slate-400">Restricted to authorized admin only</p>
            </div>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@grandstay.in"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#172554]/30 focus:border-[#172554] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast.info('Default credentials: admin@grandstay.in / admin123')}
                  className="text-xs text-[#172554] hover:text-blue-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#172554]/30 focus:border-[#172554] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#172554] border-slate-300"
              />
              <span className="text-xs text-slate-600">Keep me signed in</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#172554] hover:bg-[#1e3a8a] text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying credentials…
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Quick login */}
          <button
            type="button"
            onClick={handleQuickLogin}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 transition-all group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-200/60 flex items-center justify-center text-base flex-shrink-0">
              👑
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-800">Quick Admin Login</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">admin@grandstay.in · admin123</p>
            </div>
            <span className="text-xs font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
              Go →
            </span>
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 The GrandStay Palace · Marine Drive, Mumbai
        </p>
      </div>
    </div>
  );
};
export default Login;
