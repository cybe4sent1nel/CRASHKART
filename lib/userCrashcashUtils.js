/**
 * User-specific Crash Cash Storage Utilities
 * Stores crash cash per user (identified by email)
 */

const USERS_CRASHCASH_KEY = 'users_crashcash';

/**
 * Get crash cash for a specific user by email
 */
export function getUserCrashCash(email) {
  if (!email) return { balance: 0, items: [] };

  try {
    const allUsersCash = JSON.parse(localStorage.getItem(USERS_CRASHCASH_KEY) || '{}');
    const userCashData = allUsersCash[email] || { balance: 0, items: [] };
    
    // Calculate balance from items (only non-expired)
    if (userCashData.items && Array.isArray(userCashData.items)) {
      const now = new Date();
      const validItems = userCashData.items.filter(item => {
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          return expiryDate > now;
        }
        return true;
      });
      
      const calculatedBalance = validItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      return {
        balance: calculatedBalance,
        items: validItems
      };
    }
    
    return userCashData;
  } catch (error) {
    console.error('Error loading user crash cash:', error);
    return { balance: 0, items: [] };
  }
}

/**
 * Set crash cash for a specific user
 */
export function setUserCrashCash(email, balance, items = []) {
  if (!email) return false;

  try {
    const allUsersCash = JSON.parse(localStorage.getItem(USERS_CRASHCASH_KEY) || '{}');
    
    allUsersCash[email] = {
      balance: balance || 0,
      items: items || [],
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(USERS_CRASHCASH_KEY, JSON.stringify(allUsersCash));
    return true;
  } catch (error) {
    console.error('Error saving user crash cash:', error);
    return false;
  }
}

/**
 * Add crash cash to user
 */
export function addUserCrashCash(email, amount, expiryDays = 30, source = 'scratch') {
  if (!email || !amount) return false;

  try {
    const userData = getUserCrashCash(email);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    const newItem = {
      id: `cash_${Date.now()}`,
      amount: amount,
      expiryDate: expiryDate.toISOString(),
      source: source,
      addedAt: new Date().toISOString()
    };
    
    const updatedItems = [...(userData.items || []), newItem];
    const newBalance = updatedItems.reduce((sum, item) => {
      const itemExpiryDate = new Date(item.expiryDate);
      if (itemExpiryDate > new Date()) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
    
    setUserCrashCash(email, newBalance, updatedItems);
    return true;
  } catch (error) {
    console.error('Error adding user crash cash:', error);
    return false;
  }
}

/**
 * Deduct crash cash from user
 */
export function deductUserCrashCash(email, amount) {
  if (!email || !amount) return false;

  try {
    const userData = getUserCrashCash(email);
    const newBalance = Math.max(0, userData.balance - amount);
    
    // Remove items until balance reaches target
    let remaining = newBalance;
    const updatedItems = [];
    
    for (let i = userData.items.length - 1; i >= 0; i--) {
      const item = userData.items[i];
      if (remaining <= 0) break;
      
      if (item.amount <= remaining) {
        remaining -= item.amount;
      } else {
        updatedItems.unshift({ ...item, amount: remaining });
        remaining = 0;
        break;
      }
    }
    
    setUserCrashCash(email, newBalance, updatedItems);
    return true;
  } catch (error) {
    console.error('Error deducting user crash cash:', error);
    return false;
  }
}

/**
 * Clear crash cash for a user (on logout)
 * Note: We keep the data, just not loaded. This preserves history.
 */
export function preserveUserCrashCash(email) {
  // This function is called on logout - we don't delete, just stop loading
  // The data remains in localStorage under the user's email
  return true;
}

/**
 * Migrate old global crash cash to new user-based system
 */
export function migrateOldCrashCash(email) {
  if (!email) return false;

  try {
    const oldBalance = localStorage.getItem('crashcashBalance');
    const oldItems = localStorage.getItem('userCrashCash');
    
    // Check if user already has data
    const existingData = getUserCrashCash(email);
    if (existingData.items && existingData.items.length > 0) {
      // User already has crash cash data, don't migrate
      return true;
    }
    
    if (oldBalance || oldItems) {
      let itemsToMigrate = [];
      let balanceToMigrate = 0;
      
      if (oldItems) {
        try {
          const parsed = JSON.parse(oldItems);
          if (Array.isArray(parsed)) {
            itemsToMigrate = parsed;
            balanceToMigrate = parsed.reduce((sum, item) => {
              const expiryDate = new Date(item.expiryDate);
              if (expiryDate > new Date()) {
                return sum + item.amount;
              }
              return sum;
            }, 0);
          }
        } catch (e) {
          console.error('Error parsing old items:', e);
        }
      }
      
      if (oldBalance && !itemsToMigrate.length) {
        try {
          balanceToMigrate = JSON.parse(oldBalance);
        } catch (e) {
          console.error('Error parsing old balance:', e);
        }
      }
      
      if (balanceToMigrate > 0 || itemsToMigrate.length > 0) {
        setUserCrashCash(email, balanceToMigrate, itemsToMigrate);
        console.log(`Migrated crash cash for ${email}:`, balanceToMigrate);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating old crash cash:', error);
    return false;
  }
}
