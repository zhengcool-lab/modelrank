import Link from "next/link";
import { UI_MODELS } from "@/lib/seed-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";

// 品牌化 404：返回首页 + 热门模型推荐
export default function NotFound() {
  const popular = [...UI_MODELS].sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <div
          className="mr-pad-x"
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 48,
            paddingBottom: 48,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-2px", color: "var(--mr-primary)" }}>404</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--mr-text)", marginTop: 8 }}>页面走丢了</div>
          <div style={{ fontSize: 13, color: "var(--mr-text-3)", marginTop: 8 }}>
            你访问的页面不存在，或已被移动。
          </div>

          <Link
            href="/"
            className="mr-btn-primary"
            style={{ marginTop: 20, display: "inline-block" }}
          >
            ← 返回首页
          </Link>

          <div style={{ marginTop: 36, fontSize: 12, color: "var(--mr-text-3)" }}>热门模型</div>
          {/* 响应式 grid：移动端两列、宽屏四列，避免长模型名横向溢出被裁切 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 10,
              marginTop: 10,
              width: "100%",
              maxWidth: 640,
            }}
          >
            {popular.map((m) => (
              <Link
                key={m.id}
                href={`/detail/${m.id}`}
                className="mr-card"
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "var(--mr-text)",
                  textDecoration: "none",
                  overflowWrap: "break-word",
                }}
              >
                {m.name} · {m.score.toFixed(1)}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
