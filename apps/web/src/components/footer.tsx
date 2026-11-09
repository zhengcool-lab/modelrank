import Link from "next/link";

export function Footer() {
  return (
    <div
      className="mr-container mr-pad-x flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
      style={{ marginTop: 22, marginBottom: 28, paddingTop: 16, borderTop: "0.5px solid var(--mr-hairline)" }}
    >
      <style>{`
        .footer-link {
          color: var(--mr-text-2);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .footer-link:hover {
          color: var(--mr-primary);
        }
      `}</style>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/methodology" className="footer-link">
          方法论
        </Link>{" "}
        ·{" "}
        <Link href="/data-sources" className="footer-link">
          数据来源
        </Link>{" "}
        ·{" "}
        <Link href="/disclaimer" className="footer-link">
          免责声明
        </Link>{" "}
        ·{" "}
        <Link href="/about" className="footer-link">
          关于
        </Link>
      </div>
      <div style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
        © {new Date().getFullYear()} ModelRank 模型榜 · 不构成采购建议
      </div>
    </div>
  );
}
