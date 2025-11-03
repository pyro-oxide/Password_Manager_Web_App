'use client';

import { Lock, Key } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useVaultStore } from '../lib/store-db';
import { UnlockDialog } from './unlock-dialog';

export function LockedScreen() {
  const [showUnlock, setShowUnlock] = useState(false);
  const isLocked = useVaultStore((state) => state.isLocked);

  // Close dialog when vault is unlocked
  useEffect(() => {
    if (!isLocked) {
      setShowUnlock(false);
    }
  }, [isLocked]);

  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900">
        <Lock className="w-24 h-24 text-white mb-6" />
        <h1 className="text-3xl font-bold text-white mb-8">Vault is Locked</h1>
        <button
          onClick={() => setShowUnlock(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Key className="w-5 h-5" />
          Unlock Vault
        </button>
      </div>
      
      {showUnlock && <UnlockDialog onClose={() => setShowUnlock(false)} />}
    </>
  );
}

