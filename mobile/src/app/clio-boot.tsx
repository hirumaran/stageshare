import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { ClioBootAnimation } from '@/components/ClioBootAnimation';
import {
  markFirstSignupBootSeen,
  shouldShowFirstSignupBoot,
} from '@/lib/firstSignupBoot';

const MAIN_APP_ROUTE = '/(tabs)/catalogue';

export default function ClioBootRoute() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkPermission() {
      console.log('[clio-boot-route] checking first-signup boot permission');

      try {
        const allowed = await shouldShowFirstSignupBoot();

        if (!mounted) return;

        console.log('[clio-boot-route] permission result:', allowed);

        if (allowed) {
          setIsAllowed(true);
          setIsChecking(false);
        } else {
          console.log('[clio-boot-route] not allowed — redirecting to main app');
          router.replace(MAIN_APP_ROUTE);
        }
      } catch {
        console.log('[clio-boot-route] permission check failed — redirecting to main app');
        router.replace(MAIN_APP_ROUTE);
      }
    }

    void checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  const handleFinish = useCallback(async () => {
    console.log('[clio-boot-route] boot animation finished — marking seen');

    try {
      await markFirstSignupBootSeen();
    } finally {
      console.log('[clio-boot-route] redirecting to main app');
      router.replace(MAIN_APP_ROUTE);
    }
  }, []);

  if (isChecking || !isAllowed) {
    console.log('[clio-boot-route] rendering fallback — checking:', isChecking, 'allowed:', isAllowed);
    return <View style={styles.fallback} />;
  }

  console.log('[clio-boot-route] rendering ClioBootAnimation');
  return <ClioBootAnimation onFinish={handleFinish} />;
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
});
