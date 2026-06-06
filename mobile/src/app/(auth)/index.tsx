import { useEffect, useMemo } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores';
import { authSharedStyles } from '@/components/auth/auth-ui';

const DOTS = Array.from({ length: 96 }, (_, index) => {
  const column = index % 12;
  const row = Math.floor(index / 12);

  return {
    left: `${column * 9 - 3 + ((row % 2) * 3)}%` as DimensionValue,
    opacity: 0.06 + ((index % 4) * 0.018),
    size: 2 + (index % 3),
    top: `${row * 10 - 8}%` as DimensionValue,
  };
});

function AnimatedDottedGlow() {
  const motion = useMemo(() => new Animated.Value(0), []);
  const dots = useMemo(() => DOTS, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(motion, {
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(motion, {
          duration: 9000,
          easing: Easing.inOut(Easing.quad),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [motion]);

  const glowScale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const glowTranslateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });
  const dotTranslateX = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });
  const dotTranslateY = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.softGlow,
          {
            transform: [
              { translateY: glowTranslateY },
              { scale: glowScale },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.goldCore,
          {
            transform: [
              { translateY: glowTranslateY },
              { scale: glowScale },
            ],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.dotLayer,
          {
            transform: [
              { translateX: dotTranslateX },
              { translateY: dotTranslateY },
            ],
          },
        ]}
      >
        {dots.map((dot, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                height: dot.size,
                left: dot.left,
                opacity: dot.opacity,
                top: dot.top,
                width: dot.size,
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function CloseButton() {
  return (
    <Pressable
      accessibilityLabel="Close"
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => {}}
      style={({ pressed }) => [
        styles.closeButton,
        pressed ? styles.pressed : null,
      ]}
    >
      <Text style={styles.closeIcon}>×</Text>
    </Pressable>
  );
}

function SkeneWordmark() {
  return (
    <View style={styles.skeneWordmarkWrap}>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={styles.skeneWordmark}
      >
        Skēnē
      </Text>
    </View>
  );
}

function SheetButton({
  icon,
  iconColor,
  label,
  onPress,
  textColor,
  variant,
}: {
  icon?: string;
  iconColor?: string;
  label: string;
  onPress: () => void;
  textColor: string;
  variant: 'apple' | 'dark' | 'link';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.sheetButton,
        variant === 'apple' ? styles.appleButton : null,
        variant === 'dark' ? styles.darkButton : null,
        variant === 'link' ? styles.linkButton : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon ? (
        <Text style={[styles.sheetButtonIcon, { color: iconColor ?? textColor }]}>
          {icon}
        </Text>
      ) : null}
      <Text
        style={[
          styles.sheetButtonLabel,
          variant === 'link' ? styles.linkButtonLabel : null,
          { color: textColor },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function AuthLandingScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect authenticated users away from auth landing
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/catalogue');
    }
  }, [isAuthenticated, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={authSharedStyles.flex}
    >
      <StatusBar style="dark" />
      <View style={styles.root}>
        <AnimatedDottedGlow />

        <View style={styles.statementArea}>
          <SkeneWordmark />
        </View>

        <View style={styles.sheet}>
          <SheetButton
            icon=""
            label="Continue with Apple"
            onPress={() => {}}
            textColor={LAUNCH_COLORS.black}
            variant="apple"
          />
          <SheetButton
            icon="G"
            iconColor={LAUNCH_COLORS.google}
            label="Continue with Google"
            onPress={() => {}}
            textColor={LAUNCH_COLORS.white}
            variant="dark"
          />
          <SheetButton
            label="Sign up"
            onPress={() => router.push('/register')}
            textColor={LAUNCH_COLORS.white}
            variant="dark"
          />
          <SheetButton
            label="Log in"
            onPress={() => router.push('/login')}
            textColor={LAUNCH_COLORS.loginText}
            variant="link"
          />
          <View style={styles.homeIndicator} />
        </View>

        <CloseButton />
      </View>
    </KeyboardAvoidingView>
  );
}

const LAUNCH_COLORS = {
  black: '#000000',
  closeFill: '#e5e5e5',
  closeIcon: '#808080',
  darkButton: '#2c2c2e',
  dot: '#1d1d1f',
  glow: 'rgba(255, 249, 145, 0.52)',
  glowCore: 'rgba(234, 179, 8, 0.18)',
  google: '#4285f4',
  loginText: '#d8d8d8',
  outline: '#1f1f22',
  white: '#ffffff',
} as const;

const styles = StyleSheet.create({
  root: {
    backgroundColor: LAUNCH_COLORS.white,
    flex: 1,
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  softGlow: {
    backgroundColor: LAUNCH_COLORS.glow,
    borderRadius: 360,
    height: 720,
    left: -120,
    position: 'absolute',
    right: -120,
    top: 64,
  },
  goldCore: {
    alignSelf: 'center',
    backgroundColor: LAUNCH_COLORS.glowCore,
    borderRadius: 180,
    height: 360,
    position: 'absolute',
    top: 190,
    width: 360,
  },
  dotLayer: {
    bottom: 0,
    left: -30,
    opacity: 1,
    position: 'absolute',
    right: -30,
    top: 0,
  },
  dot: {
    backgroundColor: LAUNCH_COLORS.dot,
    borderRadius: 999,
    position: 'absolute',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: LAUNCH_COLORS.closeFill,
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    left: '79%',
    position: 'absolute',
    top: 76,
    width: 44,
    zIndex: 30,
  },
  closeIcon: {
    color: LAUNCH_COLORS.closeIcon,
    fontSize: 36,
    fontWeight: '600',
    lineHeight: 38,
    marginTop: -5,
  },
  pressed: {
    opacity: 0.72,
  },
  statementArea: {
    alignItems: 'center',
    left: 0,
    maxWidth: '100%',
    overflow: 'hidden',
    paddingHorizontal: 28,
    position: 'absolute',
    right: 0,
    top: '47%',
    zIndex: 5,
  },
  skeneWordmarkWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: '100%',
    width: '100%',
  },
  skeneWordmark: {
    color: LAUNCH_COLORS.black,
    flexShrink: 1,
    fontSize: 58,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 66,
    maxWidth: 260,
    minWidth: 0,
  },
  sheet: {
    backgroundColor: LAUNCH_COLORS.black,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    bottom: 0,
    gap: 12,
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 30,
    paddingTop: 34,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  sheetButton: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 10,
    height: 50,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  appleButton: {
    backgroundColor: LAUNCH_COLORS.white,
  },
  darkButton: {
    backgroundColor: LAUNCH_COLORS.darkButton,
  },
  linkButton: {
    backgroundColor: 'transparent',
    height: 44,
  },
  sheetButtonIcon: {
    fontSize: 23,
    fontWeight: '700',
    lineHeight: 28,
  },
  sheetButtonLabel: {
    fontSize: 23,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  linkButtonLabel: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  homeIndicator: {
    alignSelf: 'center',
    backgroundColor: LAUNCH_COLORS.white,
    borderRadius: 999,
    height: 5,
    marginBottom: 0,
    marginTop: 8,
    width: 150,
  },
});
