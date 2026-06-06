import { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuthStore } from '@/stores';
import {
  AuthButton,
  AuthHeading,
  AuthInput,
  AuthSubtext,
  LogoBlock,
  TermsLinks,
  authSharedStyles,
  useAuthTheme,
} from '@/components/auth/auth-ui';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.user?.email);
  const { scheme, theme } = useAuthTheme();
  const [code, setCode] = useState('');

  // If not authenticated, there's nothing to verify; send back to auth landing.
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)');
    }
  }, [isAuthenticated, router]);

  const handleSignOut = useCallback(async () => {
    await logout();
    router.replace('/(auth)');
  }, [logout, router]);

  const handleVerified = useCallback(() => {
    // Placeholder: in the future this would check verification status
    // For now, just go to tabs
    router.replace('/(tabs)/catalogue');
  }, [router]);

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

          <AuthHeading theme={theme}>Check your inbox</AuthHeading>
          <AuthSubtext theme={theme}>
            Enter the verification code we sent to {email ?? 'your email'}.
          </AuthSubtext>

          <View style={styles.form}>
            <AuthInput
              autoCapitalize="none"
              autoCorrect={false}
              inputMode="numeric"
              keyboardType="number-pad"
              maxLength={6}
              onChangeText={setCode}
              onSubmitEditing={handleVerified}
              placeholder="Code"
              returnKeyType="done"
              textContentType="oneTimeCode"
              theme={theme}
              value={code}
            />

            <AuthButton
              onPress={handleVerified}
              style={styles.primaryAction}
              theme={theme}
              title="Continue"
            />
          </View>

          <View style={styles.secondaryActions}>
            <AuthButton
              disabled
              onPress={() => {}}
              theme={theme}
              title="Resend email"
              variant="ghost"
            />
            <AuthButton
              onPress={handleSignOut}
              theme={theme}
              title="Sign out"
              variant="ghost"
            />
          </View>

          <View style={styles.terms}>
            <TermsLinks theme={theme} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 42,
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
  secondaryActions: {
    gap: 0,
    marginTop: 20,
  },
  terms: {
    marginTop: 24,
  },
});
