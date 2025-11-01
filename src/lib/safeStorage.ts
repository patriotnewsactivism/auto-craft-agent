/**
 * Safe Storage - Bulletproof localStorage wrapper with automatic error recovery
 * Handles all JSON parsing errors and provides persistent storage for critical data
 */

import { logger } from './logger';

export interface StorageOptions {
  useBackup?: boolean;
  validateJson?: boolean;
  silent?: boolean;
}

class SafeStorage {
  private readonly BACKUP_SUFFIX = '_backup';
  private readonly CHECKSUM_SUFFIX = '_checksum';
  
  /**
   * Safely get an item from localStorage with automatic error recovery
   */
  getItem(key: string, options: StorageOptions = {}): string | null {
    const { useBackup = true, silent = false } = options;
    
    try {
      const value = localStorage.getItem(key);
      
      if (value === null) {
        return null;
      }
      
      // Verify checksum if available
      if (useBackup) {
        const checksum = this.calculateChecksum(value);
        const storedChecksum = localStorage.getItem(key + this.CHECKSUM_SUFFIX);
        
        if (storedChecksum && storedChecksum !== checksum) {
          if (!silent) {
            logger.warning('SafeStorage', `Checksum mismatch for ${key}, trying backup`);
          }
          return this.getFromBackup(key);
        }
      }
      
      return value;
    } catch (error) {
      if (!silent) {
        logger.error('SafeStorage', `Error getting ${key}`, String(error));
      }
      
      if (useBackup) {
        return this.getFromBackup(key);
      }
      
      return null;
    }
  }
  
