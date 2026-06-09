import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { IntroBootAnimation } from '@/components/IntroBootAnimation';
import { IntroLogoTypewriter } from '@/components/IntroLogoTypewriter';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores';
import AuthLandingScreen from './(auth)';

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
  const [isIntroBootDone, setIsIntroBootDone] = useState(false);
  const [isLogoTypewriterDone, setIsLogoTypewriterDone] = useState(false);
  const handleIntroBootFinish = useCallback(() => {
    console.log('[startup] intro boot finished — showing logo typewriter');
    setIsIntroBootDone(true);
  }, []);
  const handleLogoTypewriterFinish = useCallback(() => {
    console.log('[startup] logo typewriter finished — landing is static');
    setIsLogoTypewriterDone(true);
  }, []);

  useEffect(() => {
    console.log('[startup] index mounted');
  }, []);

  // Timeout fallback: app can never hang forever
  useEffect(() => {
    if (isReady) {
      return;
    }

    const timer = setTimeout(() => {
      console.log('[startup] ⏱ timeout fallback triggered — forcing ready');
      setIsReady(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [isReady]);

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
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    console.log('[startup] rendering unauth intro host — bootDone:', isIntroBootDone, 'typewriterDone:', isLogoTypewriterDone);
    return (
      <View style={styles.authIntroHost}>
        <AuthLandingScreen />
        {!isIntroBootDone ? (
          <IntroBootAnimation onFinish={handleIntroBootFinish} />
        ) : null}
        {isIntroBootDone && !isLogoTypewriterDone ? (
          <IntroLogoTypewriter onFinish={handleLogoTypewriterFinish} />
        ) : null}
      </View>
    );
  }

  console.log('[startup] redirecting → /(tabs)/catalogue');
  return <Redirect href="/(tabs)/catalogue" />;
}

const styles = StyleSheet.create({
  authIntroHost: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
