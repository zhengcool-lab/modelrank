"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { InputNumber } from "@arco-design/web-react";
import { estimateMonthlyCost, MOCK_MODELS } from "@modelrank/shared";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

const COST_MODELS = ["gpt-5", "deepseek-r1", "claude-opus-4-5"] as const;
const CACHE_OPTIONS = [0, 0.3, 0.6] as const;

export default function CostPage() {
  const [modelId, setModelId] = useState<(typeof COST_MODELS)[number]>("gpt-5");
  const [totalWan, setTotalWan] = useState<number>(4000); // 万 token
  const [alpha, setAlpha] = useState(0.25);
  const [cache, setCache] = useState<number>(0.3);

  const model = MOCK_MODELS.find((m) => m.id === modelId) ?? MOCK_MODELS[0];
  const totalM = Math.max(0, totalWan) / 100; // 万 -> 百万

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

  const others = MOCK_MODELS.filter((m) => m.id !== modelId).slice(0, 2);

  return (
    <div>
      <NavHeader />

      <div style={{ padding: "14px 44px 0 44px", fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>成本计算器</span>
      </div>

      <div style={{ padding: "24px 44px 0 44px" }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>成本计算器</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          按月用量与输入/输出比例，估算月度 API 成本 · 示例/mockup
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, margin: "18px 44px 0 44px" }}>
        {/* left params */}
        <div className="mr-card" style={{ flex: 1, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>选择模型</div>
          <div style={{ display: "inline-flex", background: "var(--mr-card-2)", borderRadius: 4, padding: 3, marginTop: 10 }}>
            {COST_MODELS.map((id) => {
              const m = MOCK_MODELS.find((x) => x.id === id)!;
              const active = modelId === id;
              return (
                <button
                  key={id}
                  onClick={() => setModelId(id)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
                    background: active ? "var(--mr-card)" : "transparent",
                    padding: "6px 16px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 3px rgba(29,33,41,0.12)" : "none",
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 20 }}>
            月总 token 量（万）
          </div>
          <div style={{ marginTop: 10 }}>
            <InputNumber
              value={totalWan}
              onChange={(v) => setTotalWan(typeof v === "number" ? v : 0)}
              step={100}
              min={0}
              style={{ width: 200 }}
            />
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            步进 ±100 万 token，支持边界到 0
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 20 }}>
            输入占比 α（0.05–0.5，默认 0.25）
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <input
              type="range"
              min={0.05}
              max={0.5}
              step={0.05}
              value={alpha}
              onChange={(e) => setAlpha(Number(e.target.value))}
              style={{ flex: 1, accentColor: "var(--mr-primary)" }}
            />
            <span style={{ width: 48, fontSize: 13, fontWeight: 600, color: "var(--mr-primary)", textAlign: "right" }}>
              {alpha.toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-2)", marginTop: 8 }}>
            输入 {inputTokM.toFixed(0)}M / 输出 {outputTokM.toFixed(0)} token（月总量 {totalM.toFixed(0)}M）
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", marginTop: 18 }}>缓存命中率</div>
          <div style={{ display: "inline-flex", background: "var(--mr-card-2)", borderRadius: 4, padding: 3, marginTop: 10 }}>
            {CACHE_OPTIONS.map((c) => {
              const active = cache === c;
              return (
                <button
                  key={c}
                  onClick={() => setCache(c)}
                  style={{
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
                    background: active ? "var(--mr-card)" : "transparent",
                    padding: "6px 16px",
                    borderRadius: 4,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: active ? "0 1px 3px rgba(29,33,41,0.12)" : "none",
                  }}
                >
                  {c * 100}%
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            默认 30%（行业 20–40% 中值）· 示例/mockup
          </div>
        </div>

        {/* right result */}
        <div
          style={{
            width: 400,
            flex: "none",
            background: "var(--mr-primary)",
            borderRadius: 8,
            padding: "22px 24px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
            预估月成本（{model.name} · 含缓存折算）
          </div>
          <div style={{ marginTop: 8, fontSize: 40, fontWeight: 600, color: "#fff" }}>
            ¥{Math.round(result).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.9, marginTop: 14 }}>
            输入 {inputTokM.toFixed(0)}M × ¥{model.priceInput}/M × (1 − {cache}) ≈ ¥{inputCost.toFixed(0)}
            <br />
            输出 {outputTokM.toFixed(0)}M × ¥{model.priceOutput}/M ≈ ¥{outputCost.toFixed(0)}
          </div>
          <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "14px 0" }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>
            月成本 = 总token × α × 输入价 × (1 − 缓存命中率) + 总token × (1 − α) × 输出价
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 10 }}>价格更新于 2026-10-16</div>
          <Link
            href="/compare"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              borderBottom: "1px solid rgba(255,255,255,0.6)",
            }}
          >
            ↗ 用该模型发起对比
          </Link>
          <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "16px 0 12px 0" }} />
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>同预算可考虑：</div>
          {others.map((o) => {
            const c = estimateMonthlyCost({
              totalTokensM: totalM,
              alpha,
              cacheRate: cache,
              priceInput: o.priceInput,
              priceOutput: o.priceOutput,
            });
            return (
              <div key={o.id} style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.8 }}>
                {o.name}（≈¥{Math.round(c).toLocaleString()}/月）
              </div>
            );
          })}
        </div>
      </div>

      {/* formula card */}
      <div className="mr-card" style={{ margin: "16px 44px 0 44px", padding: "16px 22px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>计算公式</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 8 }}>
          月成本 = 总token × α × 输入价 × (1 − 缓存命中率) + 总token × (1 − α) × 输出价
        </div>
        <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
          其中「总token」单位为百万 token（M）；α 为输入占比，默认 0.25；缓存命中率默认 30%。示例/mockup。
        </div>
      </div>

      <Footer />
    </div>
  );
}
