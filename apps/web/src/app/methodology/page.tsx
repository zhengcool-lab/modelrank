import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/derived-data";
import { NavHeader } from "@/components/nav-header";
import { Footer } from "@/components/footer";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "评分方法论 · ModelRank",
  description: "ModelRank 评分口径：综合分来源、能力五维含义、能力档划分、Agent 榜算法与已知局限。",
};

type Section = {
  id: string;
  no: string;
  title: string;
  body: ReactNode;
};

const P = ({ children }: { children: ReactNode }) => (
  <div style={{ fontSize: 14, color: "var(--mr-text-2)", lineHeight: 1.9, marginTop: 10 }}>{children}</div>
);

const SECTIONS: Section[] = [
  {
    id: "score-source",
    no: "01",
    title: "综合分从哪来",
    body: (
      <>
        <P>
          榜单分数<b style={{ color: "var(--mr-text)" }}>直接采用 Artificial Analysis 智能指数</b>
          （Intelligence Index，0–100）。本站不做二次加权、不做 min-max 归一化、不引入人工调和系数——
          AA 给出多少，页面就显示多少。
        </P>
        <P>
          为什么不自建指数：公开基准之间的权重分配没有客观最优解，自建权重等于把主观选择包装成客观分数。
          引用单一第三方权威源的好处是每个数字都能拿回 AA 官网逐一对账，读者不需要相信我们的算法。
        </P>
        <P>
          当前榜首 60.0（Gemini 4 Carbon）。分数整体不满 100 是 AA 刻度本身如此，不是本站归一化的结果，
          也不是模型「只有 60 分」——横向比较同刻度下的相对位置才有意义。
        </P>
      </>
    ),
  },
  {
    id: "dims",
    no: "02",
    title: "能力五维是什么",
    body: (
      <>
        <P>
          首页与详情页展开的五维来自 AA 的 Capability Indexes，字段一一对应：
        </P>
        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
          {[
            ["财务", "financeAndAccounting", "财报理解、会计科目、财务建模"],
            ["战略", "strategyAndOps", "商业分析、运营决策、多步规划"],
            ["法律", "legal", "条款解读、合规判断、风险识别"],
            ["工程", "engineering", "代码实现、系统设计、调试排障"],
            ["经济", "economics", "宏观与微观经济推理、数据解读"],
          ].map(([cn, en, note]) => (
            <div
              key={en}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                padding: "8px 12px",
                background: "var(--mr-card-2)",
                borderRadius: "var(--mr-radius-sm)",
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--mr-text)", minWidth: 32 }}>{cn}</span>
              <span style={{ fontSize: 12, color: "var(--mr-text-3)", fontFamily: "monospace" }}>{en}</span>
              <span style={{ fontSize: 12, color: "var(--mr-text-2)" }}>{note}</span>
            </div>
          ))}
        </div>
        <P>
          五维用于解释「这个模型强在哪」，<b style={{ color: "var(--mr-text)" }}>不参与综合分计算</b>，
          也不能替代总分做跨模型排序。缺数据的模型直接不显示该维，不补 0、不插值、不按平均值猜。
        </P>
      </>
    ),
  },
  {
    id: "tier",
    no: "03",
    title: "能力档 S / A / B / C",
    body: (
      <>
        <P>
          <b style={{ color: "var(--mr-text)" }}>S ≥ 50 · A ≥ 40 · B ≥ 25 · C &lt; 25</b>
        </P>
        <P>
          阈值切在 AA 智能指数上，只反映综合能力高低，不参与任何价格折算。所以单价高但能力强的模型仍在 S
          （如 GPT-6 Astra，57 分，$10/$50），单价低但能力弱的仍在 C——档位回答的是「有多强」，不是「划算不划算」。
        </P>
        <P>
          成本另由「每任务成本」独立标注：≥ $5 为高、≥ $1 为中、&lt; $1 为低。价格档与能力档是两条互不干扰的轴，
          页面正名「能力档」而非「性价比」，就是为了不让读者把两件事混成一件。
        </P>
      </>
    ),
  },
  {
    id: "agent",
    no: "04",
    title: "Agent 产品榜口径",
    body: (
      <>
        <P>
          与模型榜同源不同法：这里评的是<b style={{ color: "var(--mr-text)" }}>产品</b>，不是模型。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>一、能力等级 S / A / B / C</b><br />
          分编码、办公、调研、自动化四个维度独立评级，同一产品在不同维度可以不同级。定级依据两条：官方功能清单
          （官方文档、定价页、更新日志）与公开横评交叉验证；两者冲突时以官方为准并记录分歧。不采用任何单一
          benchmark 跑分，也不给带小数的精确分。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>二、可调用强模型</b><br />
          取该产品官方列出的可选型号中，站内 AA 评分最高者，分数与其模型详情页完全一致。
          未逐一公开型号清单的产品（WorkBuddy、扣子、Manus 等）标注为推断，不作绝对断言。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>三、模型计费倍率</b><br />
          只展示官方明确给出数值的倍率（TRAE Seed 系列 0.25x、Devin Gemini 4 Argon 0.5x 等），按官方原值呈现，
          不做二次换算；官方仅作定性描述的（「按 Token 单价浮动」「享专属补贴」）一律标「未公开」，不推算、不估算。
          「不扣积分」是独立的第四种状态（自定义模型按 BYO Key 自行结算），既不等于 0 折，也不等于倍率公开。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>四、价格与起价</b><br />
          全部来自官方定价页或官方帮助文档，页面标注核对日期；促销价与原价并列显示，不做隐藏。
          无固定标价的档位（按需报价、按地区浮动）标「询价」，不参与起价计算；起价 = 最低可购买档位，不是最低标价。
        </P>
      </>
    ),
  },
  {
    id: "cadence",
    no: "05",
    title: "数据更新与延迟",
    body: (
      <>
        <P>
          数据管道每日 07:00 抓取 AA 全量数据与厂商公开报价，经生成脚本落到前端数据层后构建部署。
          榜单分数与价格是两条独立的更新线，各自标注日期。
        </P>
        <P>
          AA 从模型发布到进入指数通常需要 1–3 天，我们的抓取再滞后一天，所以新模型在首页出现一般比官方晚 2–4 天。
          这个延迟是上游节奏，不是我们漏抓；如果你发现某个已发布的模型长时间缺失，那才是需要排查的缺陷。
        </P>
      </>
    ),
  },
  {
    id: "limits",
    no: "06",
    title: "已知局限与申诉",
    body: (
      <>
        <P>
          <b style={{ color: "var(--mr-text)" }}>置信区间</b><br />
          AA 未对外披露单模型 CI，本站该字段保留为 0，页面不显示 ±CI。不用估算值填满格子。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>周涨跌</b><br />
          历史快照尚未接入，delta 为 null，页面显示「暂无涨跌」而不是 0.0。全站没有一条假的涨跌数据。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>抓取受限的来源</b><br />
          LMArena 一类站点受 Cloudflare Turnstile 拦截，HuggingFace 的旧榜已归档，这两个来源当前不进自动抓取。
          缺口如实标注，绝不用估算 ELO 或补零来让表格看起来完整。
        </P>
        <P>
          <b style={{ color: "var(--mr-text)" }}>产品图标</b><br />
          个别产品没有官方方形图标，用首字母方块兜底，不用家族通用标冒充专属图标。
        </P>
        <P>
          发现分数、价格、倍率或等级有误，可通过下方申诉入口提交，核实后在下一版更正并保留修订记录。
        </P>
      </>
    ),
  },
];

