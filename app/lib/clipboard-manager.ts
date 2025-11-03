'use client';

let clipboardTimeout: ReturnType<typeof setTimeout> | null = null;
let lastCopiedText: string = '';

export function copyToClipboardWithAutoClear(
  text: string,
  clearAfterSeconds: number
): Promise<void> {
  // Clear any existing timeout
  if (clipboardTimeout) {
    clearTimeout(clipboardTimeout);
    clipboardTimeout = null;
  }

  // Store the text we're copying
  lastCopiedText = text;

  return navigator.clipboard.writeText(text).then(() => {
    // Set new timeout to clear clipboard
    clipboardTimeout = setTimeout(() => {
      // Clear clipboard by copying empty string
      // Note: Some browsers may require additional permissions
      navigator.clipboard.writeText(' ').then(() => {
        // Immediately clear with empty string
        navigator.clipboard.writeText('').catch(() => {
          // Fallback: Try copying a single space if empty string fails
          console.warn('Could not fully clear clipboard - some browsers restrict this');
        });
      }).catch(() => {
        // If clipboard API fails, log warning but don't crash
        console.warn('Failed to clear clipboard - may require additional permissions');
      });
      clipboardTimeout = null;
      lastCopiedText = '';
    }, clearAfterSeconds * 1000);
  }).catch((err) => {
    console.error('Failed to copy to clipboard:', err);
    throw err;
  });
}

export function clearClipboardTimeout() {
  if (clipboardTimeout) {
    clearTimeout(clipboardTimeout);
    clipboardTimeout = null;
  }
  lastCopiedText = '';
}

