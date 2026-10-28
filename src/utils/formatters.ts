/**
 * Format amounts to Indian Rupees currency format
 * Matches Android Kotlin: NumberFormat.getCurrencyInstance(Locale("en", "IN")).format(amount)
 */
export function rupees(amount: number): string {
  const rounded = Math.round(amount || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Format numbers with Indian numbering grouping (e.g., 1,50,000)
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num || 0);
}

/**
 * Extract digits from phone number and ensure country code format for WhatsApp link
 */
export function sanitizePhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // If 10 digits (typical Indian mobile), prefix with 91
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

/**
 * Build WhatsApp reminder message URL
 * Replicates Kotlin: "https://wa.me/" + digits + "?text=" + Uri.encode(message)
 */
export function buildWhatsAppLink(
  phone: string,
  customerName: string,
  balance: number,
  upi: string,
  shopName: string
): string {
  const cleanPhone = sanitizePhoneForWhatsApp(phone);
  const formattedBalance = rupees(balance);
  const shop = shopName.trim() || 'Dukaan';
  
  const message = `Namaste ${customerName}, aapki ${shop} mein udhari ${formattedBalance} baaki hai. UPI ID: ${upi || 'N/A'}. Kripya jald bhugtan karein. Dhanyavaad!`;
  const encodedMsg = encodeURIComponent(message);

  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedMsg}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Build UPI intent URI
 * Matches: upi://pay?pa={upi}&pn={shop}&cu=INR&am={amount}
 */
export function buildUpiUri(
  upi: string,
  shopName: string,
  amount?: number,
  transactionNote?: string
): string {
  const cleanUpi = upi.trim();
  const cleanShop = (shopName.trim() || 'Dukaan').replace(/[^\w\s]/gi, '');
  const base = new URL('upi://pay');
  base.searchParams.set('pa', cleanUpi);
  base.searchParams.set('pn', cleanShop);
  base.searchParams.set('cu', 'INR');
  
  if (amount && amount > 0) {
    base.searchParams.set('am', amount.toString());
  }
  if (transactionNote) {
    base.searchParams.set('tn', transactionNote);
  }
  
  return base.toString();
}

/**
 * Format timestamp into friendly date/time
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
    
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return `Aaj, ${timeStr}`;
  }
  if (isYesterday) {
    return `Kal, ${timeStr}`;
  }

  return `${date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })}, ${timeStr}`;
}
