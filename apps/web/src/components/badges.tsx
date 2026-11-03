import type { ModelSource, Tier, UIModelRecord } from "@/lib/types";

/**
 * 性价比评级徽章：S 主色实底白字 / A 蓝实底白字 / B 半透明灰底描边 / C 浅灰底描边。
 * A 级底色在 --mr-a-badge(#4c7bd9) 上白字对比度仅 ~4.1:1，未达 AA 4.5:1，
 * 故用 color-mix 压深一档（随 token 自动适配深浅色主题）。
 * B/C 用 color-mix 半透明灰 + 内描边，深浅色下都不发飘、不呈"白方块"。
 */
export function TierBadge({ tier }: { tier: Tier }) {
  const style: React.CSSProperties = {
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 12px",
    borderRadius: 4,
    lineHeight: 1.4,
  };
  if (tier === "S")
    return (
      <span style={{ ...style, background: "var(--mr-primary)", color: "#fff" }}>S</span>
    );
  if (tier === "A")
    return (
      <span
        style={{
          ...style,
          background: "color-mix(in srgb, var(--mr-a-badge) 82%, #000)",
          color: "#fff",
        }}
      >
        A
      </span>
    );
  if (tier === "B")
    return (
      <span
        style={{
          ...style,
          background: "color-mix(in srgb, var(--mr-text-3) 26%, transparent)",
          color: "var(--mr-text-2)",
          boxShadow:
            "inset 0 0 0 1px color-mix(in srgb, var(--mr-text-3) 38%, transparent)",
        }}
      >
        B
      </span>
    );
  return (
    <span
      style={{
        ...style,
        background: "var(--mr-card-2)",
        color: "var(--mr-text-3)",
        boxShadow: "inset 0 0 0 1px var(--mr-border)",
      }}
    >
      C
    </span>
  );
}

/** 开源/闭源 tag（间距由调用方用 gap 控制） */
export function OpenTag({ openSource }: { openSource: boolean }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 400,
        color: openSource ? "var(--mr-up)" : "var(--mr-primary)",
        background: openSource ? "var(--mr-up-bg)" : "var(--mr-primary-bg)",
        padding: "0 6px",
        borderRadius: 4,
        lineHeight: 1.6,
      }}
    >
      {openSource ? "开源" : "闭源"}
    </span>
  );
}

/** 数据来源 tag */
export function SourceTag({ source }: { source: ModelSource }) {
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
        borderRadius: 4,
      }}
    >
      {s.label}
    </span>
  );
}

/** 周环比 delta 文字 */
export function DeltaText({ model }: { model: UIModelRecord }) {
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
export function Sparkline({ model }: { model: UIModelRecord }) {
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
