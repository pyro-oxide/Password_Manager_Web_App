'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PasswordEntry, Category, VaultSettings, VaultHealth } from '../types';
import { dbSync } from './db-sync';

type UnlockResult = 
  | boolean 
  | { requires2FA: true }
  | { twoFactorError: string };

interface VaultState {
  isLocked: boolean;
  masterPasswordSalt: string | null; // Store salt for encryption, not the password itself
  masterPasswordExists: boolean;
  passwords: PasswordEntry[];
  categories: Category[];
  settings: VaultSettings;
  selectedPasswordId: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  isSyncing: boolean;
  
  // Actions
  initializeDatabase: () => Promise<boolean>;
  checkMasterPasswordExists: () => Promise<boolean>;
  verifyAndUnlock: (password: string, twoFactorCode?: string) => Promise<UnlockResult>;
  setMasterPassword: (password: string) => Promise<boolean>;
  lock: () => void;
  loadPasswords: () => Promise<void>;
  addPassword: (password: PasswordEntry) => Promise<boolean>;
  updatePassword: (id: string, password: Partial<PasswordEntry>) => Promise<boolean>;
  deletePassword: (id: string) => Promise<boolean>;
  selectPassword: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  loadCategories: () => Promise<void>;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<VaultSettings>) => Promise<void>;
  checkVaultHealth: () => VaultHealth;
  calculatePasswordStrength: (password: string) => 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  getMasterPassword: () => string | null; // Temporary storage during session
}

const calculatePasswordStrength = (password: string): 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong' => {
  if (!password) return 'Very Weak';
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  if (password.length >= 16) strength++;
  
  if (strength <= 1) return 'Very Weak';
  if (strength === 2) return 'Weak';
  if (strength === 3) return 'Fair';
  if (strength === 4) return 'Good';
  return 'Strong';
};

