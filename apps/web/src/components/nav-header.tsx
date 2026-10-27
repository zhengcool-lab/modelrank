"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "榜单" },
  { href: "/library", label: "模型库" },
  { href: "/compare", label: "对比器" },
  { href: "/cost", label: "成本计算器" },
  { href: "/methodology", label: "方法论" },
  { href: "/news", label: "新闻" },
];

export function NavHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        padding: "0 44px",
        background: "var(--mr-card)",
        borderBottom: "1px solid var(--mr-border)",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              color: "var(--mr-text)",
            }}
          >
            ModelRank
          </span>
        </Link>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--mr-primary)",
            marginLeft: 10,
            padding: "1px 8px",
            borderRadius: 2,
            background: "var(--mr-primary-bg)",
          }}
        >
          模型榜
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          height: 64,
          boxSizing: "border-box",
          overflowX: "auto",
          flexWrap: "nowrap",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
                padding: "22px 14px 20px 14px",
                borderBottom: active ? "2px solid var(--mr-primary)" : "2px solid transparent",
                textDecoration: "none",
              }}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/search"
          style={{
            fontSize: 13,
            color: pathname.startsWith("/search")
              ? "var(--mr-primary)"
              : "var(--mr-text-2)",
            background: "var(--mr-card)",
            border: "1px solid var(--mr-border)",
            borderRadius: 4,
            height: 32,
            lineHeight: "30px",
            padding: "0 14px",
            marginLeft: 10,
            textDecoration: "none",
          }}
        >
          🔍 搜索
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
