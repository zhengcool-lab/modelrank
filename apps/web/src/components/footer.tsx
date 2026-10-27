import Link from "next/link";

export function Footer() {
  return (
    <div
      className="mr-mx flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
      style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--mr-border)" }}
    >
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/methodology" style={{ color: "var(--mr-text-3)", textDecoration: "none" }}>
          方法论
        </Link>{" "}
        ·{" "}
        <Link href="/data-sources" style={{ color: "var(--mr-text-3)", textDecoration: "none" }}>
          数据来源
        </Link>{" "}
        ·{" "}
        <Link href="/disclaimer" style={{ color: "var(--mr-text-3)", textDecoration: "none" }}>
          免责声明
        </Link>{" "}
        ·{" "}
        <Link href="/about" style={{ color: "var(--mr-text-3)", textDecoration: "none" }}>
          关于
        </Link>
      </div>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        © 2026 ModelRank 模型榜 · 不构成采购建议
      </div>
    </div>
  );
}
