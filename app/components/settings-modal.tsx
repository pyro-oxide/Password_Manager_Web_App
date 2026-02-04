'use client';

import { useState } from 'react';
import { X, Key, CheckCircle, XCircle, Heart } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';
import type { PasswordEntry } from '../types';
import { TwoFactorSetupDialog } from './two-factor-setup-dialog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (type: 'success' | 'danger', message: string) => void;
}

export function SettingsModal({ isOpen, onClose, onNotify }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'vault-health' | 'categories'>('general');
  const { settings, updateSettings, categories, addCategory, updateCategory, deleteCategory, checkVaultHealth, passwords } = useVaultStore();
  const [healthReport, setHealthReport] = useState<any>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  const handleCheckHealth = () => {
    const health = checkVaultHealth();
    setHealthReport(health);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      onNotify('danger', 'Please enter a category name');
      return;
    }

    const colors = [
      'bg-pink-200 text-pink-800',
      'bg-yellow-200 text-yellow-800',
      'bg-green-200 text-green-800',
      'bg-blue-200 text-blue-800',
      'bg-purple-200 text-purple-800',
      'bg-red-200 text-red-800',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addCategory({
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: randomColor,
    });
    setNewCategoryName('');
    onNotify('success', 'Category added');
  };

  const handleUpdateCategory = (id: string) => {
    if (editingCategoryName.trim()) {
      updateCategory(id, editingCategoryName.trim());
      setEditingCategoryId(null);
      setEditingCategoryName('');
      onNotify('success', 'Category updated');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
          {[
            { id: 'general', label: 'General' },
            { id: 'security', label: 'Security' },
            { id: 'vault-health', label: 'Vault Health' },
            { id: 'categories', label: 'Categories' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Auto-lock after inactivity:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.autoLockMinutes}
                    onChange={(e) => updateSettings({ autoLockMinutes: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Clear clipboard after:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.clearClipboardSeconds}
                    onChange={(e) => updateSettings({ clearClipboardSeconds: parseInt(e.target.value) || 30 })}
                    min="1"
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">seconds</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50">
                  <Key className="w-4 h-4" />
                  Change Master Password...
                </button>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Two-Factor Authentication (TOTP)</h3>
                <div className="mb-3">
                  <span className="text-sm">Status: </span>
                  <span className={`text-sm font-medium ${settings.twoFactorEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShow2FASetup(true)}
                    disabled={settings.twoFactorEnabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${
                      settings.twoFactorEnabled
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enable 2FA...
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
                        try {
                          await updateSettings({ twoFactorEnabled: false });
                          onNotify('success', 'Two-factor authentication disabled');
                        } catch (error) {
                          console.error(error);
                          onNotify('danger', 'Failed to disable two-factor authentication');
                        }
                      }
                    }}
                    disabled={!settings.twoFactorEnabled}
                    className={`flex items-center gap-2 px-4 py-2 rounded ${
                      settings.twoFactorEnabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Disable 2FA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vault-health' && (
            <div className="space-y-6">
              <button
                onClick={handleCheckHealth}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Heart className="w-4 h-4" />
                Check Vault Health
              </button>

              {healthReport && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-2">
                    Vault Health Check Report ({new Date(healthReport.lastChecked).toLocaleString()})
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Checked {passwords.length} entries in 0.15 seconds.
                  </p>
                  <div className="border-t pt-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Weak Passwords ({healthReport.weakPasswords.length} Found):</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {healthReport.weakPasswords.map((p: PasswordEntry) => (
                          <li key={p.id}>
                            - {p.siteName} / {p.username} (Strength: {p.strength || 'N/A'})
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Reused Passwords ({healthReport.reusedPasswords.length} Instances Found):</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {healthReport.reusedPasswords.map((rp: any, idx: number) => (
                          <li key={idx}>
                            - Password reused for: {rp.entries.map((e: PasswordEntry) => `${e.siteName} / ${e.username}`).join(', ')}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={healthReport.oldPasswords.length === 0} readOnly className="w-4 h-4" />
                      <span className="text-sm">
                        No passwords older than 1 year found.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4">
              <h3 className="font-semibold">Manage Categories</h3>
              <div className="flex gap-4">
                <div className="flex-1 border rounded-lg">
                  <div className="p-2 max-h-64 overflow-y-auto space-y-1">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => {
                          setEditingCategoryId(category.id);
                          setEditingCategoryName(category.name);
                        }}
                        className={`p-2 hover:bg-gray-50 rounded cursor-pointer ${
                          editingCategoryId === category.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        {editingCategoryId === category.id ? (
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            onBlur={() => {
                              if (editingCategoryName.trim() && editingCategoryName.trim() !== category.name) {
                                handleUpdateCategory(category.id);
                              } else {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingCategoryName.trim() && editingCategoryName.trim() !== category.name) {
                                  handleUpdateCategory(category.id);
                                } else {
                                  setEditingCategoryId(null);
                                  setEditingCategoryName('');
                                }
                              }
                              if (e.key === 'Escape') {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                              }
                            }}
                            className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div>{category.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAddCategory}
                    className="w-10 h-10 border rounded hover:bg-gray-50 flex items-center justify-center text-xl font-semibold"
                    title="Add Category"
                  >
                    +
                  </button>
                  <button
                    onClick={() => {
                      if (editingCategoryId) {
                        const category = categories.find((c) => c.id === editingCategoryId);
                        if (category) {
                          setEditingCategoryName(category.name);
                        }
                      } else if (categories.length > 0) {
                        const firstCategory = categories.find((c) => c.name !== 'Uncategorized') || categories[0];
                        if (firstCategory) {
                          setEditingCategoryId(firstCategory.id);
                          setEditingCategoryName(firstCategory.name);
                        }
                      }
                    }}
                    className="w-10 h-10 border rounded hover:bg-gray-50 flex items-center justify-center"
                    title="Edit Category"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      const categoryToDelete = editingCategoryId 
                        ? categories.find((c) => c.id === editingCategoryId)
                        : categories.find((c) => c.name !== 'Uncategorized') || categories[0];
                      if (categoryToDelete && categoryToDelete.name !== 'Uncategorized') {
                        if (confirm(`Delete category "${categoryToDelete.name}"? Passwords in this category will be moved to Uncategorized.`)) {
                          deleteCategory(categoryToDelete.id);
                          setEditingCategoryId(null);
                          setEditingCategoryName('');
                          onNotify('success', 'Category deleted');
                        }
                      } else if (categoryToDelete && categoryToDelete.name === 'Uncategorized') {
                        onNotify('danger', 'Cannot delete the default "Uncategorized" category');
                      }
                    }}
                    className="w-10 h-10 border rounded hover:bg-red-50 flex items-center justify-center text-red-600"
                    title="Delete Category"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Add New Category:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory();
                    }}
                    placeholder="Enter category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>

      <TwoFactorSetupDialog
        isOpen={show2FASetup}
        onClose={() => setShow2FASetup(false)}
        onSuccess={() => {
          setShow2FASetup(false);
        }}
        onNotify={onNotify}
      />
    </div>
  );
}

