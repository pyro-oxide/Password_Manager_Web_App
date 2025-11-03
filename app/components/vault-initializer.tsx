'use client';

import { useEffect } from 'react';
import { useVaultStore } from '../lib/store-db';

export function VaultInitializer() {
  const { initializeDatabase, checkMasterPasswordExists, isLocked } = useVaultStore();

  useEffect(() => {
    // Initialize database on app start
    const init = async () => {
      await initializeDatabase();
      await checkMasterPasswordExists();
    };
    init();
  }, [initializeDatabase, checkMasterPasswordExists]);

  return null;
}

