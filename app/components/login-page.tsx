'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyAndUnlock, checkMasterPasswordExists, masterPasswordExists } = useVaultStore();
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    checkMasterPasswordExists().then(exists => {
      setIsSetup(!exists);
    });
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetup || !masterPasswordExists) {
      // Setup mode - create master password
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setIsVerifying(true);
      const success = await verifyAndUnlock(password);
      setIsVerifying(false);
      if (!success) {
        setError('Failed to set up master password');
      }
    } else {
      // Login mode
      setIsVerifying(true);
      const result = await verifyAndUnlock(password);
      setIsVerifying(false);
      if (result === true) {
        setPassword('');
        setTwoFactorCode('');
        setRequires2FA(false);
      } else if (result && typeof result === 'object' && 'requires2FA' in result) {
        // Password is correct but 2FA is required
        setRequires2FA(true);
        setError('');
      } else if (result && typeof result === 'object' && 'twoFactorError' in result) {
        setError((result as any).twoFactorError || 'Invalid 2FA code');
      } else {
        setError('Incorrect master password');
      }
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
    const result = await verifyAndUnlock(password, twoFactorCode);
    setIsVerifying(false);
    if (result === true) {
      setPassword('');
      setTwoFactorCode('');
      setRequires2FA(false);
    } else if (result && typeof result === 'object' && 'twoFactorError' in result) {
      setError((result as any).twoFactorError || 'Invalid verification code');
      setTwoFactorCode('');
    } else {
      setError('Invalid verification code');
      setTwoFactorCode('');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">
          {isSetup || !masterPasswordExists ? 'Setup Master Password' : 'Login'}
        </h1>
        <p className="text-gray-600 text-center mb-6">
          {isSetup || !masterPasswordExists
            ? 'Create a master password to secure your vault'
            : 'Enter your master password to unlock the vault'}
        </p>

        {!requires2FA ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Master Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter master password"
                autoFocus
                disabled={isVerifying}
              />
            </div>

            {(isSetup || !masterPasswordExists) && (
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm master password"
                  disabled={isVerifying}
                />
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={isVerifying}
            >
              <Lock className="w-4 h-4" />
              {isVerifying ? 'Verifying...' : (isSetup || !masterPasswordExists ? 'Create Vault' : 'Continue')}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4 text-center">
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoFocus
                disabled={isVerifying}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorCode('');
                  setError('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                disabled={isVerifying}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={isVerifying || twoFactorCode.length !== 6}
              >
                <Shield className="w-4 h-4" />
                {isVerifying ? 'Verifying...' : 'Unlock Vault'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

