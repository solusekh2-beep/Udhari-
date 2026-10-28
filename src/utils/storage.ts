import { Customer, ShopSettings, Transaction, UserSession } from '../types';

const USERS_KEY = 'udhari_khata_accounts_v1';
const CURRENT_SESSION_KEY = 'udhari_khata_active_session_v1';

// Seed sample data for first-time shopkeeper delight
const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shop: 'Sharma General Store',
  upi: 'sharmastore@upi',
  ownerName: 'Radhe Shyam Sharma',
  phone: '+91 98765 43210',
  address: 'Shop 14, Main Market, Delhi',
  enableSoundbox: true,
};

const SEED_CUSTOMERS: Omit<Customer, 'id'>[] = [
  {
    name: 'Ramesh Verma',
    phone: '+91 98765 11223',
    balance: 4500,
    createdAt: Date.now() - 86400000 * 6,
    notes: 'Ration & dairy items',
  },
  {
    name: 'Suresh Chand (Gupta ji)',
    phone: '+91 98111 22334',
    balance: 1850,
    createdAt: Date.now() - 86400000 * 3,
    notes: 'Monthly groceries',
  },
  {
    name: 'Pooja Sharma',
    phone: '+91 99223 34455',
    balance: 820,
    createdAt: Date.now() - 86400000 * 1,
    notes: 'Cooking oil & spices',
  },
  {
    name: 'Vikram Singh',
    phone: '+91 97654 32100',
    balance: 0,
    createdAt: Date.now() - 86400000 * 12,
    lastPaymentAt: Date.now() - 86400000 * 1,
    notes: 'All dues cleared yesterday',
  },
];

type StorageListener = () => void;
const listeners = new Set<StorageListener>();

