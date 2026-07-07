import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SIZE = 88;
const STROKE = 4;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Checkmark path inside the circle
const CHECK_PATH = "M28 46 L40 58 L62 34";
const CHECK_LENGTH = 48;

type Props = {
  onAnimationComplete?: () => void;
};

export default function PaymentSuccessCheckmark({ onAnimationComplete }: Props) {
  const circleProgress = useRef(new Animated.Value(0)).current;
  const checkProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    circleProgress.setValue(0);
    checkProgress.setValue(0);

    Animated.sequence([
      Animated.timing(circleProgress, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(checkProgress, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) onAnimationComplete?.();
    });
  }, [circleProgress, checkProgress, onAnimationComplete]);

  const circleDashoffset = circleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const checkDashoffset = checkProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CHECK_LENGTH, 0],
  });

  return (
    <View style={styles.wrap} accessibilityLabel="Payment successful">
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="#22C55E"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={circleDashoffset}
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
        <AnimatedPath
          d={CHECK_PATH}
          stroke="#22C55E"
          strokeWidth={STROKE + 1}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`}
          strokeDashoffset={checkDashoffset}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
});