  /**
   * Safely set an item in localStorage with automatic backup
   */
  setItem(key: string, value: string, options: StorageOptions = {}): boolean {
    const { useBackup = true, silent = false } = options;
    
    try {
      // Save to primary storage
      localStorage.setItem(key, value);
      
      // Save checksum
      if (useBackup) {
        const checksum = this.calculateChecksum(value);
        localStorage.setItem(key + this.CHECKSUM_SUFFIX, checksum);
        
        // Save backup
        localStorage.setItem(key + this.BACKUP_SUFFIX, value);
      }
      
      return true;
    } catch (error) {
      if (!silent) {
        logger.error('SafeStorage', `Error setting ${key}`, String(error));
      }
      
      // Try to free up space by removing old backups
      this.cleanupOldBackups();
      
      // Try again
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        logger.error('SafeStorage', `Failed to set ${key} after cleanup`, String(retryError));
        return false;
      }
    }
  }
  
  /**
   * Safely parse JSON from localStorage with automatic error recovery
   */
  getJSON<T = any>(key: string, defaultValue: T | null = null, options: StorageOptions = {}): T | null {
    const { useBackup = true, silent = false } = options;
    
    const value = this.getItem(key, { useBackup, silent });
    
    if (value === null) {
      return defaultValue;
    }
    
    try {
      // Validate JSON structure before parsing
      if (options.validateJson && !this.isValidJSON(value)) {
        if (!silent) {
          logger.warning('SafeStorage', `Invalid JSON structure for ${key}`);
        }
        
        if (useBackup) {
          return this.getJSONFromBackup(key, defaultValue);
        }
        
        return defaultValue;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      if (!silent) {
        logger.error('SafeStorage', `JSON parse error for ${key}`, String(error));
      }
      
      if (useBackup) {
        return this.getJSONFromBackup(key, defaultValue);
      }
      
      // Clear corrupted data
      this.removeItem(key);
      
      return defaultValue;
    }
  }
  
  /**
   * Safely save JSON to localStorage with automatic backup
   */
  setJSON<T = any>(key: string, value: T, options: StorageOptions = {}): boolean {
    try {
      const jsonString = JSON.stringify(value);
      return this.setItem(key, jsonString, options);
    } catch (error) {
      logger.error('SafeStorage', `JSON stringify error for ${key}`, String(error));
      return false;
    }
  }
  
  /**
   * Remove item and its backup
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(key + this.BACKUP_SUFFIX);
      localStorage.removeItem(key + this.CHECKSUM_SUFFIX);
    } catch (error) {
      logger.error('SafeStorage', `Error removing ${key}`, String(error));
    }
  }
  
  /**
   * Get item from backup storage
   */
  private getFromBackup(key: string): string | null {
    try {
      const backup = localStorage.getItem(key + this.BACKUP_SUFFIX);
      
      if (backup !== null) {
        // Restore from backup
        logger.info('SafeStorage', `Restored ${key} from backup`);
        localStorage.setItem(key, backup);
        return backup;
      }
    } catch (error) {
      logger.error('SafeStorage', `Error restoring backup for ${key}`, String(error));
    }
    
    return null;
  }
  
  /**
   * Get JSON from backup storage
   */
  private getJSONFromBackup<T = any>(key: string, defaultValue: T | null = null): T | null {
    try {
      const backup = this.getFromBackup(key);
      
      if (backup !== null) {
        return JSON.parse(backup) as T;
      }
    } catch (error) {
      logger.error('SafeStorage', `Error parsing backup JSON for ${key}`, String(error));
    }
    
    return defaultValue;
  }
  
  /**
   * Calculate simple checksum for data integrity
   */
  private calculateChecksum(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Validate JSON structure without parsing
   */
  private isValidJSON(text: string): boolean {
    try {
      // Quick validation checks
      const trimmed = text.trim();
      
      if (!trimmed || trimmed.length === 0) {
        return false;
      }
      
      // Must start with { or [
      if (!['{', '['].includes(trimmed[0])) {
        return false;
      }
      
      // Check for balanced braces/brackets
      let braceCount = 0;
      let bracketCount = 0;
      let inString = false;
      let escaped = false;
      
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        
        if (escaped) {
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          continue;
        }
        
        if (inString) continue;
        
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        if (char === '[') bracketCount++;
        if (char === ']') bracketCount--;
      }
      
      // Check for unterminated strings or unbalanced braces
      if (inString || braceCount !== 0 || bracketCount !== 0) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Cleanup old backups to free up space
   */
  private cleanupOldBackups(): void {
    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith(this.BACKUP_SUFFIX)) {
          // Check if the primary key exists
          const primaryKey = key.replace(this.BACKUP_SUFFIX, '');
          if (!localStorage.getItem(primaryKey)) {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore individual removal errors
        }
      });
      
      if (keysToRemove.length > 0) {
        logger.info('SafeStorage', `Cleaned up ${keysToRemove.length} orphaned backups`);
      }
    } catch (error) {
      logger.error('SafeStorage', 'Error during backup cleanup', String(error));
    }
  }
  
  /**
   * Test if localStorage is available and working
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            used += key.length + value.length;
          }
        }
      }
      
      // Most browsers have 5-10MB limit, we'll use 5MB as conservative estimate
      const available = 5 * 1024 * 1024;
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage();

/**
 * API Key Storage - Persistent storage for critical API keys
 * Uses multiple storage strategies with automatic fallback
 */
class APIKeyStorage {
  private readonly KEYS_PREFIX = 'acw_apikey_';
  private readonly PERSISTENT_KEYS = ['google_api_key', 'github_token', 'supabase_url', 'supabase_key'];
  
  /**
   * Save API key with multiple backups
   */
  saveAPIKey(name: string, value: string): boolean {
    if (!value || value.trim().length === 0) {
      logger.warning('APIKeyStorage', `Attempted to save empty API key: ${name}`);
      return false;
    }
    
    const key = this.KEYS_PREFIX + name;
    
    // Save to primary storage
    const success = safeStorage.setItem(key, value, { useBackup: true });
    
    // Also save to legacy key for backwards compatibility
    safeStorage.setItem(name, value, { useBackup: true });
    
    if (success) {
      logger.info('APIKeyStorage', `Saved API key: ${name} (${value.substring(0, 8)}...)`);
    } else {
      logger.error('APIKeyStorage', `Failed to save API key: ${name}`);
    }
    
    return success;
  }
  
