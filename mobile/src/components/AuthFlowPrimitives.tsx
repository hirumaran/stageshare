import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export const AUTH_COLORS = {
  bg: '#F7F7F5',
  surface: '#FFFFFF',
  ink: '#0D0D0D',
  ink2: '#6B6860',
  border: '#D1CEC9',
  activeBorder: '#0D0D0D',
  muted: '#9B9891',
  disabledBg: '#C8C5C0',
  disabledText: '#8C8880',
  error: '#C0392B',
  success: '#2C7A4B',
  white: '#FFFFFF',
} as const;

type FloatingInputProps = Omit<TextInputProps, 'style'> & {
  error?: boolean;
  label: string;
  rightElement?: ReactNode;
  shellStyle?: StyleProp<ViewStyle>;
};

type PrimaryButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  title: string;
  style?: StyleProp<ViewStyle>;
};

type OtpInputProps = {
  digits: string[];
  error?: boolean;
  onChange: (digits: string[]) => void;
};

type AuthScreenProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

type FeatureIconName = 'borrow' | 'box' | 'message';
type SsoKind = 'apple' | 'google' | 'microsoft' | 'phone';

const DITHER_CELL = 18;

function hash2d(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function makeDitherPixels(width: number, height: number) {
  const cols = Math.ceil(width / DITHER_CELL) + 1;
  const rows = Math.ceil(height / DITHER_CELL) + 1;

  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const hash = hash2d(col, row);
    const visible = hash > 0.57;
    const size = DITHER_CELL * (0.54 + hash * 0.38);

    return {
      id: `${col}-${row}`,
      hash,
      visible,
      size,
      x: col * DITHER_CELL + (DITHER_CELL - size) / 2,
      y: row * DITHER_CELL + (DITHER_CELL - size) / 2,
    };
  }).filter((pixel) => pixel.visible);
}

export function AuthDitherBackground() {
  const { height, width } = useWindowDimensions();
  const pixels = useMemo(() => makeDitherPixels(width, height), [height, width]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height={height} style={StyleSheet.absoluteFill} width={width}>
        {pixels.map((pixel) => (
          <Rect
            fill={AUTH_COLORS.ink}
            height={pixel.size}
            key={pixel.id}
            opacity={0.035 + pixel.hash * 0.045}
            width={pixel.size}
            x={pixel.x}
            y={pixel.y}
          />
        ))}
      </Svg>
    </View>
  );
}

export function AuthScreen({ children, contentStyle }: AuthScreenProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <StatusBar style="dark" />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <AuthDitherBackground />
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Go back"
      accessibilityRole="button"
      onPress={onPress}
      style={styles.backButton}
    >
      <Svg height={22} viewBox="0 0 24 24" width={22}>
        <Path
          d="M15 5.5 8.5 12 15 18.5"
          fill="none"
          stroke={AUTH_COLORS.ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.2}
        />
      </Svg>
    </Pressable>
  );
}

