import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { normalizeBarAppearance, useLimitBarAppearance } from "./use-limit-bar-appearance.js";

beforeEach(() => window.localStorage.clear());

it("bounds invalid persisted values and recovers from malformed storage", () => {
  expect(normalizeBarAppearance({ style: "unknown", height: Infinity })).toEqual({ style: "classic", height: 12 });
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