// Store master password temporarily in memory (not persisted)
// This is a module-level variable to store the password during the session
let currentMasterPassword: string | null = null;

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      isLocked: true,
      masterPasswordSalt: null,
      masterPasswordExists: false,
      passwords: [],
      categories: [
        { id: '1', name: 'Coding', color: 'bg-pink-200 text-pink-800' },
        { id: '2', name: 'Personal', color: 'bg-yellow-200 text-yellow-800' },
        { id: '3', name: 'School', color: 'bg-green-200 text-green-800' },
        { id: '4', name: 'Uncategorized', color: 'bg-gray-200 text-gray-800' },
      ],
      settings: {
        autoLockMinutes: 1,
        clearClipboardSeconds: 30,
        twoFactorEnabled: false,
      },
      selectedPasswordId: null,
      searchQuery: '',
      selectedCategory: null,
      isSyncing: false,

      initializeDatabase: async () => {
        return await dbSync.initializeDatabase();
      },

      checkMasterPasswordExists: async () => {
        const masterPasswordData = await dbSync.getMasterPassword();
        if (masterPasswordData) {
          set({
            masterPasswordExists: masterPasswordData.exists,
            masterPasswordSalt: masterPasswordData.salt || null,
          });
          return masterPasswordData.exists;
        }
        return false;
      },

      verifyAndUnlock: async (password: string, twoFactorCode?: string) => {
        const state = get();
        
        // If no master password exists, set it up
        if (!state.masterPasswordExists) {
          const result = await dbSync.setMasterPassword(password);
          if (result.success && result.salt) {
            currentMasterPassword = password;
            set({
              masterPasswordExists: true,
              masterPasswordSalt: result.salt,
              isLocked: false,
            });
            await get().loadPasswords();
            await get().loadCategories();
            await get().loadSettings();
            return true;
          }
          return false;
        }

        // Verify existing master password
        const verification = await dbSync.verifyMasterPassword(password);
        if (!verification) {
          console.error('Verification returned null');
          return false;
        }
        
        if (verification.valid && verification.salt) {
          // Check if 2FA is enabled
          const twoFactorEnabled = await dbSync.getSetting('twoFactorEnabled');
          
          if (twoFactorEnabled === 'true') {
            // 2FA is enabled, verify the code
            if (!twoFactorCode) {
              // Return a special code to indicate 2FA is required
              return { requires2FA: true };
            }
            
            const twoFactorResult = await dbSync.verify2FALogin(twoFactorCode);
            if (!twoFactorResult.success || !twoFactorResult.verified) {
              return { twoFactorError: twoFactorResult.error || 'Invalid 2FA code' };
            }
          }
          
          // Password is valid and 2FA (if enabled) is verified
          currentMasterPassword = password;
          set({
            masterPasswordSalt: verification.salt,
            isLocked: false,
          });
          await get().loadPasswords();
          await get().loadCategories();
          await get().loadSettings();
          return true;
        } else {
          console.log('Password verification failed:', { valid: verification.valid, hasSalt: !!verification.salt });
        }
        return false;
      },

      setMasterPassword: async (password: string) => {
        const result = await dbSync.setMasterPassword(password);
        if (result.success && result.salt) {
          currentMasterPassword = password;
          set({
            masterPasswordExists: true,
            masterPasswordSalt: result.salt,
          });
          return true;
        }
        return false;
      },

      lock: () => {
        currentMasterPassword = null;
        set({ isLocked: true, selectedPasswordId: null });
      },

      getMasterPassword: () => currentMasterPassword,

      loadPasswords: async () => {
        const state = get();
        if (!currentMasterPassword || !state.masterPasswordSalt || state.isLocked) {
          return;
        }

        set({ isSyncing: true });
        try {
          let passwords: PasswordEntry[] = [];
          
          if (state.searchQuery) {
            passwords = await dbSync.searchPasswords(state.searchQuery, currentMasterPassword, state.masterPasswordSalt);
          } else if (state.selectedCategory) {
            passwords = await dbSync.getPasswordsByCategory(state.selectedCategory, currentMasterPassword, state.masterPasswordSalt);
          } else {
            passwords = await dbSync.getAllPasswords(currentMasterPassword, state.masterPasswordSalt);
          }

          // Calculate strength for each password
          passwords = passwords.map(p => ({
            ...p,
            strength: calculatePasswordStrength(p.password),
          }));

          set({ passwords, isSyncing: false });
        } catch (error) {
          console.error('Error loading passwords:', error);
          set({ isSyncing: false });
        }
      },

      addPassword: async (password: PasswordEntry) => {
        const state = get();
        if (!currentMasterPassword || !state.masterPasswordSalt) {
          return false;
        }

        set({ isSyncing: true });
        try {
          const success = await dbSync.addPassword(password, currentMasterPassword, state.masterPasswordSalt);
          if (success) {
            await get().loadPasswords();
          }
          set({ isSyncing: false });
          return success;
        } catch (error) {
          console.error('Error adding password:', error);
          set({ isSyncing: false });
          return false;
        }
      },

      updatePassword: async (id: string, updates: Partial<PasswordEntry>) => {
        const state = get();
        if (!currentMasterPassword || !state.masterPasswordSalt) {
          return false;
        }

        set({ isSyncing: true });
        try {
          const success = await dbSync.updatePassword(id, updates, currentMasterPassword, state.masterPasswordSalt);
          if (success) {
            await get().loadPasswords();
          }
          set({ isSyncing: false });
          return success;
        } catch (error) {
          console.error('Error updating password:', error);
          set({ isSyncing: false });
          return false;
        }
      },

      deletePassword: async (id: string) => {
        set({ isSyncing: true });
        try {
          const success = await dbSync.deletePassword(id);
          if (success) {
            await get().loadPasswords();
            const state = get();
            if (state.selectedPasswordId === id) {
              set({ selectedPasswordId: null });
            }
          }
          set({ isSyncing: false });
          return success;
        } catch (error) {
          console.error('Error deleting password:', error);
          set({ isSyncing: false });
          return false;
        }
      },

      selectPassword: (id: string | null) => {
        set({ selectedPasswordId: id });
      },

      setSearchQuery: async (query: string) => {
        set({ searchQuery: query });
        await get().loadPasswords();
      },

      setSelectedCategory: async (category: string | null) => {
        set({ selectedCategory: category });
        await get().loadPasswords();
      },

      loadCategories: async () => {
        try {
          const dbCategories = await dbSync.getCategories();
          const state = get();
          
          // Merge with existing categories, add new ones from DB
          const existingCategoryNames = new Set(state.categories.map(c => c.name));
          const newCategories: Category[] = [...state.categories];
          
          // Add default categories if they don't exist
          const defaultCategories = ['Uncategorized', 'Coding', 'Personal', 'School'];
          defaultCategories.forEach(name => {
            if (!existingCategoryNames.has(name)) {
              const colors = [
                'bg-gray-200 text-gray-800',
                'bg-pink-200 text-pink-800',
                'bg-yellow-200 text-yellow-800',
                'bg-green-200 text-green-800',
              ];
              newCategories.push({
                id: Date.now().toString() + Math.random(),
                name,
                color: colors[defaultCategories.indexOf(name)] || 'bg-gray-200 text-gray-800',
              });
            }
          });

          // Add categories from database that don't exist
          dbCategories.forEach(catName => {
            if (!existingCategoryNames.has(catName)) {
              const colors = [
                'bg-blue-200 text-blue-800',
                'bg-purple-200 text-purple-800',
                'bg-red-200 text-red-800',
                'bg-orange-200 text-orange-800',
              ];
              newCategories.push({
                id: Date.now().toString() + Math.random(),
                name: catName,
                color: colors[newCategories.length % colors.length],
              });
            }
          });

          set({ categories: newCategories });
        } catch (error) {
          console.error('Error loading categories:', error);
        }
      },

      addCategory: (category: Category) => {
        set((state) => ({
          categories: [...state.categories, category],
        }));
      },

      updateCategory: (id: string, name: string) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, name } : c
          ),
          passwords: state.passwords.map((p) =>
            p.category === state.categories.find((c) => c.id === id)?.name
              ? { ...p, category: name }
              : p
          ),
        }));
      },

      deleteCategory: (id: string) => {
        set((state) => {
          const categoryToDelete = state.categories.find((c) => c.id === id);
          return {
            categories: state.categories.filter((c) => c.id !== id),
            passwords: state.passwords.map((p) =>
              p.category === categoryToDelete?.name
                ? { ...p, category: 'Uncategorized' }
                : p
            ),
          };
        });
      },

      loadSettings: async () => {
        try {
          const autoLock = await dbSync.getSetting('autoLockMinutes');
          const clearClipboard = await dbSync.getSetting('clearClipboardSeconds');
          const twoFactor = await dbSync.getSetting('twoFactorEnabled');

          set((state) => ({
            settings: {
              autoLockMinutes: autoLock ? parseInt(autoLock) : state.settings.autoLockMinutes,
              clearClipboardSeconds: clearClipboard ? parseInt(clearClipboard) : state.settings.clearClipboardSeconds,
              twoFactorEnabled: twoFactor === 'true' || state.settings.twoFactorEnabled,
            },
          }));
        } catch (error) {
          console.error('Error loading settings:', error);
        }
      },

      updateSettings: async (settings: Partial<VaultSettings>) => {
        // Update local state
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));

        // Save to database
        if (settings.autoLockMinutes !== undefined) {
          await dbSync.setSetting('autoLockMinutes', settings.autoLockMinutes.toString());
        }
        if (settings.clearClipboardSeconds !== undefined) {
          await dbSync.setSetting('clearClipboardSeconds', settings.clearClipboardSeconds.toString());
        }
        if (settings.twoFactorEnabled !== undefined) {
          if (settings.twoFactorEnabled === false) {
            // When disabling 2FA, use the dedicated API that also clears the secret
            await dbSync.disable2FA();
          } else {
            await dbSync.setSetting('twoFactorEnabled', settings.twoFactorEnabled.toString());
          }
        }
      },

      calculatePasswordStrength,

      checkVaultHealth: () => {
        const state = get();
        const weakPasswords = state.passwords.filter(
          (p) => !p.strength || ['Very Weak', 'Weak', 'Fair'].includes(p.strength)
        );
        
        const passwordMap = new Map<string, PasswordEntry[]>();
        state.passwords.forEach((p) => {
          if (!passwordMap.has(p.password)) {
            passwordMap.set(p.password, []);
          }
          passwordMap.get(p.password)!.push(p);
        });
        
        const reusedPasswords = Array.from(passwordMap.entries())
          .filter(([_, entries]) => entries.length > 1)
          .map(([password, entries]) => ({ password, entries }));

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const oldPasswords = state.passwords.filter(
          (p) => new Date(p.createdAt) < oneYearAgo
        );

        return {
          weakPasswords,
          reusedPasswords,
          oldPasswords,
          lastChecked: new Date().toISOString(),
        };
      },
    }),
    {
      name: 'vault-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        masterPasswordSalt: state.masterPasswordSalt,
        masterPasswordExists: state.masterPasswordExists,
        categories: state.categories,
        settings: state.settings,
      }),
    }
  )
);