export function FloatingInput({
  editable = true,
  error = false,
  label,
  onBlur,
  onFocus,
  rightElement,
  shellStyle,
  value,
  ...rest
}: FloatingInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isFloating = isFocused || Boolean(value && value.length > 0);

  const labelStyle = useAnimatedStyle(() => ({
    color: isFloating ? AUTH_COLORS.ink : AUTH_COLORS.muted,
    fontSize: withTiming(isFloating ? 11 : 15, { duration: 150 }),
    transform: [
      {
        translateY: withTiming(isFloating ? 8 : 18, { duration: 150 }),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.inputShell,
        isFocused && styles.inputShellFocused,
        error && styles.inputShellError,
        !editable && styles.inputShellDisabled,
        shellStyle,
      ]}
    >
      <Animated.Text pointerEvents="none" style={[styles.floatingLabel, labelStyle]}>
        {label}
      </Animated.Text>
      <View style={styles.inputRow}>
        <TextInput
          {...rest}
          editable={editable}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholder=""
          selectionColor={AUTH_COLORS.ink}
          style={[styles.textInput, !editable && styles.textInputDisabled]}
          value={value}
        />
        {rightElement ? <View style={styles.inputRight}>{rightElement}</View> : null}
      </View>
    </View>
  );
}

export function PrimaryButton({
  disabled = false,
  loading = false,
  onPress,
  style,
  title,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        isDisabled && styles.primaryButtonDisabled,
        pressed && !isDisabled && styles.primaryButtonPressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={AUTH_COLORS.white} size="small" />
      ) : (
        <Text
          style={[
            styles.primaryButtonText,
            isDisabled && styles.primaryButtonTextDisabled,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function OrDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>OR</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

export function SsoButton({
  kind,
  onPress,
  title,
}: {
  kind: SsoKind;
  onPress?: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress ?? (() => {})}
      style={({ pressed }) => [styles.ssoButton, pressed && styles.pressed]}
    >
      <View style={styles.ssoIcon}>
        {kind === 'apple' ? <AppleIcon /> : null}
        {kind === 'google' ? <GoogleIcon /> : null}
        {kind === 'microsoft' ? <MicrosoftIcon /> : null}
        {kind === 'phone' ? <PhoneIcon /> : null}
      </View>
      <Text style={styles.ssoText}>{title}</Text>
    </Pressable>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 150 });
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text accessibilityRole="alert" style={[styles.inlineError, style]}>
      {children}
    </Animated.Text>
  );
}

export function OtpInput({ digits, error = false, onChange }: OtpInputProps) {
  const refs = useRef<(TextInput | null)[]>([]);

  const setDigit = (index: number, value: string) => {
    const nextDigit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = nextDigit;
    onChange(next);

    if (nextDigit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>
  ) => {
    if (event.nativeEvent.key !== 'Backspace') return;

    if (digits[index]) {
      const next = [...digits];
      next[index] = '';
      onChange(next);
      return;
    }

    if (index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      onChange(next);
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((digit, index) => {
        const isActive = Boolean(digit);

        return (
          <TextInput
            accessibilityLabel={`Verification digit ${index + 1}`}
            autoCorrect={false}
            inputMode="numeric"
            keyboardType="number-pad"
            key={`otp-${index}`}
            maxLength={1}
            onChangeText={(value) => setDigit(index, value)}
            onKeyPress={(event) => handleKeyPress(index, event)}
            ref={(input) => {
              refs.current[index] = input;
            }}
            selectionColor={AUTH_COLORS.ink}
            style={[
              styles.otpBox,
              isActive && styles.otpBoxActive,
              error && styles.otpBoxError,
            ]}
            textContentType="oneTimeCode"
            value={digit}
          />
        );
      })}
    </View>
  );
}

export function EyeButton({
  isVisible,
  onPress,
}: {
  isVisible: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={isVisible ? 'Hide password' : 'Show password'}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.eyeButton}
    >
      <Svg height={24} viewBox="0 0 24 24" width={24}>
        <Path
          d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
          fill="none"
          stroke={AUTH_COLORS.ink}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
        <Circle
          cx={12}
          cy={12}
          fill="none"
          r={3}
          stroke={AUTH_COLORS.ink}
          strokeWidth={1.8}
        />
        {!isVisible ? (
          <Path
            d="M4 20 20 4"
            fill="none"
            stroke={AUTH_COLORS.ink}
            strokeLinecap="round"
            strokeWidth={2}
          />
        ) : null}
      </Svg>
    </Pressable>
  );
}

export function CheckIcon({ met }: { met: boolean }) {
  const color = met ? AUTH_COLORS.success : AUTH_COLORS.muted;

  return (
    <Svg height={18} viewBox="0 0 18 18" width={18}>
      <Circle
        cx={9}
        cy={9}
        fill={met ? color : 'transparent'}
        r={8}
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="m5.2 9.1 2.4 2.4 5.2-5.4"
        fill="none"
        stroke={met ? AUTH_COLORS.white : color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
    </Svg>
  );
}

export function PulseWordmark() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.72, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.pulseWordmark, style]}>
      Clio
    </Animated.Text>
  );
}

export function AppleIcon() {
  return (
    <Svg height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="M16.75 12.73c-.02-2.08 1.7-3.08 1.78-3.13-1-.146-2.56-1.66-4.12-1.68-1.73-.18-3.38 1.02-4.25 1.02-.88 0-2.25-1-3.7-.97-1.9.03-3.66 1.1-4.64 2.8-1.98 3.44-.51 8.53 1.43 11.33.94 1.36 2.06 2.89 3.53 2.83 1.42-.06 1.96-.92 3.68-.92 1.71 0 2.2.92 3.7.89 1.53-.03 2.5-1.38 3.44-2.75 1.08-1.58 1.52-3.11 1.55-3.19-.03-.02-2.97-1.14-3-4.53ZM13.28 6.12c.79-.95 1.32-2.28 1.17-3.6-1.13.05-2.5.75-3.31 1.7-.73.84-1.37 2.2-1.2 3.49 1.26.1 2.55-.64 3.34-1.59Z"
        fill={AUTH_COLORS.ink}
        transform="translate(1 -1.7) scale(.94)"
      />
    </Svg>
  );
}

export function GoogleIcon() {
  return (
    <Svg height={20} viewBox="0 0 18 18" width={20}>
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
        d="M9 3.5791c1.3214 0 2.5077 0.4541 3.4405 1.3459l2.5814-2.5814C13.4632 0.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168 0.9573 4.9577l3.0067 2.3319C4.6718 5.1623 6.6559 3.5791 9 3.5791z"
        fill="#EA4335"
      />
    </Svg>
  );
}

