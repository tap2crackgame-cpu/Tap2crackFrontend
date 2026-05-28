import React, { useState, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { X, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PowerUpType, calculatePowerUpCost } from '@/types/game';

export type PowerUpPanelRef = {
  pressPowerUp: (type: PowerUpType) => void;
  pressWatchAd: () => void;
};

interface PowerUpPanelProps {
  egg: any;
  user: any;

  activePowerUp: { type: PowerUpType; multiplier: number } | null;
  inventoryCounts: Record<string, number>;

  isPaymentLoading: boolean;
  userEmail: string;

  onActivate: (type: PowerUpType) => void;
  onStartPayment?: (payload: {
    type: PowerUpType;
    quantity: number;
    multiplier: 2 | 3;
    amount: number;
  }) => void;

  free2xAvailable: boolean;
  onClaimFree2x?: () => void;

  adWatched2xAvailable: boolean;
  onWatchAd: () => void;

  isHappyHour?: boolean;
  hideInlinePowerActions?: boolean;
  powerUpUsedThisRound?: boolean;
}

const PowerUpPanel = forwardRef<PowerUpPanelRef, PowerUpPanelProps>(
  (props, ref) => {
    const {
      user,
      egg,
      activePowerUp,
      inventoryCounts,
      isPaymentLoading,
      userEmail,
      onActivate,
      onStartPayment,
      onWatchAd,
      hideInlinePowerActions = false,
    } = props;
    console.log("DEBUG PANEL USER:", JSON.stringify(user.PowerUp));

    const [selectedPowerUp, setSelectedPowerUp] =
      useState<PowerUpType | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);

    if (!egg) return null;

    const isNoPowerUpEgg = egg?.egg?.type === 'no-powerup';
    const powerUpUsedThisRound = props.powerUpUsedThisRound;

    const isDisabled =
      isPaymentLoading ||
      powerUpUsedThisRound ||
      isNoPowerUpEgg ||
      !egg?.isActive;

    const cost2x = calculatePowerUpCost(egg?.prize?.value || 0, 2);
    const cost3x = calculatePowerUpCost(egg?.prize?.value || 0, 3);

    const count2x = 
    inventoryCounts?.['2x'] ?? 
    inventoryCounts?.['X2'] ??
    user?.powerUps?.find((item: any) => {
      const t = String(item.type ?? '').toLowerCase();
      return t === '2x' || t === 'x2';
    })?.count ?? 0;

    const count3x = 
    inventoryCounts?.['3x'] ?? 
    inventoryCounts?.['X3'] ??
    user?.powerUps?.find((item: any) => {
      const t = String(item.type ?? '').toLowerCase();
      return t === '3x' || t === 'x3';
    })?.count ?? 0;


    const handlePowerUpPress = (type: PowerUpType) => {
  if (isDisabled) return;

  const is2x = type === '2x' || type === 'X2';
  const currentCount = is2x ? count2x : count3x;
  
  console.log(`⚡ [PANEL CLICK] Type: ${type} | Detected Count: ${currentCount}`);

  if (currentCount > 0) {
    const normalizedType = is2x ? 'X2' : 'X3';
    
    setSelectedPowerUp(normalizedType as PowerUpType);
    
    console.log(`🚀 Triggering active event for type: ${normalizedType}`);
    onActivate(normalizedType as PowerUpType);
  } else {
    const normalizedType = is2x ? 'X2' : 'X3';
    setSelectedPowerUp(normalizedType as PowerUpType);
    setQuantity(1);
    setShowPurchaseModal(true);
  }
};

    const handleWatchAd = () => {
      if (!props.adWatched2xAvailable || isDisabled) return;
      onWatchAd();
    };

    useImperativeHandle(ref, () => ({
      pressPowerUp: handlePowerUpPress,
      pressWatchAd: handleWatchAd,
    }));

    const handlePurchase = () => {
      if (!selectedPowerUp || !onStartPayment) return;
      const is2x =
        selectedPowerUp === '2x' || selectedPowerUp === 'X2';
      const multiplier = is2x ? 2 : 3;
      const unitCost = is2x ? cost2x : cost3x;
      setShowPurchaseModal(false);
      onStartPayment({
        type: selectedPowerUp,
        quantity,
        multiplier,
        amount: unitCost * quantity,
      });
    };

    const getPrizeBgColor = () => {
      switch (egg.prize.type) {
        case 'airtime':
          return ['#4ECDC4', '#44B3AB'];
        case 'coupon':
          return ['#FF6B6B', '#EE5A5A'];
        case 'cash':
          return ['#27AE60', '#229954'];
        default:
          return ['#9B59B6', '#8E44AD'];
      }
    };

    return (
      <View style={styles.container}>
        {/* HEADER */}
        <LinearGradient
          colors={getPrizeBgColor() as [string, string]}
          style={styles.prizeIndicator}
          start={{x:0, y: 0}}
          end={{x:1, y: 0}}
        >
          <Text style={styles.prizeIcon}>🎁</Text>
          <View style={styles.prizeTextContainer}>
            <Text style={styles.prizeLabel}>Current Prize</Text>
           <Text style={styles.prizeValue}>{egg.prize.description}</Text>
          </View>
        </LinearGradient>

        <Text style={styles.title}>
          ⚡ Power-Ups
        </Text>

        {powerUpUsedThisRound && (
          <View style={styles.usedBanner}>
            <Lock size={16} color="#FFD700" />
            <Text style={styles.usedText}>
              Power-up active this round
            </Text>
          </View>
        )}

        {isNoPowerUpEgg ? (
          <View style={styles.noPowerUpBanner}>
            <Text style={styles.noPowerUpText}>🥚 No Power-Ups in this round</Text>
            <Text style={styles.noPowerUpSubtext}>Skill only for this specific egg!</Text>
          </View>
        ) : (
          <>
            {!hideInlinePowerActions && (
              <View style={styles.powerUpRow}>
                {/* 2X */}
                 <TouchableOpacity
            disabled={isDisabled}
            onPress={() => handlePowerUpPress('2x')}
            style={[
              styles.powerUpButton,
              isDisabled && styles.powerUpDisabled,
              (activePowerUp?.type === '2x' 
              || activePowerUp?.type === 'X2')
              && styles.powerUpActive
            ]}
          >
            <LinearGradient
              colors={(activePowerUp?.type === '2x' || activePowerUp?.type === 'X2') ? ['#FFD700', '#FFA500'] : ['#4ECDC4', '#45B7AF']}
              style={styles.powerUpGradient} 
            >
              <Text style={styles.powerUpMultiplier}>2x</Text>
              <Text style={styles.powerUpCost}>₦{cost2x}</Text>
              
              <View style={styles.powerUpInventoryBadge}>
                <Text style={styles.powerUpInventoryBadgeText}>🎟️ {count2x}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

                {/* 3X */}
                  <TouchableOpacity
            disabled={isDisabled}
            onPress={() => handlePowerUpPress('3x')}
            style={[
              styles.powerUpButton,
              isDisabled && styles.powerUpDisabled,
              (activePowerUp?.type === '3x' || activePowerUp?.type === 'X3')
               && styles.powerUpActive
            ]}
          >
            <LinearGradient
              colors={(activePowerUp?.type === '3x' || activePowerUp?.type === 'X3') ? ['#FFD700', '#FFA500'] : ['#9B59B6', '#8E44AD']}
              style={styles.powerUpGradient}
            >
              <Text style={styles.powerUpMultiplier}>3x</Text>
              <Text style={styles.powerUpCost}>₦{cost3x}</Text>
              
              <View style={styles.powerUpInventoryBadge}>
                <Text style={styles.powerUpInventoryBadgeText}>🎟️ {count3x}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
              </View>
            )}

            {activePowerUp && (
              <View style={styles.activeBadge}>
               <Text style={styles.activeText}>
               🔥 {activePowerUp.type} ACTIVE (+{activePowerUp.multiplier} Multiplier)
               </Text>
              </View>
            )}
          </>
        )}

        {/* PURCHASE BUTTON */}
        <View style={styles.freeOptions}>
    {/* WATCH AD */}
    <TouchableOpacity
      onPress={handleWatchAd}
      style={[
        styles.freeOption,
        (!props.adWatched2xAvailable || isDisabled) && styles.freeOptionDisabled,
      ]}
      disabled={!props.adWatched2xAvailable || isDisabled}
    >
      <Text style={styles.freeOptionText}>📺 Watch Ad for Free 2x</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      onPress={() => {
        setSelectedPowerUp('X2');
        setQuantity(1);
        setShowPurchaseModal(true);
      }} 
      style={styles.watchAdButton}
    >
      <Text style={styles.watchAdText}>Shop More Power-Ups</Text>
    </TouchableOpacity>
  </View>
  <Text style={styles.disclaimer}>Power-ups apply to the current round only.</Text>

        {/* PURCHASE MODAL */}
         <Modal visible={showPurchaseModal} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => setShowPurchaseModal(false)}
        >
          <X size={24} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        <Text style={styles.modalTitle}>Get {selectedPowerUp} Boost</Text>
        <Text style={styles.modalSubtitle}>Increase your chances of cracking the egg first!</Text>

        <View style={styles.quantityContainer}>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyText}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.quantityValue, {color: '#fff'}]}>{quantity}</Text>
          <TouchableOpacity style={styles.qtyButton} onPress={() => setQuantity(quantity + 1)}>
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Total Cost:</Text>
          <Text style={styles.costValue}>
            ₦
            {((selectedPowerUp === '2x' || selectedPowerUp === 'X2')
              ? cost2x
              : cost3x) * quantity}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePurchase}
          disabled={isPaymentLoading}
          style={styles.payButton}
        >
          {isPaymentLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.secureText}>🔒 Secure Encrypted Payment</Text>
      </View>
    </View>
  </Modal>
      </View>
    );
  }
);

