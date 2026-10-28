import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, QrCode as QrIcon, ExternalLink, Copy, Check, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Customer } from '../types';
import { rupees, buildUpiUri } from '../utils/formatters';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  upi: string;
  shopName: string;
  onOpenSettings: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  customer,
  upi,
  shopName,
  onOpenSettings,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [fixAmount, setFixAmount] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasUpi = Boolean(upi && upi.includes('@'));
  const hasBalance = Boolean(customer && customer.balance > 0);

  // If customer is selected and fixAmount is true, default to customer balance
  useEffect(() => {
    if (customer && customer.balance > 0) {
      setCustomAmount(customer.balance.toString());
    } else {
      setCustomAmount('');
    }
  }, [customer]);

  const activeAmount = fixAmount && parseFloat(customAmount) > 0 ? parseFloat(customAmount) : undefined;
  const currentUri = hasUpi ? buildUpiUri(upi, shopName, activeAmount, `Khata Payment: ${customer?.name || shopName}`) : '';

  useEffect(() => {
    if (!isOpen || !hasUpi) return;

    QRCode.toDataURL(currentUri, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f3e2e',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(url => setDataUrl(url))
      .catch(err => console.error('QR generation error:', err));
  }, [isOpen, currentUri, hasUpi]);

  if (!isOpen) return null;

  // Case 1: UPI ID Not Configured
  if (!hasUpi) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">UPI ID set karein</h3>
          <p className="text-xs text-gray-600 mt-2 mb-6">
            QR code generate karne ke liye pehle apni dukaan ka sahi UPI ID save karein.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
            >
              UPI ID abhi daalein (Open Settings)
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Theek hai (Cancel)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Customer has ZERO balance (All paid up)
  if (customer && customer.balance === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Koi baaki udhari nahi</h3>
          <p className="text-xs text-gray-600 mt-2 mb-6">
            <strong className="text-gray-900 font-semibold">{customer.name}</strong> ki saari udhari chukti ho chuki hai (Balance ₹0).
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Theek hai
          </button>
        </div>
      </div>
    );
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `UPI-QR-${customer ? customer.name.replace(/\s+/g, '_') : shopName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F3E2E] to-[#14532D] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">UPI Payment QR</h3>
              <p className="text-[11px] text-emerald-200/80">{shopName || 'Dukaan'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col items-center">
          
          {/* Customer & Amount Banner */}
          {customer && (
            <div className="w-full bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 mb-4 text-center">
              <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold block">
                Grahak: {customer.name}
              </span>
              <span className="text-xl font-extrabold text-emerald-950">
                Baaki: {rupees(customer.balance)}
              </span>
            </div>
          )}

          {/* UPI ID Pill */}
          <div className="text-[11px] font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-full mb-3 flex items-center gap-1.5 border border-gray-200">
            <span>UPI ID:</span>
            <strong className="text-emerald-900">{upi}</strong>
          </div>

          {/* QR Code Canvas/Image */}
          <div className="p-3 bg-white rounded-2xl border-2 border-emerald-800/20 shadow-md mb-3 relative group">
            {dataUrl ? (
              <img
                src={dataUrl}
                alt="UPI Payment QR Code"
                className="w-52 h-52 object-contain rounded-lg"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-gray-400 text-xs">
                QR Code ban raha hai...
              </div>
            )}

            {/* Indian UPI Badges below QR */}
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              <span className="text-[#5f259f]">PhonePe</span> • 
              <span className="text-[#002e6e]">GPay</span> • 
              <span className="text-[#00b9f5]">Paytm</span> • 
              <span className="text-[#097969]">BHIM</span>
            </div>
          </div>

          {/* Amount Mode Toggle */}
          <div className="w-full mb-4 bg-gray-50 p-2.5 rounded-xl border border-gray-200/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">QR mein rakam fix karein?</span>
              <button
                type="button"
                onClick={() => setFixAmount(!fixAmount)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  fixAmount ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    fixAmount ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {fixAmount ? (
              <div className="mt-2">
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => setCustomAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full px-3 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-bold text-gray-800"
                />
                <p className="text-[10px] text-emerald-700 mt-1">
                  Grahak ke app mein ₹{customAmount || 0} automatically fill hoga.
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-gray-500 mt-1">
                QR mein amount fix nahi hai. Grahak apni ichha anusaar rakam bhar sakta hai.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <a
              href={currentUri}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>UPI app kholein (Open UPI app)</span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQr}
                className="py-2 px-3 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2 px-3 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 cursor-pointer"
          >
            Band karein (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
