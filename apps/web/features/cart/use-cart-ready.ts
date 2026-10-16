'use client';

import { useSyncExternalStore } from 'react';
import { useCartStore } from './cart-store';

function subscribe(listener: () => void) {
  if (!useCartStore.persist) return () => undefined;
  const stopHydrating = useCartStore.persist.onHydrate(listener);
  const stopHydrated = useCartStore.persist.onFinishHydration(listener);
  return () => {
    stopHydrating();
    stopHydrated();
  };
}

export function useCartReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => useCartStore.persist?.hasHydrated() ?? true,
    () => false
  );
}
