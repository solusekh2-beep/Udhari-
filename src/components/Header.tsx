import React from 'react';
import { Store, Settings, LogOut, Volume2, VolumeX, ShieldCheck, QrCode, Smartphone } from 'lucide-react';
import { ShopSettings, LanguageMode } from '../types';
import { rupees } from '../utils/formatters';

interface HeaderProps {
  shopSettings: ShopSettings;
  totalBalance: number;
  customerCount: number;
  language: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  soundboxEnabled: boolean;
  onToggleSoundbox: () => void;
  onOpenQuickQr: () => void;
  onOpenAndroidModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shopSettings,
  totalBalance,
  customerCount,
  language,
  onLanguageChange,
  onOpenSettings,
  onLogout,
  soundboxEnabled,
  onToggleSoundbox,
  onOpenQuickQr,
  onOpenAndroidModal,
}) => {
  return (
    <header className="bg-gradient-to-r from-[#0F3E2E] via-[#16563F] to-[#0A2E22] text-white shadow-xl sticky top-0 z-30 border-b border-emerald-800/40">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Top Row: Shop Brand & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shadow-inner">
                <Store className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                    <span>📒 {shopSettings.shop || 'Dukaan'}</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700/50">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verfied Khata
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-200/80">
                  <span>UPI:</span>
                  <span className="font-mono font-medium text-amber-200 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/30">
                    {shopSettings.upi || 'UPI not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile quick actions */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={onOpenAndroidModal}
                title="Android APK & Install"
                className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenQuickQr}
                title="Dukaan UPI QR"
                className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 text-amber-300 border border-emerald-700/60"
              >
                <QrCode className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenSettings}
                title="Settings"
                className="p-2 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 text-white border border-emerald-700/60"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-200 border border-red-800/40"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Right Actions: Soundbox, Quick QR, Language, Settings, Logout */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Android APK Button */}
            <button
              onClick={onOpenAndroidModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400/20 to-amber-500/20 hover:from-amber-400/30 hover:to-amber-500/30 border border-amber-400/40 text-xs font-bold text-amber-200 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>Android APK</span>
            </button>

            {/* Dukaan QR code */}
            <button
              onClick={onOpenQuickQr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 border border-emerald-700/50 text-xs font-semibold text-amber-200 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dukaan QR</span>
            </button>

            {/* Soundbox speaker toggle */}
            <button
              onClick={onToggleSoundbox}
              title={soundboxEnabled ? "Soundbox Audio On" : "Soundbox Muted"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                soundboxEnabled
                  ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                  : 'bg-emerald-950/40 border-emerald-800/60 text-gray-300'
              }`}
            >
              {soundboxEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Soundbox ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Mute</span>
                </>
              )}
            </button>

            {/* Language Selector */}
            <div className="flex bg-emerald-950/60 p-0.5 rounded-xl border border-emerald-800/60 text-xs">
              {(['hinglish', 'hindi', 'english'] as LanguageMode[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
                    language === lang
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-300/70 hover:text-white'
                  }`}
                >
                  {lang === 'hinglish' ? 'Hinglish' : lang === 'hindi' ? 'हिंदी' : 'EN'}
                </button>
              ))}
            </div>

            {/* Settings Button */}
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800/60 hover:bg-emerald-700 border border-emerald-700/50 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/40 text-xs font-semibold text-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="mt-3.5 pt-3 border-t border-emerald-800/40 grid grid-cols-2 sm:grid-cols-3 gap-2 text-white">
          <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
                Kul Baaki (Total Due)
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-300 tracking-tight">
                {rupees(totalBalance)}
              </span>
            </div>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-700/40 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
                Kul Grahak (Customers)
              </span>
              <span className="text-lg sm:text-xl font-black text-white tracking-tight">
                {customerCount} <span className="text-xs font-normal text-emerald-300">Dukandari</span>
              </span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-emerald-950/40 border border-emerald-700/40 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-200/70 block uppercase tracking-wider">
                Digital Payment QR
              </span>
              <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                GPay • PhonePe • Paytm ready
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
