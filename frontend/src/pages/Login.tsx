import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Eye,
  AlertCircle,
  EyeOff,
} from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials or login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md">
        {/* AutoTrack Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 mb-4">
            <Car className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            AutoTrack<span className="text-blue-600">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Automotive Plant Telemetry & Production Execution System
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-1">
              Authenticate to access plant telemetry and operational controls
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@autotrack.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Plant</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Role Demonstration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@autotrack.com', 'Admin@123')}
                className="p-2.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-center group transition-colors"
              >
                <div className="w-7 h-7 mx-auto rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-slate-800">Admin</div>
                <div className="text-[9px] text-slate-400">Full Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator@autotrack.com', 'Operator@123')}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl text-center group transition-colors"
              >
                <div className="w-7 h-7 mx-auto rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-slate-800">Operator</div>
                <div className="text-[9px] text-slate-400">Log & Edit</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('viewer@autotrack.com', 'Viewer@123')}
                className="p-2.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl text-center group transition-colors"
              >
                <div className="w-7 h-7 mx-auto rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <Eye className="w-3.5 h-3.5" />
                </div>
                <div className="text-[11px] font-bold text-slate-800">Viewer</div>
                <div className="text-[9px] text-slate-400">Read-Only</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400 mt-6">
          AutoTrack Manufacturing Execution System • Auto-provisioned v1.0
        </p>
      </div>
    </div>
  );
};

export default Login;
