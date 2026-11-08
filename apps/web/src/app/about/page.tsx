import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { UI_MODELS } from "@/lib/seed-data";
import { UI_NEWS } from "@/lib/news-data";

export const metadata: Metadata = {
  title: "关于我们 · ModelRank",
  description: "ModelRank 是一个独立的大模型能力排行榜：综合分直接采用 Artificial Analysis 智能指数，不接受付费排名。",
};

const P = ({ children }: { children: ReactNode }) => (
  <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.85, overflowWrap: "break-word" }}>
    {children}
  </p>
);

const H = ({ children }: { children: ReactNode }) => <b style={{ color: "var(--mr-text)" }}>{children}</b>;

const SECTIONS: { id: string; no: string; title: string; body: ReactNode }[] = [
  {
    id: "what",
    no: "01",
    title: "我们做什么",
    body: (
      <>
        <P>
          面向开发者与技术决策者的大模型能力排行榜。一屏之内给出<H>能力、价格、上下文、速率、可调用产品</H>
          这些选型时真正要比的量，而不是把链接堆成目录。
        </P>
        <P>
          页面上有两类数字，来源截然不同，我们不混着说：<H>搬运来的</H>（综合分、能力五维、价格与规格，来自第三方或厂商官方公开数据）和
          <H>站内标注的</H>（能力档 S/A/B/C、成本档、按任务成本、Agent 产品评级）。后者是本站基于公开信息的判断，依据写在对应页面，可被反驳。
        </P>
        <P>
          当前收录 {UI_MODELS.length} 个模型，每日 07:00 抓取一次公开数据，新模型通常在发布后 2–4 天进入榜单。
        </P>
      </>
    ),
  },
  {
    id: "source",
    no: "02",
    title: "数据从哪来",
    body: (
      <>
        <P>
          <H>综合分：直接采用 Artificial Analysis 智能指数（Intelligence Index，0–100）。</H>
          不做二次加权、不做 min-max 归一化、不引入人工调分系数。AA 给出多少，页面就显示多少，任何分数都能拿回 AA 官网一对一核对。
        </P>
        <P>
          <H>能力五维：</H>财务 / 战略 / 法律 / 工程 / 经济，同样取自 AA 的 Capability Indexes，用于解释「这个模型强在哪」，
          不参与综合分计算，缺数据的维度直接不显示，不补 0、不插值。
        </P>
        <P>
          <H>价格与规格：</H>各厂商官网公开的 API 定价页与模型文档，抓取后保留核对日期；促销价与原价并列，不做隐藏。
        </P>
        <P>
          <Link href="/data-sources" className="mr-link">数据来源页</Link>
          {" "}列出了所有被引用的公开评测与它们各自的污染风险；
          <Link href="/methodology" className="mr-link">评分方法论</Link>
          {" "}写清了每个分数与档位的判定规则。
        </P>
      </>
    ),
  },
  {
    id: "never",
    no: "03",
    title: "我们不做的事",
    body: (
      <>
        <P>
          <H>不接受付费排名，不接受厂商充值上榜。</H>
          排名只由公开实测成绩决定，厂商无法通过付费影响分数或排序。站内也没有任何付费位、推广位、置顶位。
        </P>
        <P>
          <H>不自建权重体系。</H>
          公开基准之间的权重分配没有客观最优解，自建权重等于把主观选择包装成客观分数。早期版本曾叠加过一套加权逻辑，
          现已撤掉——与真实数据源不一致的口径，宁可删掉也不留着好看。
        </P>
        <P>
          <H>不编数据填空。</H>
          抓不到就标「暂无 / 待核 / 未公开」，不用估算值、不用假 ELO、不把「不扣积分」当成 0 折。
          价格分级只对拿到真实报价的模型生效。
        </P>
      </>
    ),
  },
  {
    id: "limits",
    no: "04",
    title: "已知局限",
    body: (
      <>
        <P>
          <H>置信区间恒为 0、周环比多为空。</H>
          上游当前快照不提供这两项，页面显示「暂无」而不是伪造波动；宁可少一个数字，也不给一个看起来专业但没有依据的 ±0.0。
        </P>
        <P>
          <H>部分评测抓不到。</H>
          LMArena 与 HuggingFace 排行榜有反爬与归档限制，管道抓取行数为 0 属已知状态，不会用近似数据替代。
        </P>
        <P>
          <H>少数厂商图标缺失。</H>
          找不到官方方形标识的厂商与产品，用首字母方块兜底，不拿家族标或第三方图冒充官方。
        </P>
        <P>
          <H>Agent 产品评级是站内判断。</H>
          能力等级依据官方功能清单加公开横评交叉验证，遇到官方未公开的型号清单会标注「推断」，不写成确定事实。
        </P>
      </>
    ),
  },
  {
    id: "fix",
    no: "05",
    title: "纠错与申诉",
    body: (
      <>
        <P>
          发现数据错误、口径过时或页面异常，走 <Link href="/disclaimer" className="mr-link">免责声明与申诉</Link> 页登记，
          或在模型详情页底部留言；我们承诺 1 周内核实并更新，改了什么会写进方法论页的更新日志。
        </P>
        <P>
          价格与排名都可能随上游变化而失效，页面上标注的核对日期就是这条数据的保鲜期——超过保鲜期的数字，请以厂商官网为准。
        </P>
      </>
    ),
  },
];

