import React, { useState } from 'react';
import { X, Store, CheckCircle2, AlertCircle, RotateCcw, Building, Smartphone, QrCode } from 'lucide-react';
import { ShopSettings } from '../types';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSave: (settings: ShopSettings) => void;
  onResetData: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetData,
}) => {
  const [shop, setShop] = useState(settings.shop || '');
  const [upi, setUpi] = useState(settings.upi || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [status, setStatus] = useState<string>('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop.trim()) {
      setStatus('Dukaan ka naam likhna anivarya hai (Shop name is required)');
      setStatusType('error');
      return;
    }

    if (upi.trim() && !upi.includes('@')) {
      setStatus('Kripya sahi UPI ID bharein (Jaise: dukaan@upi, mobile@okhdfcbank)');
      setStatusType('error');
      return;
    }

    onSave({
      ...settings,
      shop: shop.trim(),
      upi: upi.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
    });

    setStatus('Settings save ho gayi! (Settings saved successfully)');
    setStatusType('success');
    setTimeout(() => {
      onClose();
      setStatus('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0F3E2E] to-[#14532D] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center text-amber-300">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Dukaan aur UPI Setting</h3>
              <p className="text-xs text-emerald-200/80">Apni dukaan aur QR payment ID manage karein</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {status && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusType === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{status}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dukaan ka naam *</span>
            </label>
            <input
              type="text"
              value={shop}
              onChange={e => setShop(e.target.value)}
              placeholder="e.g., Sharma Kirana & General Store"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dukandar UPI ID (Payment prapt karne ke liye) *</span>
            </label>
            <input
              type="text"
              value={upi}
              onChange={e => setUpi(e.target.value)}
              placeholder="e.g., 9876543210@paytm, dukaan@okhdfcbank"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-mono"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Isi UPI ID par aapke grahak QR code scan karke ya Google Pay/PhonePe se sidha payment bhejenge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Vyapari / Malik ka naam
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                placeholder="e.g., Radhe Shyam"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-emerald-700" />
                <span>Mobile number</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kya aap sample data reset karna chahte hain?')) {
                  onResetData();
                  setStatus('Sample data reset ho gaya!');
                  setStatusType('success');
                }
              }}
              className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Khata Data</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Radd karein
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/20 cursor-pointer"
              >
                Settings save karein
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
