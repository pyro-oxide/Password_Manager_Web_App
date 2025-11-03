'use client';

import { useEffect, useRef } from 'react';
import { useVaultStore } from '../lib/store-db';

export function ActivityTracker() {
  const { settings, lock, isLocked } = useVaultStore();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isLocked) {
      // Clear timeout if vault is locked
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const resetTimeout = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout based on settings
      const minutes = settings.autoLockMinutes || 1;
      timeoutRef.current = setTimeout(() => {
        lock();
      }, minutes * 60 * 1000);
    };

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      resetTimeout();
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach((event) => {
      window.addEventListener(event, updateActivity, true);
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, updateActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [settings.autoLockMinutes, lock, isLocked]);

  return null;
}

