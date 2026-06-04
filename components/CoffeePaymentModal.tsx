import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import {
  initiateCoffeeBankTransfer,
  verifyPayment,
  type BankTransferDetails,
} from "@/services/payments";
import FlutterwaveBranding from "@/components/FlutterwaveBranding";
import { toast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import PaymentSuccessCheckmark from "@/components/PaymentSuccessCheckmark";
import { playGameSound } from "@/utils/sounds";
import { Heart } from "lucide-react-native";

const UNIT_PRICE = 50;

type Stage = "confirm" | "bank" | "verifying" | "done" | "error";

interface Props {
  visible: boolean;
  quantity: number;
  token: string;
  onClose: () => void;
}

export default function CoffeePaymentModal({ visible, quantity, token, onClose }: Props) {
  const amount = UNIT_PRICE * quantity;
  const productName =
    quantity === 1 ? "1 coffee for the team" : `${quantity} coffees for the team`;

  const { authUser } = useAuth();
  const hasPhone = Boolean(String(authUser?.phone || "").replace(/\D/g, "").length >= 10);

  const [stage, setStage] = useState<Stage>("confirm");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);

  const reset = useCallback(() => {
    setStage("confirm");
    setError(null);
    setBusy(false);
    setTxRef(null);
    setBankDetails(null);
  }, []);

  const close = () => {
    reset();
    onClose();
  };

  const paymentError = (msg: string) => {
    setError(msg);
    setStage("error");
    toast.error(msg);
  };

  const pollVerify = async (ref: string) => {
    setBusy(true);
    for (let i = 0; i < 40; i++) {
      try {
        const r = await verifyPayment(token, ref);
        if (r.status === "SUCCESS") {
          setStage("done");
          setBusy(false);
          void playGameSound("paymentSuccess");
          toast.success("Thank you for your support!");
          setTimeout(close, 3200);
          return;
        }
        if (r.status === "FAILED") {
          paymentError("Payment failed or was not received");
          setBusy(false);
          return;
        }
      } catch (e) {
        const msg = (e as Error).message || "";
        if (msg.includes("401") || msg.includes("403")) {
          paymentError("Session expired — sign in again and tap Check payment");
          setBusy(false);
          return;
        }
      }
      await new Promise((r) => setTimeout(r, 2500));
    }
    paymentError("Verification timed out — tap “Check payment” to try again");
    setBusy(false);
  };

  const startBankTransfer = () => {
    if (!hasPhone) {
      paymentError(
        "Add a valid Nigerian phone number in your profile before bank transfer."
      );
      return;
    }
    setError(null);
    setBankDetails(null);
    setStage("bank");
  };

  const loadBankTransfer = useCallback(async () => {
    setError(null);
    setBusy(true);
    setBankDetails(null);
    try {
      const r = await initiateCoffeeBankTransfer(token, quantity);
      setTxRef(r.txRef);
      setBankDetails(r.bankDetails);
    } catch (e) {
      const msg = (e as Error).message || "Could not load bank details";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }, [token, quantity]);

  useEffect(() => {
    if (stage === "bank" && !bankDetails && !error) {
      void loadBankTransfer();
    }
  }, [stage, bankDetails, error, loadBankTransfer]);

  useEffect(() => {
    if (!visible) reset();
  }, [visible, reset]);

  const copyText = async (text: string, label: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`, "Copied");
        return;
      }
    } catch {
      /* fall through */
    }
    toast.info(text, label);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scrollContent}
          >
            {stage !== "done" && (
              <Text style={s.title}>
                Buy us a coffee — ₦{amount.toLocaleString()} ({productName})
              </Text>
            )}

            {stage === "confirm" && (
              <>
                <View style={s.confirmBox}>
                  <Text style={s.confirmHeading}>Confirm donation</Text>
                  <Text style={s.confirmBody}>
                    You are about to pay{" "}
                    <Text style={s.confirmAmount}>₦{amount.toLocaleString()}</Text> for{" "}
                    <Text style={s.confirmProduct}>{productName}</Text> via bank transfer. Your
                    support helps keep Tap2Crack running.
                  </Text>
                </View>
                <TouchableOpacity style={s.payBtn} onPress={startBankTransfer} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#1a1a2e" />
                  ) : (
                    <Text style={s.payBtnText}>Get account details</Text>
                  )}
                </TouchableOpacity>
                <FlutterwaveBranding />
              </>
            )}

            {stage === "bank" && (
              <>
                <TouchableOpacity
                  onPress={() => {
                    setStage("confirm");
                    setBankDetails(null);
                    setError(null);
                  }}
                  disabled={busy}
                >
                  <Text style={s.backLink}>← Back</Text>
                </TouchableOpacity>
                {busy && !bankDetails ? (
                  <View style={s.center}>
                    <ActivityIndicator color="#FBBF24" size="large" />
                    <Text style={s.help}>Loading Flutterwave account details…</Text>
                  </View>
                ) : bankDetails ? (
                  <>
                    <Text style={s.bankIntro}>
                      Transfer exactly{" "}
                      <Text style={s.confirmAmount}>
                        ₦{(bankDetails.amount || amount).toLocaleString()}
                      </Text>{" "}
                      to the account below.
                    </Text>
                    <View style={s.bankCard}>
                      <Text style={s.bankLabel}>Bank</Text>
                      <TouchableOpacity onPress={() => copyText(bankDetails.bankName, "Bank name")}>
                        <Text style={s.bankValue}>{bankDetails.bankName}</Text>
                      </TouchableOpacity>
                      <Text style={s.bankLabel}>Account number</Text>
                      <TouchableOpacity
                        onPress={() => copyText(bankDetails.accountNumber, "Account number")}
                      >
                        <Text style={[s.bankValue, s.mono]}>{bankDetails.accountNumber}</Text>
                      </TouchableOpacity>
                      <Text style={s.bankLabel}>Amount</Text>
                      <Text style={s.bankValue}>
                        ₦{(bankDetails.amount || amount).toLocaleString()}
                      </Text>
                      {bankDetails.note ? (
                        <>
                          <Text style={s.bankLabel}>Account Name</Text>
                          <Text style={s.bankHint}>{bankDetails.note}</Text>
                        </>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={s.payBtn}
                      onPress={() => {
                        if (txRef) {
                          setStage("verifying");
                          void pollVerify(txRef);
                        }
                      }}
                      disabled={busy || !txRef}
                    >
                      {busy ? (
                        <ActivityIndicator color="#1a1a2e" />
                      ) : (
                        <Text style={s.payBtnText}>I&apos;ve made the transfer</Text>
                      )}
                    </TouchableOpacity>
                    <FlutterwaveBranding />
                  </>
                ) : error ? (
                  <View style={s.center}>
                    <Text style={s.help}>{error}</Text>
                    <TouchableOpacity
                      style={s.payBtn}
                      onPress={() => {
                        setError(null);
                        void loadBankTransfer();
                      }}
                      disabled={busy}
                    >
                      <Text style={s.payBtnText}>Try again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setStage("confirm")}>
                      <Text style={s.cancelText}>Back</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </>
            )}

            {stage === "verifying" && (
              <View style={s.center}>
                <ActivityIndicator color="#FBBF24" size="large" />
                <Text style={s.help}>Confirming your transfer…</Text>
                <FlutterwaveBranding compact />
              </View>
            )}

            {stage === "done" && (
              <View style={s.center}>
                <PaymentSuccessCheckmark />
                <Heart size={40} color="#FF6B6B" style={{ marginTop: 8 }} />
                <Text style={s.thanksTitle}>Thank you so much!</Text>
                <Text style={s.thanksBody}>
                  Your {quantity === 1 ? "coffee" : `${quantity} coffees`} means the world to us.
                  Because of supporters like you, we can keep the eggs cracking and the prizes
                  flowing. ☕🥚
                </Text>
                <FlutterwaveBranding compact />
              </View>
            )}

            {stage === "error" && (
              <>
                <Text style={s.help}>
                  {error ||
                    "Payment could not be completed. Try again or verify your transfer below."}
                </Text>
                <TouchableOpacity style={s.cancelBtn} onPress={reset}>
                  <Text style={s.cancelText}>Try again</Text>
                </TouchableOpacity>
                {txRef ? (
                  <TouchableOpacity
                    style={s.payBtn}
                    onPress={() => {
                      setStage("verifying");
                      void pollVerify(txRef);
                    }}
                  >
                    <Text style={s.payBtnText}>Check payment</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}

            {stage !== "done" && stage !== "verifying" && (
              <TouchableOpacity style={s.cancelBtn} onPress={close} disabled={busy}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  sheet: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  scrollContent: { gap: 12, paddingBottom: 4 },
  title: { color: "#FBBF24", fontSize: 17, fontWeight: "600" as const },
  payBtn: {
    backgroundColor: "#FBBF24",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  payBtnText: { color: "#1a1a2e", fontWeight: "700" as const, fontSize: 15 },
  backLink: { color: "#4ECDC4", fontSize: 13, marginBottom: 4 },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  help: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" },
  center: { alignItems: "center", padding: 20, gap: 12 },
  confirmBox: {
    backgroundColor: "rgba(255,215,0,0.08)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.2)",
  },
  confirmHeading: { color: "#FBBF24", fontSize: 16, fontWeight: "700" as const, marginBottom: 8 },
  confirmBody: { color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 22 },
  confirmAmount: { color: "#FBBF24", fontWeight: "700" as const },
  confirmProduct: { color: "#4ECDC4", fontWeight: "600" as const },
  bankIntro: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 20 },
  bankCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  bankLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 6,
  },
  bankValue: { color: "#fff", fontSize: 17, fontWeight: "600" as const },
  bankHint: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  mono: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  thanksTitle: {
    color: "#FBBF24",
    fontSize: 22,
    fontWeight: "700" as const,
    textAlign: "center",
    marginTop: 4,
  },
  thanksBody: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
