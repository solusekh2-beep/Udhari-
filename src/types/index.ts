export interface Customer {
  id: string;
  name: string;
  phone: string;
  balance: number;
  createdAt: number;
  notes?: string;
  lastPaymentAt?: number;
}

export interface Transaction {
  id: string;
  customerId: string;
  type: 'credit' | 'payment'; // 'credit' = Udhari (Customer owes more), 'payment' = Jama (Customer paid)
  amount: number;
  timestamp: number;
  note?: string;
  balanceAfter: number;
}

export interface ShopSettings {
  shop: string;
  upi: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  enableSoundbox?: boolean;
}

export interface UserSession {
  uid: string;
  email: string;
  displayName?: string;
}

export type LanguageMode = 'hinglish' | 'hindi' | 'english';
