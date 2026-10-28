/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Store, 
  QrCode, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { Customer, ShopSettings, UserSession, LanguageMode } from './types';
import { LedgerStore } from './utils/storage';
import { rupees } from './utils/formatters';
import { AuthScreen } from './components/AuthScreen';
import { Header } from './components/Header';
import { CustomerCard } from './components/CustomerCard';
import { AddCustomerModal } from './components/AddCustomerModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { QrCodeModal } from './components/QrCodeModal';
import { PaymentModal } from './components/PaymentModal';
import { CustomerDetailDrawer } from './components/CustomerDetailDrawer';
import { AndroidApkModal } from './components/AndroidApkModal';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => LedgerStore.getActiveSession());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<ShopSettings>({
    shop: 'Sharma General Store',
    upi: 'sharmastore@upi',
  });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'settled'>('all');
  const [sortBy, setSortBy] = useState<'balance_desc' | 'name_asc' | 'date_desc'>('balance_desc');
  const [language, setLanguage] = useState<LanguageMode>('hinglish');
  const [soundboxEnabled, setSoundboxEnabled] = useState<boolean>(true);

  // Modal states
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedForQr, setSelectedForQr] = useState<Customer | null>(null);
  const [isDukaanQrOpen, setIsDukaanQrOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    customer: Customer | null;
    mode: 'payment' | 'credit';
  }>({
    isOpen: false,
    customer: null,
    mode: 'payment',
  });
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Sync data whenever session or store changes
  useEffect(() => {
    if (!session?.uid) return;

    const loadData = () => {
      const custs = LedgerStore.getCustomers(session.uid);
      const sett = LedgerStore.getSettings(session.uid);
      setCustomers(custs);
      setSettings(sett);
      if (sett.enableSoundbox !== undefined) {
        setSoundboxEnabled(sett.enableSoundbox);
      }
    };

    loadData();
    const unsubscribe = LedgerStore.subscribe(loadData);
    return () => unsubscribe();
  }, [session?.uid]);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage('');
    }, 3500);
  };

  const handleLogout = () => {
    LedgerStore.setActiveSession(null);
    setSession(null);
  };

  const handleAddCustomer = (data: { name: string; phone: string; balance: number; notes?: string }) => {
    if (!session) return;
    LedgerStore.addCustomer(session.uid, data);
    showStatus('Grahak save ho gaya');
  };

  const handleRecordPayment = (customerId: string, amount: number, note?: string) => {
    if (!session) return;
    const res = LedgerStore.recordPayment(session.uid, customerId, amount, note);
    if (res.success) {
      showStatus(`Jama rakam record hui: ₹${amount}`);
    }
  };

  const handleAddCredit = (customerId: string, amount: number, note?: string) => {
    if (!session) return;
    const res = LedgerStore.addMoreCredit(session.uid, customerId, amount, note);
    if (res.success) {
      showStatus(`Udhari save ho gayi: ₹${amount}`);
    }
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (!session) return;
    LedgerStore.deleteCustomer(session.uid, customer.id);
    showStatus(`${customer.name} ko khata se hataya gaya`);
  };

  const handleSaveSettings = (newSettings: ShopSettings) => {
    if (!session) return;
    LedgerStore.saveSettings(session.uid, {
      ...newSettings,
      enableSoundbox: soundboxEnabled,
    });
    showStatus('Settings saved');
  };

  const handleResetData = () => {
    if (!session) return;
    LedgerStore.resetDemoData(session.uid);
    showStatus('Khata data reset ho gaya');
  };

  // Metrics
  const totalBalance = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  }, [customers]);

  // Filtered & Sorted Customer List
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (!matchesSearch) return false;

        if (filterType === 'due') return c.balance > 0;
        if (filterType === 'settled') return c.balance === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'balance_desc') return b.balance - a.balance;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'date_desc') return b.createdAt - a.createdAt;
        return 0;
      });
  }, [customers, searchQuery, filterType, sortBy]);

  // If unauthenticated, show AuthScreen (Matches Kotlin !loggedIn)
  if (!session) {
    return <AuthScreen onLoginSuccess={s => setSession(s)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col selection:bg-emerald-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        shopSettings={settings}
        totalBalance={totalBalance}
        customerCount={customers.length}
        language={language}
        onLanguageChange={setLanguage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        soundboxEnabled={soundboxEnabled}
        onToggleSoundbox={() => {
          const next = !soundboxEnabled;
          setSoundboxEnabled(next);
          if (session) {
            LedgerStore.saveSettings(session.uid, { ...settings, enableSoundbox: next });
          }
        }}
        onOpenQuickQr={() => setIsDukaanQrOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Main Ledger Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 sm:py-6 pb-24">
        
        {/* Status Toast/Banner - Matches Kotlin status text */}
        {statusMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-900 text-white font-medium text-xs flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage('')}
              className="text-emerald-300 hover:text-white text-xs underline cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* Controls Toolbar: Search, Filters & Add Customer CTA */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Grahak ka naam ya phone number khojein..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Chips & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white text-emerald-900 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sabhi ({customers.length})
              </button>
              <button
                onClick={() => setFilterType('due')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === 'due'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Baaki ({customers.filter(c => c.balance > 0).length})
              </button>
              <button
                onClick={() => setFilterType('settled')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterType === 'settled'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Chukta ({customers.filter(c => c.balance === 0).length})
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="appearance-none bg-gray-100 border border-gray-200 hover:bg-gray-200/70 text-gray-700 text-xs font-semibold py-2 pl-3 pr-7 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="balance_desc">Highest Baaki First</option>
                <option value="name_asc">Naam (A-Z)</option>
                <option value="date_desc">Sabse Naya First</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* "+ Naya Grahak" Primary CTA */}
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/15 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4 text-amber-300" />
              <span>+ Naya Grahak / Udhari</span>
            </button>
          </div>

        </div>

        {/* Customer Cards List */}
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-200/80 shadow-xs max-w-lg mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? 'Koi grahak nahi mila' : 'Khata Khali Hai'}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-6">
              {searchQuery
                ? `"${searchQuery}" se match hone wala koi grahak nahi hai. Kripya doosra naam search karein.`
                : 'Apni dukaan ke grahakon ki udhari aur payment record karne ke liye naya grahak jodein.'}
            </p>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Naya Grahak Jodein</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCustomers.map(cust => (
              <CustomerCard
                key={cust.id}
                customer={cust}
                upi={settings.upi}
                shopName={settings.shop}
                onOpenQr={c => setSelectedForQr(c)}
                onOpenPayment={c =>
                  setPaymentModalState({
                    isOpen: true,
                    customer: c,
                    mode: 'payment',
                  })
                }
                onOpenAddCredit={c =>
                  setPaymentModalState({
                    isOpen: true,
                    customer: c,
                    mode: 'credit',
                  })
                }
                onViewHistory={c => setHistoryCustomer(c)}
                onDeleteCustomer={handleDeleteCustomer}
              />
            ))}
          </div>
        )}

      </main>

      {/* Floating Action Button (FAB) for Mobile View */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="w-14 h-14 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl flex items-center justify-center border-2 border-amber-300 transition-transform active:scale-95 cursor-pointer"
          title="Naya Grahak"
        >
          <UserPlus className="w-6 h-6" />
        </button>
      </div>

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onAddCustomer={handleAddCustomer}
      />

      {/* Shop & UPI Settings Modal */}
      <ShopSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetData={handleResetData}
      />

      {/* Customer Dynamic UPI QR Modal */}
      <QrCodeModal
        isOpen={Boolean(selectedForQr)}
        onClose={() => setSelectedForQr(null)}
        customer={selectedForQr}
        upi={settings.upi}
        shopName={settings.shop}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Dukaan Standee QR Modal (Open general QR) */}
      <QrCodeModal
        isOpen={isDukaanQrOpen}
        onClose={() => setIsDukaanQrOpen(false)}
        customer={null}
        upi={settings.upi}
        shopName={settings.shop}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Payment / Jama Entry Modal */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() =>
          setPaymentModalState({
            isOpen: false,
            customer: null,
            mode: 'payment',
          })
        }
        customer={paymentModalState.customer}
        mode={paymentModalState.mode}
        onRecordPayment={handleRecordPayment}
        onAddCredit={handleAddCredit}
        soundboxEnabled={soundboxEnabled}
      />

      {/* Customer Ledger History Drawer */}
      <CustomerDetailDrawer
        isOpen={Boolean(historyCustomer)}
        onClose={() => setHistoryCustomer(null)}
        customer={historyCustomer}
        transactions={
          session && historyCustomer
            ? LedgerStore.getTransactions(session.uid, historyCustomer.id)
            : []
        }
        shopSettings={settings}
        onOpenQr={c => {
          setHistoryCustomer(null);
          setSelectedForQr(c);
        }}
        onOpenPayment={c => {
          setHistoryCustomer(null);
          setPaymentModalState({
            isOpen: true,
            customer: c,
            mode: 'payment',
          })
        }}
        onOpenAddCredit={c => {
          setHistoryCustomer(null);
          setPaymentModalState({
            isOpen: true,
            customer: c,
            mode: 'credit',
          })
        }}
      />

      {/* Android APK & Install Modal */}
      <AndroidApkModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />

    </div>
  );
}
