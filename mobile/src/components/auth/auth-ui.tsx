import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  useColorScheme,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export interface AuthTheme {
  canvas: string;
  card: string;
  inputBg: string;
  text: string;
  textSec: string;
  textMuted: string;
  border: string;
  separator: string;
  cta: string;
  ctaLabel: string;
  link: string;
  ghost: string;
  dot: string;
  google: string;
  error: string;
  headingWeight: TextStyle['fontWeight'];
}

export const LIGHT_TOKENS = {
  canvas: '#f5f5f7',
  card: '#ffffff',
  inputBg: '#ffffff',
  text: '#1d1d1f',
  textSec: '#707070',
  textMuted: '#707070',
  border: '#e8e8ed',
  separator: '#e8e8ed',
  cta: '#0071e3',
  ctaLabel: '#ffffff',
  link: '#0066cc',
  ghost: '#1d1d1f',
  dot: '#1d1d1f',
  google: '#4285f4',
  error: '#d70015',
  headingWeight: '700',
} as const satisfies AuthTheme;

export const DARK_TOKENS = {
  canvas: '#08090a',
  card: '#0f1011',
  inputBg: '#0f1011',
  text: '#f7f8f8',
  textSec: '#8a8f98',
  textMuted: '#62666d',
  border: '#23252a',
  separator: '#23252a',
  cta: '#e4f222',
  ctaLabel: '#08090a',
  link: '#5e6ad2',
  ghost: '#62666d',
  dot: '#e4f222',
  google: '#4285f4',
  error: '#ff453a',
  headingWeight: '300',
} as const satisfies AuthTheme;

export function useAuthTheme() {
  const scheme = useColorScheme();
  const resolvedScheme = scheme === 'dark' ? 'dark' : 'light';

  return {
    scheme: resolvedScheme,
    theme: resolvedScheme === 'dark' ? DARK_TOKENS : LIGHT_TOKENS,
  };
}

type AuthButtonVariant = 'primary' | 'outline' | 'ghost';

interface AuthButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  icon?: ReactNode;
  iconColor?: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  theme: AuthTheme;
  title: string;
  variant?: AuthButtonVariant;
}

export function AuthButton({
  disabled = false,
  icon,
  iconColor,
  loading = false,
  style,
  textStyle,
  theme,
  title,
  variant = 'primary',
  ...rest
}: AuthButtonProps) {
  const isDisabled = disabled || loading;
  const labelColor = variant === 'primary' ? theme.ctaLabel : theme.text;
  const ghostLabelColor = variant === 'ghost' ? theme.ghost : labelColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.buttonBase,
        variant === 'primary'
          ? { backgroundColor: theme.cta }
          : null,
        variant === 'outline'
          ? {
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
            }
          : null,
        variant === 'ghost' ? styles.ghostButton : null,
        pressed && !isDisabled ? styles.pressed : null,
        style,
      ]}
      {...rest}
    >
      {icon ? (
        <View style={styles.buttonIcon}>
          {typeof icon === 'string' ? (
            <Text style={[styles.buttonIconText, { color: iconColor ?? ghostLabelColor }]}>
              {icon}
            </Text>
          ) : (
            icon
          )}
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator color={ghostLabelColor} />
      ) : (
        <Text
          style={[
            styles.buttonLabel,
            variant === 'outline' ? styles.outlineButtonLabel : null,
            variant === 'ghost' ? styles.ghostButtonLabel : null,
            { color: ghostLabelColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

interface AuthInputProps extends TextInputProps {
  error?: boolean;
  theme: AuthTheme;
}

export function AuthInput({
  error = false,
  onBlur,
  onFocus,
  placeholder,
  style,
  theme,
  ...rest
}: AuthInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error
    ? theme.error
    : isFocused
      ? theme.cta
      : theme.border;

  return (
    <RNTextInput
      {...rest}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      placeholder={placeholder}
      placeholderTextColor={theme.textMuted}
      selectionColor={theme.cta}
      style={[
        styles.input,
        {
          backgroundColor: theme.inputBg,
          borderColor,
          color: theme.text,
        },
        style,
      ]}
    />
  );
}

export function LogoBlock({
  subtitle,
  theme,
  style,
}: {
  subtitle?: string;
  theme: AuthTheme;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.logoBlock, style]}>
      <View style={[styles.logoDot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.wordmark, { color: theme.text }]}>Skēnē</Text>
      {subtitle ? (
        <Text style={[styles.logoSubtitle, { color: theme.textSec }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function AuthHeading({
  children,
  style,
  theme,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  theme: AuthTheme;
}) {
  return (
    <Text
      style={[
        styles.heading,
        { color: theme.text, fontWeight: theme.headingWeight },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function AuthSubtext({
  children,
  style,
  theme,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  theme: AuthTheme;
}) {
  return (
    <Text style={[styles.subtext, { color: theme.textSec }, style]}>
      {children}
    </Text>
  );
}

export function AuthErrorText({
  children,
  theme,
}: {
  children: ReactNode;
  theme: AuthTheme;
}) {
  return (
    <Text style={[styles.errorText, { color: theme.error }]}>{children}</Text>
  );
}

export function TermsLinks({ theme }: { theme: AuthTheme }) {
  return (
    <Text style={[styles.termsText, { color: theme.textSec }]}>
      <Text style={[styles.underlined, { color: theme.link }]}>Terms of Use</Text>
      <Text>   |   </Text>
      <Text style={[styles.underlined, { color: theme.link }]}>Privacy Policy</Text>
    </Text>
  );
}

export const authSharedStyles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  buttonBase: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 48,
  },
  pressed: {
    opacity: 0.72,
  },
  buttonIcon: {
    left: 20,
    position: 'absolute',
  },
  buttonIconText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  outlineButtonLabel: {
    fontWeight: '500',
  },
  ghostButtonLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 17,
    fontWeight: '400',
    height: 52,
    letterSpacing: -0.1,
    paddingHorizontal: 16,
    width: '100%',
  },
  logoBlock: {
    alignItems: 'center',
  },
  logoDot: {
    borderRadius: 9999,
    height: 7,
    marginBottom: 10,
    width: 7,
  },
  wordmark: {
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginTop: 12,
    textAlign: 'center',
  },
  heading: {
    fontSize: 36,
    letterSpacing: -0.5,
    lineHeight: 43,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
  },
  underlined: {
    textDecorationLine: 'underline',
  },
});
