export const StorageManager = {
  // Version key for cache invalidation
  STORAGE_VERSION: '1.0.3',
  VERSION_KEY: 'oracle_storage_version',
  
  // Check and update storage version
  checkStorageVersion: () => {
    const currentVersion = localStorage.getItem(StorageManager.VERSION_KEY);
    if (currentVersion !== StorageManager.STORAGE_VERSION) {
      // Clear all storage if version mismatch
      StorageManager.clearCache();
      localStorage.setItem(StorageManager.VERSION_KEY, StorageManager.STORAGE_VERSION);
    }
  },
  
  // Selective clear - keeps auth but clears cache
  clearCache: () => {
    const authKeys = ['sb-nwmzegonnmqzflamcxfd-auth-token'];
    const keysToKeep: { [key: string]: string } = {};
    
    // Preserve auth keys
    authKeys.forEach(key => {
      const keys = Object.keys(localStorage).filter(k => k.includes(key));
      keys.forEach(k => {
        const value = localStorage.getItem(k);
        if (value) keysToKeep[k] = value;
      });
    });
    
    // Clear everything
    localStorage.clear();
    
    // Restore auth keys
    Object.entries(keysToKeep).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    // Update version
    localStorage.setItem(StorageManager.VERSION_KEY, StorageManager.STORAGE_VERSION);
  },
  
  // Complete clear
  clearAll: () => {
    localStorage.clear();
    sessionStorage.clear();
  }
}; 