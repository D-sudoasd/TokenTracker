import DEFAULT_PALETTE from "../content/limit-bar-palette.json";
import { isNativeWindowsApp, onNativeSettings, requestNativeSettings, setNativeSetting } from "../lib/native-bridge.js";
import { useCallback, useEffect, useState, useRef } from "react";

export const BAR_STYLES = ["nature", "shadow", "storm", "blood", "runic", "dragon", "gilded", "arcane", "frost", "ember", "classic", "gradient", "glass", "metal", "neon", "segmented"];
const KEY = "tt.limits.barAppearance";
const EVENT = "tt:bar-appearance";
export { DEFAULT_PALETTE };
const DEFAULTS = { style: "classic", height: 12, colorMode: "solid", palette: DEFAULT_PALETTE };
export function barAppearanceVariables(prefs) {
  return { "--tt-bar-height": `${prefs.height}px`, ...Object.fromEntries(Object.entries(prefs.palette).map(([key, value]) => [`--tt-${key}`, value])) };
}

export function normalizeBarAppearance(value) {
  return {
    colorMode: ["solid", "status-gradient", "spectrum"].includes(value?.colorMode) ? value.colorMode : "solid",
    palette: Object.fromEntries(Object.entries(DEFAULT_PALETTE).map(([key, fallback]) => [key, /^#[0-9a-f]{6}$/i.test(value?.palette?.[key]) ? value.palette[key] : fallback])),
    style: BAR_STYLES.includes(value?.style) ? value.style : DEFAULTS.style,
    height: typeof value?.height === "number" && Number.isFinite(value.height)
      ? Math.max(6, Math.min(24, Math.round(value.height))) : DEFAULTS.height,
  };
}

function readAppearance() {
  try { return normalizeBarAppearance(JSON.parse(window.localStorage.getItem(KEY))); }
  catch { return { ...DEFAULTS }; }
}

// Dashboard-only presentation settings; separate from the native quota preferences.
export function useLimitBarAppearance() {
  const [appearance, setAppearance] = useState(readAppearance);
  const currentRef = useRef(appearance);
  const editedRef = useRef(false);
  const hydratedRef = useRef(false);
  useEffect(() => {
    const onChange = (event) => { if (!event.detail?.fromNative) editedRef.current = true; currentRef.current = normalizeBarAppearance(event.detail); setAppearance(currentRef.current); };
    const onStorage = (event) => {
      if (event.key === KEY || event.key === null) { currentRef.current = readAppearance(); setAppearance(currentRef.current); }
    };
    const offNative = isNativeWindowsApp() ? onNativeSettings((settings) => {
      if (editedRef.current || hydratedRef.current || typeof settings.limitBarAppearance !== "string") return;
      try {
        const restored = normalizeBarAppearance(JSON.parse(settings.limitBarAppearance));
        hydratedRef.current = true;
        try { window.localStorage.setItem(KEY, JSON.stringify(restored)); } catch { /* Session only. */ }
        window.dispatchEvent(new CustomEvent(EVENT, { detail: { ...restored, fromNative: true } }));
      } catch { /* Ignore invalid native snapshots. */ }
    }) : () => {};
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    if (isNativeWindowsApp()) requestNativeSettings();
    return () => {
      offNative();
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const update = useCallback((patch) => {
    editedRef.current = true;
    const next = normalizeBarAppearance({ ...currentRef.current, ...patch });
    currentRef.current = next;
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Session-only when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
    if (isNativeWindowsApp()) setNativeSetting("limitBarAppearance", JSON.stringify(next));
  }, []);
  return { ...appearance, update, reset: () => update(DEFAULTS) };
}
