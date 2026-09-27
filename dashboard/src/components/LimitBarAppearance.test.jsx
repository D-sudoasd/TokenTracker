import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { copy, setCopyLocale } from "../lib/copy";
import { EN_LOCALE } from "../lib/locale";
import { BAR_STYLES, DEFAULT_PALETTE } from "../hooks/use-limit-bar-appearance.js";
import { LimitBarAppearance } from "./LimitBarAppearance.jsx";

beforeEach(() => { localStorage.clear(); setCopyLocale(EN_LOCALE); });

it("applies exact preview height, color changes and saved style through the controls", () => {
  const { container, unmount } = render(<LimitBarAppearance />);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "6" } });
  for (const preview of container.querySelectorAll(".tt-bar-swatch")) {
    expect(preview.style.getPropertyValue("--tt-bar-height")).toBe("6px");
  }
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "status-gradient" } });
  fireEvent.change(screen.getByLabelText(copy("limits.appearance.safe")), { target: { value: DEFAULT_PALETTE.danger } });
  fireEvent.change(screen.getByLabelText(`${copy("limits.appearance.warning")}: ${copy("limits.appearance.endColor")}`), { target: { value: DEFAULT_PALETTE.safeEnd } });
  fireEvent.click(screen.getByRole("button", { name: copy("limits.appearance.frost") }));
  const saved = JSON.parse(localStorage.getItem("tt.limits.barAppearance"));
  expect(saved).toMatchObject({ style: "frost", height: 6, colorMode: "status-gradient", palette: { safe: DEFAULT_PALETTE.danger, warningEnd: DEFAULT_PALETTE.safeEnd } });
  expect(container.querySelectorAll(".tt-bar-swatch")).toHaveLength(BAR_STYLES.length);
  unmount();
  render(<LimitBarAppearance />);
  expect(screen.getByRole("button", { name: copy("limits.appearance.frost") })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: copy("limits.appearance.reset") }));
  expect(screen.getByRole("slider")).toHaveValue("12");
  expect(screen.getByRole("combobox")).toHaveValue("solid");
});
