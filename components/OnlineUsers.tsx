import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Users } from 'lucide-react-native';

interface OnlineUsersProps {
  count: number;
}

export default function OnlineUsers({ count }: OnlineUsersProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          { transform: [{ scale: pulseAnim }] },
        ]}
      />
      <Users size={16} color="#4ECDC4" />
      <Text style={styles.text}>
        <Text style={styles.count}>{count.toLocaleString()}</Text> online
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  text: {
    color: '#4ECDC4',
    fontSize: 13,
    fontWeight: '500',
  },
  count: {
    fontWeight: 'bold',
  },
});
