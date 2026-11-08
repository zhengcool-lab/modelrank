"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { InputNumber } from "@arco-design/web-react";
import { estimateMonthlyCost } from "@/lib/cost-formula";
import { UI_MODELS } from "@/lib/seed-data";
import { formatDate } from "@/lib/derived-data";
import { useCompare } from "@/context/compare";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

// 成本计算器可选模型 = UI_MODELS 中已有真实 token 单价（输入或输出价 > 0）的模型。
// 注意：SEED_MODELS 是原型期手写模型（gpt-5 等），其 id 与真实榜单 UI_MODELS 不一致，
// 直接用它做 find 会在运行时崩（TypeError: undefined.name）。价格接入前列表为空并显示诚实空态。
const COST_MODELS = UI_MODELS.filter(
  (m) => (m.priceInput ?? 0) > 0 || (m.priceOutput ?? 0) > 0
);
const CACHE_OPTIONS = [0, 0.3, 0.6] as const;

// 全站统一金额/数字格式化：四舍五入 + zh-CN 千分位，标题/明细/推荐三处共用
const fmt = (n: number) => Math.round(n).toLocaleString("zh-CN");

function CostInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const { toggle, has } = useCompare();

  // 初始选中模型优先取 URL ?model=，校验失败再回退到第一个可选模型
  const initialFromUrl = sp.get("model");
  const [modelId, setModelId] = useState<string | undefined>(
    initialFromUrl && UI_MODELS.some((m) => m.id === initialFromUrl)
      ? initialFromUrl
      : COST_MODELS[0]?.id
  );
  const [totalWan, setTotalWan] = useState<number | null>(4000); // 万 token；null 表示未输入
  const [alpha, setAlpha] = useState(0.25);
  const [cache, setCache] = useState<number>(0.3);

  const model = UI_MODELS.find((m) => m.id === modelId) ?? UI_MODELS[0];
  // 空态：输入被清空或 ≤0 时不计算，结果区显示"—"
  const hasInput = totalWan != null && totalWan > 0;
  const effectiveWan = hasInput ? (totalWan as number) : 0;
  const totalM = Math.max(0, effectiveWan) / 100; // 万 -> 百万

  const result = useMemo(
    () =>
      estimateMonthlyCost({
        totalTokensM: totalM,
        alpha,
        cacheRate: cache,
        priceInput: model.priceInput,
        priceOutput: model.priceOutput,
      }),
    [totalM, alpha, cache, model]
  );

  const inputTokM = totalM * alpha;
  const outputTokM = totalM * (1 - alpha);
  const inputCost = totalM * alpha * model.priceInput * (1 - cache);
  const outputCost = totalM * (1 - alpha) * model.priceOutput;
  const cachePct = Math.round(cache * 100);

  // 同预算可考虑：按与当前结果的成本差绝对值升序取前 2（纯展示排序，公式/价格不变）
  // 推荐范围约束在可选的模型内，避免推荐到按钮组外导致选中态断裂
  const others = UI_MODELS.filter((m) => m.id !== modelId && COST_MODELS.some((c) => c.id === m.id))
    .map((o) => ({
      ...o,
      cost: estimateMonthlyCost({
        totalTokensM: totalM,
        alpha,
        cacheRate: cache,
        priceInput: o.priceInput,
        priceOutput: o.priceOutput,
      }),
    }))
    .sort((a, b) => Math.abs(a.cost - result) - Math.abs(b.cost - result))
    .slice(0, 2);

  // 发起对比：先把当前模型加入对比集，再跳转到 /compare
  const startCompare = () => {
    if (!has(model.id)) toggle(model.id);
    router.push("/compare");
  };

  // 无真实 token 单价时显示诚实空态（不渲染 0 价假结果，也不因旧模型 id 崩溃）
  if (COST_MODELS.length === 0) {
    return (
      <>
        <div className="mr-pad-x" style={{ paddingTop: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>成本计算器</div>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
            按月用量与输入/输出比例，估算月度 API 成本
          </div>
        </div>
        <div className="mr-card mr-mx" style={{ padding: "20px 22px", marginTop: 18, maxWidth: 640 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>暂无可计算的模型价格</div>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 8, lineHeight: 1.7 }}>
            榜单数据来自 Artificial Analysis 的每任务成本，尚未接入各模型官方 token 单价（输入/输出每百万 tokens）。
            为避免用估算价或 0 价误导，成本计算器暂时停用；真实 token 单价接入后会自动恢复。
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8 }}>
            模型榜单、价格分级（high/mid/low）与对比功能不受影响，可正常使用。
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mr-pad-x" style={{ paddingTop: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>成本计算器</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          按月用量与输入/输出比例，估算月度 API 成本
        </div>
      </div>

      <div className="mr-mx" style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 18 }}>
        {/* left params */}
        <div className="mr-card" style={{ flex: "1 1 320px", padding: "20px 22px", minWidth: 0 }}>
          <div id="cost-model-label" style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>选择模型</div>
          <div
            role="radiogroup"
            aria-labelledby="cost-model-label"
            className="grid grid-cols-2 md:grid-cols-4 gap-1.5"
            style={{ background: "var(--mr-card-2)", borderRadius: "var(--mr-radius)", padding: 3, marginTop: 10 }}
          >
            {COST_MODELS.map((m) => {
              const active = modelId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setModelId(m.id)}
                  style={{
                    height: 32,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : "var(--mr-text-2)",
                    background: active ? "var(--mr-primary)" : "transparent",
                    padding: "0 10px",
                    borderRadius: "var(--mr-pill)",
                    border: active ? "1px solid var(--mr-primary)" : "1px solid transparent",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          <label
            htmlFor="cost-total-wan"
            style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 20 }}
          >
            月总 token 量（万）
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
            <div style={{ flex: "0 1 240px", minWidth: 0 }}>
              <InputNumber
                id="cost-total-wan"
                value={totalWan ?? undefined}
                onChange={(v) => setTotalWan(typeof v === "number" ? v : null)}
                step={100}
                min={0}
                max={10000}
                style={{ width: "100%" }}
              />
            </div>
            <span style={{ fontSize: 12, color: "var(--mr-text-3)", whiteSpace: "nowrap" }}>万 tokens</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            步进 ±100 万；1 万 = 0.01M；上限 10000 万（约 1 亿 tokens/月）
          </div>

          <label
            htmlFor="cost-alpha"
            style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 20 }}
          >
            输入占比 α（0.05–0.5，默认 0.25）
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <input
              id="cost-alpha"
              type="range"
              min={0.05}
              max={0.5}
              step={0.05}
              value={alpha}
              aria-label="输入占比 α"
              aria-valuetext={`${Math.round(alpha * 100)}%`}
              onChange={(e) => setAlpha(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--mr-primary)" }}
            />
            <span style={{ width: 48, fontSize: 13, fontWeight: 600, color: "var(--mr-primary)", textAlign: "right" }}>
              {alpha.toFixed(2)}
            </span>
          </div>
          <div
            style={{
              fontSize: 12,
              color: hasInput ? "var(--mr-text-2)" : "var(--mr-text-3)",
              marginTop: 8,
              fontVariant: "tabular-nums",
            }}
          >
            输入 {fmt(inputTokM)}M / 输出 {fmt(outputTokM)}M tokens，月总量 {fmt(totalM)}M
          </div>

          <div id="cost-cache-label" style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 18 }}>缓存命中率</div>
          <div
            role="radiogroup"
            aria-labelledby="cost-cache-label"
            style={{ display: "inline-flex", background: "var(--mr-card-2)", borderRadius: "var(--mr-pill)", padding: 3, marginTop: 10 }}
          >
            {CACHE_OPTIONS.map((c) => {
              const active = cache === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setCache(c)}
                  style={{
                    height: 32,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#fff" : "var(--mr-text-2)",
                    background: active ? "var(--mr-primary)" : "transparent",
                    padding: "0 16px",
                    borderRadius: "var(--mr-pill)",
                    border: active ? "1px solid var(--mr-primary)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  {c * 100}%
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            默认 30%
          </div>
        </div>

        {/* right result —— 移动端全宽堆叠，桌面固定 400px 与左卡并排 */}
        <div
          className="w-full md:w-[400px]"
          style={{
            flex: "0 1 auto",
            minWidth: 0,
            background: "var(--mr-primary)",
            borderRadius: "var(--mr-radius)",
            padding: "22px 24px",
            boxSizing: "border-box",
          }}
        >
          {/* ① 核心数字区 */}
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            预估月成本（{model.name} · 含缓存折算）
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 40,
              fontWeight: 600,
              color: hasInput ? "#fff" : "rgba(255,255,255,0.45)",
              lineHeight: 1.15,
              fontVariant: "tabular-nums",
            }}
          >
            {hasInput ? `$${fmt(result)}` : "—"}
          </div>
          {hasInput ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.9, marginTop: 14, fontVariant: "tabular-nums" }}>
              输入 {fmt(inputTokM)}M × ${model.priceInput}/M × (1 − {cachePct}%) ≈ ${fmt(inputCost)}
              <br />
              输出 {fmt(outputTokM)}M × ${model.priceOutput}/M ≈ ${fmt(outputCost)}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.9, marginTop: 14 }}>
              输入月 token 用量后计算
            </div>
          )}

          {/* ② 参数快照行 */}
          {hasInput && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "16px 0" }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontVariant: "tabular-nums" }}>
                月总量 {fmt(effectiveWan)} 万 = {fmt(totalM)}M · α {Math.round(alpha * 100)}% · 缓存 {cachePct}% · 价格更新于 {formatDate(model.priceUpdatedAt)}
              </div>
            </>
          )}

          {/* ③ 操作区 */}
          <button
            type="button"
            onClick={startCompare}
            className="hover:opacity-90"
            style={{
              display: "block",
              width: "100%",
              height: 32,
              background: "#fff",
              color: "var(--mr-primary)",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: "var(--mr-pill)",
              border: "none",
              cursor: "pointer",
              marginTop: 16,
            }}
          >
            ↗ 用该模型发起对比
          </button>

          {/* 推荐区：可点击小卡片；空输入时隐藏避免显示 ≈$0/月 */}
          {hasInput && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "16px 0 12px 0" }} />
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>同预算可考虑：</div>
              {others.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setModelId(o.id)}
                  className="hover:bg-white/20"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "var(--mr-pill)",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.9)",
                    border: "none",
                    cursor: "pointer",
                    marginTop: 8,
                    fontVariant: "tabular-nums",
                  }}
                >
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                  <span style={{ flex: "none", whiteSpace: "nowrap", fontVariant: "tabular-nums" }}>≈${fmt(o.cost)}/月</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* formula card */}
      <div className="mr-card mr-mx" style={{ marginTop: 16, padding: "16px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>计算公式</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 8 }}>
          月成本 = 总token × α × 输入价 × (1 − 缓存命中率) + 总token × (1 − α) × 输出价
        </div>
        <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
          口径：总 token 以 M（百万）计，1 万 = 0.01M；α 为输入占比（默认 0.25）；缓存命中率默认 30%
        </div>
      </div>
    </>
  );
}

export default function CostPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>成本计算器</span>
      </div>

      {/* useSearchParams 必须包在 Suspense 边界内 */}
      <Suspense fallback={<div className="mr-pad-x" style={{ paddingTop: 24 }}>加载中…</div>}>
        <CostInner />
      </Suspense>
      </div>

      <Footer />
    </div>
  );
}
