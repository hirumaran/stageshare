import { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import {
  CLIO_DOT_WORDMARK_WIDTH,
  ClioDotWordmark,
} from '@/components/ClioDotWordmark';

type ClioBootAnimationProps = {
  onFinish: () => void;
};

const { width } = Dimensions.get('window');

export function ClioBootAnimation({ onFinish }: ClioBootAnimationProps) {
  const singleDotScale = useSharedValue(0);
  const singleDotOpacity = useSharedValue(1);
  const screenOpacity = useSharedValue(1);

  useEffect(() => {
    singleDotScale.value = withSequence(
      withSpring(1, {
        damping: 9,
        stiffness: 180,
      }),
      withDelay(
        220,
        withTiming(0, {
          duration: 160,
          easing: Easing.out(Easing.quad),
        })
      )
    );

    singleDotOpacity.value = withDelay(
      330,
      withTiming(0, {
        duration: 120,
      })
    );

    screenOpacity.value = withDelay(
      1620,
      withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.quad),
      })
    );

    const timer = setTimeout(() => {
      onFinish();
    }, 1980);

    return () => clearTimeout(timer);
  }, [onFinish, screenOpacity, singleDotOpacity, singleDotScale]);

  const singleDotStyle = useAnimatedStyle(() => ({
    opacity: singleDotOpacity.value,
    transform: [{ scale: singleDotScale.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <Animated.View style={[styles.singleDot, singleDotStyle]} />

      <ClioDotWordmark
        style={[
          styles.logoWrap,
          {
            left: width / 2 - CLIO_DOT_WORDMARK_WIDTH / 2,
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flex: 1,
    justifyContent: 'center',
    zIndex: 9999,
  },
  singleDot: {
    backgroundColor: '#000000',
    borderRadius: 8,
    height: 16,
    width: 16,
  },
  logoWrap: {
    position: 'absolute',
    top: '43%',
  },
});
