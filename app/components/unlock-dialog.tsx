'use client';

import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

interface UnlockDialogProps {
  onClose?: () => void;
}

export function UnlockDialog({ onClose }: UnlockDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { verifyAndUnlock } = useVaultStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    try {
      const success = await verifyAndUnlock(password);
      if (success) {
        setPassword('');
        if (onClose) onClose();
      } else {
        setError('Incorrect master password');
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="bg-white rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Unlock Vault</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Enter master password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
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
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

