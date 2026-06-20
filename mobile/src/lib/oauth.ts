import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from 'expo-auth-session';

import { getConfig } from './config';
import { useAuthStore } from '@/stores/auth-store';

// Required so the auth popup can complete/close (esp. web). Safe no-op on native.
WebBrowser.maybeCompleteAuthSession();

const MICROSOFT_ISSUER = 'https://login.microsoftonline.com/common/v2.0';
const OAUTH_SCOPES = ['openid', 'profile', 'email'];

export type OAuthProvider = 'google' | 'microsoft';

/**
 * Drives Google + Microsoft sign-in via expo-auth-session, hands the resulting
 * OpenID Connect id_token to the backend (POST /auth/oauth), and persists the
 * returned Clio session. Buttons whose client IDs aren't configured report a
 * clear "not configured" message instead of failing opaquely.
 */
export function useOAuthSignIn() {
  const oauth = getConfig().oauth;
  const oauthSignIn = useAuthStore((s) => s.oauthSignIn);
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const googleConfigured = Boolean(
    oauth.googleIosClientId || oauth.googleAndroidClientId || oauth.googleWebClientId
  );
  const microsoftConfigured = Boolean(oauth.microsoftClientId);

  // Google: the provider helper handles the reversed-client-id redirect and
  // returns the id_token directly in the success result params.
  const [googleRequest, , googlePrompt] = Google.useIdTokenAuthRequest({
    iosClientId: oauth.googleIosClientId,
    androidClientId: oauth.googleAndroidClientId,
    webClientId: oauth.googleWebClientId,
    scopes: OAUTH_SCOPES,
  });

  // Microsoft (Azure AD v2): generic OIDC, code + PKCE, exchanged for an id_token.
  const microsoftDiscovery = useAutoDiscovery(MICROSOFT_ISSUER);
  const microsoftRedirectUri = makeRedirectUri({ scheme: 'clio', path: 'oauthredirect' });
  const [microsoftRequest, , microsoftPrompt] = useAuthRequest(
    {
      clientId: oauth.microsoftClientId ?? '',
      scopes: OAUTH_SCOPES,
      redirectUri: microsoftRedirectUri,
    },
    microsoftDiscovery
  );

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    if (!googleConfigured || !googleRequest) {
      setError('Google sign-in isn’t configured yet.');
      return false;
    }
    setBusy('google');
    try {
      const result = await googlePrompt();
      if (result.type !== 'success') return false;
      const idToken = result.params?.id_token;
      if (!idToken) {
        setError('Google did not return an identity token.');
        return false;
      }
      const ok = await oauthSignIn('google', idToken);
      if (!ok) setError(useAuthStore.getState().error ?? 'Google sign-in failed.');
      return ok;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }, [googleConfigured, googlePrompt, googleRequest, oauthSignIn]);

  const signInWithMicrosoft = useCallback(async () => {
    setError(null);
    if (!microsoftConfigured || !microsoftRequest || !microsoftDiscovery) {
      setError('Microsoft sign-in isn’t configured yet.');
      return false;
    }
    setBusy('microsoft');
    try {
      const result = await microsoftPrompt();
      if (result.type !== 'success' || !result.params?.code) return false;
      const tokenResponse = await exchangeCodeAsync(
        {
          clientId: oauth.microsoftClientId as string,
          code: result.params.code,
          redirectUri: microsoftRedirectUri,
          extraParams: microsoftRequest.codeVerifier
            ? { code_verifier: microsoftRequest.codeVerifier }
            : undefined,
        },
        microsoftDiscovery
      );
      const idToken = tokenResponse.idToken;
      if (!idToken) {
        setError('Microsoft did not return an identity token.');
        return false;
      }
      const ok = await oauthSignIn('microsoft', idToken);
      if (!ok) setError(useAuthStore.getState().error ?? 'Microsoft sign-in failed.');
      return ok;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  }, [
    microsoftConfigured,
    microsoftDiscovery,
    microsoftPrompt,
    microsoftRedirectUri,
    microsoftRequest,
    oauth.microsoftClientId,
    oauthSignIn,
  ]);

  return {
    signInWithGoogle,
    signInWithMicrosoft,
    busy,
    error,
    googleConfigured,
    microsoftConfigured,
  };
}
