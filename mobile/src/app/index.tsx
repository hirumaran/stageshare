import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getConfig } from '@/lib/config';
import { useAuthStore } from '@/stores';

type MeStatus = 'idle' | 'checking' | 'pass' | 'fail';

function useAuthHydrated() {
  return useSyncExternalStore(
    useCallback((onStoreChange) => useAuthStore.persist.onFinishHydration(onStoreChange), []),
    () => useAuthStore.persist.hasHydrated(),
    () => true
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.debugRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.debugLabel}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.debugValue}>
        {value}
      </ThemedText>
    </View>
  );
}

function LoginScreen() {
  const theme = useTheme();
  const login = useAuthStore((state) => state.login);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const backendUrl = getConfig().apiBaseUrl;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isLoading;

  const handleLogin = useCallback(async () => {
    if (!canSubmit) {
      setLocalError('Enter an email and password.');
      return;
    }

    setLocalError(null);
    clearError();
    const didLogin = await login(email.trim(), password);
    if (!didLogin) {
      setPassword('');
    }
  }, [canSubmit, clearError, email, login, password]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardView}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.panel}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Skene auth</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Backend: {backendUrl}
            </ThemedText>
          </View>

          <View style={styles.form}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmail(value);
                setLocalError(null);
                clearError();
              }}
              placeholder="Email"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="next"
              style={[
                styles.input,
                {
                  borderColor: theme.backgroundSelected,
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              textContentType="emailAddress"
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              onChangeText={(value) => {
                setPassword(value);
                setLocalError(null);
                clearError();
              }}
              onSubmitEditing={handleLogin}
              placeholder="Password"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="go"
              secureTextEntry
              style={[
                styles.input,
                {
                  borderColor: theme.backgroundSelected,
                  color: theme.text,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              textContentType="password"
              value={password}
            />

            {(localError || error) && (
              <ThemedText type="small" style={styles.errorText}>
                {localError ?? error}
              </ThemedText>
            )}

            <Pressable
              disabled={!canSubmit}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.primaryButton,
                (!canSubmit || pressed) && styles.primaryButtonDimmed,
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ThemedText type="smallBold" style={styles.primaryButtonText}>
                  Log in
                </ThemedText>
              )}
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function DebugHome({ meStatus, onCheckMe }: { meStatus: MeStatus; onCheckMe: () => void }) {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const backendUrl = getConfig().apiBaseUrl;

  const meStatusLabel = useMemo(() => {
    switch (meStatus) {
      case 'checking':
        return 'checking';
      case 'pass':
        return 'pass';
      case 'fail':
        return 'fail';
      default:
        return 'not run';
    }
  }, [meStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.debugContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}>
        <ThemedView style={styles.panel}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Auth debug</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Backend: {backendUrl}
            </ThemedText>
          </View>

          <ThemedView type="backgroundElement" style={styles.debugBox}>
            <DebugRow label="Name" value={user?.name || 'missing'} />
            <DebugRow label="Email" value={user?.email || 'missing'} />
            <DebugRow label="School" value={user?.schoolName || user?.school || 'missing'} />
            <DebugRow label="Role" value={user?.role || 'missing'} />
            <DebugRow
              label="Tokens exist"
              value={`access: ${token ? 'yes' : 'no'}, refresh: ${refreshToken ? 'yes' : 'no'}`}
            />
            <DebugRow label="/auth/me" value={meStatusLabel} />
          </ThemedView>

          <View style={styles.actions}>
            <Pressable
              disabled={isLoading}
              onPress={onCheckMe}
              style={({ pressed }) => [
                styles.secondaryButton,
                { borderColor: theme.backgroundSelected },
                (isLoading || pressed) && styles.secondaryButtonDimmed,
              ]}>
              <ThemedText type="smallBold">
                {meStatus === 'checking' ? 'Checking...' : 'Check /auth/me'}
              </ThemedText>
            </Pressable>

            <Pressable
              disabled={isLoading}
              onPress={() => {
                void logout();
              }}
              style={({ pressed }) => [
                styles.dangerButton,
                (isLoading || pressed) && styles.primaryButtonDimmed,
              ]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Log out
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function AuthProofScreen() {
  const hasHydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [meStatus, setMeStatus] = useState<MeStatus>('idle');
  const checkedTokenRef = useRef<string | null>(null);

  const checkMe = useCallback(async () => {
    if (!useAuthStore.getState().token) {
      setMeStatus('fail');
      return;
    }

    setMeStatus('checking');
    await useAuthStore.getState().loadUser();

    const current = useAuthStore.getState();
    setMeStatus(current.token && current.isAuthenticated ? 'pass' : 'fail');
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      checkedTokenRef.current = null;
      return;
    }

    if (checkedTokenRef.current === token) return;
    checkedTokenRef.current = token;
    void checkMe();
  }, [checkMe, hasHydrated, token]);

  if (!hasHydrated) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator />
        <ThemedText type="small" themeColor="textSecondary">
          Restoring session
        </ThemedText>
      </ThemedView>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <DebugHome meStatus={meStatus} onCheckMe={checkMe} />;
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  panel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  form: {
    gap: Spacing.three,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    fontSize: 16,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  errorText: {
    color: '#d92d20',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  primaryButtonDimmed: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  debugContent: {
    flexGrow: 1,
  },
  debugBox: {
    borderRadius: Spacing.two,
    gap: Spacing.two,
    padding: Spacing.three,
  },
  debugRow: {
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  debugLabel: {
    textTransform: 'uppercase',
  },
  debugValue: {
    flexShrink: 1,
  },
  actions: {
    gap: Spacing.three,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
  secondaryButtonDimmed: {
    opacity: 0.6,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: '#b42318',
    borderRadius: Spacing.two,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: Spacing.three,
  },
});
