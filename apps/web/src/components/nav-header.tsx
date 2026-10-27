"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
        padding: "0 16px",
        background: "var(--mr-card)",
        borderBottom: "1px solid var(--mr-border)",
        boxSizing: "border-box",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
      className="md:px-[44px]"
    >
      {/* left: logo */}
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

      {/* right: desktop nav (hidden on mobile) */}
      <div
        className="hidden md:flex"
        style={{
          alignItems: "center",
          gap: 2,
          height: 64,
          boxSizing: "border-box",
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

      {/* right: mobile controls (ThemeToggle + hamburger) */}
      <div className="flex md:hidden" style={{ alignItems: "center", gap: 8 }}>
        <ThemeToggle />
        <button
          type="button"
          aria-label="打开菜单"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            border: "1px solid var(--mr-border)",
            borderRadius: 4,
            background: "var(--mr-card)",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {menuOpen ? (
              <path d="M4 4L14 14M14 4L4 14" stroke="var(--mr-text)" strokeWidth="1.8" strokeLinecap="round" />
            ) : (
              <path d="M3 5H15M3 9H15M3 13H15" stroke="var(--mr-text)" strokeWidth="1.8" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* mobile dropdown panel */}
      {menuOpen && (
        <div
          style={{
            position: "absolute",
            top: 64,
            left: 0,
            right: 0,
            background: "var(--mr-card)",
            borderBottom: "1px solid var(--mr-border)",
            boxShadow: "var(--mr-shadow)",
            padding: "8px 0",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
                  padding: "12px 16px",
                  borderLeft: active ? "3px solid var(--mr-primary)" : "3px solid transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              fontSize: 14,
              color: pathname.startsWith("/search") ? "var(--mr-primary)" : "var(--mr-text-2)",
              padding: "12px 16px",
              borderLeft: pathname.startsWith("/search")
                ? "3px solid var(--mr-primary)"
                : "3px solid transparent",
              textDecoration: "none",
            }}
          >
            🔍 搜索
          </Link>
        </div>
      )}
    </header>
  );
}
