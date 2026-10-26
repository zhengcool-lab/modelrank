"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="切换深浅色"
      title={isDark ? "切换到浅色" : "切换到深色"}
      style={{
        fontSize: 13,
        marginLeft: 8,
        height: 32,
        padding: "0 12px",
        borderRadius: 4,
        border: "1px solid var(--mr-border)",
        background: "var(--mr-card)",
        color: "var(--mr-text-2)",
        cursor: "pointer",
      }}
    >
      {mounted ? (isDark ? "☀ 浅色" : "🌙 深色") : "◐"}
    </button>
  );
}
