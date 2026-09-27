import { useCallback, useEffect, useState } from "react";

export const BAR_STYLES = ["classic", "gradient", "glass", "metal", "neon", "segmented"];
const KEY = "tt.limits.barAppearance";
const EVENT = "tt:bar-appearance";
const DEFAULTS = { style: "classic", height: 12 };

export function normalizeBarAppearance(value) {
  return {
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
  useEffect(() => {
    const onChange = (event) => setAppearance(event.detail);
    const onStorage = (event) => {
      if (event.key === KEY || event.key === null) setAppearance(readAppearance());
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  const update = useCallback((patch) => {
    const next = normalizeBarAppearance({ ...appearance, ...patch });
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Session-only when storage is unavailable. */ }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  }, [appearance]);
  return { ...appearance, update, reset: () => update(DEFAULTS) };
}
