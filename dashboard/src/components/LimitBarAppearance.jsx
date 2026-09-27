import React, { useId } from "react";
import { copy } from "../lib/copy";
import { BAR_STYLES, useLimitBarAppearance } from "../hooks/use-limit-bar-appearance.js";
import "./limit-bar-appearance.css";

export function LimitBarAppearance() {
  const prefs = useLimitBarAppearance();
  const id = useId();
  return (
    <section className="space-y-4" aria-label={copy("limits.appearance.title")}>
      <div>
        <h3 className="text-sm font-semibold">{copy("limits.appearance.title")}</h3>
        <p className="mt-1 text-xs text-oai-gray-500 dark:text-oai-gray-400">{copy("limits.appearance.hint")}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {BAR_STYLES.map((style) => (
          <button key={style} type="button" aria-pressed={prefs.style === style}
            onClick={() => prefs.update({ style })}
            className={`rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oai-brand-500 ${prefs.style === style ? "border-oai-brand-500 bg-oai-brand-500/10" : "border-oai-gray-200 dark:border-oai-gray-700 hover:bg-oai-gray-100 dark:hover:bg-oai-gray-800"}`}>
            <span className="text-xs font-medium">{copy(`limits.appearance.${style}`)}</span>
            <div data-bar-style={style} style={{ "--tt-bar-height": `${prefs.height}px` }} className="mt-3 mb-1" aria-hidden="true">
              <div className="tt-limit-track"><div className="tt-limit-fill bg-emerald-500" style={{ width: "72%" }} /></div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs">
        <label htmlFor={id}>{copy("limits.appearance.height")}</label>
        <output htmlFor={id} className="tabular-nums">{copy("limits.appearance.pixels", { value: prefs.height })}</output>
      </div>
      <input id={id} type="range" min="6" max="24" step="1" value={prefs.height}
        onChange={(event) => prefs.update({ height: Number(event.target.value) })}
        className="w-full accent-emerald-500 cursor-pointer" />
      <button type="button" onClick={prefs.reset} className="text-xs underline underline-offset-4 rounded focus-visible:ring-2 focus-visible:ring-oai-brand-500">{copy("limits.appearance.reset")}</button>
    </section>
  );
}
