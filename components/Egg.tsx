import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Animated, StyleSheet, Pressable, Text, Platform } from 'react-native';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { EggType, EGG_CONFIGS } from '@/types/game';

interface EggProps {
  type: EggType;
  progress: number;
  onTap: (x: number, y: number) => void;
  isCracked: boolean;
  isCooldown: boolean;
  isLoser?: boolean;
  testCrackLevel?: number | null;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const getEggGradient = (type: EggType): [string, string] => {
  switch (type) {
    case 'golden':
      return ['#FFD700', '#FFA500'];
    case 'silver':
      return ['#E8E8E8', '#A0A0A0'];
    case 'no-powerup':
      return ['#FFFFFF', '#E0E0E0'];
    case 'company':
      return ['#FF6B6B', '#EE5A5A'];
    case 'business':
      return ['#4ECDC4', '#44B3AB'];
    default:
      return ['#F4A460', '#D2691E'];
  }
};

// Crack SVG paths for different stages
const CRACK_PATHS = {
  stage1: [
    "M 45 80 L 55 95 L 50 110",
    "M 125 70 L 115 85 L 120 100",
  ],
  stage2: [
    "M 45 80 L 55 95 L 50 110 L 60 125",
    "M 125 70 L 115 85 L 120 100 L 110 115",
    "M 80 50 L 85 75 L 75 90",
  ],
  stage3: [
    "M 45 80 L 55 95 L 50 110 L 60 125 L 55 145",
    "M 125 70 L 115 85 L 120 100 L 110 115 L 115 135",
    "M 80 50 L 85 75 L 75 90 L 80 110",
    "M 140 140 L 125 155 L 135 170",
  ],
  stage4: [
    "M 45 80 L 55 95 L 50 110 L 60 125 L 55 145 L 65 165",
    "M 125 70 L 115 85 L 120 100 L 110 115 L 115 135 L 105 155",
    "M 80 50 L 85 75 L 75 90 L 80 110 L 70 130",
    "M 140 140 L 125 155 L 135 170 L 120 185",
    "M 35 130 L 50 145 L 40 165",
    "M 90 25 L 95 50 L 85 70",
  ],
  broken: [
    // Main crack lines
    "M 30 70 L 50 90 L 40 120 L 60 140 L 45 170",
    "M 150 60 L 130 85 L 145 110 L 125 135 L 140 160",
    "M 90 30 L 95 60 L 80 85 L 90 110 L 75 140",
    "M 20 110 L 40 125 L 30 150 L 55 170",
    "M 160 120 L 140 140 L 155 165",
    // Extra fragments
    "M 60 50 L 75 70 L 65 85",
    "M 120 45 L 110 70 L 125 85",
  ],
};

// Fragment paths for shattered egg effect
const FRAGMENT_PATHS = [
  { d: "M 30 70 L 50 90 L 40 120 Z", fill: "url(#eggGradient)", opacity: 0.9 },
  { d: "M 50 90 L 60 140 L 40 120 Z", fill: "url(#eggGradient)", opacity: 0.85 },
  { d: "M 150 60 L 130 85 L 145 110 Z", fill: "url(#eggGradient)", opacity: 0.9 },
  { d: "M 130 85 L 125 135 L 145 110 Z", fill: "url(#eggGradient)", opacity: 0.85 },
  { d: "M 90 30 L 95 60 L 80 85 Z", fill: "url(#eggGradient)", opacity: 0.9 },
  { d: "M 95 60 L 90 110 L 80 85 Z", fill: "url(#eggGradient)", opacity: 0.85 },
];

export default function EggComponent({ 
  type, 
  progress, 
  onTap, 
  isCracked, 
  isCooldown,
  isLoser = false,
  testCrackLevel = null,
}: EggProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastAnimAtRef = useRef(0);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  
  // Fragment animations for broken state
  const fragmentAnims = useRef(FRAGMENT_PATHS.map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0),
  }))).current;

  const effectiveProgress = testCrackLevel !== null ? testCrackLevel : progress;
  const isBroken = isCracked || effectiveProgress >= 100;
  const [showYolk, setShowYolk] = useState(isBroken);
  const prevBrokenRef = useRef(isBroken);

  // fragmentAnims ref is stable for the component lifetime
  useEffect(() => {
    if (isBroken && !prevBrokenRef.current) {
      setShowYolk(true);
      fragmentAnims.forEach((anim, i) => {
        const direction = i % 2 === 0 ? 1 : -1;
        const randomX = (Math.random() * 80 + 40) * direction;
        const randomY = Math.random() * 60 + 40;
        const randomRotate = (Math.random() * 90 - 45) * direction;
        
        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: randomX,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: randomY,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotate, {
            toValue: randomRotate,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (!isBroken && prevBrokenRef.current) {
      setShowYolk(false);
      fragmentAnims.forEach(anim => {
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.rotate.setValue(0);
        anim.opacity.setValue(0);
      });
    }
    prevBrokenRef.current = isBroken;
  }, [isBroken]);

  const handleTap = useCallback(() => {
    onTapRef.current(0, 0);

    const now = Date.now();
    const minAnimGap = Platform.OS === "web" ? 50 : 110;
    if (now - lastAnimAtRef.current < minAnimGap) return;
    lastAnimAtRef.current = now;

    bounceAnim.stopAnimation();
    scaleAnim.stopAnimation();
    bounceAnim.setValue(0);
    scaleAnim.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 0,
          friction: 5,
          tension: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 45,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [bounceAnim, scaleAnim]);

  const [gradientStart, gradientEnd] = getEggGradient(type);
  const config = EGG_CONFIGS[type];

  // Determine crack stage based on progress
  const getCrackStage = () => {
    if (effectiveProgress >= 100 || isCracked) return 'broken';
    if (effectiveProgress >= 70) return 'stage4';
    if (effectiveProgress >= 50) return 'stage3';
    if (effectiveProgress >= 30) return 'stage2';
    if (effectiveProgress >= 10) return 'stage1';
    return null;
  };

  const crackStage = getCrackStage();

  return (
    <Pressable
      onPressIn={handleTap}
      disabled={isCooldown || isCracked}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.eggWrapper,
          {
            transform: [
              { translateY: bounceAnim },
              { translateX: shakeAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={styles.eggContainer}>
          {/* Main Egg or Broken Pieces */}
          {!showYolk ? (
            <LinearGradient
              colors={[gradientStart, gradientEnd]}
              style={[
                styles.eggGradient,
                isLoser && styles.loserEgg,
              ]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
            >
              <Svg width="180" height="220" viewBox="0 0 180 220">
                <Ellipse
                  cx="90"
                  cy="110"
                  rx="85"
                  ry="105"
                  fill={gradientStart}
                />
                
                {/* Shine highlight */}
                <Ellipse
                  cx="70"
                  cy="70"
                  rx="25"
                  ry="35"
                  fill="rgba(255,255,255,0.3)"
                />
                
                {/* Crack lines based on progress */}
                {crackStage && crackStage !== 'broken' && CRACK_PATHS[crackStage].map((path, i) => (
                  <Path
                    key={i}
                    d={path}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                ))}
              </Svg>
            </LinearGradient>
          ) : (
            /* Broken egg with scattered fragments */
            <View style={[styles.eggGradient, styles.brokenEggContainer]}>
              <Svg width="180" height="220" viewBox="0 0 180 220" style={StyleSheet.absoluteFill}>
                {/* Egg white oozing */}
                <Ellipse cx="90" cy="110" rx="70" ry="85" fill="rgba(255,255,255,0.3)" />
                
                {/* Yolk inside */}
                <Circle cx="90" cy="110" r="45" fill="#FFD700" />
                <Circle cx="75" cy="95" r="12" fill="rgba(255,255,255,0.4)" />
              </Svg>
              
              {/* Scattered fragments */}
              {FRAGMENT_PATHS.map((fragment, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.fragment,
                    {
                      transform: [
                        { translateX: fragmentAnims[i].x },
                        { translateY: fragmentAnims[i].y },
                        { rotate: fragmentAnims[i].rotate.interpolate({
                          inputRange: [-100, 100],
                          outputRange: ['-100deg', '100deg'],
                        }) },
                      ],
                      opacity: fragmentAnims[i].opacity,
                    },
                  ]}
                >
                  <Svg width="60" height="60" viewBox="0 0 60 60">
                    <Path
                      d={fragment.d}
                      fill={gradientEnd}
                      stroke="rgba(0,0,0,0.2)"
                      strokeWidth="1"
                    />
                  </Svg>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Loser overlay */}
          {isLoser && (
            <View style={styles.loserOverlay}>
              <Text style={styles.loserEmoji}>😢</Text>
              <Text style={styles.loserText}>So Close!</Text>
            </View>
          )}

          {/* Winner glow */}
          {showYolk && !isLoser && (
            <Animated.View style={styles.yolkGlow}>
              <Text style={styles.yolkEmoji}>🎉</Text>
            </Animated.View>
          )}

          <View style={[styles.glow, { opacity: 0.3 + (effectiveProgress / 200) }]} />
        </View>

        <View style={styles.eggLabel}>
          <Text style={[styles.eggName, isLoser && styles.loserTextStyle]}>{config.name}</Text>
          {type !== 'normal' && type !== 'no-powerup' && (
            <View style={[styles.badge, { backgroundColor: config.color }]}>
              <Text style={styles.badgeText}>{config.frequency}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggWrapper: {
    alignItems: 'center',
  },
  eggContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eggGradient: {
    width: 180,
    height: 220,
    borderRadius: 90,
    overflow: 'hidden',
  },
  brokenEggContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loserEgg: {
    opacity: 0.7,
  },
  loserOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 90,
  },
  loserEmoji: {
    fontSize: 48,
  },
  loserText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  loserTextStyle: {
    opacity: 0.6,
  },
  fragment: {
    position: 'absolute',
    width: 60,
    height: 60,
  },
  yolkGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yolkEmoji: {
    fontSize: 40,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 240,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    transform: [{ scale: 1.1 }],
    zIndex: -1,
  },
  eggLabel: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  eggName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
