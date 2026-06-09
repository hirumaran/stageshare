import { useEffect, useState } from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { useFonts } from 'expo-font';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type IntroLogoTypewriterProps = {
  onFinish: () => void;
};

const WORD = 'Clio';
const TYPE_DELAY_MS = 120;
const LETTER_DELAY_MS = 115;
const HOLD_DELAY_MS = 520;
const FADE_DURATION_MS = 260;
const CLIO_FONT_WEIGHT = '360' as unknown as TextStyle['fontWeight'];

export function IntroLogoTypewriter({ onFinish }: IntroLogoTypewriterProps) {
  const [visibleLetters, setVisibleLetters] = useState(0);
  const overlayOpacity = useSharedValue(1);
  const [fontsLoaded] = useFonts({
    BitcountSingle: require('../../assets/fonts/BitcountSingle-Variable.ttf'),
  });

  useEffect(() => {
    console.log('[intro-typewriter] mounted — typing Clio once');

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let index = 1; index <= WORD.length; index += 1) {
      timers.push(
        setTimeout(() => {
          console.log('[intro-typewriter] visible letters:', index);
          setVisibleLetters(index);
        }, TYPE_DELAY_MS + index * LETTER_DELAY_MS)
      );
    }

    timers.push(
      setTimeout(() => {
        console.log('[intro-typewriter] fade started');
        overlayOpacity.value = withTiming(0, {
          duration: FADE_DURATION_MS,
          easing: Easing.out(Easing.quad),
        });
      }, TYPE_DELAY_MS + WORD.length * LETTER_DELAY_MS + HOLD_DELAY_MS)
    );

    timers.push(
      setTimeout(
        () => {
          console.log('[intro-typewriter] finish timer fired');
          onFinish();
        },
        TYPE_DELAY_MS +
          WORD.length * LETTER_DELAY_MS +
          HOLD_DELAY_MS +
          FADE_DURATION_MS
      )
    );

    return () => {
      console.log('[intro-typewriter] unmounting — clearing timers');
      timers.forEach(clearTimeout);
    };
  }, [onFinish, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wordmarkCover, overlayStyle]}
    >
      <Text
        accessibilityLabel="Clio"
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[
          styles.wordmark,
          fontsLoaded ? styles.bitcountSingle : null,
        ]}
      >
        {WORD.slice(0, visibleLetters)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wordmarkCover: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    height: 112,
    justifyContent: 'center',
    left: 0,
    paddingHorizontal: 28,
    position: 'absolute',
    right: 0,
    top: '34.5%',
    zIndex: 30,
  },
  bitcountSingle: {
    fontFamily: 'BitcountSingle',
  },
  wordmark: {
    color: '#000000',
    fontSize: 96,
    fontWeight: CLIO_FONT_WEIGHT,
    letterSpacing: 5,
    lineHeight: 112,
    maxWidth: '92%',
    minWidth: 0,
    textAlign: 'center',
  },
});
