import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import {
  initiatePayment,
  initiateBankTransfer,
  authorizePayment,
  verifyPayment,
  type CardInput,
  type NextAction,
  type BankTransferDetails,
} from "@/services/payments";
import FlutterwaveBranding from "@/components/FlutterwaveBranding";
import { toast } from "@/context/ToastContext";

type Stage =
  | "choose"
  | "confirm"
  | "card"
  | "bank"
  | "pin"
  | "otp"
  | "redirect"
  | "verifying"
  | "done"
  | "error";

interface Props {
  visible: boolean;
  multiplier: 2 | 3;
  amount: number;
  quantity?: number;
  token: string;
  powerUpLabel?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function defaultPowerUpLabel(multiplier: 2 | 3) {
  return multiplier === 3 ? "3x Tap" : "2x Tap";
}

export default function PaymentModal({
  visible,
  multiplier,
  amount,
  quantity = 1,
  token,
  powerUpLabel,
  onClose,
  onSuccess,
}: Props) {
  const productName = powerUpLabel ?? defaultPowerUpLabel(multiplier);

  const [stage, setStage] = useState<Stage>("choose");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [card, setCard] = useState<CardInput>({
    number: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
  });
  const [pin, setPin] = useState("");
  const [otp, setOtp] = useState("");
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [txRef, setTxRef] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankTransferDetails | null>(null);

  const reset = useCallback(() => {
    setStage("choose");
    setError(null);
    setBusy(false);
    setCard({ number: "", expiry_month: "", expiry_year: "", cvv: "" });
    setPin("");
    setOtp("");
    setChargeId(null);
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
    for (let i = 0; i < 30; i++) {
      try {
        const r = await verifyPayment(token, ref);
        if (r.status === "SUCCESS") {
          setStage("done");
          setBusy(false);
          toast.success("Payment successful");
          onSuccess();
          setTimeout(close, 1200);
          return;
        }
        if (r.status === "FAILED") {
          paymentError("Payment failed or was not received");
          setBusy(false);
          return;
        }
      } catch {
        /* keep polling */
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    paymentError("Verification timed out — tap “Check payment” to try again");
    setBusy(false);
  };

  const handleNextAction = async (nextAction: NextAction, ref: string, cId?: string) => {
    if (!nextAction) {
      setStage("verifying");
      await pollVerify(ref);
      return;
    }
    const t = (nextAction as { type: string }).type;
    if (t === "requires_pin" || t === "pin") {
      setStage("pin");
    } else if (t === "requires_otp" || t === "otp") {
      setStage("otp");
    } else if (t === "redirect_url" || t === "redirect") {
      const url = (nextAction as { redirect_url?: { url: string } }).redirect_url?.url;
      if (url && typeof window !== "undefined") {
        const popup = window.open(url, "flw_3ds", "width=480,height=720");
        setStage("redirect");
        const interval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(interval);
            setStage("verifying");
            await pollVerify(ref);
          }
        }, 1500);
      } else {
        paymentError("Could not open 3DS verification");
      }
    } else {
      setStage("verifying");
      await pollVerify(ref);
    }
  };

  const submitCard = async () => {
    setError(null);
    setBusy(true);
    try {
      const r = await initiatePayment(token, multiplier, card, quantity);
      setTxRef(r.txRef);
      if (r.chargeId) setChargeId(r.chargeId);
      await handleNextAction(r.nextAction, r.txRef, r.chargeId);
    } catch (e) {
      const msg = (e as Error).message || "Payment failed";
      paymentError(
        msg.includes("10403") || msg.toLowerCase().includes("forbidden")
          ? "Card payments are not enabled on this Flutterwave app. Add FLW_SECRET_KEY to the server .env (Dashboard → API Keys → Secret Key), then restart the backend."
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  const submitAuth = async (type: "pin" | "otp") => {
    if (!chargeId || !txRef) return;
    setError(null);
    setBusy(true);
    try {
      const r = await authorizePayment(token, chargeId, type, type === "pin" ? pin : otp);
      await handleNextAction(r.nextAction, txRef, chargeId);
    } catch (e) {
      paymentError((e as Error).message || "Authorization failed");
    } finally {
      setBusy(false);
    }
  };

  const loadBankTransfer = useCallback(async () => {
    setError(null);
    setBusy(true);
    setBankDetails(null);
    try {
      const r = await initiateBankTransfer(token, multiplier, quantity);
      setTxRef(r.txRef);
      if (r.chargeId) setChargeId(r.chargeId);
      setBankDetails(r.bankDetails);
    } catch (e) {
      paymentError((e as Error).message || "Could not load bank details");
    } finally {
      setBusy(false);
    }
  }, [token, multiplier, quantity]);

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
      //expect-error web clipboard
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        //expect-error web clipboard
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`, "Copied");
        return;
      }
    } catch {
      /* fall through */
    }
    toast.info(text, label);
  };

  const summaryLine = `₦${amount.toLocaleString()} for ${quantity}  ${productName}${quantity > 1 ?`` : ""}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.scrollContent}
          >
            <Text style={s.title}>Paying {summaryLine}</Text>

            {stage === "choose" && (
              <>
                <Text style={s.subtitle}>Choose payment method</Text>
                <TouchableOpacity
                  style={s.methodBtn}
                  onPress={() => setStage("card")}
                  disabled={busy}
                >
                  <Text style={s.methodTitle}>Card payment</Text>
                  <Text style={s.methodHint}>Debit or credit card</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.methodBtn}
                  onPress={() => setStage("bank")}
                  disabled={busy}
                >
                  <Text style={s.methodTitle}>Bank transfer</Text>
                  <Text style={s.methodHint}>Flutterwave Transfer</Text>
                </TouchableOpacity>
                <FlutterwaveBranding />
              </>
            )}

            {stage === "confirm" && (
              <>
                <View style={s.confirmBox}>
                  <Text style={s.confirmHeading}>Confirm payment</Text>
                  <Text style={s.confirmBody}>
                    You are about to pay{" "}
                    <Text style={s.confirmAmount}>₦{amount.toLocaleString()}</Text> for{" "}
                    <Text style={s.confirmProduct}>{productName}</Text>
                    {quantity > 1 ? ` (× ${quantity})` : ""}.
                  </Text>
                </View>
                <TouchableOpacity style={s.payBtn} onPress={submitCard} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#1a1a2e" />
                  ) : (
                    <Text style={s.payBtnText}>Confirm & pay</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.backBtn}
                  onPress={() => setStage("card")}
                  disabled={busy}
                >
                  <Text style={s.backBtnText}>Back</Text>
                </TouchableOpacity>
                <FlutterwaveBranding />
              </>
            )}

            {stage === "card" && (
              <>
                <TouchableOpacity onPress={() => setStage("choose")} disabled={busy}>
                  <Text style={s.backLink}>← Change payment method</Text>
                </TouchableOpacity>
                <TextInput
                  style={s.input}
                  placeholder="Card number"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  value={card.number}
                  onChangeText={(t) => setCard({ ...card, number: t.replace(/\s/g, "") })}
                  maxLength={19}
                />
                <View style={s.row}>
                  <TextInput
                    style={[s.input, s.flex]}
                    placeholder="MM"
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                    value={card.expiry_month}
                    onChangeText={(t) => setCard({ ...card, expiry_month: t })}
                    maxLength={2}
                  />
                  <TextInput
                    style={[s.input, s.flex]}
                    placeholder="YY"
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                    value={card.expiry_year}
                    onChangeText={(t) => setCard({ ...card, expiry_year: t })}
                    maxLength={2}
                  />
                  <TextInput
                    style={[s.input, s.flex]}
                    placeholder="CVV"
                    placeholderTextColor="#888"
                    keyboardType="number-pad"
                    value={card.cvv}
                    onChangeText={(t) => setCard({ ...card, cvv: t })}
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
                <TouchableOpacity
                  style={s.payBtn}
                  onPress={() => setStage("confirm")}
                  disabled={busy || !card.number || !card.expiry_month || !card.expiry_year || !card.cvv}
                >
                  <Text style={s.payBtnText}>Continue · ₦{amount.toLocaleString()}</Text>
                </TouchableOpacity>
                <FlutterwaveBranding />
              </>
            )}

            {stage === "bank" && (
              <>
                <TouchableOpacity onPress={() => { setStage("choose"); setBankDetails(null); }} disabled={busy}>
                  <Text style={s.backLink}>← Change payment method</Text>
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
                ) : null}
              </>
            )}

            {stage === "pin" && (
              <>
                <Text style={s.help}>Enter your card PIN</Text>
                <TextInput
                  style={s.input}
                  placeholder="PIN"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  value={pin}
                  onChangeText={setPin}
                  maxLength={4}
                  secureTextEntry
                />
                <TouchableOpacity style={s.payBtn} onPress={() => submitAuth("pin")} disabled={busy}>
                  {busy ? <ActivityIndicator color="#1a1a2e" /> : <Text style={s.payBtnText}>Submit PIN</Text>}
                </TouchableOpacity>
              </>
            )}

            {stage === "otp" && (
              <>
                <Text style={s.help}>Enter the OTP sent to your phone</Text>
                <TextInput
                  style={s.input}
                  placeholder="OTP"
                  placeholderTextColor="#888"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                  maxLength={8}
                />
                <TouchableOpacity style={s.payBtn} onPress={() => submitAuth("otp")} disabled={busy}>
                  {busy ? <ActivityIndicator color="#1a1a2e" /> : <Text style={s.payBtnText}>Submit OTP</Text>}
                </TouchableOpacity>
              </>
            )}

            {stage === "redirect" && (
              <View style={s.center}>
                <ActivityIndicator color="#FBBF24" size="large" />
                <Text style={s.help}>Complete 3DS verification in the popup…</Text>
              </View>
            )}

            {stage === "verifying" && (
              <View style={s.center}>
                <ActivityIndicator color="#FBBF24" size="large" />
                <Text style={s.help}>Confirming payment…</Text>
                <FlutterwaveBranding compact />
              </View>
            )}

            {stage === "done" && (
              <View style={s.center}>
                <Text style={s.success}>Payment successful</Text>
                <FlutterwaveBranding compact />
              </View>
            )}

            {stage === "error" && (
              <>
                <Text style={s.help}>Payment could not be completed. Try again or verify your transfer below.</Text>
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

            {stage !== "done" &&
              stage !== "verifying" &&
              stage !== "redirect" &&
              stage !== "choose" &&
              stage !== "confirm" &&
              stage !== "card" &&
              stage !== "bank" && (
                <TouchableOpacity style={s.cancelBtn} onPress={close} disabled={busy}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}

            {(stage === "choose" ||
              stage === "card" ||
              stage === "bank" ||
              stage === "confirm") && (
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
  title: { color: "#FBBF24", fontSize: 18, fontWeight: "600" as const },
  subtitle: { color: "rgba(255,255,255,0.65)", fontSize: 14, marginBottom: 4 },
  methodBtn: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.25)",
  },
  methodTitle: { color: "#fff", fontSize: 16, fontWeight: "700" as const },
  methodHint: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    fontSize: 15,
  },
  row: { flexDirection: "row", gap: 8 },
  flex: { flex: 1 },
  payBtn: {
    backgroundColor: "#FBBF24",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  payBtnText: { color: "#1a1a2e", fontWeight: "700" as const, fontSize: 15 },
  backBtn: { padding: 10, alignItems: "center" },
  backBtnText: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  backLink: { color: "#4ECDC4", fontSize: 13, marginBottom: 4 },
  cancelBtn: { padding: 10, alignItems: "center" },
  cancelText: { color: "rgba(255,255,255,0.5)", fontSize: 13 },
  help: { color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center" },
  center: { alignItems: "center", padding: 20, gap: 12 },
  success: { color: "#4ECDC4", fontSize: 15, fontWeight: "600" as const },
  error: { color: "#FF6B6B", fontSize: 14, padding: 8 },
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
});
