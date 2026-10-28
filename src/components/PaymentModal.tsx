import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, CheckCircle, ShieldCheck, IndianRupee, AlertCircle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Customer } from '../types';
import { rupees } from '../utils/formatters';
import { soundbox } from '../utils/sound';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  mode: 'payment' | 'credit'; // 'payment' = Jama (Received), 'credit' = Nayi Udhari (Given)
  onRecordPayment: (customerId: string, amount: number, note?: string) => void;
  onAddCredit: (customerId: string, amount: number, note?: string) => void;
  soundboxEnabled: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  mode,
  onRecordPayment,
  onAddCredit,
  soundboxEnabled,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'bank'>('upi');
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifiedChecked, setVerifiedChecked] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !customer) return null;

  const currentBalance = customer.balance;
  const isPayment = mode === 'payment';

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const paid = parseFloat(amount.trim());

    if (isNaN(paid) || paid <= 0) {
      setErrorMessage('Kripya sahi rakam bharein (Please enter valid amount)');
      return;
    }

    if (isPayment && paid > currentBalance) {
      setErrorMessage(`Jama rakam baaki (${rupees(currentBalance)}) se zyada nahi ho sakti`);
      return;
    }

    setErrorMessage('');
    
    if (isPayment) {
      // Show Verification Alert Dialog (matches Kotlin AlertDialog)
      setShowVerifyDialog(true);
    } else {
      // Directly record credit
      executeTransaction(paid);
    }
  };

  const executeTransaction = (numAmount: number) => {
    if (isPayment) {
      onRecordPayment(
        customer.id,
        numAmount,
        note.trim() || `Jama via ${paymentMethod.toUpperCase()}`
      );

      // Play Soundbox Chime & Voice
      if (soundboxEnabled) {
        soundbox.announcePayment(numAmount, customer.name);
      }

      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#FBBF24', '#34D399'],
        });
      } catch {
        // ignore
      }
    } else {
      onAddCredit(
        customer.id,
        numAmount,
        note.trim() || 'Nayi Udhari'
      );
    }

    setShowVerifyDialog(false);
    setAmount('');
    setNote('');
    onClose();
  };

  const handleQuickPreset = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div
            className={`text-white px-6 py-4 flex items-center justify-between ${
              isPayment
                ? 'bg-gradient-to-r from-emerald-800 to-emerald-700'
                : 'bg-gradient-to-r from-red-800 to-red-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                {isPayment ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {isPayment ? 'Jama Rakam Record Karein (Payment)' : 'Nayi Udhari Jodein (Give Credit)'}
                </h3>
                <p className="text-xs text-white/80">Grahak: {customer.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
            
            {/* Customer Snapshot */}
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Kul Baaki (Current Due)</span>
                <span className="text-xl font-extrabold text-gray-900">{rupees(customer.balance)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500 font-medium block">Phone</span>
                <span className="text-xs font-mono text-gray-700">{customer.phone || 'No Phone'}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Amount input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                <span>{isPayment ? 'Jama Rakam (₹) *' : 'Udhari Rakam (₹) *'}</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={isPayment ? customer.balance.toString() : '500'}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-lg font-bold text-gray-900"
                  autoFocus
                  required
                />
              </div>

              {/* Quick Preset Buttons */}
              {isPayment && customer.balance > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-gray-500 font-medium">Shortcuts:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(customer.balance)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[11px] font-bold text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Pura Baaki ({rupees(customer.balance)})
                  </button>
                  {customer.balance > 200 && (
                    <button
                      type="button"
                      onClick={() => handleQuickPreset(Math.round(customer.balance / 2))}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-medium text-gray-700 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Aadha (Half)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method (for payment) */}
            {isPayment && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Bhugtan ka tareeqa (Payment Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'cash', 'bank'] as const).map(modeOpt => (
                    <button
                      key={modeOpt}
                      type="button"
                      onClick={() => setPaymentMethod(modeOpt)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                        paymentMethod === modeOpt
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {modeOpt === 'upi' ? '⚡ UPI / QR' : modeOpt === 'cash' ? '💵 Nakad (Cash)' : '🏦 Bank Transfer'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Note / Item details */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Note / Bill Number (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={isPayment ? 'e.g., GPay ref #9832 or Nakad mila' : 'e.g., 5kg Atta, 2L Tel'}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs"
              />
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold text-xs hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPayment
                    ? 'bg-emerald-700 hover:bg-emerald-800 shadow-emerald-900/20'
                    : 'bg-red-700 hover:bg-red-800 shadow-red-900/20'
                }`}
              >
                {isPayment ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Verified payment record karein</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Udhari darj karein</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </div>

      {/* Verification Dialog - EXACT replica of Kotlin AlertDialog:
          title: Text("Payment verify karein")
          text: Text("Apne bank/UPI app mein receipt verify karne ke baad hi confirm karein.")
          confirmButton: "Verified, confirm"
          dismissButton: "Cancel"
      */}
      {showVerifyDialog && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-7 h-7 text-amber-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 text-center">
              Payment verify karein
            </h3>
            
            <p className="text-xs text-gray-600 text-center mt-2 leading-relaxed">
              Apne bank/UPI app ya soundbox mein receipt verify karne ke baad hi confirm karein.
            </p>

            <div className="my-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <span className="text-[11px] font-semibold text-emerald-800 uppercase block">
                Jama karne ki rakam
              </span>
              <span className="text-2xl font-black text-emerald-950">
                ₹{amount}
              </span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                Naya baaki balance hoga: {rupees(Math.max(0, currentBalance - (parseFloat(amount) || 0)))}
              </span>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer select-none mb-4">
              <input
                type="checkbox"
                checked={verifiedChecked}
                onChange={e => setVerifiedChecked(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Haan, maine apne bank SMS / UPI app me rakam verify kar li hai.</span>
            </label>

            <div className="space-y-2">
              <button
                type="button"
                disabled={!verifiedChecked}
                onClick={() => executeTransaction(parseFloat(amount))}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Verified, confirm</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVerifyDialog(false)}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
