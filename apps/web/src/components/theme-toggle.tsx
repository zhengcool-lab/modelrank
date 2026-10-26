"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // SSR 与挂载前渲染稳定占位，避免 SSR 输出「切换到深色」而 CSR 首帧已是「切换到浅色」的 hydration mismatch。
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="切换深浅色"
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
        ◐
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
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
      {isDark ? "☀ 浅色" : "🌙 深色"}
    </button>
  );
}
