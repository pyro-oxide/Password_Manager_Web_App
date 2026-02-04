'use client';

import type { PasswordEntry, Category } from '../types';

export interface MasterPasswordData {
  salt: string;
  exists: boolean;
}

class DatabaseSync {
  private baseUrl = '/api';

  async initializeDatabase(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/db/init`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Database initialization error:', error);
      return false;
    }
  }

  async getMasterPassword(): Promise<MasterPasswordData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/master-password`);
      const data = await response.json();
      if (data.success) {
        return {
          exists: data.exists,
          salt: data.salt || '',
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching master password:', error);
      return null;
    }
  }

  async verifyMasterPassword(password: string): Promise<{ valid: boolean; salt?: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/master-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
        return {
          valid: data.valid,
          salt: data.salt,
        };
      }
      return null;
    } catch (error) {
      console.error('Error verifying master password:', error);
      return null;
    }
  }

  async setMasterPassword(password: string): Promise<{ success: boolean; salt?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/master-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      return {
        success: data.success,
        salt: data.salt,
      };
    } catch (error) {
      console.error('Error setting master password:', error);
      return { success: false };
    }
  }

  async getAllPasswords(masterPassword: string, salt: string): Promise<PasswordEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/passwords`);
      const data = await response.json();
      
      if (!data.success || !data.passwords) {
        return [];
      }

      // Decrypt passwords
      const decryptedPasswords: PasswordEntry[] = [];
      for (const entry of data.passwords) {
        try {
          const decryptResponse = await fetch(`${this.baseUrl}/passwords/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encryptedPassword: entry.password,
              masterPassword,
              salt,
            }),
          });
          const decryptData = await decryptResponse.json();
          
          if (decryptData.success) {
            decryptedPasswords.push({
              id: entry.id.toString(),
              siteName: entry.site,
              username: entry.username,
              password: decryptData.password,
              websiteUrl: entry.website || '',
              category: entry.category || 'Uncategorized',
              notes: entry.notes || '',
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
            });
          }
        } catch (error) {
          console.error(`Error decrypting password for entry ${entry.id}:`, error);
        }
      }

      return decryptedPasswords;
    } catch (error) {
      console.error('Error fetching passwords:', error);
      return [];
    }
  }

  async searchPasswords(query: string, masterPassword: string, salt: string): Promise<PasswordEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/passwords?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!data.success || !data.passwords) {
        return [];
      }

      // Decrypt passwords (same logic as getAllPasswords)
      const decryptedPasswords: PasswordEntry[] = [];
      for (const entry of data.passwords) {
        try {
          const decryptResponse = await fetch(`${this.baseUrl}/passwords/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encryptedPassword: entry.password,
              masterPassword,
              salt,
            }),
          });
          const decryptData = await decryptResponse.json();
          
          if (decryptData.success) {
            decryptedPasswords.push({
              id: entry.id.toString(),
              siteName: entry.site,
              username: entry.username,
              password: decryptData.password,
              websiteUrl: entry.website || '',
              category: entry.category || 'Uncategorized',
              notes: entry.notes || '',
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
            });
          }
        } catch (error) {
          console.error(`Error decrypting password for entry ${entry.id}:`, error);
        }
      }

      return decryptedPasswords;
    } catch (error) {
      console.error('Error searching passwords:', error);
      return [];
    }
  }

  async getPasswordsByCategory(category: string, masterPassword: string, salt: string): Promise<PasswordEntry[]> {
    try {
      const response = await fetch(`${this.baseUrl}/passwords?category=${encodeURIComponent(category)}`);
      const data = await response.json();
      
      if (!data.success || !data.passwords) {
        return [];
      }

      // Decrypt passwords (same logic as getAllPasswords)
      const decryptedPasswords: PasswordEntry[] = [];
      for (const entry of data.passwords) {
        try {
          const decryptResponse = await fetch(`${this.baseUrl}/passwords/decrypt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              encryptedPassword: entry.password,
              masterPassword,
              salt,
            }),
          });
          const decryptData = await decryptResponse.json();
          
          if (decryptData.success) {
            decryptedPasswords.push({
              id: entry.id.toString(),
              siteName: entry.site,
              username: entry.username,
              password: decryptData.password,
              websiteUrl: entry.website || '',
              category: entry.category || 'Uncategorized',
              notes: entry.notes || '',
              createdAt: entry.created_at,
              updatedAt: entry.updated_at,
            });
          }
        } catch (error) {
          console.error(`Error decrypting password for entry ${entry.id}:`, error);
        }
      }

      return decryptedPasswords;
    } catch (error) {
      console.error('Error fetching passwords by category:', error);
      return [];
    }
  }

  async addPassword(password: PasswordEntry, masterPassword: string, salt: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/passwords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: password.siteName,
          username: password.username,
          password: password.password,
          website: password.websiteUrl || null,
          category: password.category || 'Uncategorized',
          notes: password.notes || null,
          masterPassword,
          salt,
        }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error adding password:', error);
      return false;
    }
  }

  async updatePassword(id: string, password: Partial<PasswordEntry>, masterPassword: string, salt: string): Promise<boolean> {
    try {
      // First get current password entry to merge with updates
      const allPasswords = await this.getAllPasswords(masterPassword, salt);
      const current = allPasswords.find(p => p.id === id);
      
      if (!current) {
        return false;
      }

      // Merge updates with current entry
      const updated: PasswordEntry = {
        ...current,
        ...password,
        id,
        // Preserve password if not being updated
        password: password.password !== undefined ? password.password : current.password,
      };

      const response = await fetch(`${this.baseUrl}/passwords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(id),
          site: updated.siteName,
          username: updated.username,
          password: updated.password, // Will be encrypted on server
          website: updated.websiteUrl || null,
          category: updated.category || 'Uncategorized',
          notes: updated.notes || null,
          masterPassword,
          salt,
        }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error updating password:', error);
      return false;
    }
  }

  async deletePassword(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/passwords?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error deleting password:', error);
      return false;
    }
  }

  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/categories`);
      const data = await response.json();
      if (data.success) {
        return data.categories || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getSetting(key: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/settings?key=${encodeURIComponent(key)}`);
      const data = await response.json();
      if (data.success) {
        return data.value;
      }
      return null;
    } catch (error) {
      console.error('Error fetching setting:', error);
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error setting setting:', error);
      return false;
    }
  }

  async disable2FA(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/2fa/disable`, {
        method: 'POST',
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  async verify2FALogin(token: string): Promise<{ success: boolean; verified: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/2fa/verify-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      return {
        success: data.success,
        verified: data.verified || false,
        error: data.error,
      };
    } catch (error) {
      console.error('Error verifying 2FA for login:', error);
      return { success: false, verified: false, error: 'Failed to verify 2FA code' };
    }
  }
}

export const dbSync = new DatabaseSync();

