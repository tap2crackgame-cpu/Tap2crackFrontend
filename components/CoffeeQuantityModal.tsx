import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Coffee, Minus, Plus } from "lucide-react-native";

const UNIT_PRICE = 50;
const MIN_QTY = 1;
const MAX_QTY = 20;

interface Props {
  visible: boolean;
  onClose: () => void;
  onContinue: (quantity: number) => void;
}

export default function CoffeeQuantityModal({ visible, onClose, onContinue }: Props) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!visible) setQuantity(1);
  }, [visible]);

  const total = UNIT_PRICE * quantity;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.iconRow}>
            <Coffee size={28} color="#FBBF24" />
          </View>
          <Text style={s.title}>How many coffees?</Text>
          <Text style={s.subtitle}>₦{UNIT_PRICE.toLocaleString()} per coffee — thank you for supporting Tap2Crack!</Text>

          <View style={s.stepper}>
            <TouchableOpacity
              style={[s.stepBtn, quantity <= MIN_QTY && s.stepBtnDisabled]}
              onPress={() => setQuantity((q) => Math.max(MIN_QTY, q - 1))}
              disabled={quantity <= MIN_QTY}
            >
              <Minus size={22} color={quantity <= MIN_QTY ? "rgba(255,255,255,0.25)" : "#fff"} />
            </TouchableOpacity>
            <View style={s.qtyBox}>
              <Text style={s.qtyNumber}>{quantity}</Text>
              <Text style={s.qtyLabel}>{quantity === 1 ? "coffee" : "coffees"}</Text>
            </View>
            <TouchableOpacity
              style={[s.stepBtn, quantity >= MAX_QTY && s.stepBtnDisabled]}
              onPress={() => setQuantity((q) => Math.min(MAX_QTY, q + 1))}
              disabled={quantity >= MAX_QTY}
            >
              <Plus size={22} color={quantity >= MAX_QTY ? "rgba(255,255,255,0.25)" : "#fff"} />
            </TouchableOpacity>
          </View>

          <Text style={s.total}>Total: ₦{total.toLocaleString()}</Text>

          <TouchableOpacity style={s.continueBtn} onPress={() => onContinue(quantity)}>
            <Text style={s.continueText}>Continue to payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  iconRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(251,191,36,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { color: "#FBBF24", fontSize: 20, fontWeight: "700" as const },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginVertical: 8,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepBtnDisabled: { opacity: 0.5 },
  qtyBox: { alignItems: "center", minWidth: 80 },
  qtyNumber: { color: "#fff", fontSize: 36, fontWeight: "700" as const },
  qtyLabel: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  total: { color: "#4ECDC4", fontSize: 18, fontWeight: "600" as const, marginTop: 4 },
  continueBtn: {
    backgroundColor: "#FBBF24",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginTop: 8,
  },
  continueText: { color: "#1a1a2e", fontWeight: "700" as const, fontSize: 15 },
  cancelBtn: { padding: 10 },
  cancelText: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
});
