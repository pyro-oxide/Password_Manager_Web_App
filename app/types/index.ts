export interface PasswordEntry {
  id: string;
  siteName: string;
  username: string;
  password: string;
  websiteUrl: string;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  strength?: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface VaultSettings {
  autoLockMinutes: number;
  clearClipboardSeconds: number;
  masterPassword?: string;
  twoFactorEnabled: boolean;
}

export interface VaultHealth {
  weakPasswords: PasswordEntry[];
  reusedPasswords: { password: string; entries: PasswordEntry[] }[];
  oldPasswords: PasswordEntry[];
  lastChecked: string;
}
