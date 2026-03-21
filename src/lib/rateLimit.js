/**
 * Simple rate limiting using localStorage.
 * No registration needed — limits AI queries per day.
 * 
 * CONFIG: Change these values to adjust limits
 */
const DAILY_LIMIT = 5; // Free AI queries per day
const STORAGE_KEY = 'sc_ai_usage';

function getToday() {
  return new Date().toISOString().split('T')[0]; // "2026-03-15"
}

function getUsage() {
  if (typeof window === 'undefined') return { date: getToday(), count: 0 };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { date: getToday(), count: 0 };
    
    const usage = JSON.parse(stored);
    // Reset if it's a new day
    if (usage.date !== getToday()) {
      return { date: getToday(), count: 0 };
    }
    return usage;
  } catch {
    return { date: getToday(), count: 0 };
  }
}

function saveUsage(usage) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // localStorage might be full or disabled
  }
}

/**
 * Check if user can make an AI query
 * @returns {{ allowed: boolean, remaining: number, limit: number }}
 */
export function checkAILimit() {
  const usage = getUsage();
  return {
    allowed: usage.count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
    limit: DAILY_LIMIT,
    used: usage.count,
  };
}

/**
 * Record an AI query usage
 * @returns {{ allowed: boolean, remaining: number }}
 */
export function recordAIUsage() {
  const usage = getUsage();
  usage.count += 1;
  saveUsage(usage);
  return {
    allowed: usage.count < DAILY_LIMIT,
    remaining: Math.max(0, DAILY_LIMIT - usage.count),
  };
}
