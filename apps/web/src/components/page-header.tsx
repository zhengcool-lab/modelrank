import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 全站统一页头（ego 设计语言铺到二级页的载体）
 * - 面包屑 + 主标题 + 一句话副标题 + 右侧动作，四段固定节奏
 * - 标题字号全站一致（clamp 24→32），不再各页 24/30/32/40 混用
 * - 顶部一层极淡的品牌色晕染，取自 ego 首屏的渐变语言，深色模式自动降透明度
 */
export type Crumb = { label: string; href?: string };

export function PageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  bottom = 0,
}: {
  breadcrumb?: Crumb[];
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  bottom?: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        paddingTop: breadcrumb?.length ? 14 : 28,
        paddingBottom: bottom,
        isolation: "isolate",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "0 0 auto 0",
          height: 220,
          zIndex: -1,
          pointerEvents: "none",
          background:
            "radial-gradient(62% 230px at 50% -40px, color-mix(in srgb, var(--mr-primary) 8%, transparent), transparent 70%)",
        }}
      />
      <div className="mr-pad-x">
        {breadcrumb?.length ? (
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginBottom: 10 }}>
            {breadcrumb.map((c, i) => (
              <span key={`${c.label}-${i}`}>
                {i > 0 && <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>}
                {c.href ? (
                  <Link href={c.href} className="mr-link">
                    {c.label}
                  </Link>
                ) : (
                  <span style={{ color: "var(--mr-text-2)" }}>{c.label}</span>
                )}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between" style={{ gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(24px, 2.6vw, 32px)",
                fontWeight: 700,
                letterSpacing: "-0.6px",
                lineHeight: 1.18,
                color: "var(--mr-text)",
              }}
            >
              {title}
            </h1>
            {subtitle ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--mr-text-3)",
                  lineHeight: 1.6,
                  marginTop: 8,
                  maxWidth: 920,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
          {actions ? (
            <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
