import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

import {
  AUTH_COLORS,
  AuthScreen,
  BackButton,
  CheckIcon,
  EyeButton,
  FeatureIcon,
  FloatingInput,
  InlineError,
  OrDivider,
  OtpInput,
  PrimaryButton,
  PulseWordmark,
  SsoButton,
} from '@/components/AuthFlowPrimitives';
import { useAuthStore } from '@/stores';
import { apiFetch } from '@/lib/api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAIN_ROUTE = '/(tabs)/catalogue';

type SignupStatus = 'idle' | 'loading' | 'success';

function clampEmail(email: string) {
  return email.length > 32 ? `${email.slice(0, 29)}...` : email;
}

function firstNameFrom(name: string) {
  return name.trim().split(/\s+/)[0] || 'there';
}

function RequirementRow({ met }: { met: boolean }) {
  return (
    <View style={styles.requirementCard}>
      <View style={styles.requirementRow}>
        <CheckIcon met={met} />
        <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
          At least {MIN_PASSWORD_LENGTH} characters
        </Text>
      </View>
    </View>
  );
}

function TermsText() {
  return (
    <Text style={styles.termsText}>
      By tapping Continue, you agree to our{' '}
      <Text style={styles.termsLink}>Terms</Text> and have read our{' '}
      <Text style={styles.termsLink}>Privacy Policy</Text>.
    </Text>
  );
}

