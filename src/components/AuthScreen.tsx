import React, { useState } from 'react';
import { BookOpen, ShieldCheck, ArrowRight, Store, KeyRound, Mail, Sparkles } from 'lucide-react';
import { LedgerStore } from '../utils/storage';
import { UserSession } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Kripya email aur password dono bharein');
      return;
    }

    setIsSubmitting(true);
    setError('');
    
    setTimeout(() => {
      const res = LedgerStore.loginUser(email, password);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        onLoginSuccess(res.user);
      }
    }, 200);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Kripya email aur password dono bharein');
      return;
    }

    if (password.length < 6) {
      setError('Password kam se kam 6 akshar ka hona chahiye');
      return;
    }

    setIsSubmitting(true);
    setError('');

    setTimeout(() => {
      const res = LedgerStore.registerUser(email, password);
      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        onLoginSuccess(res.user);
      }
    }, 200);
  };

  const handleQuickDemo = () => {
    setEmail('demo.dukandar@khata.in');
    setPassword('dukaan123');
    const res = LedgerStore.loginUser('demo.dukandar@khata.in', 'dukaan123');
    onLoginSuccess(res.user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F3E2E] via-[#14532D] to-[#0A261D] flex flex-col justify-center items-center px-4 py-8">
      {/* Decorative Brand Header */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-400/20 border border-amber-400/30 text-amber-300 mb-3 shadow-lg backdrop-blur-md">
          <BookOpen className="w-8 h-8 text-amber-300" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          📒 Udhari Khata
        </h1>
        <p className="text-emerald-200/80 text-sm mt-1">
          Digital Dukaan Ledger & Dynamic UPI Bahi Khata
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-emerald-900/10">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Dukandar Login</h2>
          <p className="text-xs text-gray-500 mt-1">
            Apna grahak ledger dekhne ke liye sign-in karein
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vyapari@gmail.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm bg-gray-50/50"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
            >
              <span>Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isSubmitting}
              className="w-full py-3 px-4 border-2 border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 active:scale-[0.99] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Naya account banayein</span>
            </button>
          </div>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-400 font-medium">ya seedha try karein</span>
          </div>
        </div>

        {/* Demo One-Click Access */}
        <button
          type="button"
          onClick={handleQuickDemo}
          className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 border border-amber-300/60 text-amber-900 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Demo Dukaan mein pravesh karein (1-Click)</span>
        </button>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Safe Ledger
          </span>
          <span className="flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-emerald-600" /> Bharat ke Vyapari
          </span>
        </div>
      </div>
    </div>
  );
};
