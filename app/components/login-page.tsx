'use client';

import { useState, useEffect } from 'react';
import { Lock, Shield } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

export function LoginPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { verifyAndUnlock, checkMasterPasswordExists, masterPasswordExists } = useVaultStore();
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    checkMasterPasswordExists().then(exists => {
      setIsSetup(!exists);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      const success = await verifyAndUnlock(password);
      if (!success) {
        setError('Failed to set up master password');
      }
    } else {
      // Login mode
      const success = await verifyAndUnlock(password);
      if (success) {
        setPassword('');
      } else {
        setError('Incorrect master password');
      }
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {isSetup || !masterPasswordExists ? 'Create Vault' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    </div>
  );
}

