import type { Metadata } from "next";
export const runtime = "edge";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getUIModel, UI_MODELS } from "@/lib/seed-data";
import {
  getModelSpecs,
  getPriceMedian,
  getRelatedNews,
  getVendorBackground,
} from "@/lib/derived-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { DetailCharts } from "@/components/detail-charts";
import { SameVendorModels } from "@/components/lead-form";
import { DeltaText, OpenTag, TierBadge } from "@/components/badges";
import { ProductLogo, VendorLogo } from "@/components/model-logo";

/** 地区可用性：以各厂商官方支持地区列表为准（OpenAI 官方未开放中国大陆/香港/澳门） */
const VENDOR_REGIONS: Record<string, { ok: string[]; blocked: string[] }> = {
  OpenAI: {
    ok: ["美国", "英国 / 法国 / 德国等欧洲国家", "日本", "韩国", "新加坡", "台湾"],
    blocked: ["中国大陆", "香港", "澳门"],
  },
};

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
  const priceMedian = getPriceMedian();
  const relatedNews = getRelatedNews(model.name);

  return (
    <div>
      <NavHeader />

      {/* 全站内容容器：1200 居中，与导航 Logo 左缘对齐 */}
      <div className="mr-container">
      {/* breadcrumb */}
      <div className="mr-pad-x" style={{ paddingTop: 20, fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <Link href="/library" className="mr-link">{model.vendor}</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>{model.name}</span>
      </div>

      {/* header */}
      <div
        className="mr-pad-x"
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingTop: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <ProductLogo modelId={model.id} modelName={model.name} size={56} radius={8} />
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
                  borderRadius: 4,
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
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-5 mt-4 md:mt-5 mr-pad-x">
        <div style={{ minWidth: 0 }}>
          {/* overview card：左大评分 / 右竖排指标 / 下方通栏简介，层次分明 */}
          <div className="mr-card" style={{ padding: "18px 20px" }}>
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-8"
            >
              {/* 左：大数字评分 */}
              <div style={{ flex: "0 0 auto" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-3)" }}>
                  评分（Artificial Analysis 智能指数 0–100）
                </div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 46, fontWeight: 700, lineHeight: 1, color: "var(--mr-text)" }}>
                    {model.score.toFixed(1)}
                  </span>
                  <DeltaText model={model} />
                </div>
              </div>
              {/* 右：竖排关键指标 */}
              <div style={{ flex: "1 1 220px", minWidth: 200, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  {
                    label: "综合排名",
                    value: `#${rank} / ${UI_MODELS.length}`,
                    color: rankColor,
                  },
                  { label: "置信区间", value: model.ci > 0 ? `±${model.ci.toFixed(1)}` : "暂无置信区间", color: "var(--mr-text)" },
                  { label: "周环比", valueEl: <DeltaText model={model} /> },
                  { label: "收录时间", value: model.updatedAt, color: "var(--mr-text)" },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
                  >
                    <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>{row.label}</span>
                    {row.valueEl ?? (
                      <span style={{ fontSize: 13, fontWeight: 600, color: row.color }}>{row.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* 下方通栏简介 */}
            <div style={{ fontSize: 13, color: "var(--mr-text-2)", lineHeight: 1.7, marginTop: 14 }}>
              {model.vendor} 出品的{model.openSource ? "开源" : "闭源"}模型：
              {model.blurb}，支持 {model.context} 上下文窗口，
              是当前榜单中{rank <= 3 ? "头部" : "主流"}代表模型之一。
            </div>
          </div>

          {/* trend + radar：标题行右侧放采样口径说明，底部不留空行 */}
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>
                评分趋势（近 12 周）· 能力雷达
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", whiteSpace: "nowrap" }}>
                单位：综合分 · 每周采样
              </div>
            </div>
            <DetailCharts model={model} />
          </div>

          {/* price + specs */}
          <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
            <div className="mr-card" style={{ flex: "1 1 260px", padding: "18px 20px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>价格（API 按量）</div>
              <div className="flex flex-wrap gap-4 sm:gap-6" style={{ marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>输入</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text)" }}>
                    {model.priceInput > 0 ? `¥${model.priceInput}` : "待核对"}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--mr-text-2)" }}>/M tok</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>输出</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text)" }}>
                    {model.priceOutput > 0 ? `¥${model.priceOutput}` : "待核对"}
                    <span style={{ fontSize: 12, fontWeight: 400, color: "var(--mr-text-2)" }}>/M tok</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>同类中位数</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "var(--mr-text-2)" }}>
                    ¥{priceMedian.input} / ¥{priceMedian.output}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10 }}>
                价格更新于 {model.priceUpdatedAt.slice(5)}
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
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {getModelSpecs(model).map((row) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}
                  >
                    <span style={{ fontSize: 12, color: "var(--mr-text-3)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* related news */}
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>相关新闻</div>
            {relatedNews.length === 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: "24px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--mr-text-3)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <line x1="6" y1="9" x2="14" y2="9" />
                  <line x1="6" y1="13" x2="18" y2="13" />
                  <line x1="6" y1="17" x2="11" y2="17" />
                </svg>
                <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>暂无相关新闻</div>
                <Link href="/news" className="mr-link" style={{ fontSize: 12, fontWeight: 600 }}>
                  查看全部 →
                </Link>
              </div>
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
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10 }}>
              <VendorLogo vendor={model.vendor} size={40} radius={8} />
              <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 1.7 }}>
                {getVendorBackground(model.vendor) ??
                  `${model.vendor}，${model.openSource ? "开源" : "闭源"}模型线厂商，旗舰模型通过 API 与官方产品提供。`}
              </div>
            </div>
          </div>
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>地区可用性</div>
            {VENDOR_REGIONS[model.vendor] ? (
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                {VENDOR_REGIONS[model.vendor].ok.map((r) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--mr-text-2)" }}>{r}</span>
                    <span style={{ color: "var(--mr-up)", background: "var(--mr-up-bg)", padding: "1px 8px", borderRadius: 4, fontWeight: 600 }}>
                      可直连
                    </span>
                  </div>
                ))}
                {VENDOR_REGIONS[model.vendor].blocked.map((r) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--mr-text-2)" }}>{r}</span>
                    <span style={{ color: "var(--mr-text-3)", background: "var(--mr-card-2)", padding: "1px 8px", borderRadius: 4 }}>
                      官方未开放 · 需合规渠道
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--mr-text-2)", lineHeight: 1.7, marginTop: 8 }}>
                中国大陆需合规代理接入 · 美国 / 欧洲可直连
              </div>
            )}
          </div>
          <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>合规资质</div>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["SOC 2", "ISO 27001"].map((s) => (
                <span
                  key={s}
                  style={{ fontSize: 12, color: "var(--mr-up)", background: "var(--mr-up-bg)", padding: "2px 10px", borderRadius: 4 }}
                >
                  {s}
                </span>
              ))}
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", background: "var(--mr-card-2)", padding: "2px 10px", borderRadius: 4 }}>
                暂未取得：算法备案
              </span>
            </div>
          </div>

          <SameVendorModels vendor={model.vendor} currentId={model.id} />
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}