  /**
   * Get API key with automatic fallback to environment variables
   */
  getAPIKey(name: string): string | null {
    // Try to get from persistent storage first
    let value = safeStorage.getItem(this.KEYS_PREFIX + name, { useBackup: true, silent: true });
    
    // Fallback to legacy key
    if (!value) {
      value = safeStorage.getItem(name, { useBackup: true, silent: true });
    }
    
    // Fallback to environment variables
    if (!value) {
      const envKey = this.getEnvKey(name);
      if (envKey) {
        value = import.meta.env[envKey] || null;
      }
    }
    
    return value;
  }
  
  /**
   * Remove API key
   */
  removeAPIKey(name: string): void {
    safeStorage.removeItem(this.KEYS_PREFIX + name);
    safeStorage.removeItem(name);
    logger.info('APIKeyStorage', `Removed API key: ${name}`);
  }
  
  /**
   * Check if API key exists
   */
  hasAPIKey(name: string): boolean {
    return this.getAPIKey(name) !== null;
  }
  
  /**
   * Get all stored API key names (not values)
   */
  getAllKeyNames(): string[] {
    const names: string[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.KEYS_PREFIX)) {
          names.push(key.replace(this.KEYS_PREFIX, ''));
        }
      }
    } catch (error) {
      logger.error('APIKeyStorage', 'Error getting key names', String(error));
    }
    
    return names;
  }
  
  /**
   * Verify API key storage
   */
  verifyStorage(): { success: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if storage is available
    if (!safeStorage.isAvailable()) {
      errors.push('localStorage is not available');
      return { success: false, errors };
    }
    
    // Check storage capacity
    const info = safeStorage.getStorageInfo();
    if (info.percentage > 90) {
      errors.push(`Storage almost full: ${info.percentage.toFixed(1)}%`);
    }
    
    // Verify each persistent key
    for (const keyName of this.PERSISTENT_KEYS) {
      const value = this.getAPIKey(keyName);
      if (value) {
        // Verify backup exists
        const backupKey = this.KEYS_PREFIX + keyName + '_backup';
        const backup = localStorage.getItem(backupKey);
        if (!backup) {
          errors.push(`Missing backup for ${keyName}`);
          // Create backup
          this.saveAPIKey(keyName, value);
        }
      }
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }
  
  /**
   * Get environment variable key name
   */
  private getEnvKey(name: string): string | null {
    const envMap: Record<string, string> = {
      'google_api_key': 'VITE_GOOGLE_API_KEY',
      'github_token': 'VITE_GITHUB_TOKEN',
      'supabase_url': 'VITE_SUPABASE_URL',
      'supabase_key': 'VITE_SUPABASE_ANON_KEY'
    };
    
    return envMap[name] || null;
  }
  
  /**
   * Migrate old API keys to new storage format
   */
  migrateOldKeys(): number {
    let migrated = 0;
    
    for (const keyName of this.PERSISTENT_KEYS) {
      const oldValue = localStorage.getItem(keyName);
      if (oldValue && !localStorage.getItem(this.KEYS_PREFIX + keyName)) {
        if (this.saveAPIKey(keyName, oldValue)) {
          migrated++;
          logger.info('APIKeyStorage', `Migrated API key: ${keyName}`);
        }
      }
    }
    
    return migrated;
  }
}

// Export singleton instance
export const apiKeyStorage = new APIKeyStorage();

// Auto-migrate old keys on module load
try {
  const migrated = apiKeyStorage.migrateOldKeys();
  if (migrated > 0) {
    logger.info('SafeStorage', `Migrated ${migrated} API keys to new storage format`);
  }
  
  // Verify storage on load
  const verification = apiKeyStorage.verifyStorage();
  if (!verification.success) {
    logger.warning('SafeStorage', `Storage verification found issues: ${verification.errors.join(', ')}`);
  }
} catch (error) {
  logger.error('SafeStorage', 'Error during initialization', String(error));
}
