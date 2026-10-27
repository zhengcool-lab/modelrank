"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UI_MODELS, UI_NEWS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  // 初始 state 从 URL ?q= 读取
  const [q, setQ] = useState(sp.get("q") ?? "");

  // 输入时同步到 URL（不刷新页面，replace 不留历史记录）
  const updateQ = (next: string) => {
    setQ(next);
    const trimmed = next.trim();
    const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    router.replace(url);
  };

  // 「搜索」按钮与回车走同一提交逻辑（这里就是即时过滤，按钮触发一次 replace 刷新 URL）
  const onSubmit = () => {
    const trimmed = q.trim();
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  };

  const modelHits = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return UI_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        m.vendor.toLowerCase().includes(kw) ||
        m.blurb.toLowerCase().includes(kw)
    );
  }, [q]);

  const newsHits = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return UI_NEWS.filter(
      (n) => n.title.toLowerCase().includes(kw) || n.summary.toLowerCase().includes(kw)
    );
  }, [q]);

  return (
    <>
      <div className="mr-pad-x" style={{ paddingTop: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>搜索</div>
        <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
          按模型名、厂商、关键词全站检索
        </div>
      </div>

      {/* search box */}
      <div className="mr-mx" style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <input
          autoFocus
          value={q}
          onChange={(e) => updateQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="输入模型名 / 厂商，如 GPT、DeepSeek、开源…"
          style={{
            flex: 1,
            height: 32,
            padding: "0 12px",
            border: "1px solid var(--mr-primary)",
            borderRadius: 4,
            background: "var(--mr-card)",
            color: "var(--mr-text)",
            fontSize: 13,
            boxShadow: "0 0 0 2px rgba(42,92,170,0.12)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button type="button" onClick={onSubmit} className="mr-btn-primary" style={{ height: 32 }}>
          搜索
        </button>
      </div>

      {q.trim() === "" ? (
        <div
          className="mr-mx"
          style={{
            marginTop: 22,
            border: "1px dashed var(--mr-text-4)",
            borderRadius: 8,
            padding: 28,
            textAlign: "center",
            background: "var(--mr-card)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text-2)" }}>输入关键词开始搜索</div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8 }}>
            试试「GPT」「开源」「价格」，或浏览
            <Link href="/library" className="mr-link">全量模型库</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mr-mx" style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)", marginTop: 22, marginBottom: 10 }}>
            模型（{modelHits.length}）
          </div>
          <div className="mr-card mr-mx" style={{ overflow: "hidden" }}>
            {modelHits.map((m) => (
              <Link
                key={m.id}
                href={`/detail/${m.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 64,
                  padding: "0 20px",
                  borderBottom: "1px solid var(--mr-border-soft)",
                  textDecoration: "none",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)" }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 2 }}>
                    {m.vendor} · {m.openSource ? "开源" : "闭源"}
                  </div>
                </div>
                <div style={{ width: 160, fontSize: 13, color: "var(--mr-text)" }}>
                  综合 <b>{m.score.toFixed(1)}</b>
                </div>
                <div style={{ width: 160, fontSize: 13, color: "var(--mr-text-2)" }}>
                  输入 {m.priceInput} / 输出 {m.priceOutput}
                </div>
              </Link>
            ))}
            {modelHits.length === 0 && (
              <div style={{ padding: 20, fontSize: 13, color: "var(--mr-text-3)" }}>未找到相关模型</div>
            )}
          </div>

          <div className="mr-mx" style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)", marginTop: 22, marginBottom: 10 }}>
            新闻（{newsHits.length}）
          </div>
          <div className="mr-card mr-mx" style={{ overflow: "hidden" }}>
            {newsHits.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 56,
                  padding: "0 20px",
                  borderBottom: "1px solid var(--mr-border-soft)",
                  textDecoration: "none",
                }}
              >
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--mr-text)" }}>{n.title}</div>
                <div style={{ width: 80 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "1px 8px", borderRadius: 2 }}>
                    {n.category}
                  </span>
                </div>
                <div style={{ width: 180, fontSize: 12, color: "var(--mr-text-3)", textAlign: "right" }}>
                  {n.source} · {n.time} · 站外 ↗
                </div>
              </a>
            ))}
            {newsHits.length === 0 && (
              <div style={{ padding: 20, fontSize: 13, color: "var(--mr-text-3)" }}>未找到相关新闻</div>
            )}
          </div>
        </>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
        <Link href="/" className="mr-link">模型榜</Link>
        <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
        <span style={{ color: "var(--mr-text-2)" }}>搜索</span>
      </div>

      {/* useSearchParams 必须包在 Suspense 边界内，否则 next build 会报错 */}
      <Suspense fallback={<div className="mr-pad-x" style={{ paddingTop: 24 }}>加载中…</div>}>
        <SearchInner />
      </Suspense>

      <Footer />
    </div>
  );
}
