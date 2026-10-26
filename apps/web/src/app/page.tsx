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

      {/* alert */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 40,
          padding: "0 44px",
          background: "var(--mr-warn-bg)",
          borderLeft: "3px solid var(--mr-orange)",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--mr-warn-text)" }}>
          ⚠ 数据延迟告警：LMSYS Arena 数据延迟至 10-15 18:00 采集，官方榜单更新前以聚合值为准 · 示例/mockup
        </span>
      </div>

      {/* title */}
      <div style={{ padding: "24px 44px 0 44px" }}>
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

      {/* subscribe banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "14px 44px 0 44px",
          background: "var(--mr-primary-bg)",
          border: "1px solid var(--mr-border)",
          borderRadius: 8,
          padding: "10px 16px",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--mr-text)" }}>
          📈 立即订阅 Top20 变动提醒，第一时间收到排名变动推送 · <b>免费</b>
        </span>
        <a href="mailto:hi@modelrank.dev?subject=订阅" className="mr-link" style={{ fontWeight: 600 }}>
          免费订阅 →
        </a>
      </div>

      {/* scope tabs */}
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          padding: "14px 44px 0 44px",
          borderBottom: "1px solid var(--mr-border)",
          margin: "14px 44px 0 44px",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--mr-primary)",
            padding: "8px 16px",
            marginBottom: -1,
            borderBottom: "2px solid var(--mr-primary)",
          }}
        >
          综合
        </span>
        {["中文", "代码", "性价比", "多模态"].map((t) => (
          <span
            key={t}
            title="即将上线"
            aria-disabled="true"
            style={{
              fontSize: 14,
              color: "var(--mr-text-4)",
              padding: "8px 16px",
              cursor: "not-allowed",
              opacity: 0.6,
            }}
          >
            {t} <span style={{ fontSize: 12, color: "var(--mr-text-4)" }}>即将上线</span>
          </span>
        ))}
      </div>

      {/* filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 44px 0 44px" }}>
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>筛选：</span>
        {[
          { label: "厂商：全部 ▾", active: true },
          { label: "开源 / 闭源 ▾", active: false },
          { label: "价格区间 ▾", active: false },
          { label: "能力 ▾", active: false },
        ].map((f) => (
          <span
            key={f.label}
            style={{
              fontSize: 13,
              fontWeight: f.active ? 600 : 400,
              color: f.active ? "var(--mr-primary)" : "var(--mr-text-2)",
              padding: "0 12px",
              height: 32,
              lineHeight: "30px",
              border: `1px solid ${f.active ? "var(--mr-primary)" : "var(--mr-border)"}`,
              borderRadius: 4,
              background: f.active ? "var(--mr-primary-bg)" : "var(--mr-card)",
            }}
          >
            {f.label}
          </span>
        ))}
        <span style={{ fontSize: 13, color: "var(--mr-text-3)", padding: "0 12px", textDecoration: "underline" }}>
          清除全部
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 44px 0 44px" }}>
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>能力分区间</span>
        <input type="range" min={0} max={100} defaultValue={60} style={{ width: 220, accentColor: "var(--mr-primary)" }} />
        <input type="range" min={0} max={100} defaultValue={100} style={{ width: 220, accentColor: "var(--mr-primary)" }} />
        <span style={{ fontSize: 12, color: "var(--mr-text-4)" }}>60 – 100</span>
        <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>示例/mockup</span>
      </div>

      <TierFilteredBoard />

      <CompareBar />

      {/* news strip */}
      <div style={{ margin: "20px 44px 0 44px" }}>
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
