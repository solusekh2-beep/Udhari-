import React from 'react';
import { Phone, MessageCircle, QrCode, ArrowDownLeft, ArrowUpRight, History, MoreVertical, Trash2 } from 'lucide-react';
import { Customer } from '../types';
import { rupees, buildWhatsAppLink } from '../utils/formatters';

interface CustomerCardProps {
  customer: Customer;
  upi: string;
  shopName: string;
  onOpenQr: (customer: Customer) => void;
  onOpenPayment: (customer: Customer) => void;
  onOpenAddCredit: (customer: Customer) => void;
  onViewHistory: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  upi,
  shopName,
  onOpenQr,
  onOpenPayment,
  onOpenAddCredit,
  onViewHistory,
  onDeleteCustomer,
}) => {
  const isDue = customer.balance > 0;
  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildWhatsAppLink(
      customer.phone,
      customer.name,
      customer.balance,
      upi,
      shopName
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group">
      
      {/* Top Section */}
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        
        {/* Customer Avatar & Info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 border ${
              isDue
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {initials || 'G'}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-base leading-tight group-hover:text-emerald-800 transition-colors">
              {customer.name}
            </h4>
            
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-gray-400" />
                {customer.phone || 'Number nahi hai'}
              </span>
              {customer.notes && (
                <span className="hidden sm:inline text-gray-400 text-[11px] truncate max-w-[150px]">
                  • {customer.notes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Balance Badge */}
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Baaki (Due)
          </span>
          <div
            className={`text-lg sm:text-xl font-black tracking-tight ${
              isDue ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {rupees(customer.balance)}
          </div>
          {customer.balance === 0 && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Sab Chukta
            </span>
          )}
        </div>

      </div>

      {/* Action Buttons Row - EXACT match to Kotlin features */}
      <div className="bg-gray-50/80 px-4 py-3 border-t border-gray-100 flex flex-wrap items-center gap-2 justify-between">
        
        {/* Left primary actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* QR / Payment button */}
          <button
            onClick={() => onOpenQr(customer)}
            className="px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-amber-300" />
            <span>QR / Payment</span>
          </button>

          {/* WhatsApp Reminder button */}
          <button
            onClick={handleWhatsApp}
            title="WhatsApp par reminder bhejein"
            className="px-3 py-1.5 rounded-xl border border-emerald-600/40 text-emerald-800 hover:bg-emerald-50 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
            <span>WhatsApp</span>
          </button>

          {/* Jama Entry ke liye select karein */}
          {isDue && (
            <button
              onClick={() => onOpenPayment(customer)}
              className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:border-emerald-600 text-emerald-900 hover:text-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Jama Entry (Payment)</span>
            </button>
          )}

          {/* Add more credit */}
          <button
            onClick={() => onOpenAddCredit(customer)}
            className="px-2.5 py-1.5 rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
            <span>+ Udhari</span>
          </button>
        </div>

        {/* Right utility actions: Ledger history & Delete */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => onViewHistory(customer)}
            title="Khata History / Transactions"
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (window.confirm(`${customer.name} ko khata se hatayein (Delete customer)?`)) {
                onDeleteCustomer(customer);
              }
            }}
            title="Grahak Hatayein (Delete)"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
