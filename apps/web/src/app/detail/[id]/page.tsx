import type { Metadata } from "next";
export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getUIModel, UI_MODELS, UI_NEWS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { DetailCharts } from "@/components/detail-charts";
import { LeadForm } from "@/components/lead-form";
import { DeltaText, OpenTag, TierBadge } from "@/components/badges";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const model = getUIModel(id);
  if (!model) return { title: "模型未找到 · ModelRank" };
  return {
    title: `${model.name} 详情 · ModelRank`,
    description: `${model.name} 价格、性能、性价比详情`,
  };
}

export default async function DetailPage({ params }: Props) {
  const { id } = await params;
  const model = getUIModel(id);
  if (!model) notFound();

  const rank = UI_MODELS.filter((m) => m.score > model.score).length + 1;
  const rankColor =
    rank === 1 ? "var(--mr-gold)" : rank === 2 ? "var(--mr-silver)" : rank === 3 ? "var(--mr-bronze)" : "var(--mr-text-3)";
  const relatedNews = UI_NEWS.filter((n) => n.relatedModel === model.name).slice(0, 2);

  return (
    <div>
      <NavHeader />

      {/* breadcrumb */}
      <div style={{ padding: "20px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <Link href="/library" className="mr-link">{model.vendor}</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>{model.name} · 示例/mockup</span>
      </div>

      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "14px 44px 0 44px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 8,
              background: "var(--mr-primary)",
              color: "#fff",
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            {model.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>
                {model.name}
              </span>
              <OpenTag openSource={model.openSource} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#fff",
                  background: "var(--mr-primary)",
                  padding: "1px 8px",
                  borderRadius: 2,
                }}
              >
                性价比 {model.tier}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 4 }}>
              {model.vendor} · {model.blurb} · 更新于 {model.updatedAt}
            </div>
          </div>
        </div>
      </div>

      {/* main：移动端单列，桌面端主内容 2fr + 侧栏 1fr */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 mx-11 mt-5">
        <div style={{ minWidth: 0 }}>
          {/* overview card */}
          <div
            className="mr-card"
            style={{
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>
                综合评分（公开基准聚合加权 0–100）
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 34, fontWeight: 600, color: "var(--mr-text)" }}>
                  {model.score.toFixed(1)}
                </span>{" "}
                <DeltaText model={model} />
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>综合排名</div>
              <div style={{ fontSize: 26, fontWeight: 600, color: rankColor, marginTop: 4 }}>
                #{rank} / 128
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 2 }}>
                ±{model.ci.toFixed(1)} 置信区间 · 示例/mockup
              </div>
            </div>
          </div>

          {/* trend + radar */}
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginBottom: 8 }}>
              评分趋势（近 12 周）· 能力雷达
            </div>
            <DetailCharts model={model} />
            <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8 }}>
              单位：综合分 · 每周采样 · 示例/mockup
            </div>
          </div>

          {/* price + specs */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <div className="mr-card" style={{ flex: "1 1 260px", padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>价格（API 按量）</div>
              <div style={{ display: "flex", gap: 24, marginTop: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>输入</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text)" }}>
                    ¥{model.priceInput}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--mr-text-2)" }}>/M tok</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>输出</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text)" }}>
                    ¥{model.priceOutput}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--mr-text-2)" }}>/M tok</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>同类中位数</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text-2)" }}>¥9 / ¥27</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10 }}>
                价格更新于 {model.priceUpdatedAt}
              </div>
              <Link
                href={`/cost?model=${model.id}`}
                className="mr-link"
                style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 600 }}
              >
                用成本计算器测算 →
              </Link>
            </div>
            <div className="mr-card" style={{ flex: "1 1 260px", padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>规格</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {[
                  `上下文 ${model.context}`,
                  `速率 ${model.speedTokPerS} tok/s`,
                  "最大输出 16K",
                  "知识截止 2025-06",
                  "参数规模未公开",
                ].map((s) => (
                  <span
                    key={s}
                    style={{
                      fontSize: 12,
                      color: "var(--mr-text-2)",
                      background: "var(--mr-card-2)",
                      padding: "4px 12px",
                      borderRadius: 4,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* related news */}
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>相关新闻</div>
            {relatedNews.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10 }}>暂无相关新闻 · 示例/mockup</div>
            )}
            {relatedNews.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--mr-border-soft)",
                  textDecoration: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 3 }}>
                    {n.source} · {n.time}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--mr-primary)" }}>站外 ↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* sidebar */}
        <div style={{ minWidth: 0 }}>
          <div className="mr-card" style={{ padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>厂商背景</div>
            <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 1.7, marginTop: 8 }}>
              {model.vendor} · 旗舰{model.openSource ? "开源" : "闭源"}模型线 · 示例/mockup 简介。
            </div>
          </div>
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>地区可用性</div>
            <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 1.7, marginTop: 8 }}>
              ✅ 中国大陆需合规代理接入 · ✅ 美国/欧洲直连
            </div>
          </div>
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>合规资质</div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["SOC 2", "ISO 27001"].map((s) => (
                <span
                  key={s}
                  style={{ fontSize: 12, color: "var(--mr-up)", background: "var(--mr-up-bg)", padding: "2px 10px", borderRadius: 2 }}
                >
                  {s}
                </span>
              ))}
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", background: "var(--mr-card-2)", padding: "2px 10px", borderRadius: 2 }}>
                暂未取得：算法备案（示例）
              </span>
            </div>
          </div>

          <LeadForm />
        </div>
      </div>

      <Footer />
    </div>
  );
}
