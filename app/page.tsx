'use client';

import { useVaultStore } from './lib/store-db';
import { LockedScreen } from './components/locked-screen';
import { Dashboard } from './components/dashboard';
import { LoginPage } from './components/login-page';
import { VaultInitializer } from './components/vault-initializer';

export default function Home() {
  const { isLocked, masterPasswordExists } = useVaultStore();

  // Show login page if no master password is set (first time opening)
  if (!masterPasswordExists) {
    return (
      <>
        <LoginPage />
      </>
    );
  }

  // Show locked screen if vault is locked but master password exists
  // Show dashboard if vault is unlocked
  return (
    <>
      <VaultInitializer />
      {isLocked ? <LockedScreen /> : <Dashboard />}
    </>
  );
}

