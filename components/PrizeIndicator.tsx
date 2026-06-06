import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Banknote, Ticket, Gift, Building2, Briefcase, Smartphone } from 'lucide-react-native';
import { Prize, EggType } from '@/types/game';

interface PrizeIndicatorProps {
  prize: Prize;
  eggType: EggType;
}

const PRIZE_CONFIGS: Record<string, { 
  icon: React.ReactNode; 
  gradient: [string, string];
  label: string;
}> = {
  airtime: {
    icon: <Smartphone size={18} color="#FFFFFF" />,
    gradient: ['#4ECDC4', '#44B3AB'],
    label: 'Airtime',
  },
  coupon: {
    icon: <Ticket size={18} color="#FFFFFF" />,
    gradient: ['#FF6B6B', '#EE5A5A'],
    label: 'Coupon',
  },
  cash: {
    icon: <Banknote size={18} color="#FFFFFF" />,
    gradient: ['#27AE60', '#229954'],
    label: 'Cash',
  },
  sponsor: {
    icon: <Gift size={18} color="#FFFFFF" />,
    gradient: ['#9B59B6', '#8E44AD'],
    label: 'Prize',
  },
};

const EGG_TYPE_CONFIGS: Record<EggType, { icon: React.ReactNode; color: string; label: string }> = {
  normal: { icon: null, color: '#F4A460', label: 'Normal' },
  'no-powerup': { icon: null, color: '#E8E8E8', label: 'Pure' },
  silver: { icon: null, color: '#C0C0C0', label: 'Silver' },
  golden: { icon: null, color: '#FFD700', label: 'Golden' },
  company: { icon: <Building2 size={14} color="#FFFFFF" />, color: '#FF6B6B', label: 'Company' },
  business: { icon: <Briefcase size={14} color="#FFFFFF" />, color: '#4ECDC4', label: 'Business' },
};

export default function PrizeIndicator({ prize, eggType }: PrizeIndicatorProps) {
  const config = PRIZE_CONFIGS[prize.type] || PRIZE_CONFIGS.sponsor;
  const eggConfig = EGG_TYPE_CONFIGS[eggType];
  const maskedValue =
    prize.type === "airtime" || prize.type === "coupon" || prize.type === "cash"
      ? "*******"
      : "*******";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <View style={styles.iconContainer}>
          {config.icon}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.label}>{config.label}</Text>
          <Text style={styles.value}>{maskedValue}</Text>
        </View>
      </LinearGradient>
      
      {(eggType === 'company' || eggType === 'business') && (
        <View style={[styles.sponsorBadge, { backgroundColor: eggConfig.color }]}>
          {eggConfig.icon}
          <Text style={styles.sponsorText}>{eggConfig.label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  sponsorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
