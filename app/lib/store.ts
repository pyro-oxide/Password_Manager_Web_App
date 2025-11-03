'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PasswordEntry, Category, VaultSettings, VaultHealth } from '../types';

interface VaultState {
  isLocked: boolean;
  masterPassword: string | null;
  passwords: PasswordEntry[];
  categories: Category[];
  settings: VaultSettings;
  selectedPasswordId: string | null;
  searchQuery: string;
  selectedCategory: string | null;
  
  // Actions
  unlock: (password: string) => boolean;
  lock: () => void;
  addPassword: (password: PasswordEntry) => void;
  updatePassword: (id: string, password: Partial<PasswordEntry>) => void;
  deletePassword: (id: string) => void;
  selectPassword: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  updateSettings: (settings: Partial<VaultSettings>) => void;
  checkVaultHealth: () => VaultHealth;
  calculatePasswordStrength: (password: string) => 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
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

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      isLocked: true,
      masterPassword: null,
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

      unlock: (password: string) => {
        const state = get();
        if (!state.masterPassword) {
          // First time setup
          set({ masterPassword: password, isLocked: false });
          return true;
        }
        if (state.masterPassword === password) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },

      lock: () => {
        set({ isLocked: true, selectedPasswordId: null });
      },

      addPassword: (password: PasswordEntry) => {
        const strength = calculatePasswordStrength(password.password);
        set((state) => ({
          passwords: [...state.passwords, { ...password, strength }],
        }));
      },

      updatePassword: (id: string, updates: Partial<PasswordEntry>) => {
        set((state) => ({
          passwords: state.passwords.map((p) => {
            if (p.id === id) {
              const updated = { ...p, ...updates };
              if (updates.password) {
                updated.strength = calculatePasswordStrength(updates.password);
              }
              updated.updatedAt = new Date().toISOString();
              return updated;
            }
            return p;
          }),
        }));
      },

      deletePassword: (id: string) => {
        set((state) => ({
          passwords: state.passwords.filter((p) => p.id !== id),
          selectedPasswordId: state.selectedPasswordId === id ? null : state.selectedPasswordId,
        }));
      },

      selectPassword: (id: string | null) => {
        set({ selectedPasswordId: id });
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSelectedCategory: (category: string | null) => {
        set({ selectedCategory: category });
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
        }));
      },

      deleteCategory: (id: string) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          passwords: state.passwords.map((p) =>
            p.category === state.categories.find((c) => c.id === id)?.name
              ? { ...p, category: 'Uncategorized' }
              : p
          ),
        }));
      },

      updateSettings: (settings: Partial<VaultSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
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
        masterPassword: state.masterPassword,
        passwords: state.passwords,
        categories: state.categories,
        settings: state.settings,
      }),
    }
  )
);

