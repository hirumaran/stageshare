import { useEffect, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '@/stores';
import { authSharedStyles } from '@/components/auth/auth-ui';

const CLIO_FONT_WEIGHT = '360' as unknown as TextStyle['fontWeight'];

function BackgroundEffects() {
  return (
    <View pointerEvents="none" style={styles.backgroundEffects}>
      <View style={[styles.screenGlowEdge, styles.screenGlowTop]} />
      <View style={[styles.screenGlowEdge, styles.screenGlowRight]} />
      <View style={[styles.screenGlowEdge, styles.screenGlowBottom]} />
      <View style={[styles.screenGlowEdge, styles.screenGlowLeft]} />
    </View>
  );
}

function ClioWordmark() {
  const [fontsLoaded] = useFonts({
    BitcountSingle: require('../../../assets/fonts/BitcountSingle-Variable.ttf'),
  });
  const fontStyle = fontsLoaded ? styles.bitcountSingle : null;

  return (
    <View style={styles.clioWordmarkWrap}>
      <Text
        accessibilityLabel="Clio"
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[styles.clioText, styles.clioWordmark, fontStyle]}
      >
        Clio
      </Text>
    </View>
  );
}

function GoogleLogo() {
  return (
    <Svg height={18} viewBox="0 0 18 18" width={18}>
      <Path
        d="M17.64 9.2045c0-.6381-.0573-1.2527-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7932 2.7164v2.2582h2.9073c1.7018-1.5668 2.6823-3.8741 2.6823-6.6155z"
        fill="#4285F4"
      />
      <Path
        d="M9 18c2.43 0 4.4673-.8059 5.9564-2.18l-2.9073-2.2582c-.8059.54-1.8368.8591-3.0491.8591-2.3441 0-4.3282-1.5832-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
        fill="#34A853"
      />
      <Path
        d="M3.964 10.7105c-.18-.54-.2827-1.1168-.2827-1.7105 0-.5936.1027-1.1705.2827-1.7104V4.9577H.9573C.3477 6.1723 0 7.5477 0 9s.3477 2.8277.9573 4.0423l3.0067-2.3318z"
        fill="#FBBC05"
      />
      <Path
        d="M9 3.5791c1.3214 0 2.5077.4541 3.4405 1.3459l2.5814-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9577l3.0067 2.3319C4.6718 5.1623 6.6559 3.5791 9 3.5791z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AuthButton({
  icon,
  label,
  onPress,
  style,
  textColor,
  variant,
}: {
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textColor: string;
  variant: 'apple' | 'dark' | 'outline';
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.authButton,
        variant === 'apple' && styles.appleButton,
        variant === 'dark' && styles.darkButton,
        variant === 'outline' && styles.outlineButton,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View
        style={[
          styles.authButtonContent,
          variant === 'apple' && styles.appleButtonContent,
        ]}
      >
        {icon ? (
          typeof icon === 'string' ? (
            <View style={styles.sheetButtonIconFrame}>
              <Text style={[styles.sheetButtonIcon, { color: textColor }]}>
                {icon}
              </Text>
            </View>
          ) : (
            icon
          )
        ) : null}
        <Text
          style={[
            styles.authButtonLabel,
            variant === 'outline' && styles.outlineButtonLabel,
            { color: textColor },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AuthLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sheetPaddingBottom = Math.max(insets.bottom + 4, 26);

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
        <BackgroundEffects />

        <View style={styles.statementArea}>
          <ClioWordmark />
        </View>

        <View style={[styles.sheet, { paddingBottom: sheetPaddingBottom }]}>
          <AuthButton
            icon=""
            label="Continue with Apple"
            onPress={() => {}}
            textColor={LAUNCH_COLORS.black}
            variant="apple"
          />
          <AuthButton
            icon={<GoogleLogo />}
            label="Continue with Google"
            onPress={() => {}}
            style={styles.authButtonGap}
            textColor={LAUNCH_COLORS.white}
            variant="dark"
          />
          <AuthButton
            label="Sign up"
            onPress={() => router.push('/register')}
            style={styles.authButtonGap}
            textColor={LAUNCH_COLORS.white}
            variant="dark"
          />
          <AuthButton
            label="Log in"
            onPress={() => router.push('/login')}
            style={styles.authButtonGap}
            textColor={LAUNCH_COLORS.loginText}
            variant="outline"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const LAUNCH_COLORS = {
  background: '#ffffff',
  black: '#000000',
  darkButton: '#2c2c2e',
  loginBorder: 'rgba(255, 255, 255, 0.18)',
  loginText: 'rgba(255, 255, 255, 0.75)',
  white: '#ffffff',
} as const;

const styles = StyleSheet.create({
  root: {
    backgroundColor: LAUNCH_COLORS.background,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundEffects: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20,
  },
  statementArea: {
    alignItems: 'center',
    left: 0,
    paddingHorizontal: 28,
    position: 'absolute',
    right: 0,
    top: '34.5%',
    zIndex: 5,
  },
  screenGlowEdge: {
    position: 'absolute',
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
  },
  screenGlowTop: {
    backgroundColor: 'rgba(147, 197, 253, 0.22)',
    height: 1,
    left: 0,
    right: 0,
    shadowColor: '#93c5fd',
    top: 0,
  },
  screenGlowRight: {
    backgroundColor: 'rgba(165, 243, 252, 0.24)',
    bottom: 0,
    right: -1,
    shadowColor: '#67e8f9',
    top: 0,
    width: 1,
  },
  screenGlowBottom: {
    backgroundColor: 'rgba(253, 230, 138, 0.16)',
    bottom: 0,
    height: 1,
    left: 0,
    right: 0,
    shadowColor: '#fde68a',
  },
  screenGlowLeft: {
    backgroundColor: 'rgba(251, 207, 232, 0.2)',
    bottom: 0,
    left: -1,
    shadowColor: '#fbcfe8',
    top: 0,
    width: 1,
  },
  clioWordmarkWrap: {
    alignItems: 'center',
    height: 112,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  bitcountSingle: {
    fontFamily: 'BitcountSingle',
  },
  clioText: {
    fontSize: 96,
    fontWeight: CLIO_FONT_WEIGHT,
    letterSpacing: 5,
    lineHeight: 112,
    maxWidth: '92%',
    minWidth: 0,
    textAlign: 'center',
  },
  clioWordmark: {
    color: LAUNCH_COLORS.black,
  },
  sheet: {
    backgroundColor: LAUNCH_COLORS.black,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    bottom: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 28,
    position: 'absolute',
    right: 0,
    zIndex: 10,
  },
  authButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  authButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  appleButtonContent: {
    transform: [{ translateX: 8 }],
  },
  authButtonGap: {
    marginTop: 10,
  },
  appleButton: {
    backgroundColor: LAUNCH_COLORS.white,
  },
  darkButton: {
    backgroundColor: LAUNCH_COLORS.darkButton,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderColor: LAUNCH_COLORS.loginBorder,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.72,
  },
  sheetButtonIconFrame: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    width: 20,
  },
  sheetButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    includeFontPadding: false,
    lineHeight: 24,
    textAlign: 'center',
    transform: [{ translateY: -1 }],
  },
  authButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  outlineButtonLabel: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
});
