'use client';

import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Wand2 } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';
import type { PasswordEntry } from '../types';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger', message: string) => void;
  password?: PasswordEntry;
}

export function PasswordDialog({ isOpen, onClose, onNotify, password }: PasswordDialogProps) {
  const { addPassword, updatePassword, passwords, categories, calculatePasswordStrength } = useVaultStore();
  const [formData, setFormData] = useState({
    siteName: '',
    username: '',
    password: '',
    websiteUrl: '',
    category: 'Uncategorized',
    notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'>('Very Weak');
  const [isReused, setIsReused] = useState(false);

  useEffect(() => {
    if (password) {
      setFormData({
        siteName: password.siteName,
        username: password.username,
        password: password.password,
        websiteUrl: password.websiteUrl,
        category: password.category,
        notes: password.notes,
      });
    } else {
      setFormData({
        siteName: '',
        username: '',
        password: '',
        websiteUrl: '',
        category: 'Uncategorized',
        notes: '',
      });
    }
  }, [password, isOpen]);

  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password);
      setPasswordStrength(strength);
      
      // Check if password is reused
      const reused = passwords.some(
        (p) => p.password === formData.password && p.id !== password?.id
      );
      setIsReused(reused);
    } else {
      setPasswordStrength('Very Weak');
      setIsReused(false);
    }
  }, [formData.password, passwords, password, calculatePasswordStrength]);

  const generatePassword = () => {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let generated = '';
    for (let i = 0; i < length; i++) {
      generated += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData({ ...formData, password: generated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password) {
      const success = await updatePassword(password.id, formData);
      if (success) {
        onNotify('success', 'Password updated successfully');
        onClose();
      } else {
        onNotify('danger', 'Failed to update password. Please try again.');
      }
    } else {
      const newPassword: PasswordEntry = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const success = await addPassword(newPassword);
      if (success) {
        onNotify('success', 'Password added successfully');
        onClose();
      } else {
        onNotify('danger', 'Failed to add password. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  const strengthColors = {
    'Very Weak': 'bg-red-500',
    'Weak': 'bg-orange-500',
    'Fair': 'bg-yellow-500',
    'Good': 'bg-blue-500',
    'Strong': 'bg-green-500',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b bg-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">{password ? 'Edit Password' : 'Add New Password'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Site/App Name:</label>
            <input
              type="text"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Username:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password:</label>
            <div className="flex gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <Wand2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => {
                  const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
                  const currentLevel = strengthLevels.indexOf(passwordStrength);
                  const filled = i <= currentLevel + 1;
                  return (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded ${
                        filled ? strengthColors[passwordStrength] : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-gray-600">Strength: {passwordStrength}</p>
            </div>
            {isReused && (
              <p className="text-orange-600 text-sm mt-1">Warning: This password is used elsewhere in your vault.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Website URL:</label>
            <input
              type="text"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              placeholder="e.g., https://www.example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category:</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes:</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

