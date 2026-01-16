// Currency formatting utility for LKR (Sri Lankan Rupees)

export const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `Rs. ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `Rs. ${(amount / 1000).toFixed(1)}K`;
  }
  return `Rs. ${amount.toFixed(0)}`;
};

// Currency conversion utilities with real-time exchange rates

// Cache for exchange rate
let cachedRate: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Fetch real-time USD to LKR exchange rate from exchangerate-api.com
 * Free tier: 1,500 requests/month
 */
export const fetchExchangeRate = async (): Promise<number> => {
  // Check cache first
  const now = Date.now();
  if (cachedRate && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedRate;
  }

  try {
    // Using exchangerate-api.com (free, no API key needed for basic usage)
    const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
    
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();
    const rate = data.rates?.LKR || 300; // Fallback to 300 if not available
    
    // Update cache
    cachedRate = rate;
    cacheTimestamp = now;
    
    return rate;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback to cached rate or default
    return cachedRate || 300;
  }
};

/**
 * Convert LKR to USD for NowPayments API
 * NowPayments doesn't support LKR, so we convert to USD
 */
export const lkrToUsd = async (lkrAmount: number): Promise<number> => {
  const rate = await fetchExchangeRate();
  return Number((lkrAmount / rate).toFixed(2));
};

/**
 * Convert LKR to USD synchronously (uses cached rate)
 */
export const lkrToUsdSync = (lkrAmount: number, rate: number = 300): number => {
  return Number((lkrAmount / rate).toFixed(2));
};

/**
 * Convert USD to LKR for display
 */
export const usdToLkr = async (usdAmount: number): Promise<number> => {
  const rate = await fetchExchangeRate();
  return Number((usdAmount * rate).toFixed(2));
};

/**
 * Get current USD to LKR exchange rate (cached or fetch)
 */
export const getExchangeRate = async (): Promise<number> => {
  return await fetchExchangeRate();
};
