"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Message } from "@arco-design/web-react";
import { UI_MODELS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { useCompare } from "@/context/compare";
import { DeltaText, TierBadge } from "@/components/badges";
import { ProductLogo } from "@/components/model-logo";

// —— 真实数据维度定义（AA Capability Indexes 可抓字段；无数据时诚实显示"暂无"） ——
const DIM_ROWS: {
  key: "financeAndAccounting" | "strategyAndOps" | "legal" | "engineering" | "economics";
  label: string;
}[] = [
  { key: "financeAndAccounting", label: "财务" },
  { key: "strategyAndOps", label: "战略" },
  { key: "legal", label: "法律" },
  { key: "engineering", label: "工程" },
  { key: "economics", label: "经济" },
];

function contextToK(c: string): number {
  if (c.endsWith("M")) return parseFloat(c) * 1000;
  if (c.endsWith("K")) return parseFloat(c);
  return parseFloat(c) || 0;
}

// 厂商筛选 chips（取 UI_MODELS 实际出现的厂商，按数量降序）
const VENDOR_CHIPS = [...new Set(UI_MODELS.map((m) => m.vendor))].sort(
  (a, b) =>
    UI_MODELS.filter((m) => m.vendor === b).length -
    UI_MODELS.filter((m) => m.vendor === a).length
);
const PRICE_LEVELS = [
  { id: "high", label: "高成本", color: "var(--mr-down)" },
  { id: "mid", label: "中等", color: "var(--mr-orange)" },
  { id: "low", label: "低成本", color: "var(--mr-up, #16a34a)" },
] as const;

function CompareInner() {
  const sp = useSearchParams();
  const { selected, toggle, clear, has, max } = useCompare();

  // —— 选择面板状态（真实交互，替代旧假预算卡） ——
  const [search, setSearch] = useState("");
  const [vendor, setVendor] = useState<string>("all");
  const [price, setPrice] = useState<string>("all");
  const [open, setOpen] = useState<string>("all");

  // 从 ?ids=a,b,c 同步初始选中到 CompareContext（仅首次挂载消费，避免覆盖用户手动操作）
  const [consumedUrl, setConsumedUrl] = useState(false);
  if (!consumedUrl) {
    const idsParam = sp.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter((s) => UI_MODELS.some((m) => m.id === s))
      : [];
    if (ids.length > 0) {
      clear();
      ids.forEach((id) => {
        if (!has(id)) toggle(id);
      });
    }
    setConsumedUrl(true);
  }

  const models = UI_MODELS.filter((m) => selected.includes(m.id));

  // —— 筛选器：按 搜索词/厂商/价格等级/开源 过滤全库 ——
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return UI_MODELS.filter((m) => {
      if (q && !(m.name.toLowerCase().includes(q) || m.vendor.toLowerCase().includes(q)))
        return false;
      if (vendor !== "all" && m.vendor !== vendor) return false;
      if (price !== "all" && m.priceLevel !== price) return false;
      if (open === "open" && !m.openSource) return false;
      if (open === "closed" && m.openSource) return false;
      return true;
    }).sort((a, b) => b.score - a.score);
  }, [search, vendor, price, open]);

  // 热门模型：score Top6（空态快速入口）
  const hotModels = useMemo(
    () => [...UI_MODELS].sort((a, b) => b.score - a.score).slice(0, 6),
    []
  );
  // 底部推荐：score Top3，排除已选
  const recModels = useMemo(() => {
    const byScore = [...UI_MODELS].sort((a, b) => b.score - a.score);
    return byScore.filter((m) => !selected.includes(m.id)).slice(0, 3);
  }, [selected]);

  // 加入对比（带上限提示）
  const addToCompare = (id: string) => {
    if (has(id)) {
      toggle(id); // 已选中 → 移除
      return;
    }
    if (selected.length >= max) {
      Message.info({ content: `最多同时对比 ${max} 个模型` });
      return;
    }
    toggle(id);
  };

  // —— 每行最优值计算：并列时多个；无数据（null）不参与 ——
  const bestIds = (
    getValue: (m: (typeof models)[number]) => number | null,
    better: "max" | "min"
  ): Set<string> => {
    if (models.length === 0) return new Set();
    const vals = models.map((m) => getValue(m)).filter((v): v is number => v != null);
    if (vals.length === 0) return new Set();
    const bestVal = better === "max" ? Math.max(...vals) : Math.min(...vals);
    return new Set(
      models
        .filter((m) => {
          const v = getValue(m);
          return v != null && v === bestVal;
        })
        .map((m) => m.id)
    );
  };

  const bestScore = bestIds((m) => m.score, "max");
  const bestContext = bestIds((m) => contextToK(m.context), "max");
  const bestCost = bestIds((m) => m.costPerTask, "min");
  const bestLatency = bestIds((m) => m.latencyS, "min");
  const bestDims: Record<string, Set<string>> = {};
  for (const d of DIM_ROWS) {
    bestDims[d.key] = bestIds((m) => m.dims?.[d.key] ?? null, "max");
  }

  const cellBest = (isBest: boolean): React.CSSProperties => ({
    fontWeight: isBest ? 700 : 400,
    color: isBest ? "var(--mr-primary)" : "var(--mr-text)",
    fontVariantNumeric: "tabular-nums",
  });

  // 价格等级徽标
  const priceBadge = (level: string) => {
    const def = PRICE_LEVELS.find((p) => p.id === level);
    if (!def) return null;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          height: 22,
          padding: "0 8px",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 999,
          border: `1px solid ${def.color}`,
          color: def.color,
          background: "transparent",
        }}
      >
        {def.label}
      </span>
    );
  };

  // —— 对比表行定义 ——
  type RowDef = {
    group: string;
    label: string;
    renderCell: (m: (typeof models)[number]) => React.ReactNode;
    bestSet?: Set<string>;
  };

  const hasDims = models.some(
    (m) => m.dims && Object.values(m.dims).some((v) => v > 0)
  );

  const tableRows: RowDef[] = [
    {
      group: "综合表现",
      label: "综合评分",
      bestSet: bestScore,
      renderCell: (m) => (
        <span style={{ fontSize: 16, fontWeight: 600, ...cellBest(bestScore.has(m.id)) }}>
          {m.score.toFixed(1)} <DeltaText model={m} />
          {bestScore.has(m.id) && <BestStar />}
        </span>
      ),
    },
    {
      group: "综合表现",
      label: "上下文窗口",
      bestSet: bestContext,
      renderCell: (m) => (
        <span style={{ fontSize: 14, ...cellBest(bestContext.has(m.id)) }}>
          {m.context === "--" ? "暂无" : m.context}
          {bestContext.has(m.id) && <BestStar />}
        </span>
      ),
    },
    {
      group: "成本与延迟",
      label: "每任务成本（USD）",
      bestSet: bestCost,
      renderCell: (m) => (
        <span style={{ fontSize: 14, ...cellBest(bestCost.has(m.id)) }}>
          {m.costPerTask != null ? `$${m.costPerTask.toFixed(2)}` : "暂无"}
          {bestCost.has(m.id) && <BestStar />}
        </span>
      ),
    },
    {
      group: "成本与延迟",
      label: "中位延迟（秒）",
      bestSet: bestLatency,
      renderCell: (m) => (
        <span style={{ fontSize: 14, ...cellBest(bestLatency.has(m.id)) }}>
          {m.latencyS != null ? `${m.latencyS.toFixed(1)}s` : "暂无"}
          {bestLatency.has(m.id) && <BestStar />}
        </span>
      ),
    },
    {
      group: "成本与延迟",
      label: "价格等级",
      renderCell: (m) => priceBadge(m.priceLevel),
    },
    {
      group: "成本与延迟",
      label: "性价比评级",
      renderCell: (m) => <TierBadge tier={m.tier} />,
    },
    // 能力子维度：AA 无五维数据时整行诚实提示，不渲染空进度条
    ...(hasDims
      ? DIM_ROWS.map<RowDef>((d) => ({
          group: "能力",
          label: d.label,
          bestSet: bestDims[d.key],
          renderCell: (m) => {
            const v = m.dims?.[d.key];
            const isBest = bestDims[d.key].has(m.id);
            if (v == null)
              return <span style={{ fontSize: 12.5, color: "var(--mr-text-3)" }}>暂无</span>;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--mr-border-soft)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${v}%`,
                      height: 6,
                      background: isBest ? "var(--mr-primary)" : "var(--mr-text-4)",
                      borderRadius: 3,
                    }}
                  />
                </div>
                <span style={{ minWidth: 28, textAlign: "right", fontSize: 13, ...cellBest(isBest) }}>
                  {v}
                </span>
                {isBest && <BestStar />}
              </div>
            );
          },
        }))
      : [
          {
            group: "能力",
            label: "能力子维度",
            renderCell: () => (
              <span style={{ fontSize: 12.5, color: "var(--mr-text-3)" }}>
                第三方榜单暂未提供该项评测数据
              </span>
            ),
          } as RowDef,
        ]),
  ];

  // 按 group 分组渲染：每组一个分隔标题
  const groups: { name: string; rows: RowDef[] }[] = [];
  for (const r of tableRows) {
    const g = groups.find((x) => x.name === r.group);
    if (g) g.rows.push(r);
    else groups.push({ name: r.group, rows: [r] });
  }

  const selectedIds = new Set(selected);

  // —— 选择面板（常驻，空态也可用） ——
  const pickerPanel = (
    <div
      className="mr-card"
      style={{
        padding: 18,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>挑选模型</div>
        <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
          {selected.length}/{max} 已选
        </div>
      </div>

      {/* 已选 chips */}
      {models.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {models.map((m) => (
            <span
              key={m.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 26,
                padding: "0 6px 0 8px",
                fontSize: 12,
                borderRadius: 999,
                background: "var(--mr-primary-bg)",
                border: "1px solid var(--mr-primary)",
                color: "var(--mr-primary)",
                fontWeight: 600,
              }}
            >
              {m.name}
              <button
                type="button"
                aria-label={`移除 ${m.name}`}
                onClick={() => toggle(m.id)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: "var(--mr-primary)",
                  fontSize: 13,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 搜索 */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="搜索模型名称或厂商…"
        style={{
          width: "100%",
          height: 34,
          lineHeight: "32px",
          padding: "0 12px",
          border: "1px solid var(--mr-border)",
          borderRadius: 6,
          background: "var(--mr-card)",
          color: "var(--mr-text)",
          boxSizing: "border-box",
          outline: "none",
          fontSize: 13,
        }}
      />

      {/* 厂商 chips */}
      <div>
        <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginBottom: 6 }}>厂商</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          <FilterChip active={vendor === "all"} onClick={() => setVendor("all")}>
            全部
          </FilterChip>
          {VENDOR_CHIPS.slice(0, 8).map((v) => (
            <FilterChip key={v} active={vendor === v} onClick={() => setVendor(vendor === v ? "all" : v)}>
              {v}
            </FilterChip>
          ))}
        </div>
      </div>

      {/* 价格等级 + 开源 */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginBottom: 6 }}>成本档</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <FilterChip active={price === "all"} onClick={() => setPrice("all")}>
              全部
            </FilterChip>
            {PRICE_LEVELS.map((p) => (
              <FilterChip key={p.id} active={price === p.id} onClick={() => setPrice(price === p.id ? "all" : p.id)}>
                {p.label}
              </FilterChip>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginBottom: 6 }}>开源</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <FilterChip active={open === "all"} onClick={() => setOpen("all")}>
              全部
            </FilterChip>
            <FilterChip active={open === "open"} onClick={() => setOpen(open === "open" ? "all" : "open")}>
              开源
            </FilterChip>
            <FilterChip active={open === "closed"} onClick={() => setOpen(open === "closed" ? "all" : "closed")}>
              闭源
            </FilterChip>
          </div>
        </div>
      </div>

      {/* 筛选结果列表 */}
      <div style={{ maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && (
          <div style={{ fontSize: 12.5, color: "var(--mr-text-3)", padding: "12px 4px", textAlign: "center" }}>
            没有符合筛选条件的模型
          </div>
        )}
        {filtered.slice(0, 16).map((m) => {
          const active = selectedIds.has(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => addToCompare(m.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 8px",
                border: active ? "1px solid var(--mr-primary)" : "1px solid transparent",
                borderRadius: 6,
                background: active ? "var(--mr-primary-bg)" : "transparent",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <ProductLogo modelId={m.id} modelName={m.name} size={26} radius={6} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: "var(--mr-text)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {m.name}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--mr-text-3)" }}>
                  {m.vendor} · 评分 {m.score.toFixed(1)} · {m.priceLevel}
                </div>
              </div>
              <span style={{ fontSize: 14, color: "var(--mr-primary)", flex: "none" }}>
                {active ? "✓" : "＋"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <div
        className="mr-mx"
        style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-start" }}
      >
        {/* 左：选择面板 */}
        <div style={{ width: 320, flex: "1 1 280px", maxWidth: 360, boxSizing: "border-box" }}>
          {pickerPanel}
        </div>

        {/* 右：对比表格 */}
        <div className="mr-card" style={{ flex: "1 1 420px", minWidth: 0, overflowX: "auto" }}>
          {models.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 30, lineHeight: 1 }}>⚖️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", marginTop: 12 }}>
                选择 2–4 个模型开始对比
              </div>
              <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
                从左侧筛选并点击模型加入，或从下方热门模型快速开始
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
                {hotModels.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => addToCompare(m.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      height: 32,
                      padding: "0 12px",
                      fontSize: 12,
                      borderRadius: 16,
                      border: "1px solid var(--mr-primary)",
                      background: "var(--mr-primary-bg)",
                      color: "var(--mr-primary)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ProductLogo modelId={m.id} modelName={m.name} size={16} radius={4} />
                    {m.name} ＋
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ minWidth: 680 }}>
              {/* 表头：指标 + 模型列 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  borderBottom: "1px solid var(--mr-border)",
                  background: "var(--mr-card-2)",
                  padding: "6px 0",
                }}
              >
                <div
                  style={{
                    width: 150,
                    flex: "none",
                    padding: "0 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--mr-text-3)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  指标
                </div>
                {models.map((m) => (
                  <div key={m.id} style={{ flex: 1, minWidth: 0, padding: "4px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ProductLogo modelId={m.id} modelName={m.name} size={22} radius={6} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "var(--mr-text)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {m.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--mr-text-3)" }}>{m.vendor}</div>
                      </div>
                      <button
                        type="button"
                        aria-label={`移除 ${m.name}`}
                        onClick={() => toggle(m.id)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                          color: "var(--mr-down)",
                          fontSize: 13,
                          lineHeight: 1,
                          padding: 0,
                          flex: "none",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 分组行 */}
              {groups.map((g) => (
                <div key={g.name}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--mr-text-3)",
                      letterSpacing: "0.06em",
                      padding: "8px 16px 4px",
                      background: "var(--mr-card)",
                    }}
                  >
                    {g.name}
                  </div>
                  {g.rows.map((row, i) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        minHeight: 44,
                        padding: "2px 0",
                        borderBottom:
                          i === g.rows.length - 1
                            ? "1px solid var(--mr-border)"
                            : "1px solid var(--mr-border-soft)",
                      }}
                    >
                      <div
                        style={{
                          width: 150,
                          flex: "none",
                          padding: "0 16px",
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--mr-text-2)",
                        }}
                      >
                        {row.label}
                      </div>
                      {models.map((m) => (
                        <div
                          key={m.id}
                          style={{ flex: 1, minWidth: 0, fontSize: 13, color: "var(--mr-text)", padding: "0 14px" }}
                        >
                          {row.renderCell(m)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部推荐：score Top3（真实），可一键加入对比 */}
      {models.length > 0 && (
        <div className="mr-mx" style={{ marginTop: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text-2)", marginBottom: 10 }}>
            高分推荐 · 点击加入对比
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {recModels.map((m) => (
              <div
                key={m.id}
                className="mr-card"
                style={{
                  flex: "1 1 220px",
                  padding: "16px 18px",
                  minWidth: 0,
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ProductLogo modelId={m.id} modelName={m.name} size={30} radius={8} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/detail/${m.id}`}
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--mr-text)",
                        display: "block",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {m.name}
                    </Link>
                    <div
                      style={{ fontSize: 12, color: "var(--mr-text-2)", fontVariantNumeric: "tabular-nums", marginTop: 2 }}
                    >
                      综合评分 {m.score.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                  {m.vendor} · {m.context === "--" ? "上下文待核" : `${m.context} 上下文`} ·{" "}
                  {priceBadge(m.priceLevel)}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => addToCompare(m.id)}
                    className="mr-btn-primary"
                    style={{ flex: 1, fontSize: 13, height: 34 }}
                  >
                    {has(m.id) ? "已加入 ✓" : "加入对比"}
                  </button>
                  <Link href={`/detail/${m.id}`} className="mr-btn-outline" style={{ fontSize: 13, height: 34, padding: "0 14px" }}>
                    详情
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// 最优值标记 ★
function BestStar() {
  return (
    <span style={{ marginLeft: 4, color: "var(--mr-primary)", fontSize: 12, fontWeight: 700, verticalAlign: 2 }}>
      ★
    </span>
  );
}

// 筛选 chips
function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 26,
        padding: "0 10px",
        fontSize: 12,
        borderRadius: 999,
        border: active ? "1px solid var(--mr-primary)" : "1px solid var(--mr-border)",
        background: active ? "var(--mr-primary-bg)" : "transparent",
        color: active ? "var(--mr-primary)" : "var(--mr-text-2)",
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

export default function ComparePage() {
  // 数据更新时间：取全部模型 priceUpdatedAt 最大值（与首页口径一致）
  const lastUpdated = UI_MODELS.map((m) => m.priceUpdatedAt).sort().pop() ?? "";
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
          <Link href="/" className="mr-link">
            模型榜
          </Link>
          <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--mr-text-2)" }}>对比器</span>
        </div>

        <div className="mr-pad-x" style={{ paddingTop: 24, paddingBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>
            模型对比
          </div>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
            筛选并选择 2–4 个模型，逐项对比真实榜单数据 · 数据更新于 {lastUpdated.slice(5)}
          </div>
        </div>

        {/* useSearchParams 必须包在 Suspense 边界内 */}
        <Suspense fallback={<div className="mr-pad-x" style={{ paddingTop: 24 }}>加载中…</div>}>
          <CompareInner />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
