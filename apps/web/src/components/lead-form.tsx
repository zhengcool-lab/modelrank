"use client";

import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import { ProductLogo } from "./model-logo";
import { TierBadge } from "./badges";

/**
 * 详情页右栏：同厂商其他模型列表（替代原"企业咨询留资"表单）。
 * 按 vendor 过滤 UI_MODELS、排除当前模型；无同厂模型时给一个空状态引导。
 */
export function SameVendorModels({
  vendor,
  currentId,
}: {
  vendor: string;
  currentId: string;
}) {
  const siblings = UI_MODELS.filter((m) => m.vendor === vendor && m.id !== currentId).slice(0, 5);

  return (
    <div className="mr-card" style={{ padding: "18px 20px", marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>
        {vendor} 其他模型
      </div>
      {siblings.length === 0 ? (
        <div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 10, lineHeight: 1.6 }}>
            该厂商暂无其他已收录模型，后续会随榜单更新补充。
          </div>
          <Link
            href="/library"
            className="mr-link"
            style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 600 }}
          >
            浏览完整榜单 →
          </Link>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column" }}>
          {siblings.map((m) => (
            <Link
              key={m.id}
              href={`/detail/${m.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 0",
                borderBottom: "1px solid var(--mr-border-soft)",
                textDecoration: "none",
              }}
            >
              <ProductLogo modelId={m.id} modelName={m.name} size={28} radius={6} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--mr-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--mr-text-3)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 1,
                  }}
                >
                  {m.blurb}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>
                  {m.score.toFixed(1)}
                </span>
                <TierBadge tier={m.tier} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