export default PowerUpPanel;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
  },
  prizeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 12,
  },
  prizeIcon: {
    fontSize: 28,
  },
  prizeTextContainer: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prizeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  usedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  usedText: {
    color: '#FF6B6B',
    fontWeight: '600',
    fontSize: 13,
  },
  happyHourBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  happyHourText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noPowerUpBanner: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  noPowerUpText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  noPowerUpSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  powerUpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  powerUpButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  powerUpDisabled: {
    opacity: 0.4,
  },
  powerUpActive: {
    transform: [{ scale: 1.02 }],
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  powerUpGradient: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  powerUpMultiplier: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  powerUpCost: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  powerUpInventoryBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  powerUpInventoryBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  freeOptions: {
    marginTop: 12,
    gap: 8,
  },
  freeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  freeOptionDisabled: {
    opacity: 0.45,
  },
  freeOptionText: {
    color: '#FFD700',
    fontWeight: '600',
    fontSize: 13,
  },
  watchAdButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  watchAdText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  activeText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  disclaimer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secureText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 12,
  },
  quantityContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
  marginVertical: 20,
},

qtyButton: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: '#eee',
  justifyContent: 'center',
  alignItems: 'center',
},

qtyText: {
  fontSize: 22,
  fontWeight: 'bold',
},

quantityValue: {
  fontSize: 20,
  fontWeight: 'bold',
},
});
