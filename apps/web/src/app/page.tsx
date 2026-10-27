import Link from "next/link";
import { UI_NEWS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { CompareBar } from "@/components/compare-bar";
import { TierFilteredBoard } from "@/components/tier-filtered-board";

export default function Home() {
  const news = UI_NEWS.slice(0, 3);

  return (
    <div>
      <NavHeader />

      {/* title */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "32px 44px 0 44px",
        }}
      >
        <div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.2px", color: "var(--mr-text)" }}>
            大模型能力排行榜
          </div>
          <div style={{ fontSize: 13, color: "var(--mr-text-3)", marginTop: 6 }}>
            公开基准聚合加权（0–100）· 数据更新于 10-16 08:00 · 已收录 128 个模型 · 口径见
            <Link href="/methodology" className="mr-link" style={{ marginLeft: 4 }}>
              方法论
            </Link>
          </div>
        </div>
        <a
          href="mailto:hi@modelrank.dev?subject=订阅"
          style={{
            fontSize: 12,
            color: "var(--mr-text-3)",
            textDecoration: "none",
            marginTop: 10,
            whiteSpace: "nowrap",
          }}
        >
          📈 订阅变动提醒
        </a>
      </div>

      <div style={{ marginTop: 24 }}>
        <TierFilteredBoard />
      </div>

      <CompareBar />

      {/* news strip */}
      <div style={{ margin: "32px 44px 0 44px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--mr-text)" }}>大模型新闻</div>
          <Link href="/news" className="mr-link" style={{ fontSize: 13, fontWeight: 600 }}>
            查看全部 →
          </Link>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {news.map((n) => (
            <a
              key={n.id}
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1,
                background: "var(--mr-card)",
                border: "1px solid var(--mr-border)",
                borderRadius: 8,
                boxShadow: "var(--mr-shadow)",
                padding: 16,
                textDecoration: "none",
              }}
            >
              <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                <span
                  style={{
                    color: "var(--mr-primary)",
                    background: "var(--mr-primary-bg)",
                    padding: "1px 8px",
                    borderRadius: 2,
                    marginRight: 6,
                  }}
                >
                  {n.category}
                </span>
                <span style={{ background: "var(--mr-card-2)", padding: "1px 8px", borderRadius: 2 }}>
                  AI 摘要
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)", lineHeight: 1.4, marginTop: 8 }}>
                {n.title}
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8 }}>
                {n.source} · {n.time} · 站外 ↗
              </div>
            </a>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
