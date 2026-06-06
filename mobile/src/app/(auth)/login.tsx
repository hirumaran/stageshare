import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores';
import {
  AuthButton,
  AuthErrorText,
  AuthHeading,
  AuthInput,
  AuthSubtext,
  LogoBlock,
  authSharedStyles,
  useAuthTheme,
} from '@/components/auth/auth-ui';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { scheme, theme } = useAuthTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Redirect authenticated users away from login
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/catalogue');
    }
  }, [isAuthenticated, router]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password) {
      setLocalError('Enter an email and password.');
      return;
    }

    setLocalError(null);
    clearError();
    const didLogin = await login(email.trim(), password);
    if (!didLogin) {
      setPassword('');
    }
  }, [email, password, login, clearError]);

  const errorText = localError || storeError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[authSharedStyles.flex, { backgroundColor: theme.canvas }]}
    >
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[authSharedStyles.flex, { backgroundColor: theme.canvas }]}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <LogoBlock style={styles.logo} theme={theme} />

          <AuthHeading theme={theme}>Log in</AuthHeading>
          <AuthSubtext theme={theme}>
            Enter your email and password to continue
          </AuthSubtext>

          <View style={styles.form}>
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={Boolean(errorText)}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setLocalError(null);
                clearError();
              }}
              placeholder="Email address"
              returnKeyType="next"
              textContentType="emailAddress"
              theme={theme}
              value={email}
            />
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              error={Boolean(errorText)}
              onChangeText={(value) => {
                setPassword(value);
                setLocalError(null);
                clearError();
              }}
              onSubmitEditing={handleLogin}
              placeholder="Password"
              returnKeyType="go"
              secureTextEntry
              textContentType="password"
              theme={theme}
              value={password}
            />

            {errorText ? (
              <AuthErrorText theme={theme}>{errorText}</AuthErrorText>
            ) : null}

            <AuthButton
              loading={isLoading}
              onPress={handleLogin}
              style={styles.primaryAction}
              theme={theme}
              title="Continue"
            />
          </View>

          <Text style={[styles.switchText, { color: theme.textSec }]}>
            {"Don't have an account? "}
            <Text
              onPress={() => router.replace('/register')}
              style={{ color: theme.link }}
            >
              Sign up
            </Text>
          </Text>

          <AuthButton
            onPress={() => router.replace('/(auth)')}
            style={styles.backButton}
            theme={theme}
            title="Back to sign in options"
            variant="ghost"
          />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 48,
    paddingHorizontal: 24,
    paddingTop: 58,
  },
  logo: {
    marginBottom: 54,
  },
  form: {
    gap: 14,
  },
  primaryAction: {
    marginTop: 18,
  },
  switchText: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 22,
    marginTop: 28,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
  },
});