export default function MethodologyPage() {
  return (
    <div>
      <NavHeader />

      <div className="mr-container">
        <PageHeader
          breadcrumb={[{ label: "模型榜", href: "/" }, { label: "评分方法论" }]}
          title="评分方法论"
          subtitle="分数只搬运、不自己算 · 每个数字都能回到源头核对"
        />

        <div className="mr-mx flex flex-col md:flex-row" style={{ gap: 24, marginTop: 20 }}>
          {/* 左栏：章节索引 + 侧注（sticky） */}
          <div
            className="hidden md:block"
            style={{ flex: "none", width: 168, position: "sticky", top: 20, alignSelf: "flex-start" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "7px 0",
                    textDecoration: "none",
                    color: "var(--mr-text-2)",
                    fontSize: 12,
                    borderLeft: "2px solid transparent",
                    paddingLeft: 10,
                  }}
                  className="mr-toc-link"
                >
                  <span style={{ color: "var(--mr-text-4)", fontVariant: "tabular-nums", fontSize: 11 }}>{s.no}</span>
                  <span>{s.title}</span>
                </a>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "0.5px solid var(--mr-hairline)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mr-text-3)", letterSpacing: "0.4px" }}>口径假设</div>
              <div style={{ fontSize: 11, color: "var(--mr-text-3)", lineHeight: 1.7, marginTop: 6 }}>
                缓存命中率按 30% 估算（行业 20–40% 中值），成本计算器支持 0 / 30 / 60% 三档。
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mr-text-3)", letterSpacing: "0.4px" }}>更新日志</div>
              <div style={{ fontSize: 11, color: "var(--mr-text-2)", lineHeight: 1.9, marginTop: 6, fontVariant: "tabular-nums" }}>
                <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-16")}</span> 新增 Llama 4 Maverick<br />
                <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-12")}</span> GPT-5 官方价格口径<br />
                <span style={{ color: "var(--mr-primary)", fontWeight: 600 }}>{formatDate("10-08")}</span> 权重体系 v0.9
              </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/disclaimer"
                className="mr-btn-outline"
                style={{ height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}
              >
                对结果有异议？申诉
              </Link>
              <button
                className="mr-btn-primary"
                style={{ height: 32, opacity: 0.5, cursor: "not-allowed", fontSize: 12 }}
                disabled
                aria-disabled="true"
                title="功能开发中，敬请期待"
              >
                导出快照（即将上线）
              </button>
            </div>
          </div>

          {/* 右栏：内容 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {SECTIONS.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="mr-card"
                style={{ padding: "22px 24px", marginTop: i === 0 ? 0 : 14, scrollMarginTop: 24 }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 2 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--mr-primary)", fontVariant: "tabular-nums", letterSpacing: "-0.5px" }}>
                    {s.no}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--mr-text)" }}>{s.title}</span>
                </div>
                {s.body}
              </section>
            ))}

            <div
              style={{
                marginTop: 14,
                padding: "12px 16px",
                fontSize: 12,
                color: "var(--mr-text-3)",
                lineHeight: 1.8,
                borderTop: "0.5px solid var(--mr-hairline)",
              }}
            >
              原始基准清单与污染风险评估见{" "}
              <Link href="/data-sources" className="mr-link">数据来源</Link>；
              价格字段的逐条核对日期见各模型详情页。
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
