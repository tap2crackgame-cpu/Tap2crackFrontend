import { useEffect } from "react";
import type { ComponentProps } from "react";
import { Platform, Text, TextInput } from "react-native";

let nativeTextDefaultsApplied = false;

type ComponentWithDefaultProps<T> = {
  defaultProps?: Partial<T>;
};

function applyNativeNoSelectDefaults() {
  if (nativeTextDefaultsApplied || Platform.OS === "web") return;
  nativeTextDefaultsApplied = true;

  const TextComponent = Text as typeof Text &
    ComponentWithDefaultProps<ComponentProps<typeof Text>>;
  TextComponent.defaultProps = {
    ...TextComponent.defaultProps,
    selectable: false,
  };

  const TextInputComponent = TextInput as typeof TextInput &
    ComponentWithDefaultProps<ComponentProps<typeof TextInput>>;
  TextInputComponent.defaultProps = {
    ...TextInputComponent.defaultProps,
    selectTextOnFocus: false,
  };
}

const VIEWPORT_CONTENT =
  "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

/** Web: block pinch/double-tap zoom and text selection outside inputs. */
export function useDisableZoomAndSelect() {
  useEffect(() => {
    applyNativeNoSelectDefaults();

    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      meta.setAttribute("content", VIEWPORT_CONTENT);
    }

    const preventGesture = (e: Event) => e.preventDefault();

    const preventCtrlWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };

    let lastTouchEnd = 0;
    const preventDoubleTapZoom = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd < 300) e.preventDefault();
      lastTouchEnd = now;
    };

    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("wheel", preventCtrlWheelZoom, { passive: false });
    document.addEventListener("touchmove", preventMultiTouch, { passive: false });
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("wheel", preventCtrlWheelZoom);
      document.removeEventListener("touchmove", preventMultiTouch);
      document.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, []);
}