function FeatureRow({
  body,
  icon,
  title,
}: {
  body: string;
  icon: 'borrow' | 'box' | 'message';
  title: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <FeatureIcon name={icon} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureBody}>{body}</Text>
      </View>
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

function SmallErrorIcon() {
  return (
    <Svg height={14} viewBox="0 0 14 14" width={14}>
      <Circle
        cx={7}
        cy={7}
        fill="none"
        r={6}
        stroke={AUTH_COLORS.error}
        strokeWidth={1.4}
      />
      <Path
        d="M7 3.9v3.6M7 10.1h.01"
        fill="none"
        stroke={AUTH_COLORS.error}
        strokeLinecap="round"
        strokeWidth={1.5}
      />
    </Svg>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const signup = useAuthStore((state) => state.signup);
  const clearError = useAuthStore((state) => state.clearError);

  const [step, setStep] = useState(0);
  const [transitionDirection, setTransitionDirection] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [resendRemaining, setResendRemaining] = useState(0);
  const [signupStatus, setSignupStatus] = useState<SignupStatus>('idle');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [emailVerifiedToken, setEmailVerifiedToken] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const signupStartedRef = useRef(false);

  const emailIsValid = EMAIL_PATTERN.test(email.trim());
  const passwordIsValid = password.length >= MIN_PASSWORD_LENGTH;
  const otpValue = otpDigits.join('');
  const otpIsComplete = otpValue.length === 6;
  const profileIsValid = fullName.trim().length >= 2 && school.trim().length >= 2;
  const firstName = useMemo(() => firstNameFrom(fullName), [fullName]);

  const goToStep = useCallback(
    (nextStep: number) => {
      const direction = nextStep > step ? 1 : -1;
      setTransitionDirection(direction);
      setStep(nextStep);
    },
    [step]
  );

  const clearFieldErrors = useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  const handleBack = useCallback(() => {
    clearFieldErrors();

    if (step === 0) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace('/');
      return;
    }

    if (signupStatus === 'loading') return;
    goToStep(step - 1);
  }, [clearFieldErrors, goToStep, router, signupStatus, step]);

  const handleEmailContinue = useCallback(() => {
    const normalizedEmail = email.trim();

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setLocalError('Enter a valid email address.');
      return;
    }

    setEmail(normalizedEmail);
    clearFieldErrors();
    goToStep(1);
  }, [clearFieldErrors, email, goToStep]);

  // Requests a fresh verification code. Returns a result rather than throwing so
  // callers can branch on the failure mode (personal email vs rate-limited).
  const requestOtp = useCallback(async (targetEmail: string) => {
    try {
      await apiFetch('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email: targetEmail }),
      });
      return { ok: true as const };
    } catch (err) {
      const e = err as Error & { code?: string };
      return { ok: false as const, message: e.message, code: e.code };
    }
  }, []);

  const handlePasswordContinue = useCallback(async () => {
    if (!passwordIsValid) {
      setLocalError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    clearFieldErrors();
    setIsSendingOtp(true);
    const result = await requestOtp(email.trim());
    setIsSendingOtp(false);

    // An invalid-email rejection means the email itself must change — send the
    // user back to the email step instead of stranding them on the code screen.
    if (!result.ok && result.code === 'invalid_email') {
      setBannerError(result.message ?? 'Please enter a valid email address.');
      goToStep(0);
      return;
    }

    // Any other send failure (rate limit, network): still show the code screen
    // so they can use Resend, but surface why nothing arrived.
    if (!result.ok) {
      setBannerError(result.message ?? 'Could not send a code. Try Resend in a moment.');
    }

    setResendRemaining(30);
    goToStep(2);
  }, [clearFieldErrors, email, goToStep, passwordIsValid, requestOtp]);

  const handleOtpContinue = useCallback(async () => {
    if (!otpIsComplete) {
      setLocalError('Incorrect code');
      setTimeout(() => {
        setOtpDigits(['', '', '', '', '', '']);
        setLocalError(null);
      }, 900);
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otpValue }),
      });
      setEmailVerifiedToken(
        typeof data?.emailVerifiedToken === 'string' ? data.emailVerifiedToken : null
      );
      clearFieldErrors();
      setIsVerifyingOtp(false);
      goToStep(3);
    } catch (err) {
      setIsVerifyingOtp(false);
      // Server returns a human message per failure mode (incorrect / expired /
      // too many attempts); show it directly and clear the boxes to retry.
      setLocalError((err as Error).message || 'Incorrect code');
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [clearFieldErrors, email, goToStep, otpIsComplete, otpValue]);

  const handleProfileContinue = useCallback(() => {
    if (!profileIsValid) {
      setLocalError('Enter your full name and school.');
      return;
    }

    clearFieldErrors();
    goToStep(4);
  }, [clearFieldErrors, goToStep, profileIsValid]);

  const handleResend = useCallback(async () => {
    if (resendRemaining > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    const result = await requestOtp(email.trim());
    setIsSendingOtp(false);
    if (!result.ok) {
      setBannerError(result.message ?? 'Could not resend the code. Try again shortly.');
      return;
    }
    setOtpDigits(['', '', '', '', '', '']);
    setLocalError(null);
    setResendRemaining(30);
  }, [email, isSendingOtp, requestOtp, resendRemaining]);

  useEffect(() => {
    if (step !== 2 || resendRemaining <= 0) return;

    const timer = setInterval(() => {
      setResendRemaining((remaining) => Math.max(remaining - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendRemaining, step]);

  useEffect(() => {
    if (!bannerError) return;

    const timer = setTimeout(() => {
      setBannerError(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [bannerError]);

  useEffect(() => {
    if (step !== 4 || signupStartedRef.current) return;

    let mounted = true;

    async function completeSignup() {
      signupStartedRef.current = true;
      setSignupStatus('loading');

      const created = await signup(
        email.trim(),
        password,
        fullName.trim(),
        emailVerifiedToken ?? undefined
      );

      if (!mounted) return;

      if (!created) {
        const message =
          useAuthStore.getState().error ?? 'Unable to create your account.';
        signupStartedRef.current = false;
        setSignupStatus('idle');
        setBannerError(message);
        setLocalError(null);
        setStep(0);
        return;
      }

      setSignupStatus('success');
    }

    void completeSignup();

    return () => {
      mounted = false;
    };
  }, [email, emailVerifiedToken, fullName, password, signup, step]);

  const renderAppHeader = (heading: string, subheading?: string) => (
    <View style={styles.headerBlock}>
      <Text style={styles.heading}>{heading}</Text>
      {subheading ? (
        <Text style={styles.subheading}>{subheading}</Text>
      ) : null}
    </View>
  );

  const renderEmailStep = () => (
    <>
      {renderAppHeader('Create an account')}
      <View style={styles.stack}>
        <FloatingInput
          autoCapitalize="none"
          autoCorrect={false}
          error={Boolean(localError)}
          inputMode="email"
          keyboardType="email-address"
          label="Email address"
          onChangeText={(value) => {
            setEmail(value);
            clearFieldErrors();
          }}
          onSubmitEditing={handleEmailContinue}
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        {localError ? <InlineError>{localError}</InlineError> : null}
        <PrimaryButton
          disabled={!emailIsValid}
          onPress={handleEmailContinue}
          title="Continue"
        />
      </View>
      <Text style={styles.switchLine}>
        Already have an account?{' '}
        <Text
          onPress={() => router.replace('/(auth)/login')}
          style={styles.inlineLink}
        >
          Log in
        </Text>
      </Text>
      <OrDivider />
      <SsoButton kind="apple" title="Continue with Apple" />
      <SsoButton kind="google" title="Continue with Google" />
      <SsoButton kind="microsoft" title="Continue with Microsoft" />
      <SsoButton kind="phone" title="Continue with phone" />
    </>
  );

  const renderPasswordStep = () => (
    <>
      {renderAppHeader(
        'Create your account',
        'Set your password for Clio to continue'
      )}
      <View style={styles.stack}>
        <FloatingInput
          editable={false}
          label="Email address"
          rightElement={
            <Pressable accessibilityRole="button" onPress={() => goToStep(0)}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          }
          value={email}
        />
        <FloatingInput
          autoCapitalize="none"
          autoCorrect={false}
          error={Boolean(localError)}
          label="Password"
          onChangeText={(value) => {
            setPassword(value);
            clearFieldErrors();
          }}
          onSubmitEditing={handlePasswordContinue}
          returnKeyType="next"
          rightElement={
            <EyeButton
              isVisible={isPasswordVisible}
              onPress={() => setIsPasswordVisible((visible) => !visible)}
            />
          }
          secureTextEntry={!isPasswordVisible}
          textContentType="newPassword"
          value={password}
        />
        {password.length > 0 ? <RequirementRow met={passwordIsValid} /> : null}
        {localError ? <InlineError>{localError}</InlineError> : null}
        <PrimaryButton
          disabled={!passwordIsValid}
          loading={isSendingOtp}
          onPress={handlePasswordContinue}
          title="Continue"
        />
      </View>
      <Text style={styles.switchLine}>
        Already have an account?{' '}
        <Text
          onPress={() => router.replace('/(auth)/login')}
          style={styles.inlineLink}
        >
          Log in
        </Text>
      </Text>
    </>
  );

  const renderVerificationStep = () => (
    <>
      {renderAppHeader(
        'Check your inbox',
        `Enter the verification code we sent to ${clampEmail(email)}`
      )}
      <View style={styles.stack}>
        <OtpInput
          digits={otpDigits}
          error={Boolean(localError)}
          onChange={(nextDigits) => {
            setOtpDigits(nextDigits);
            clearFieldErrors();
          }}
        />
        {localError ? (
          <View style={styles.otpErrorRow}>
            <SmallErrorIcon />
            <InlineError>{localError}</InlineError>
          </View>
        ) : null}
        <PrimaryButton
          disabled={!otpIsComplete}
          loading={isVerifyingOtp}
          onPress={handleOtpContinue}
          title="Continue"
        />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={resendRemaining > 0}
        onPress={handleResend}
        style={styles.resendButton}
      >
        <Text style={styles.resendText}>
          {resendRemaining > 0
            ? `Resend in 0:${String(resendRemaining).padStart(2, '0')}`
            : 'Resend email'}
        </Text>
      </Pressable>
    </>
  );

  const renderProfileStep = () => (
    <>
      {renderAppHeader('Tell us about you')}
      <View style={styles.stack}>
        <FloatingInput
          autoCapitalize="words"
          autoCorrect={false}
          error={Boolean(localError)}
          label="Full name"
          onChangeText={(value) => {
            setFullName(value);
            clearFieldErrors();
          }}
          returnKeyType="next"
          textContentType="name"
          value={fullName}
        />
        <FloatingInput
          autoCapitalize="words"
          autoCorrect={false}
          error={Boolean(localError)}
          label="School"
          onChangeText={(value) => {
            setSchool(value);
            clearFieldErrors();
          }}
          returnKeyType="done"
          value={school}
        />
        <TermsText />
        {localError ? <InlineError>{localError}</InlineError> : null}
        <PrimaryButton
          disabled={!profileIsValid}
          onPress={handleProfileContinue}
          title="Continue"
        />
      </View>
    </>
  );

  const renderWelcomeStep = () => {
    if (signupStatus !== 'success') {
      return (
        <View style={styles.loadingState}>
          <PulseWordmark />
        </View>
      );
    }

    return (
      <>
        {renderAppHeader(
          'Welcome to Clio.',
          `${firstName}'s account is ready.`
        )}
        <View style={styles.features}>
          <FeatureRow
            body="Request costumes, props, scripts, and gear from any BSD school."
            icon="borrow"
            title="Borrow from the district"
          />
          <FeatureRow
            body="Share your inventory and help other theatre programs find what they need."
            icon="box"
            title="List what you have"
          />
          <FeatureRow
            body="Message lending schools and track requests from start to finish."
            icon="message"
            title="Coordinate directly"
          />
        </View>
        <PrimaryButton
          onPress={() => router.replace(MAIN_ROUTE)}
          title="Get started"
        />
      </>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderEmailStep();
      case 1:
        return renderPasswordStep();
      case 2:
        return renderVerificationStep();
      case 3:
        return renderProfileStep();
      default:
        return renderWelcomeStep();
    }
  };

  const enteringAnimation =
    transitionDirection > 0
      ? SlideInRight.duration(250).easing(Easing.out(Easing.quad))
      : SlideInLeft.duration(250).easing(Easing.out(Easing.quad));
  const exitingAnimation =
    transitionDirection > 0
      ? SlideOutLeft.duration(250).easing(Easing.out(Easing.quad))
      : SlideOutRight.duration(250).easing(Easing.out(Easing.quad));

  return (
    <AuthScreen contentStyle={styles.content}>
      {bannerError ? <ErrorBanner message={bannerError} /> : null}
      <BackButton onPress={handleBack} />
      <Animated.View
        entering={enteringAnimation}
        exiting={exitingAnimation}
        key={step}
        style={styles.stepFrame}
      >
        {renderStep()}
      </Animated.View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 18,
  },
  stepFrame: {
    width: '100%',
  },
  headerBlock: {
    marginBottom: 32,
    marginTop: 24,
  },
  heading: {
    color: AUTH_COLORS.ink,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 38,
    textAlign: 'left',
  },
  subheading: {
    color: AUTH_COLORS.ink2,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 6,
    textAlign: 'left',
  },
  stack: {
    gap: 0,
  },
  switchLine: {
    color: AUTH_COLORS.ink2,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    marginTop: 22,
    textAlign: 'center',
  },
  inlineLink: {
    color: AUTH_COLORS.ink,
    fontWeight: '600',
  },
  editText: {
    color: AUTH_COLORS.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  requirementCard: {
    backgroundColor: '#F0EEE9',
    borderRadius: 12,
    marginTop: 12,
    padding: 12,
  },
  requirementRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  requirementText: {
    color: AUTH_COLORS.muted,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  requirementTextMet: {
    color: AUTH_COLORS.success,
  },
  termsText: {
    color: AUTH_COLORS.muted,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: 14,
    textAlign: 'center',
  },
  termsLink: {
    color: AUTH_COLORS.ink,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  resendText: {
    color: AUTH_COLORS.ink,
    fontSize: 15,
    fontWeight: '500',
  },
  otpErrorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 420,
  },
  features: {
    gap: 24,
    marginBottom: 10,
    marginTop: 24,
  },
  featureRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  featureIcon: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    color: AUTH_COLORS.ink,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  featureBody: {
    color: AUTH_COLORS.ink2,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: AUTH_COLORS.ink,
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  errorBannerText: {
    color: AUTH_COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
});
