import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { DEFAULT_PALETTE, normalizeBarAppearance, useLimitBarAppearance } from "./use-limit-bar-appearance.js";
import { isNativeWindowsApp, setNativeSetting } from "../lib/native-bridge.js";

vi.mock("../lib/native-bridge.js", async (importOriginal) => ({
  ...await importOriginal(),
  isNativeWindowsApp: vi.fn(() => false),
  requestNativeSettings: vi.fn(),
  setNativeSetting: vi.fn(),
}));

beforeEach(() => { window.localStorage.clear(); vi.clearAllMocks(); isNativeWindowsApp.mockReturnValue(false); });

it("migrates old settings and rejects invalid colors without losing valid colors", () => {
  expect(normalizeBarAppearance({ style: "gilded", height: 20 })).toMatchObject({ colorMode: "solid", palette: DEFAULT_PALETTE });
  expect(normalizeBarAppearance({ palette: { safe: "url(unsafe)", danger: DEFAULT_PALETTE.warning } }).palette)
    .toEqual({ ...DEFAULT_PALETTE, danger: DEFAULT_PALETTE.warning });
});

it("keeps rapid successive changes rather than reading a stale render", () => {
  const hook = renderHook(useLimitBarAppearance);
  act(() => { hook.result.current.update({ style: "storm" }); hook.result.current.update({ colorMode: "spectrum" }); });
  expect(hook.result.current).toMatchObject({ style: "storm", colorMode: "spectrum" });
});

it("merges individual color edits from multiple controls without discarding other colors", () => {
  const first = renderHook(useLimitBarAppearance);
  const second = renderHook(useLimitBarAppearance);
  act(() => {
    first.result.current.update({ palette: { safe: DEFAULT_PALETTE.danger } });
    second.result.current.update({ palette: { warning: DEFAULT_PALETTE.safe } });
  });
  expect(first.result.current.palette).toMatchObject({
    safe: DEFAULT_PALETTE.danger,
    warning: DEFAULT_PALETTE.safe,
  });
});

it("does not overwrite a newer cross-tab selection with a delayed Windows snapshot", () => {
  isNativeWindowsApp.mockReturnValue(true);
  const hook = renderHook(useLimitBarAppearance);
  act(() => {
    window.localStorage.setItem("tt.limits.barAppearance", JSON.stringify({ style: "frost" }));
    window.dispatchEvent(new StorageEvent("storage", { key: "tt.limits.barAppearance" }));
    window.dispatchEvent(new CustomEvent("native:settings", { detail: {
      limitBarAppearance: JSON.stringify({ style: "classic" }),
    } }));
  });
  expect(hook.result.current.style).toBe("frost");
});

it("restores Windows settings on a new origin and ignores late snapshots after editing", () => {
  isNativeWindowsApp.mockReturnValue(true);
  const panel = renderHook(useLimitBarAppearance);
  const controls = renderHook(useLimitBarAppearance);
  const nativeSnapshot = () => window.dispatchEvent(new CustomEvent("native:settings", { detail: {
    limitBarAppearance: JSON.stringify({ style: "dragon", height: 24, colorMode: "spectrum" }),
  } }));
  act(nativeSnapshot);
  expect(panel.result.current).toMatchObject({ style: "dragon", height: 24, colorMode: "spectrum" });
  act(() => controls.result.current.update({ style: "nature" }));
  act(nativeSnapshot);
  expect(panel.result.current.style).toBe("nature");
  expect(setNativeSetting).toHaveBeenCalledWith("limitBarAppearance", expect.stringContaining('"style":"nature"'));
});

it("bounds invalid persisted values and recovers from malformed storage", () => {
  expect(normalizeBarAppearance({ style: "unknown", height: Infinity })).toMatchObject({ style: "classic", height: 12 });
  expect(normalizeBarAppearance({ height: 99 }).height).toBe(24);
  expect(normalizeBarAppearance({ height: -1 }).height).toBe(6);
  window.localStorage.setItem("tt.limits.barAppearance", "broken");
  expect(renderHook(useLimitBarAppearance).result.current.height).toBe(12);
});

it("updates mounted panels together and preserves the selection after remount", () => {
  const controls = renderHook(useLimitBarAppearance);
  const panel = renderHook(useLimitBarAppearance);
  act(() => controls.result.current.update({ style: "glass", height: 24 }));
  expect(panel.result.current.style).toBe("glass");
  expect(panel.result.current.height).toBe(24);
  controls.unmount();
  const restored = renderHook(useLimitBarAppearance);
  expect(restored.result.current.style).toBe("glass");
  act(() => restored.result.current.reset());
  expect(panel.result.current.height).toBe(12);
  expect(panel.result.current.style).toBe("classic");
});

it("responds when another tab clears the saved preferences", () => {
  const hook = renderHook(useLimitBarAppearance);
  act(() => hook.result.current.update({ style: "metal" }));
  act(() => {
    window.localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
  expect(hook.result.current.style).toBe("classic");
});
