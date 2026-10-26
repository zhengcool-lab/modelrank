import Link from "next/link";

export function Footer() {
  return (
    <div
      style={{
        margin: "22px 44px 0 44px",
        paddingTop: 16,
        borderTop: "1px solid var(--mr-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/methodology" style={{ color: "var(--mr-text-3)", textDecoration: "none" }}>
          方法论
        </Link>{" "}
        · <span style={{ cursor: "pointer" }}>数据来源</span> ·{" "}
        <span style={{ cursor: "pointer" }}>免责声明</span> ·{" "}
        <span style={{ cursor: "pointer" }}>关于</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        © 2026 ModelRank 模型榜 · 示例/mockup 数据，不构成采购建议
      </div>
    </div>
  );
}
