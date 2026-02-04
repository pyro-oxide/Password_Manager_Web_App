'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

interface TwoFactorSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNotify: (type: 'success' | 'danger', message: string) => void;
}

export function TwoFactorSetupDialog({ isOpen, onClose, onSuccess, onNotify }: TwoFactorSetupDialogProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const updateSettings = useVaultStore((state) => state.updateSettings);

  useEffect(() => {
    if (isOpen && !qrCode) {
      generateSecret();
    } else if (!isOpen) {
      // Reset state when dialog closes
      setQrCode(null);
      setSecret(null);
      setVerificationCode('');
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);

  const generateSecret = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/2fa/generate', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setQrCode(data.qrCode);
        setSecret(data.manualEntryKey);
      } else {
        setError(data.error || 'Failed to generate 2FA secret');
        onNotify('danger', data.error || 'Failed to generate 2FA secret');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate 2FA secret');
      onNotify('danger', err.message || 'Failed to generate 2FA secret');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secret,
          token: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Update local state
        await updateSettings({ twoFactorEnabled: true });
        onNotify('success', 'Two-factor authentication enabled');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Invalid verification code. Please try again.');
        onNotify('danger', data.error || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
      onNotify('danger', err.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Enable Two-Factor Authentication</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : qrCode ? (
            <>
              <div className="text-sm text-gray-600 space-y-3">
                <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
                
                <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>

                <div className="space-y-2">
                  <p className="font-medium">Or enter this code manually:</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border">
                    <code className="flex-1 font-mono text-sm break-all">{secret}</code>
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium mb-2">
                    Enter verification code from your app:
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setError(null);
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verificationCode.length !== 6 || isVerifying}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-red-600">{error || 'Failed to load QR code'}</p>
              <button
                onClick={generateSecret}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

