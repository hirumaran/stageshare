import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Redirect } from 'expo-router';

import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores';

function useAuthHydrated() {
  return useSyncExternalStore(
    useCallback((onStoreChange) => {
      console.log('[startup] subscribing to onFinishHydration');
      const unsub = useAuthStore.persist.onFinishHydration((state) => {
        console.log(
          '[startup] onFinishHydration fired — hasHydrated:',
          useAuthStore.persist.hasHydrated(),
          'isAuthenticated:',
          state?.isAuthenticated
        );
        onStoreChange();
      });
      // Edge case: if hydration already finished before we subscribed
      if (useAuthStore.persist.hasHydrated()) {
        console.log('[startup] already hydrated on mount — firing change immediately');
        onStoreChange();
      }
      return () => {
        console.log('[startup] unsubscribing from onFinishHydration');
        unsub();
      };
    }, []),
    () => useAuthStore.persist.hasHydrated(),
    () => true
  );
}

export default function Index() {
  const hasHydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  // Timeout fallback: app can never hang forever
  useEffect(() => {
    console.log('[startup] index mounted — hasHydrated:', hasHydrated);
    const timer = setTimeout(() => {
      if (!isReady) {
        console.log('[startup] ⏱ timeout fallback triggered — forcing ready');
        setIsReady(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // When hydration finishes, wait a tiny beat so we never flicker the spinner away instantly
  useEffect(() => {
    if (hasHydrated && !isReady) {
      console.log(
        '[startup] hydration done — isAuthenticated:',
        isAuthenticated,
        'token exists:',
        !!useAuthStore.getState().token
      );
      const timer = setTimeout(() => {
        console.log('[startup] setting isReady = true');
        setIsReady(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [hasHydrated, isAuthenticated, isReady]);

  if (!isReady) {
    return <LoadingState message="Starting up..." />;
  }

  if (!isAuthenticated) {
    console.log('[startup] redirecting → /(auth)/login');
    return <Redirect href="/(auth)/login" />;
  }

  console.log('[startup] redirecting → /(tabs)/catalogue');
  return <Redirect href="/(tabs)/catalogue" />;
}
