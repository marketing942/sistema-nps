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
      grid: "#e4dfd3",
      axis: "#6e6a5e",
      tooltipBg: "#ffffff",
      tooltipBorder: "#e4dfd3",
      tooltipLabel: "#2a2822",
      tooltipText: "#14120e",
      primary: "#8A7040",
      gold: "#3f6f9c",
    };
  }
  return {
    grid: "#26252e",
    axis: "#87847a",
    tooltipBg: "#111115",
    tooltipBorder: "rgba(175,146,86,0.3)",
    tooltipLabel: "#ada99b",
    tooltipText: "#e8e4d9",
    primary: "#C9AE7A",
    gold: "#5b8cb8",
  };
}