export function MicrosoftIcon() {
  return (
    <Svg height={20} viewBox="0 0 21 21" width={20}>
      <Rect fill="#F25022" height={10} width={10} x={0} y={0} />
      <Rect fill="#7FBA00" height={10} width={10} x={11} y={0} />
      <Rect fill="#00A4EF" height={10} width={10} x={0} y={11} />
      <Rect fill="#FFB900" height={10} width={10} x={11} y={11} />
    </Svg>
  );
}

export function PhoneIcon() {
  return (
    <Svg height={20} viewBox="0 0 20 20" width={20}>
      <Path
        d="M6.15 3.25 8.2 7.75l-1.55 1.4c.98 2.02 2.6 3.65 4.55 4.55l1.42-1.55 4.35 2.12c.3.15.46.49.36.81l-.62 2.12c-.1.34-.42.57-.78.55C8.4 17.33 2.52 11.42 2.18 4.08c-.02-.36.21-.68.55-.78l2.6-.72c.33-.09.68.06.82.37Z"
        fill="none"
        stroke={AUTH_COLORS.ink}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export function FeatureIcon({ name }: { name: FeatureIconName }) {
  if (name === 'borrow') {
    return (
      <Svg height={24} viewBox="0 0 24 24" width={24}>
        <Rect
          fill="none"
          height={10}
          rx={2}
          stroke={AUTH_COLORS.ink}
          strokeWidth={1.8}
          width={12}
          x={4}
          y={5}
        />
        <Rect
          fill="none"
          height={10}
          rx={2}
          stroke={AUTH_COLORS.ink}
          strokeWidth={1.8}
          width={12}
          x={8}
          y={9}
        />
      </Svg>
    );
  }

  if (name === 'box') {
    return (
      <Svg height={24} viewBox="0 0 24 24" width={24}>
        <Path
          d="M4 8.5 12 4l8 4.5v8.8L12 22l-8-4.7V8.5Z"
          fill="none"
          stroke={AUTH_COLORS.ink}
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
        <Path
          d="m4 8.5 8 4.5 8-4.5M12 13v9"
          fill="none"
          stroke={AUTH_COLORS.ink}
          strokeLinejoin="round"
          strokeWidth={1.8}
        />
      </Svg>
    );
  }

  return (
    <Svg height={24} viewBox="0 0 24 24" width={24}>
      <Path
        d="M4 5.5h16v11H9l-5 3v-14Z"
        fill="none"
        stroke={AUTH_COLORS.ink}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: AUTH_COLORS.bg,
    flex: 1,
  },
  safeArea: {
    backgroundColor: AUTH_COLORS.bg,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
    marginLeft: -10,
    width: 44,
  },
  inputShell: {
    backgroundColor: AUTH_COLORS.surface,
    borderColor: AUTH_COLORS.border,
    borderRadius: 100,
    borderWidth: 1.5,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  inputShellFocused: {
    borderColor: AUTH_COLORS.activeBorder,
  },
  inputShellError: {
    borderColor: AUTH_COLORS.error,
  },
  inputShellDisabled: {
    opacity: 0.92,
  },
  floatingLabel: {
    fontWeight: '400',
    left: 18,
    position: 'absolute',
    top: 0,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: '100%',
  },
  textInput: {
    color: AUTH_COLORS.ink,
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    height: '100%',
    includeFontPadding: false,
    paddingBottom: 0,
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  textInputDisabled: {
    color: AUTH_COLORS.ink,
  },
  inputRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.ink,
    borderRadius: 100,
    height: 56,
    justifyContent: 'center',
    marginTop: 16,
    width: '100%',
  },
  primaryButtonDisabled: {
    backgroundColor: AUTH_COLORS.disabledBg,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  primaryButtonText: {
    color: AUTH_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: AUTH_COLORS.disabledText,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    backgroundColor: AUTH_COLORS.border,
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    color: AUTH_COLORS.muted,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  ssoButton: {
    alignItems: 'center',
    backgroundColor: AUTH_COLORS.surface,
    borderColor: AUTH_COLORS.border,
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
  ssoIcon: {
    left: 20,
    position: 'absolute',
  },
  ssoText: {
    color: AUTH_COLORS.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  inlineError: {
    color: AUTH_COLORS.error,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 8,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    backgroundColor: AUTH_COLORS.surface,
    borderColor: AUTH_COLORS.border,
    borderRadius: 12,
    borderWidth: 1.5,
    color: AUTH_COLORS.ink,
    flex: 1,
    fontSize: 22,
    fontWeight: '600',
    height: 58,
    maxWidth: 46,
    padding: 0,
    textAlign: 'center',
  },
  otpBoxActive: {
    borderColor: AUTH_COLORS.activeBorder,
  },
  otpBoxError: {
    borderColor: AUTH_COLORS.error,
  },
  eyeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pulseWordmark: {
    color: AUTH_COLORS.ink,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
});
