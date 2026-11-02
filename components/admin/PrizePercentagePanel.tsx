import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { showAlertAsToast } from "@/context/ToastContext";

type PrizePercentages = {
  couponPercent: number;
  airtime100Percent: number;
  airtime200Percent: number;
};

type PrizeKey = keyof PrizePercentages;

const PRIZE_OPTIONS: { key: PrizeKey; label: string; color: string }[] = [
  { key: "couponPercent", label: "Coupon", color: "#FFD700" },
  { key: "airtime100Percent", label: "₦100 airtime", color: "#4ECDC4" },
  { key: "airtime200Percent", label: "₦200 airtime", color: "#FF8A65" },
];

function PrizeSlider({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<View>(null);
  const trackLeft = useRef(0);
  const trackWidth = useRef(1);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromPageX = (pageX: number) => {
    const ratio = Math.max(0, Math.min(1, (pageX - trackLeft.current) / trackWidth.current));
    onChangeRef.current(Math.round(ratio * 100));
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => setFromPageX(event.nativeEvent.pageX),
        onPanResponderMove: (_event, gestureState) => setFromPageX(gestureState.moveX),
        onPanResponderTerminationRequest: () => false,
      }),
    []
  );

  return (
    <View
      ref={trackRef}
      style={styles.sliderTouchArea}
      onLayout={(event) => {
        trackWidth.current = Math.max(1, event.nativeEvent.layout.width);
        trackRef.current?.measureInWindow((x) => {
          trackLeft.current = x;
        });
      }}
      {...responder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${value}%`, backgroundColor: color }]} />
        <View
          style={[
            styles.thumb,
            { left: `${value}%`, borderColor: color, backgroundColor: "#1a1a2e" },
          ]}
        />
      </View>
    </View>
  );
}

export default function PrizePercentagePanel({
  token,
  baseUrl,
}: {
  token: string | null;
  baseUrl: string;
}) {
  const [percentages, setPercentages] = useState<PrizePercentages>({
    couponPercent: 50,
    airtime100Percent: 30,
    airtime200Percent: 20,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError("Sign in as an administrator to load prize settings.");
      setLoading(false);
      return;
    }

    let active = true;
    const loadSettings = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`${baseUrl}/admin/prize-percentages`, {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Failed to load settings (${response.status})`);
        }
        if (active) setPercentages(data.settings);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load prize settings";
        if (active) setLoadError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSettings();
    return () => {
      active = false;
    };
  }, [baseUrl, token]);

  const total = percentages.couponPercent + percentages.airtime100Percent + percentages.airtime200Percent;
  const totalIsValid = total === 100;

  const updatePercentage = (key: PrizeKey, value: number) => {
    setPercentages((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!token || !totalIsValid || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`${baseUrl}/admin/prize-percentages`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(percentages),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Failed to save settings (${response.status})`);
      }
      setPercentages(data.settings);
      showAlertAsToast("Success", "Prize percentages saved. New rounds will use these odds.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save prize settings";
      showAlertAsToast("Error", message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Prize win percentages</Text>
      <Text style={styles.hint}>
        Drag each slider or enter a percentage. Values must total exactly 100%. These are independent odds for each new round, so actual daily totals can vary.
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#FFD700" />
          <Text style={styles.hint}>Loading current settings…</Text>
        </View>
      ) : loadError ? (
        <Text style={styles.error}>{loadError}</Text>
      ) : (
        <>
          {PRIZE_OPTIONS.map((option) => (
            <View key={option.key} style={styles.prizeRow}>
              <View style={styles.labelRow}>
                <Text style={styles.prizeLabel}>{option.label}</Text>
                <View style={styles.valueRow}>
                  <TextInput
                    accessibilityLabel={`${option.label} percentage`}
                    keyboardType="number-pad"
                    maxLength={3}
                    value={String(percentages[option.key])}
                    onChangeText={(text) => {
                      if (!/^\d{0,3}$/.test(text)) return;
                      const value = Number(text || 0);
                      if (value <= 100) updatePercentage(option.key, value);
                    }}
                    style={styles.percentageInput}
                  />
                  <Text style={styles.percentSign}>%</Text>
                </View>
              </View>
              <PrizeSlider
                value={percentages[option.key]}
                color={option.color}
                onChange={(value) => updatePercentage(option.key, value)}
              />
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={[styles.totalValue, !totalIsValid && styles.error]}>
              {total}%
            </Text>
          </View>
          {!totalIsValid && (
            <Text style={styles.error}>
              Percentages must add up to 100% before you can save.
            </Text>
          )}

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.saveButton, (!totalIsValid || saving) && styles.disabledButton]}
            onPress={save}
            disabled={!totalIsValid || saving}
          >
            {saving ? (
              <ActivityIndicator color="#1a1a2e" />
            ) : (
              <Text style={styles.saveButtonText}>Save prize percentages</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  title: { color: "#FFF", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  hint: { color: "rgba(255,255,255,0.58)", fontSize: 12, lineHeight: 18 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 16 },
  prizeRow: { marginTop: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  prizeLabel: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  valueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  percentageInput: {
    minWidth: 54,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: "right",
    color: "#FFF",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 8,
    fontWeight: "700",
  },
  percentSign: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  sliderTouchArea: { height: 36, justifyContent: "center" },
  track: { height: 6, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.18)" },
  trackFill: { height: 6, borderRadius: 4 },
  thumb: {
    position: "absolute",
    top: -8,
    width: 22,
    height: 22,
    marginLeft: -11,
    borderRadius: 11,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: { color: "#FFF", fontWeight: "800" },
  totalValue: { color: "#4ECDC4", fontWeight: "900" },
  error: { color: "#FF9B9B", fontSize: 12, marginTop: 6 },
  saveButton: {
    marginTop: 16,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
  },
  disabledButton: { opacity: 0.5 },
  saveButtonText: { color: "#1a1a2e", fontWeight: "900" },
});
