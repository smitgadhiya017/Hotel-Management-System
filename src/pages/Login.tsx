import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const { login, isAuthenticated, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sign In form fields (pre-filled with default admin for convenience)
  const [email, setEmail] = useState('admin@grandstay.in');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success(res.message || 'Welcome back, Administrator!', {
        description: 'Session authenticated successfully',
      });
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.message || 'Authentication failed. Please check credentials.');
      toast.error('Sign In Failed', {
        description: res.message || 'Invalid administrator email or password',
      });
    }
  };

  // Instant 1-Click Admin Login
  const handleInstantAdminLogin = () => {
    setEmail('admin@grandstay.in');
    setPassword('admin123');
    setErrorMessage('');
    quickLogin('admin@grandstay.in', 'Administrator', 'Rajeshwar Rao');
    toast.success('Signed in as Administrator (Rajeshwar Rao)', {
      description: 'Full portal access granted',
    });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0A0F1D] relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full flex flex-col lg:flex-row max-w-6xl mx-auto my-auto p-4 sm:p-8 z-10">
        {/* Left Side: Brand & Hotel Atmosphere */}
        <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 text-white">
          <div>
            {/* Hotel Crest & Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/20">
                <div className="w-full h-full bg-[#0A0F1D] rounded-[14px] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent">
                  The GrandStay Palace
                </h1>
                <p className="text-xs uppercase tracking-widest text-amber-400/90 font-medium">
                  Hotel & Resort Management Portal
                </p>
              </div>
            </div>

            {/* Tagline & Feature Highlights */}
            <div className="space-y-6 mt-12 max-w-md">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Administrator Control Center</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
                Complete hospitality operations in one unified portal.
              </h2>

              <p className="text-slate-400 text-sm leading-relaxed">
                Manage room inventory, guest bookings, check-ins, payments, staff directory, and real-time reports with cloud Supabase synchronization.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-amber-400">Admin</p>
                  <p className="text-xs text-slate-400 mt-1">Full System Access</p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
                  <p className="text-2xl font-bold text-emerald-400">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Supabase PostgreSQL</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
            <span>The GrandStay Palace Hotel © 2026</span>
            <span>Marine Drive, Nariman Point, Mumbai</span>
          </div>
        </div>

        {/* Right Side: Admin Sign In Card */}
        <div className="lg:w-1/2 flex items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-100 relative">
            {/* Header Badge & Title */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mb-3">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span>Admin Login Only</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Administrator Sign In
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Enter your administrator credentials to access the hotel management portal.
              </p>
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <p className="flex-1">{errorMessage}</p>
              </div>
            )}

            {/* SIGN IN FORM */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@grandstay.in"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info('Default Admin Password', {
                      description: 'Email: admin@grandstay.in | Password: admin123',
                    })}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600">Remember this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-[#172554] hover:bg-[#1E3A8A] text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying admin credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Admin Login (Single Clean Button) */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Quick 1-Click Test Login
                </span>
                <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Admin Only
                </span>
              </div>

              <button
                type="button"
                onClick={handleInstantAdminLogin}
                className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-400 transition-all flex items-center justify-between group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-800 font-bold text-sm">
                    👑
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-amber-900">
                      Sign in as Administrator
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      admin@grandstay.in · admin123
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  Instant Access →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