export default function AboutPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <div className="mr-pad-x" style={{ paddingTop: 14, fontSize: 12, color: "var(--mr-text-3)" }}>
          <Link href="/" className="mr-link">模型榜</Link>
          <span style={{ color: "var(--mr-text-4)", margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--mr-text-2)" }}>关于</span>
        </div>

        <div className="mr-pad-x" style={{ paddingTop: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.4px", color: "var(--mr-text)" }}>关于 ModelRank</div>
          <div style={{ fontSize: 13, color: "var(--mr-text-2)", marginTop: 6 }}>
            独立、可核对、可申诉 · 分数搬运自公开数据，判断标注依据
          </div>
        </div>

        <div className="mr-mx flex flex-col md:flex-row" style={{ gap: 24, marginTop: 20 }}>
          {/* 左栏：章节索引 + 站点信息（sticky） */}
          <div className="hidden md:block" style={{ flex: "none", width: 168, position: "sticky", top: 20, alignSelf: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="mr-toc-link"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "7px 0",
                    paddingLeft: 10,
                    textDecoration: "none",
                    color: "var(--mr-text-2)",
                    fontSize: 12,
                    borderLeft: "2px solid transparent",
                  }}
                >
                  <span style={{ color: "var(--mr-text-4)", fontVariant: "tabular-nums", fontSize: 11 }}>{s.no}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "0.5px solid var(--mr-hairline)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mr-text-3)", letterSpacing: "0.4px" }}>站点信息</div>
              <div style={{ fontSize: 11, color: "var(--mr-text-3)", lineHeight: 1.8, marginTop: 6 }}>
                收录 {UI_MODELS.length} 个模型 · {UI_NEWS.length} 条新闻<br />
                每日 07:00 抓取 · 不接受付费排名
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/methodology"
                className="mr-btn-primary"
                style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
              >
                看评分方法论
              </Link>
              <Link
                href="/data-sources"
                className="mr-btn-outline"
                style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
              >
                数据来源
              </Link>
            </div>
          </div>

          {/* 右栏：叙事章节 */}
          <div style={{ minWidth: 0, flex: 1 }}>
            {SECTIONS.map((s) => (
              <div
                key={s.id}
                id={s.id}
                className="mr-card"
                style={{ padding: "20px 22px", marginBottom: 14, scrollMarginTop: 24 }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--mr-primary)", fontVariant: "tabular-nums", lineHeight: 1 }}>
                    {s.no}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>{s.title}</span>
                </div>
                {s.body}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
