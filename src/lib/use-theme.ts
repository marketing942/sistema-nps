"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("cppem-theme");
    const initial: Theme =
      stored === "light" || stored === "dark"
        ? stored
        : document.documentElement.classList.contains("light")
          ? "light"
          : "dark";
    setTheme(initial);

    const obs = new MutationObserver(() => {
      setTheme(
        document.documentElement.classList.contains("light") ? "light" : "dark"
      );
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  const apply = useCallback((next: Theme) => {
    if (next === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
    localStorage.setItem("cppem-theme", next);
    setTheme(next);
  }, []);

  const toggle = useCallback(() => {
    apply(theme === "dark" ? "light" : "dark");
  }, [theme, apply]);

  return { theme, setTheme: apply, toggle };
}

export function useChartColors() {
  const { theme } = useTheme();
  if (theme === "light") {
    return {
      grid: "#e5e7eb",
      axis: "#6b7280",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e5e7eb",
      tooltipLabel: "#1f2937",
      tooltipText: "#111827",
      primary: "#00803D",
      gold: "#A07B10",
    };
  }
  return {
    grid: "#1f1f29",
    axis: "#6b6b7f",
    tooltipBg: "#101015",
    tooltipBorder: "#1f1f29",
    tooltipLabel: "#a1a1b3",
    tooltipText: "#ececf1",
    primary: "#00E63C",
    gold: "#C9A227",
  };
}
