import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react-native";

const TOAST_DURATION_MS = 3000;

export type ToastType = "success" | "error" | "info" | "warning";

type ToastPayload = {
  id: number;
  title?: string;
  message: string;
  type: ToastType;
};

export type ToastAPI = {
  show: (message: string, options?: { title?: string; type?: ToastType }) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastAPI | null>(null);

let globalToast: ToastAPI | null = null;

export function notify(
  message: string,
  options?: { title?: string; type?: ToastType }
) {
  globalToast?.show(message, options);
}

/** Drop-in replacement for simple `Alert.alert(title, message?)` notifications. */
export function showAlertAsToast(title: string, message?: string) {
  const lower = title.toLowerCase();
  let type: ToastType = "info";
  if (lower.includes("success") || lower === "copied") type = "success";
  else if (
    lower.includes("error") ||
    lower.includes("failed") ||
    lower.includes("missing") ||
    lower.includes("unavailable")
  ) {
    type = "error";
  }
  const body = message ?? title;
  const heading = message ? title : undefined;
  notify(body, { type, title: heading });
}

export const toast: ToastAPI = {
  show: (message, options) => notify(message, options),
  success: (message, title) => notify(message, { type: "success", title }),
  error: (message, title) => notify(message, { type: "error", title }),
  info: (message, title) => notify(message, { type: "info", title }),
  warning: (message, title) => notify(message, { type: "warning", title }),
};

const TYPE_STYLES: Record<
  ToastType,
  { accent: string; iconBg: string; Icon: typeof Info }
> = {
  success: { accent: "#4ECDC4", iconBg: "rgba(78,205,196,0.18)", Icon: CheckCircle2 },
  error: { accent: "#FF6B6B", iconBg: "rgba(255,107,107,0.18)", Icon: AlertCircle },
  warning: {
    accent: "#FBBF24",
    iconBg: "rgba(251,191,36,0.18)",
    Icon: AlertTriangle,
  },
  info: { accent: "#7EC8E3", iconBg: "rgba(126,200,227,0.18)", Icon: Info },
};

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState<ToastPayload | null>(null);
  const slide = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: -140,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setCurrent(null);
    });
  }, [slide, opacity]);

  const present = useCallback(
    (payload: ToastPayload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      slide.setValue(-140);
      opacity.setValue(0);
      setCurrent(payload);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.spring(slide, {
            toValue: 0,
            useNativeDriver: true,
            tension: 72,
            friction: 11,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      });
      hideTimer.current = setTimeout(dismiss, TOAST_DURATION_MS);
    },
    [slide, opacity, dismiss]
  );

  const api = useMemo<ToastAPI>(
    () => ({
      show: (message, options) =>
        present({
          id: Date.now(),
          message,
          title: options?.title,
          type: options?.type ?? "info",
        }),
      success: (message, title) =>
        present({ id: Date.now(), message, title, type: "success" }),
      error: (message, title) =>
        present({ id: Date.now(), message, title, type: "error" }),
      info: (message, title) =>
        present({ id: Date.now(), message, title, type: "info" }),
      warning: (message, title) =>
        present({ id: Date.now(), message, title, type: "warning" }),
    }),
    [present]
  );

  useEffect(() => {
    globalToast = api;
    return () => {
      globalToast = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [api]);

  const typeStyle = current ? TYPE_STYLES[current.type] : null;
  const Icon = typeStyle?.Icon ?? Info;

  return (
    <ToastContext.Provider value={api}>
      {children}
      {current && typeStyle ? (
        <View style={[styles.host, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.toast,
              {
                borderLeftColor: typeStyle.accent,
                opacity,
                transform: [{ translateY: slide }],
              },
              Platform.OS === "web" ? styles.toastWeb : null,
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: typeStyle.iconBg }]}>
              <Icon size={20} color={typeStyle.accent} strokeWidth={2.25} />
            </View>
            <View style={styles.textWrap}>
              {current.title ? (
                <Text style={[styles.title, { color: typeStyle.accent }]} numberOfLines={1}>
                  {current.title}
                </Text>
              ) : null}
              <Text style={styles.message} numberOfLines={4}>
                {current.message}
              </Text>
            </View>
            <TouchableOpacity
              onPress={dismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
            >
              <X size={16} color="rgba(255,255,255,0.45)" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: "center",
    paddingHorizontal: 16,
    elevation: 99999,
  },
  toast: {
    width: "100%",
    maxWidth: 420,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 12,
    borderRadius: 14,
    borderLeftWidth: 4,
    backgroundColor: "rgba(22, 28, 48, 0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  toastWeb: {
    boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  textWrap: { flex: 1, gap: 2 },
  title: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  message: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  closeBtn: {
    padding: 2,
    marginTop: 2,
  },
});
