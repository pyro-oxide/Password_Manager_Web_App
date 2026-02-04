'use client';

import { useState } from 'react';
import { Lock, X, Shield } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

interface UnlockDialogProps {
  onClose?: () => void;
}

export function UnlockDialog({ onClose }: UnlockDialogProps) {
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyAndUnlock } = useVaultStore();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Please enter a password');
      return;
    }
    
    setIsVerifying(true);
    try {
      const result = await verifyAndUnlock(password);
      if (result === true) {
        setPassword('');
        setTwoFactorCode('');
        setRequires2FA(false);
        if (onClose) onClose();
      } else if (result && typeof result === 'object' && 'requires2FA' in result) {
        // Password is correct but 2FA is required
        setRequires2FA(true);
        setError('');
      } else if (result && typeof result === 'object' && 'twoFactorError' in result) {
        setError((result as any).twoFactorError || 'Invalid 2FA code');
      } else {
        setError('Incorrect master password');
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }
    
    setIsVerifying(true);
    try {
      const result = await verifyAndUnlock(password, twoFactorCode);
      if (result === true) {
        setPassword('');
        setTwoFactorCode('');
        setRequires2FA(false);
        if (onClose) onClose();
      } else if (result && typeof result === 'object' && 'twoFactorError' in result) {
        setError((result as any).twoFactorError || 'Invalid verification code');
        setTwoFactorCode('');
      } else {
        setError('Invalid verification code');
        setTwoFactorCode('');
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="bg-white rounded-lg shadow-xl w-96">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {requires2FA ? (
              <Shield className="w-5 h-5 text-blue-600" />
            ) : (
              <Lock className="w-5 h-5 text-green-600" />
            )}
            <h2 className="text-lg font-semibold">
              {requires2FA ? 'Two-Factor Authentication' : 'Unlock Vault'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {!requires2FA ? (
          <form onSubmit={handlePasswordSubmit} className="p-6">
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
                disabled={isVerifying}
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
                disabled={isVerifying}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Continue'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code from your authenticator app:
              </p>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTwoFactorCode(value);
                  setError('');
                }}
                className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoFocus
                disabled={isVerifying}
              />
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setError('');
                }}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                disabled={isVerifying}
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isVerifying || twoFactorCode.length !== 6}
              >
                {isVerifying ? 'Verifying...' : 'Unlock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

