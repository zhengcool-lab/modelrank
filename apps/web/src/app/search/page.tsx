"use client";

import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UI_MODELS } from "@/lib/seed-data";
import { UI_NEWS } from "@/lib/news-data";
import { getHotSearches, matchModelsByQuery } from "@/lib/derived-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";
import { ProductLogo } from "@/components/model-logo";

/** 关键词高亮：大小写不敏感匹配（中文天然小写无关），React 自动转义文本节点 */
function Highlight({ text, kw }: { text: string; kw: string }) {
  const k = kw.trim().toLowerCase();
  if (!k) return <>{text}</>;
  const lower = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  for (;;) {
    const found = lower.indexOf(k, i);
    if (found === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (found > i) parts.push(text.slice(i, found));
    parts.push(
      <mark key={key++} style={{ background: "var(--mr-warn-bg)", color: "var(--mr-warn-text)", padding: "0 1px", borderRadius: 2 }}>
        {text.slice(found, found + k.length)}
      </mark>
    );
    i = found + k.length;
  }
  return <>{parts}</>;
}

function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} 天前`;
  const dt = new Date(t);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

const RECENT_KEY = "mr-recent-searches";
const RECENT_MAX = 6;

/** 首页空态示例词（点击即搜索） */
const EXAMPLE_TERMS = ["GPT", "开源", "价格", "DeepSeek"];

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function SearchInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialQ = sp.get("q") ?? "";
  // 初始 state 从 URL ?q= 读取
  const [q, setQ] = useState(initialQ);
  // 仅当 URL 带 ?q= 时自动聚焦
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // 输入时同步到 URL（不刷新页面，replace 不留历史记录）
  const updateQ = (next: string) => {
    setQ(next);
    setActiveIdx(-1);
    const trimmed = next.trim();
    const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    router.replace(url);
  };

  const commitSearch = (term: string) => {
    const trimmed = term.trim();
    if (trimmed) {
      setRecent((prev) => {
        const next = [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, RECENT_MAX);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    }
    setQ(trimmed);
    setActiveIdx(-1);
    router.replace(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
    inputRef.current?.focus();
  };

  // 前缀补全建议（品牌别名匹配，最多 6 条）
  const suggestions = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [] as { id: string; label: string }[];
    const seen = new Set<string>();
    const out: { id: string; label: string }[] = [];
    for (const m of matchModelsByQuery(UI_MODELS, kw)) {
      if (!seen.has(m.name)) {
        seen.add(m.name);
        out.push({ id: m.id, label: m.name });
      }
      if (out.length >= 6) break;
    }
    return out;
  }, [q]);

  const modelHits = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return matchModelsByQuery(UI_MODELS, kw);
  }, [q]);

  const newsHits = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return [];
    return UI_NEWS.filter(
      (n) => n.title.toLowerCase().includes(kw) || n.summary.toLowerCase().includes(kw)
    );
  }, [q]);

  const kw = q.trim();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length > 0) {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setActiveIdx(-1);
      setFocused(false);
      inputRef.current?.blur();
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        commitSearch(suggestions[activeIdx].label);
      } else {
        commitSearch(q);
      }
    }
  };

  return (
    <>
      {/* 响应式结果行样式（页面级局部样式，不动 globals.css） */}
      <style>{`
        .sr-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid var(--mr-border-soft); }
        .sr-main { flex: 1 1 auto; min-width: 0; }
        .sr-title { font-size: 14; font-weight: 600; color: var(--mr-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sr-sub { font-size: 12; color: var(--mr-text-3); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sr-side { flex: 0 0 auto; font-size: 13; white-space: nowrap; }
        .sr-news { flex: 1 1 auto; min-width: 0; }
        .sr-news-snip { font-size: 12; color: var(--mr-text-2); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 640px) {
          .sr-row { flex-wrap: wrap; row-gap: 6px; }
          .sr-side { width: 100%; font-size: 12; color: var(--mr-text-3); }
          /* 移动端即时搜索下冗余「搜索」按钮隐藏，输入框占满整行 */
          .sr-search-btn { display: none !important; }
          .sr-search-box { gap: 0 !important; }
        }
      `}</style>

      {/* search box */}
      <div className="mr-mx sr-search-box" role="search" style={{ position: "relative", display: "flex", gap: 10, marginTop: 18 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => updateQ(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              // 延迟关闭，让下拉点击先触发
              setTimeout(() => setFocused(false), 120);
            }}
            aria-label="全站搜索模型与新闻"
            placeholder="输入模型名 / 厂商，如 GPT、DeepSeek、开源…"
            style={{
              width: "100%",
              height: 40,
              padding: "0 32px 0 12px",
              border: "0.5px solid var(--mr-hairline)",
              borderRadius: "var(--mr-pill)",
              background: "var(--mr-card)",
              color: "var(--mr-text)",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
          {q && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => updateQ("")}
              style={{
                position: "absolute",
                right: 6,
                top: "50%",
                transform: "translateY(-50%)",
                width: 22,
                height: 22,
                border: "none",
                borderRadius: "50%",
                background: "var(--mr-card-2)",
                color: "var(--mr-text-3)",
                cursor: "pointer",
                fontSize: 12,
                lineHeight: "22px",
                padding: 0,
              }}
            >
              ×
            </button>
          )}

          {/* 前缀补全下拉 */}
          {focused && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                background: "var(--mr-card)",
                border: "0.5px solid var(--mr-hairline)",
                borderRadius: "var(--mr-radius)",
                boxShadow: "var(--mr-shadow)",
                zIndex: 20,
                overflow: "hidden",
              }}
            >
              {suggestions.map((s, i) => (
                <Link
                  key={s.id}
                  href={`/detail/${s.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // 阻止 input blur 先触发
                    commitSearch(s.label);
                  }}
                  style={{
                    display: "block",
                    padding: "8px 12px",
                    fontSize: 13,
                    color: "var(--mr-text)",
                    background: i === activeIdx ? "var(--mr-primary-bg)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <Highlight text={s.label} kw={kw} />
                </Link>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={() => commitSearch(q)} className="mr-btn-primary sr-search-btn" style={{ height: 40 }}>
          搜索
        </button>
      </div>

      {/* 空状态：引导 + 最近搜索 */}
      {kw === "" && (
        <div
          className="mr-mx"
          style={{
            marginTop: 22,
            border: "1px dashed var(--mr-text-4)",
            borderRadius: "var(--mr-radius)",
            padding: 28,
            textAlign: "center",
            background: "var(--mr-card)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text-2)" }}>输入关键词开始搜索</div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 8 }}>
            试试热门词，或浏览
            <Link href="/library" className="mr-link">全量模型库</Link>
          </div>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {EXAMPLE_TERMS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => commitSearch(t)}
                style={{
                  fontSize: 12,
                  color: "var(--mr-primary)",
                  background: "var(--mr-primary-bg)",
                  border: "1px solid transparent",
                  borderRadius: "var(--mr-pill)",
                  padding: "4px 14px",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          {recent.length > 0 && (
            <>
              <div style={{ marginTop: 18, fontSize: 12, color: "var(--mr-text-3)" }}>最近搜索</div>
              <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => commitSearch(r)}
                    style={{
                      fontSize: 12,
                      color: "var(--mr-text-2)",
                      background: "var(--mr-card-2)",
                      border: "0.5px solid var(--mr-hairline)",
                      borderRadius: "var(--mr-pill)",
                      padding: "3px 12px",
                      cursor: "pointer",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {kw !== "" && modelHits.length === 0 && newsHits.length === 0 && (
        /* 零结果统一空态：图标 + 提示 + 热门推荐 chips + 回到搜索 */
        <div
          className="mr-mx"
          style={{
            marginTop: 22,
            border: "1px dashed var(--mr-text-4)",
            borderRadius: "var(--mr-radius)",
            padding: "40px 24px",
            textAlign: "center",
            background: "var(--mr-card)",
          }}
        >
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              margin: "0 auto",
              borderRadius: "50%",
              background: "var(--mr-card-2)",
              color: "var(--mr-text-3)",
              fontSize: 22,
              lineHeight: "48px",
            }}
          >
            🔍
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)", marginTop: 14 }}>
            未找到与「{kw}」相关的内容
          </div>
          <div style={{ fontSize: 12, color: "var(--mr-text-3)", marginTop: 6 }}>
            换个关键词试试，或从下面的热门词开始
          </div>
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {getHotSearches().map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => commitSearch(t)}
                style={{
                  fontSize: 12,
                  color: "var(--mr-primary)",
                  background: "var(--mr-primary-bg)",
                  border: "1px solid transparent",
                  borderRadius: "var(--mr-pill)",
                  padding: "4px 14px",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={() => {
                updateQ("");
                inputRef.current?.focus();
              }}
              className="mr-btn-outline"
              style={{ fontSize: 13, padding: "7px 20px" }}
            >
              清除并重新搜索
            </button>
          </div>
        </div>
      )}

      {kw !== "" && (modelHits.length > 0 || newsHits.length > 0) && (
        <>
          {modelHits.length > 0 && (
            <>
              <div className="mr-mx" style={{ fontSize: 14, fontWeight: 600, color: "var(--mr-text)", marginTop: 22, marginBottom: 10 }}>
                模型（{modelHits.length}）
              </div>
              <div className="mr-card mr-mx" style={{ overflow: "hidden" }}>
                {modelHits.map((m) => (
                  <Link key={m.id} href={`/detail/${m.id}`} className="sr-row" style={{ textDecoration: "none", height: "auto" }}>
                    <ProductLogo modelId={m.id} modelName={m.name} size={36} radius={8} />
                    <div className="sr-main">
                      <div className="sr-title"><Highlight text={m.name} kw={kw} /></div>
                      <div className="sr-sub">
                        <Highlight text={m.vendor} kw={kw} /> · {m.openSource ? "开源" : "闭源"}
                      </div>
                    </div>
                    <div className="sr-side" style={{ color: "var(--mr-text)" }}>
                      综合 <b>{m.score.toFixed(1)}</b>
                    </div>
                    <div className="sr-side" style={{ color: "var(--mr-text-2)" }}>
                      {m.priceInput > 0 ? `输入 $${m.priceInput} / 输出 $${m.priceOutput}` : "价格待核对"}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {newsHits.length > 0 && (
            <>
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
                    className="sr-row"
                    style={{ textDecoration: "none", height: "auto" }}
                  >
                    <div className="sr-news">
                      <div className="sr-title">
                        <Highlight text={n.title} kw={kw} />
                      </div>
                      <div className="sr-news-snip">
                        <Highlight text={n.summary} kw={kw} />
                      </div>
                    </div>
                    <div className="sr-side">
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--mr-primary)", background: "var(--mr-primary-bg)", padding: "1px 8px", borderRadius: "var(--mr-pill)"}}>
                        {n.category}
                      </span>
                    </div>
                    <div className="sr-side" style={{ fontSize: 12, color: "var(--mr-text-3)" }}>
                      {n.source} · {fmtRelative(n.time)} · 站外 ↗
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
      <PageHeader
        breadcrumb={[{ label: "模型榜", href: "/" }, { label: "搜索" }]}
        title="搜索"
        subtitle="按模型名、厂商、关键词全站检索"
      />

      {/* useSearchParams 必须包在 Suspense 边界内，否则 next build 会报错 */}
      <Suspense fallback={<div className="mr-pad-x" style={{ paddingTop: 24 }}>加载中…</div>}>
        <SearchInner />
      </Suspense>
      </div>

      <Footer />
    </div>
  );
}
