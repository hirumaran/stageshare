import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  AUTH_COLORS,
  AuthScreen,
  BackButton,
  EyeButton,
  FloatingInput,
  InlineError,
  OrDivider,
  PrimaryButton,
  SsoButton,
} from '@/components/AuthFlowPrimitives';
import { useAuthStore } from '@/stores';

const MAIN_ROUTE = '/(tabs)/catalogue';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(MAIN_ROUTE);
    }
  }, [isAuthenticated, router]);

  const clearFieldErrors = useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/');
  }, [router]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setLocalError('Enter an email and password.');
      return;
    }

    setLocalError(null);
    clearError();

    const didLogin = await login(email.trim(), password);

    if (didLogin) {
      router.replace(MAIN_ROUTE);
      return;
    }

    setPassword('');
  }, [clearError, email, login, password, router]);

  const errorText = localError || storeError;
  const canSubmit = email.trim().length > 0 && password.length > 0;

  return (
    <AuthScreen contentStyle={styles.content}>
      <BackButton onPress={handleBack} />
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Welcome back</Text>
      </View>

      <View style={styles.stack}>
        <FloatingInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          error={Boolean(errorText)}
          inputMode="email"
          keyboardType="email-address"
          label="Email address"
          onChangeText={(value) => {
            setEmail(value);
            clearFieldErrors();
          }}
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <FloatingInput
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          error={Boolean(errorText)}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            clearFieldErrors();
          }}
          onSubmitEditing={handleLogin}
          returnKeyType="go"
          rightElement={
            <EyeButton
              isVisible={isPasswordVisible}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
            />
          }
          secureTextEntry={!isPasswordVisible}
          shellStyle={styles.passwordInput}
          textContentType="password"
          value={password}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {}}
          style={styles.forgotButton}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>
        <PrimaryButton
          disabled={!canSubmit}
          loading={isLoading}
          onPress={handleLogin}
          title="Continue"
        />
        {errorText ? <InlineError>{errorText}</InlineError> : null}
      </View>

      <Text style={styles.switchLine}>
        {"Don't have an account? "}
        <Text
          onPress={() => router.replace('/(auth)/register')}
          style={styles.inlineLink}
        >
          Sign up
        </Text>
      </Text>
      <OrDivider />
      <SsoButton kind="apple" title="Continue with Apple" />
      <SsoButton kind="google" title="Continue with Google" />
      <SsoButton kind="microsoft" title="Continue with Microsoft" />
      <SsoButton kind="phone" title="Continue with phone" />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 18,
  },
  headerBlock: {
    marginBottom: 30,
    marginTop: 42,
  },
  heading: {
    color: AUTH_COLORS.ink,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 36,
    textAlign: 'left',
  },
  stack: {
    gap: 0,
  },
  passwordInput: {
    marginTop: 12,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    paddingTop: 12,
  },
  forgotText: {
    color: AUTH_COLORS.ink2,
    fontSize: 13,
    fontWeight: '400',
  },
  switchLine: {
    color: AUTH_COLORS.ink2,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 20,
    textAlign: 'center',
  },
  inlineLink: {
    color: AUTH_COLORS.ink,
    fontWeight: '600',
  },
});
