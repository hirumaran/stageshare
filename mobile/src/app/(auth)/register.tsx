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
  TermsLinks,
  authSharedStyles,
  useAuthTheme,
} from '@/components/auth/auth-ui';

export default function RegisterScreen() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { scheme, theme } = useAuthTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)/catalogue');
    }
  }, [isAuthenticated, router]);

  const handleSignup = useCallback(async () => {
    if (!fullName.trim()) {
      setLocalError('Enter your full name.');
      return;
    }
    if (!email.trim()) {
      setLocalError('Enter your email address.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLocalError(null);
    clearError();
    await signup(email.trim(), password, fullName.trim());
  }, [fullName, email, password, signup, clearError]);

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

          <AuthHeading theme={theme}>Create an account</AuthHeading>
          <AuthSubtext theme={theme}>
            Set up your Skēnē account to continue
          </AuthSubtext>

          <View style={styles.form}>
            <AuthInput
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
              error={Boolean(errorText)}
              onChangeText={(value) => {
                setFullName(value);
                setLocalError(null);
                clearError();
              }}
              placeholder="Full name"
              returnKeyType="next"
              textContentType="name"
              theme={theme}
              value={fullName}
            />
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
              onSubmitEditing={handleSignup}
              placeholder="Password"
              returnKeyType="go"
              secureTextEntry
              textContentType="newPassword"
              theme={theme}
              value={password}
            />

            {errorText ? (
              <AuthErrorText theme={theme}>{errorText}</AuthErrorText>
            ) : null}

            <AuthButton
              loading={isLoading}
              onPress={handleSignup}
              style={styles.primaryAction}
              theme={theme}
              title="Continue"
            />
          </View>

          <Text style={[styles.switchText, { color: theme.textSec }]}>
            Already have an account?{' '}
            <Text
              onPress={() => router.replace('/login')}
              style={{ color: theme.link }}
            >
              Log in
            </Text>
          </Text>

          <View style={styles.termsWrap}>
            <Text style={[styles.agreementText, { color: theme.textSec }]}>
              By tapping Continue, you agree to our terms and privacy policy.
            </Text>
            <TermsLinks theme={theme} />
          </View>

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
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 46,
  },
  logo: {
    marginBottom: 46,
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
  termsWrap: {
    gap: 12,
    marginTop: 24,
  },
  agreementText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 10,
  },
});
