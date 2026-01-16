// Number lock management utility
// Manages locked numbers (00-99) with 5-minute expiration

export interface LockedNumber {
  number: string;
  userId: string;
  lockedAt: number;
  expiresAt: number;
}

const LOCK_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const STORAGE_KEY = "lockedNumbers";

export const NumberLockManager = {
  // Get all locked numbers
  getLockedNumbers(): LockedNumber[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const locks: LockedNumber[] = JSON.parse(data);
      // Clean up expired locks
      const now = Date.now();
      const validLocks = locks.filter((lock) => lock.expiresAt > now);
      if (validLocks.length !== locks.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validLocks));
      }
      return validLocks;
    } catch {
      return [];
    }
  },

  // Lock a number for a user
  lockNumber(number: string, userId: string): boolean {
    const locks = this.getLockedNumbers();
    const now = Date.now();

    // Check if number is already locked
    const existingLock = locks.find((lock) => lock.number === number);
    if (existingLock && existingLock.expiresAt > now) {
      // Already locked by someone else
      if (existingLock.userId !== userId) {
        return false;
      }
      // Same user, extend the lock
      existingLock.expiresAt = now + LOCK_DURATION;
      existingLock.lockedAt = now;
    } else {
      // New lock
      locks.push({
        number,
        userId,
        lockedAt: now,
        expiresAt: now + LOCK_DURATION,
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(locks));
    return true;
  },

  // Release a number (on payment failure or timeout)
  releaseNumber(number: string, userId: string): void {
    const locks = this.getLockedNumbers();
    const filtered = locks.filter(
      (lock) => !(lock.number === number && lock.userId === userId)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Release multiple numbers
  releaseNumbers(numbers: string[], userId: string): void {
    const locks = this.getLockedNumbers();
    const filtered = locks.filter(
      (lock) => !(numbers.includes(lock.number) && lock.userId === userId)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  // Reserve numbers permanently (on payment success)
  reserveNumbers(numbers: string[], userId: string): void {
    // Remove from locks and add to reserved numbers
    this.releaseNumbers(numbers, userId);
    
    // Store reserved numbers
    const reserved = this.getReservedNumbers();
    numbers.forEach((number) => {
      if (!reserved.find((r) => r.number === number)) {
        reserved.push({
          number,
          userId,
          reservedAt: Date.now(),
        });
      }
    });
    localStorage.setItem("reservedNumbers", JSON.stringify(reserved));
  },

  // Get reserved numbers (permanently owned)
  getReservedNumbers(): Array<{ number: string; userId: string; reservedAt: number }> {
    try {
      const data = localStorage.getItem("reservedNumbers");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  // Check if number is available
  isNumberAvailable(number: string): boolean {
    const locks = this.getLockedNumbers();
    const reserved = this.getReservedNumbers();
    const now = Date.now();

    // Check if reserved
    if (reserved.find((r) => r.number === number)) {
      return false;
    }

    // Check if locked (and not expired)
    const lock = locks.find((l) => l.number === number);
    if (lock && lock.expiresAt > now) {
      return false;
    }

    return true;
  },

  // Get remaining lock time for a number
  getRemainingLockTime(number: string, userId: string): number | null {
    const locks = this.getLockedNumbers();
    const lock = locks.find(
      (l) => l.number === number && l.userId === userId
    );
    if (!lock) return null;

    const remaining = lock.expiresAt - Date.now();
    return remaining > 0 ? remaining : 0;
  },

  // Get all numbers locked by a user
  getUserLockedNumbers(userId: string): LockedNumber[] {
    const locks = this.getLockedNumbers();
    return locks.filter((lock) => lock.userId === userId);
  },
};
