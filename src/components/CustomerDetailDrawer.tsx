import React from 'react';
import { X, Printer, Phone, Calendar, ArrowDownLeft, ArrowUpRight, MessageCircle, QrCode } from 'lucide-react';
import { Customer, Transaction, ShopSettings } from '../types';
import { rupees, formatTimestamp, buildWhatsAppLink } from '../utils/formatters';

interface CustomerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  transactions: Transaction[];
  shopSettings: ShopSettings;
  onOpenQr: (customer: Customer) => void;
  onOpenPayment: (customer: Customer) => void;
  onOpenAddCredit: (customer: Customer) => void;
}

export const CustomerDetailDrawer: React.FC<CustomerDetailDrawerProps> = ({
  isOpen,
  onClose,
  customer,
  transactions,
  shopSettings,
  onOpenQr,
  onOpenPayment,
  onOpenAddCredit,
}) => {
  if (!isOpen || !customer) return null;

  const handlePrintSlip = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppLink(
      customer.phone,
      customer.name,
      customer.balance,
      shopSettings.upi,
      shopSettings.shop
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3E2E] to-[#14532D] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Grahak Bahi Khata
            </span>
            <h3 className="font-bold text-xl">{customer.name}</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-200/80 mt-0.5">
              <Phone className="w-3 h-3" />
              <span>{customer.phone || 'Phone number not set'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Action Bar */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-900/70 uppercase">
              Kul Baaki (Current Due)
            </span>
            <div className="text-2xl font-black text-rose-600">
              {rupees(customer.balance)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPayment(customer)}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Jama lein</span>
            </button>
            <button
              onClick={() => onOpenAddCredit(customer)}
              className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Udhari dein</span>
            </button>
            <button
              onClick={() => onOpenQr(customer)}
              title="QR code"
              className="p-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-700" />
            </button>
            <button
              onClick={handleWhatsApp}
              title="WhatsApp reminder"
              className="p-2 rounded-xl bg-white border border-gray-300 text-emerald-600 hover:bg-gray-50 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400 pb-1">
            <span>Len-Den Itihas (Transactions)</span>
            <span>Rakam (Amount)</span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              Koi len-den record nahi mila.
            </div>
          ) : (
            transactions.map(tx => {
              const isPayment = tx.type === 'payment';
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-xl p-3 border border-gray-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPayment
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {isPayment ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 text-xs block">
                        {isPayment ? 'Jama prapt hua (Payment)' : 'Udhari diya (Credit)'}
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        {tx.note || (isPayment ? 'Verified payment' : 'Udhari')}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {formatTimestamp(tx.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-extrabold ${
                        isPayment ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {isPayment ? '-' : '+'}
                      {rupees(tx.amount)}
                    </div>
                    <span className="text-[10px] text-gray-400 block">
                      Balance: {rupees(tx.balanceAfter)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Print/Share */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-between shrink-0">
          <button
            onClick={handlePrintSlip}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>Print Receipt / Slip</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
          >
            Band karein
          </button>
        </div>

      </div>
    </div>
  );
};
