# OAuth Sign-In Setup (Google + Microsoft)

The code for "Continue with Google" / "Continue with Microsoft" is fully implemented
(mobile `expo-auth-session` flow → backend `POST /auth/oauth` id-token verification →
Clio session). It is **inert until you register OAuth apps and supply client IDs** —
that registration can only be done in your Google Cloud / Azure accounts.

When a provider's client ID is unset, its button shows a clear
"…isn't configured yet" message (mobile) and the backend returns `501`.

## 1. Google

1. Google Cloud Console → **APIs & Services → Credentials → Create OAuth client ID**.
   Create three clients (so every platform's `aud` is covered):
   - **iOS** — needs the app's bundle identifier (set `expo.ios.bundleIdentifier` in `app.json`).
   - **Android** — needs the package name (`expo.android.package`) + the signing SHA-1.
   - **Web** — used as the `webClientId` / audience.
2. Mobile: put the IDs in `mobile/app.json` → `expo.extra.oauth`
   (`googleIosClientId`, `googleAndroidClientId`, `googleWebClientId`)
   — or set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` etc.
3. Backend: set `GOOGLE_OAUTH_CLIENT_IDS` to **all** of those IDs, comma-separated
   (the verifier accepts any of them as the token audience).

## 2. Microsoft (Azure AD)

1. Azure Portal → **App registrations → New registration**.
2. Add a redirect URI under **Mobile and desktop applications**: `clio://oauthredirect`.
3. Copy the **Application (client) ID**.
4. Mobile: `mobile/app.json` → `expo.extra.oauth.microsoftClientId`
   (or `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`).
5. Backend: `MICROSOFT_OAUTH_CLIENT_ID=<that id>`.

## 3. Build requirement

Expo SDK 56 AuthSession uses the app's native `clio://` scheme (the Expo Go proxy
is gone). Test on a **dev or standalone build** (`npx expo run:ios` / `run:android`
or an EAS dev build) — the buttons will not complete sign-in inside Expo Go.

## 4. Dependencies (already added)

- mobile: `expo-auth-session`, `expo-crypto` (run `npx expo install` if missing)
- backend: `jose` (run `npm install` in `backend/`)