function notifyChange() {
  listeners.forEach(cb => {
    try {
      cb();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export const LedgerStore = {
  // Listeners
  subscribe(callback: StorageListener): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  // Auth & Session
  getActiveSession(): UserSession | null {
    try {
      const data = localStorage.getItem(CURRENT_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setActiveSession(session: UserSession | null): void {
    if (session) {
      localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
    notifyChange();
  },

  // Users Auth DB (mock Firebase Auth)
  getRegisteredUsers(): Record<string, { email: string; passwordHash: string; uid: string }> {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },

  registerUser(email: string, pass: string): { user: UserSession; error?: string } {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    
    if (users[cleanEmail]) {
      return { user: { uid: '', email: '' }, error: 'Account already exists. Please login.' };
    }

    const uid = 'usr_' + Math.random().toString(36).substring(2, 10);
    users[cleanEmail] = {
      email: cleanEmail,
      passwordHash: btoa(pass),
      uid,
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Initialize default shop settings & sample customers for new user
    this.saveSettings(uid, {
      ...DEFAULT_SHOP_SETTINGS,
      shop: 'Meri Dukaan',
      upi: cleanEmail.split('@')[0] + '@upi',
    });

    // Seed customers for demonstration
    const customers = SEED_CUSTOMERS.map((c, i) => ({
      ...c,
      id: `cust_${Date.now()}_${i}`,
    }));
    this.saveCustomers(uid, customers);

    const session: UserSession = { uid, email: cleanEmail };
    this.setActiveSession(session);
    return { user: session };
  },

  loginUser(email: string, pass: string): { user: UserSession; error?: string } {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();

    const existing = users[cleanEmail];
    if (!existing) {
      // Auto-create for first user or friendly login
      return this.registerUser(email, pass);
    }

    if (existing.passwordHash !== btoa(pass)) {
      return { user: { uid: '', email: '' }, error: 'Galat password (Incorrect password).' };
    }

    const session: UserSession = { uid: existing.uid, email: existing.email };
    this.setActiveSession(session);
    return { user: session };
  },

  // Settings: users/{uid}/settings/shop
  getSettings(uid: string): ShopSettings {
    try {
      const raw = localStorage.getItem(`udhari_settings_${uid}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    return DEFAULT_SHOP_SETTINGS;
  },

  saveSettings(uid: string, settings: ShopSettings): void {
    localStorage.setItem(`udhari_settings_${uid}`, JSON.stringify(settings));
    notifyChange();
  },

  // Customers: users/{uid}/customers
  getCustomers(uid: string): Customer[] {
    try {
      const raw = localStorage.getItem(`udhari_customers_${uid}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse customers:', e);
    }
    // Seed default if empty
    const seeded = SEED_CUSTOMERS.map((c, i) => ({
      ...c,
      id: `cust_${Date.now()}_${i}`,
    }));
    this.saveCustomers(uid, seeded);
    return seeded;
  },

  saveCustomers(uid: string, customers: Customer[]): void {
    localStorage.setItem(`udhari_customers_${uid}`, JSON.stringify(customers));
    notifyChange();
  },

  addCustomer(
    uid: string,
    customerData: { name: string; phone: string; balance: number; notes?: string }
  ): Customer {
    const customers = this.getCustomers(uid);
    const newCust: Customer = {
      id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      balance: Math.max(0, customerData.balance),
      createdAt: Date.now(),
      notes: customerData.notes?.trim() || '',
    };

    const updated = [newCust, ...customers];
    this.saveCustomers(uid, updated);

    if (newCust.balance > 0) {
      this.recordTransaction(uid, {
        customerId: newCust.id,
        type: 'credit',
        amount: newCust.balance,
        note: 'Prarambhik udhari (Initial credit balance)',
        balanceAfter: newCust.balance,
      });
    }

    return newCust;
  },

  updateCustomer(uid: string, customerId: string, updates: Partial<Customer>): void {
    const customers = this.getCustomers(uid);
    const updated = customers.map(c => (c.id === customerId ? { ...c, ...updates } : c));
    this.saveCustomers(uid, updated);
  },

  deleteCustomer(uid: string, customerId: string): void {
    const customers = this.getCustomers(uid);
    const updated = customers.filter(c => c.id !== customerId);
    this.saveCustomers(uid, updated);
  },

  // Transactions: users/{uid}/customers/{id}/transactions
  getTransactions(uid: string, customerId?: string): Transaction[] {
    try {
      const raw = localStorage.getItem(`udhari_transactions_${uid}`);
      const list: Transaction[] = raw ? JSON.parse(raw) : [];
      if (customerId) {
        return list.filter(t => t.customerId === customerId);
      }
      return list;
    } catch {
      return [];
    }
  },

  recordTransaction(
    uid: string,
    txData: Omit<Transaction, 'id' | 'timestamp'>
  ): Transaction {
    const list = this.getTransactions(uid);
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };
    const updated = [newTx, ...list];
    localStorage.setItem(`udhari_transactions_${uid}`, JSON.stringify(updated));
    return newTx;
  },

  // Record payment (Jama Rakam)
  // Matches Kotlin: customerRef.document(c.id).update("balance", c.balance - paid)
  recordPayment(
    uid: string,
    customerId: string,
    amount: number,
    note?: string
  ): { success: boolean; newBalance: number } {
    const customers = this.getCustomers(uid);
    const custIndex = customers.findIndex(c => c.id === customerId);
    if (custIndex === -1) return { success: false, newBalance: 0 };

    const cust = customers[custIndex];
    const newBalance = Math.max(0, cust.balance - amount);

    customers[custIndex] = {
      ...cust,
      balance: newBalance,
      lastPaymentAt: Date.now(),
    };

    this.saveCustomers(uid, customers);

    this.recordTransaction(uid, {
      customerId,
      type: 'payment',
      amount,
      note: note || 'Verified payment (Jama)',
      balanceAfter: newBalance,
    });

    return { success: true, newBalance };
  },

  // Add more credit (Udhari add karein)
  addMoreCredit(
    uid: string,
    customerId: string,
    amount: number,
    note?: string
  ): { success: boolean; newBalance: number } {
    const customers = this.getCustomers(uid);
    const custIndex = customers.findIndex(c => c.id === customerId);
    if (custIndex === -1) return { success: false, newBalance: 0 };

    const cust = customers[custIndex];
    const newBalance = cust.balance + amount;

    customers[custIndex] = {
      ...cust,
      balance: newBalance,
    };

    this.saveCustomers(uid, customers);

    this.recordTransaction(uid, {
      customerId,
      type: 'credit',
      amount,
      note: note || 'Naya saaman / Udhari (Credit)',
      balanceAfter: newBalance,
    });

    return { success: true, newBalance };
  },

  // Reset demo data
  resetDemoData(uid: string): void {
    const seeded = SEED_CUSTOMERS.map((c, i) => ({
      ...c,
      id: `cust_${Date.now()}_${i}`,
    }));
    this.saveCustomers(uid, seeded);
    this.saveSettings(uid, DEFAULT_SHOP_SETTINGS);
    localStorage.removeItem(`udhari_transactions_${uid}`);
    notifyChange();
  },
};
