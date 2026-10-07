import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CluckySad, EmojiRain } from './CluckyReactions';

interface LoseModalProps {
  visible: boolean;
  onJoinNext: () => void;
}

const PUNS = [
  "Don't cry over cracked eggs! 🥲",
  "Yolk's on someone else! 🍳",
  "Egg-stra close, but no yolk! 😅",
  "Shell shock! Better luck next time! 🐣",
  "That was egg-citing though, right? 😄",
  "Keep your sunny side up! ☀️",
];
const TEARDROPS = ['💧', '🥲', '💔'];

export default function LoseModal({ visible, onJoinNext }: LoseModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [eggCracked, setEggCracked] = useState(false);
  const eggShakeAnim = useRef(new Animated.Value(0)).current;
  const eggScaleAnim = useRef(new Animated.Value(1)).current;
  const prevVisibleRef = useRef(false);
  const [pun, setPun] = useState<string>('');

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setEggCracked(false);
      setPun(PUNS[Math.floor(Math.random() * PUNS.length)]);
      eggShakeAnim.setValue(0);
      eggScaleAnim.setValue(1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }),
      ]).start();
    }
    prevVisibleRef.current = visible;
  }, [visible, fadeAnim, slideAnim, eggShakeAnim, eggScaleAnim]);

  const lockIn = () => {
    if (eggCracked) return;
    setEggCracked(true);
    Animated.sequence([
      Animated.timing(eggShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(eggShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(eggShakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(eggShakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(eggShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      Animated.timing(eggScaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(eggScaleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onJoinNext());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onJoinNext}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient colors={['#4A4A6A', '#2D2D44']} style={styles.gradient}>
            <EmojiRain emojis={TEARDROPS} count={8} height={520} minMs={3800} maxMs={6000} />

            {/* Clucky cries in the corner */}
            <View style={styles.cornerRow}>
              <CluckySad size={112} />
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>Waaah! 😭</Text>
                <Text style={styles.bubbleSub}>so close…</Text>
              </View>
            </View>

            <Text style={styles.title}>So Close! 🥚</Text>
            <Text style={styles.punText}>{pun}</Text>

            <Text style={styles.message}>
              Someone else got the yolk this time, but your next crack could be the winner! 🍀
            </Text>

            <TouchableOpacity style={styles.button} onPress={lockIn} activeOpacity={0.8}>
              <LinearGradient
                colors={eggCracked ? ['#FFD700', '#FFA500'] : ['#4ECDC4', '#44B3AB']}
                style={styles.buttonGradient}
              >
                <Animated.Text style={[styles.eggBtnIcon, { transform: [{ translateX: eggShakeAnim }, { scale: eggScaleAnim }] }]}>
                  {eggCracked ? '🐣' : '🥚'}
                </Animated.Text>
                <Text style={styles.buttonText}>{eggCracked ? 'Next round coming…' : 'Continue'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', maxWidth: 400, borderRadius: 24, overflow: 'hidden' },
  gradient: { padding: 24, alignItems: 'center' },
  cornerRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginLeft: -6 },
  bubble: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 14 },
  bubbleText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  bubbleSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  punText: { fontSize: 14, color: '#FFD700', fontStyle: 'italic', marginBottom: 14, textAlign: 'center' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 22, lineHeight: 20 },
  button: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  eggBtnIcon: { fontSize: 22, marginRight: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
