import { createMemo } from 'solid-js';
import { createStore } from 'solid-js/store';
import { daysToMs } from '../devtools/time-utils';

interface EarlyAccessState {
  isEarlyAccess: boolean;
  expiry?: number;
}

const [earlyAccessStore, setEarlyAccessStore] = createStore<EarlyAccessState>({
  isEarlyAccess: import.meta.env.VITE_MAINLINE_PUBLISH !== 'true',
});

export const isEarlyAccess = createMemo(() => earlyAccessStore.isEarlyAccess);
export const earlyAccessExpiry = createMemo(() => earlyAccessStore.expiry);

export const isEarlyAccessExpiryInPast = createMemo(() => {
  if (earlyAccessStore.expiry) {
    return earlyAccessStore.expiry < Date.now();
  }
  return false;
});

export function loadPersistedEarlyAccessInfo() {
  chrome.storage.sync.get('earlyAccess', (result) => {
    if (result.earlyAccess && result.earlyAccess.expiry) {
      setEarlyAccessStore({
        expiry: result.earlyAccess.expiry,
        isEarlyAccess: result.earlyAccess.expiry > Date.now(),
      });
    }
  });
}

export function startTrial() {
  const expiry = Date.now() + daysToMs(7);
  chrome.storage.sync.set({ earlyAccess: { expiry } });
  setEarlyAccessStore({
    isEarlyAccess: true,
    expiry,
  });
}

export function forceEarlyAccess(value: boolean) {
  setEarlyAccessStore('isEarlyAccess', value);
}

export async function checkoutPageLicenseKeyCheck(licenseKey: string) {
  const res = await fetch('https://api.checkoutpage.co/api/v1/license-keys/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      key: licenseKey,
      incrementUses: 'true',
    }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? 'Failed to validate license key.');
  }
  return res.json();
}

export async function activateLicense(
  licenseKey: string,
): Promise<{ success: boolean; message?: string }> {
  if (!licenseKey) {
    return { success: false, message: 'License key cannot be empty' };
  }

  try {
    const { data } = await checkoutPageLicenseKeyCheck(licenseKey);

    if (data.enabled) {
      const expiry = Infinity;
      chrome.storage.sync.set({ earlyAccess: { expiry, key: licenseKey } });
      setEarlyAccessStore({
        isEarlyAccess: true,
        expiry,
      });
      return { success: true };
    } else {
      return { success: false, message: 'Invalid license key' };
    }
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
