import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type ClioDotWordmarkProps = {
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
};

const DOT = 13;
const GAP = 9;
const CELL = DOT + GAP;

export const CLIO_DOT_WORDMARK_WIDTH = 22 * CELL;
export const CLIO_DOT_WORDMARK_HEIGHT = 6 * CELL;

type DotPoint = {
  x: number;
  y: number;
  delay: number;
};

function makeDots(
  points: [number, number][],
  baseDelay: number,
  stepDelay: number
): DotPoint[] {
  return points.map(([x, y], index) => ({
    x,
    y,
    delay: baseDelay + index * stepDelay,
  }));
}

const CLIO_DOTS: DotPoint[] = [
  ...makeDots(
    [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 1],
      [4, 3],
      [1, 4],
      [2, 4],
      [3, 4],
    ],
    260,
    18
  ),
  ...makeDots(
    [
      [6, 0],
      [7, 0],
      [8, 0],
      [8, 1],
      [8, 2],
      [8, 3],
      [6, 4],
      [7, 4],
      [8, 4],
      [9, 4],
      [10, 4],
    ],
    430,
    18
  ),
  ...makeDots(
    [
      [12, 2],
      [13, 2],
      [14, 1],
      [14, 2],
      [14, 3],
      [12, 4],
      [13, 4],
      [14, 4],
      [15, 4],
    ],
    610,
    20
  ),
  ...makeDots(
    [
      [18, 1],
      [19, 1],
      [20, 1],
      [17, 2],
      [21, 2],
      [17, 3],
      [21, 3],
      [18, 4],
      [19, 4],
      [20, 4],
    ],
    820,
    18
  ),
  {
    x: 14,
    y: -1,
    delay: 1120,
  },
];

function AnimatedDot({ animate, point }: { animate: boolean; point: DotPoint }) {
  const progress = useSharedValue(animate ? 0 : 1);
  const bounce = useSharedValue(0);
  const isIDot = point.x === 14 && point.y === -1;

  useEffect(() => {
    if (!animate) {
      progress.value = 1;
      bounce.value = 0;
      return;
    }

    progress.value = withDelay(
      point.delay,
      withSpring(1, {
        damping: 10,
        stiffness: 185,
      })
    );

    if (isIDot) {
      bounce.value = withDelay(
        point.delay + 100,
        withSequence(
          withTiming(-11, {
            duration: 110,
            easing: Easing.out(Easing.quad),
          }),
          withSpring(0, {
            damping: 7,
            stiffness: 190,
          })
        )
      );
    }
  }, [animate, bounce, isIDot, point.delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [0.15, 1]),
      },
      {
        translateY: bounce.value,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.logoDot,
        {
          left: point.x * CELL,
          top: point.y * CELL,
        },
        animatedStyle,
      ]}
    />
  );
}

export function ClioDotWordmark({ animate = true, style }: ClioDotWordmarkProps) {
  const logoScale = useSharedValue(animate ? 0.96 : 1);

  useEffect(() => {
    if (!animate) {
      logoScale.value = 1;
      return;
    }

    logoScale.value = withDelay(
      780,
      withSpring(1, {
        damping: 13,
        stiffness: 120,
      })
    );
  }, [animate, logoScale]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.logoWrap, style, logoStyle]}>
      {CLIO_DOTS.map((point, index) => (
        <AnimatedDot
          animate={animate}
          key={`${point.x}-${point.y}-${index}`}
          point={point}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    height: CLIO_DOT_WORDMARK_HEIGHT,
    position: 'relative',
    width: CLIO_DOT_WORDMARK_WIDTH,
  },
  logoDot: {
    backgroundColor: '#000000',
    borderRadius: DOT / 2,
    height: DOT,
    position: 'absolute',
    width: DOT,
  },
});
