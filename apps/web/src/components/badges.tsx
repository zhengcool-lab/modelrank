import type { ModelRecord, Tier } from "@modelrank/shared";

/** 性价比评级徽章：S 主色实底白字 / A #4C7BD9 / B 灰实底 / C 灰底字 */
export function TierBadge({ tier }: { tier: Tier }) {
  const style: React.CSSProperties = {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 12px",
    borderRadius: 2,
  };
  if (tier === "S")
    return (
      <span style={{ ...style, background: "var(--mr-primary)", color: "#fff" }}>S</span>
    );
  if (tier === "A")
    return (
      <span style={{ ...style, background: "var(--mr-a-badge)", color: "#fff" }}>A</span>
    );
  if (tier === "B")
    return (
      <span style={{ ...style, background: "var(--mr-text-3)", color: "#fff" }}>B</span>
    );
  return (
    <span style={{ ...style, background: "var(--mr-card-2)", color: "var(--mr-text-2)" }}>
      C
    </span>
  );
}

/** 开源/闭源 tag */
export function OpenTag({ openSource }: { openSource: boolean }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 400,
        color: openSource ? "var(--mr-up)" : "var(--mr-primary)",
        background: openSource ? "var(--mr-up-bg)" : "var(--mr-primary-bg)",
        padding: "0 6px",
        borderRadius: 2,
        marginLeft: 4,
      }}
    >
      {openSource ? "开源" : "闭源"}
    </span>
  );
}

/** 数据来源 tag */
export function SourceTag({ source }: { source: ModelRecord["source"] }) {
  const map = {
    official: { label: "官方", color: "var(--mr-primary)", bg: "var(--mr-primary-bg)" },
    thirdparty: { label: "第三方", color: "var(--mr-text-3)", bg: "var(--mr-card-2)" },
    self: { label: "自测/估算", color: "var(--mr-text-3)", bg: "var(--mr-card-2)" },
  } as const;
  const s = map[source];
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 12,
        color: s.color,
        background: s.bg,
        padding: "2px 8px",
        borderRadius: 2,
      }}
    >
      {s.label}
    </span>
  );
}

/** 价格档位 tag */
export function PriceLevelTag({ level }: { level: ModelRecord["priceLevel"] }) {
  const map = {
    high: { label: "高", color: "var(--mr-warn-text)", bg: "var(--mr-warn-bg)" },
    mid: { label: "中", color: "var(--mr-text-2)", bg: "var(--mr-card-2)" },
    low: { label: "低", color: "var(--mr-up)", bg: "var(--mr-up-bg)" },
  } as const;
  const s = map[level];
  return (
    <span
      style={{
        fontSize: 12,
        color: s.color,
        background: s.bg,
        padding: "1px 6px",
        borderRadius: 2,
      }}
    >
      {s.label}
    </span>
  );
}

/** 周环比 delta 文字 */
export function DeltaText({ model }: { model: ModelRecord }) {
  if (model.trend === "flat" || model.delta === null)
    return (
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-text-4)" }}>—</span>
    );
  const up = model.trend === "up";
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: up ? "var(--mr-up)" : "var(--mr-down)",
      }}
    >
      {up ? "↑" : "↓"}
      {Math.abs(model.delta).toFixed(1)}
    </span>
  );
}

/** 迷你趋势 sparkline（SVG） */
export function Sparkline({ model }: { model: ModelRecord }) {
  if (model.trend === "flat")
    return (
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text-4)" }}>—</span>
    );
  const data = model.trendHistory;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const W = 64;
  const H = 22;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - 3 - ((v - min) / (max - min || 1)) * (H - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={model.trend === "up" ? "var(--mr-up)" : "var(--mr-down)"}
        strokeWidth={2}
      />
    </svg>
  );
}
