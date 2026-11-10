/**
 * Agent 产品榜数据（手工维护，非自动抓取）
 *
 * 口径说明：
 * - 价格均为官方定价页/官方帮助文档核对所得，核对日期见 priceCheckedAt；促销价为连续包月/年付价。
 * - 能力等级（S/A/B/C）为编辑评估，依据是官方功能清单 + 公开横评结论，不是第三方跑分。
 * - 客观锚点见 bestModel：取该产品官方列出的可选型号中，站内（Artificial Analysis）评分最高者；
 *   分数必须与 seed-data 中同名模型完全一致，未逐一公开型号清单的产品在该列标注为推断。
 * - 倍率（multipliers）：仅有官方公开数值的产品填写 factor，其余只写定性说明，不推算、不编造。
 * - 套餐价格：monthly 为 0 且标注 quote 的档位不是免费档（需询价或按地区浮动），不参与起价计算。
 * - 仅按年报价的席位制产品用 annual（每席每年总价），不做月均折算；annual 与 quote 档都不计入月付起价。
 */

export type AgentCategory = "coding" | "office" | "general" | "design";
export type Grade = "S" | "A" | "B" | "C";

export interface AgentPlan {
  name: string;
  monthly: number;
  promo?: number;
  /** 每席每年总价（仅年付报价产品使用，不折算月价）；使用时 monthly 填 0 */
  annual?: number;
  currency: "USD" | "CNY";
  perSeat?: boolean;
  quota?: string;
  /** 无固定标价：需询价、按地区浮动或按席位报价。monthly 为 0 也不代表免费 */
  quote?: boolean;
  note?: string;
}

/** 询价档的价格文案（详情页统一渲染，避免把 0 元当成免费） */
export function planPriceLabel(p: AgentPlan): string {
  if (p.quote) return "询价 / 按地区浮动";
  const sym = p.currency === "USD" ? "$" : "¥";
  const seat = p.perSeat ? "/席" : "";
  if (p.annual && p.annual > 0) return `${sym}${p.annual}${seat}/年`;
  if (p.monthly === 0) return "免费";
  if (p.promo && p.promo > 0 && p.promo !== p.monthly) {
    return `${sym}${p.promo}${seat}/月（原价 ${sym}${p.monthly}${seat}）`;
  }
  return `${sym}${p.monthly}${seat}/月`;
}

export interface AgentMultiplier {
  model: string;
  factor?: number;
  note: string;
}

export interface AgentProduct {
  id: string;
  name: string;
  vendor: string;
  category: AgentCategory;
  tagline: string;
  grades: {
    coding?: Grade;
    research?: Grade;
    office?: Grade;
    automation?: Grade;
    design?: Grade;
  };
  gradeBasis: string;
  /**
   * 客观锚点：官方明确列出的可选型号中，站内评分最高者。
   * score 可缺省——官方点名了型号但站内未收录该模型时只写名称，不补分数（避免编造）。
   */
  bestModel?: { name: string; score?: number; slug?: string };
  billingMode: "订阅额度" | "积分制" | "按 token 计费";
  models: string[];
  plans: AgentPlan[];
  multipliers?: AgentMultiplier[];
  priceCheckedAt: string;
  /** overseas：该来源站点在中国大陆网络下通常无法直连，页面会加角标提示 */
  sources: { label: string; url: string; overseas?: boolean }[];
}

export const AGENT_PRODUCTS: AgentProduct[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    vendor: "Anthropic",
    category: "coding",
    tagline: "终端里的编码 Agent，按订阅额度计费，不做模型倍率",
    grades: { coding: "S", automation: "A", research: "B" },
    gradeBasis: "官方文档 + 开发者横评：终端原生、MCP 生态完整、长任务稳定性好；无独立 IDE 图形界面",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "订阅额度",
    models: ["Claude Opus 5.5", "Claude Sonnet 5.5", "Claude Fable 5.1", "Claude Haiku 5.5"],
    // 2026-11-09 按 claude.com/pricing 逐档核对：官方档位名为 Free / Pro / Max / Ultra / Team / Enterprise。
    // Max 下方已分出 Ultra（原「Max 20x」实为 Ultra 档，命名与价格都已变），Team 拆 Standard / Premium 双席位。
    plans: [
      { name: "Pro", monthly: 20, promo: 17, currency: "USD", quota: "含 Claude Code", note: "年付 $200 一次性，折合 $17/月；月付 $20" },
      { name: "Max", monthly: 100, currency: "USD", quota: "Pro 的 5 倍用量", note: "含每月 $100 Claude Platform API 额度" },
      { name: "Ultra", monthly: 200, currency: "USD", quota: "无 5 小时上限", note: "含 Max 全部权益，每月 API 额度提至 $200" },
      { name: "Team Standard", monthly: 25, promo: 20, currency: "USD", perSeat: true, quota: "不含 Claude Code", note: "年付 $20/席/月、月付 $25；2–150 人；要用 Claude Code 需 Premium 席位" },
      { name: "Team Premium", monthly: 125, promo: 100, currency: "USD", perSeat: true, quota: "含 Claude Code + Claude Cowork", note: "年付 $100/席/月、月付 $125；用量为标准席位的 5 倍" },
      { name: "Enterprise", monthly: 20, currency: "USD", perSeat: true, quota: "另按 API 价计用量", note: "年付 $20/席/月 + 使用量按 API 价计费；含 SCIM、审计日志、RBAC" },
    ],
    multipliers: [
      { model: "全部 Claude 模型", note: "不按模型算倍率，共用同一个月度额度池；超额后降速或需升级档位" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [
      { label: "Claude 定价页（逐档核对）", url: "https://claude.com/pricing" },
      { label: "Claude Code 官方文档", url: "https://docs.claude.com/en/docs/claude-code/overview" },
    ],
  },
  {
    id: "cursor",
    name: "Cursor",
    vendor: "Anysphere",
    category: "coding",
    tagline: "IDE 形态的编码 Agent；Plus 起步，Premium / Super / Ultra 按 4x / 15x / 50x 用量倍数分档",
    grades: { coding: "S", automation: "A", research: "B" },
    gradeBasis: "官方定价页与模型文档：IDE 内联补全与 Agent 模式成熟；档位差异主要体现在用量倍数与第三方模型计费方式",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "订阅额度",
    models: ["Claude 系列", "GPT 系列", "Gemini 系列", "Grok 系列（含聊天、图像、视频）"],
    plans: [
      { name: "免费", monthly: 0, currency: "USD", quota: "有限 AI 用量" },
      { name: "Plus", monthly: 8, currency: "USD", quota: "共享 AI 用量池，入门档" },
      { name: "Premium", monthly: 30, currency: "USD", quota: "Plus 的 4 倍用量" },
      { name: "Super", monthly: 100, currency: "USD", quota: "Plus 的 15 倍用量" },
      { name: "Ultra", monthly: 200, currency: "USD", quota: "Plus 的 50 倍用量" },
      { name: "团队版", monthly: 30, currency: "USD", perSeat: true, note: "起，4–50 倍用量" },
      { name: "企业版", monthly: 0, currency: "USD", quote: true },
    ],
    multipliers: [
      { model: "档位用量倍数", note: "官方：Premium 为 Plus 的 4 倍用量、Super 15 倍、Ultra 50 倍，团队版按席位 4–50 倍（用量倍数，非价格折扣）" },
      { model: "第三方模型", note: "Premium 起可按 API 标价调用第三方模型，用量单独计费、不含在月费内" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [
      { label: "Cursor 定价", url: "https://cursor.com/pricing" },
      { label: "Cursor 模型与定价文档", url: "https://cursor.com/docs/models" },
      { label: "AI Coding 工具对比矩阵 2026（评级参考）", url: "https://www.developersdigest.tech/blog/ai-coding-tools-comparison-matrix-2026" },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    vendor: "GitHub",
    category: "coding",
    tagline: "覆盖面最广的编码助手，Pro 起可挂第三方 Agent（Claude Code / Codex）",
    grades: { coding: "A", automation: "B", research: "C" },
    gradeBasis: "官方定价页：补全能力稳定、企业采购链路成熟；Agent 能力弱于纯 Agent 产品",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "订阅额度",
    models: ["Claude 系列", "GPT 系列", "Gemini 系列", "Microsoft MAI"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "2,000 次补全/月" },
      { name: "Pro", monthly: 10, currency: "USD", quota: "含 $15 AI credits" },
      { name: "Pro+", monthly: 39, currency: "USD", quota: "含 $70 AI credits" },
      { name: "Max", monthly: 100, currency: "USD", quota: "含 $200 AI credits" },
      { name: "Business", monthly: 19, currency: "USD", perSeat: true },
      { name: "Enterprise", monthly: 39, currency: "USD", perSeat: true },
    ],
    multipliers: [
      { model: "全部模型", note: "以 credits 折算：各模型按自身 token 单价扣 credits，官方未公开逐模型倍率表" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [
      { label: "AI Coding 工具定价 2026", url: "https://www.developersdigest.tech/blog/ai-coding-tools-pricing-2026" },
      { label: "AI Coding Agents 对比", url: "https://cheatsheets.davidveksler.com/ai-coding-agents-compared.html" },
    ],
  },
  {
    id: "codex",
    name: "Codex",
    vendor: "OpenAI",
    category: "coding",
    tagline: "CLI / IDE / 云端三端同权，含 GitHub code review 与 Slack、Linear 集成",
    grades: { coding: "S", automation: "A", research: "B" },
    gradeBasis:
      "官方功能对照表：CLI、IDE 扩展、云端会话、SDK 与自动化 token、GitHub PR review、Slack/Linear 集成、沙箱与定时任务齐备；模型能力取 GPT-6 系列",
    bestModel: { name: "GPT-6 Astra", score: 57.0, slug: "gpt-6-astra" },
    billingMode: "订阅额度",
    models: ["GPT-6 Astra", "GPT-6.1 Sol", "GPT-6.1 Terra", "GPT-6 Sol", "GPT-6 Luna", "GPT-5.6 系列"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "仅桌面端 GPT-6 Luna，Standard 速度", note: "不含图片生成" },
      { name: "Go", monthly: 8, currency: "USD", quota: "轻量任务，额度限 GPT-6 Luna" },
      { name: "Plus", monthly: 20, currency: "USD", quota: "5 小时窗口本地消息数：Astra 5–45 / 6.1 Sol 15–160 / Luna 350–3,000", note: "Web / CLI / IDE / iOS，含自动 code review 与 Slack、Linear 集成" },
      { name: "Pro", monthly: 100, currency: "USD", quota: "无 5 小时限制；Fast 2.5x，可用 credits 扩量", note: "$100 / $200 / $500 三档；Pro 500 含 Ultrafast" },
      { name: "Business", monthly: 25, promo: 20, currency: "USD", perSeat: true, quota: "年付 $20/席；更大云 VM、共享 credits、SAML SSO", note: "2 席起" },
      { name: "Enterprise & Edu", monthly: 0, currency: "USD", quote: true, quota: "按 credits 弹性计价", note: "联系销售" },
    ],
    multipliers: [
      {
        model: "全部模型",
        note: "按 credits 计费（每百万输入 token：GPT-6 Astra 250、GPT-6.1 Sol 50、GPT-6 Luna 2.5），官方未给相对倍率",
      },
    ],
    priceCheckedAt: "2026-11-08",
    sources: [
      { label: "Codex 定价与额度（官方文档）", url: "https://developers.openai.com/codex/pricing", overseas: true },
      { label: "Codex in ChatGPT 产品页", url: "https://chatgpt.com/codex", overseas: true },
    ],
  },
  {
    id: "devin",
    name: "Devin",
    vendor: "Cognition",
    category: "coding",
    tagline: "自主式编码 Agent，按所选模型的 token 成本折算用量",
    grades: { coding: "A", automation: "S", research: "B" },
    gradeBasis: "官方文档：自主跑完整任务链、支持 Teams/Enterprise 集中计费；可控性依赖任务描述质量",
    bestModel: { name: "Gemini 4 Argon", score: 50.0, slug: "gemini-4-argon" },
    billingMode: "按 token 计费",
    models: ["SWE-2", "Claude 系列", "GPT 系列", "Gemini 系列"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "轻量额度，模型受限" },
      { name: "Pro", monthly: 20, currency: "USD", quota: "含前沿模型访问" },
      { name: "Max", monthly: 200, currency: "USD", quota: "显著更高额度" },
      { name: "Teams / Enterprise", monthly: 0, currency: "USD", quote: true, note: "按需报价，集中计费与管理后台" },
    ],
    multipliers: [
      { model: "SWE-2", factor: 1, note: "官方标注为基准价：$3.00/1M 输入、$15.00/1M 输出（2026-12-31 前 75% 折扣）" },
      { model: "Gemini 4 Argon", factor: 0.5, note: "官方标注 list price 5 折（至 2026-12-01）" },
      { model: "Claude / GPT 系列", note: "按各自 token 单价扣额度，官方模型选择器内实时展示" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [
      { label: "Devin 定价", url: "https://devin.ai/pricing" },
      { label: "Devin 模型与计费", url: "https://docs.devinenterprise.com/desktop/chat/models" },
    ],
  },
  {
    id: "trae",
    name: "TRAE",
    vendor: "字节跳动",
    category: "coding",
    tagline: "积分制编码 IDE，对指定模型给公开折扣倍率",
    grades: { coding: "A", automation: "B", research: "C" },
    gradeBasis: "官方计费文档：云端任务并行、Seed 系列深度集成；生态较新",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "积分制",
    models: ["Seed-2.1-Turbo", "Seed-Code", "GLM-5.3", "DeepSeek 系列", "Claude / GPT 系列"],
    plans: [
      { name: "免费", monthly: 0, currency: "CNY", quota: "每月登录赠 500 积分" },
      { name: "会员 Lite", monthly: 49, promo: 45, currency: "CNY", quota: "2,000 积分/月" },
      { name: "会员 Pro", monthly: 99, promo: 89, currency: "CNY", quota: "4,000 积分/月" },
      { name: "会员 Pro+", monthly: 239, promo: 219, currency: "CNY", quota: "12,000 积分/月" },
      { name: "会员 Ultra", monthly: 699, promo: 629, currency: "CNY", quota: "40,000 积分/月" },
    ],
    multipliers: [
      { model: "Seed-2.1-Turbo", factor: 0.25, note: "官方：计费享 2.5 折（会员全档同享）" },
      { model: "Seed-Code", factor: 0.25, note: "官方：计费享 2.5 折（会员全档同享）" },
      { model: "GLM-5.3 / DeepSeek", note: "会员调用享专属补贴，具体折扣未公开数值" },
      { model: "自定义模型", factor: 0, note: "不消耗积分，按 BYO Key 自行结算" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "TRAE 套餐与计费", url: "https://docs.trae.cn/ide_plans-and-billing?lang=zh" }],
  },
  {
    id: "workbuddy",
    name: "WorkBuddy",
    vendor: "腾讯",
    category: "office",
    tagline: "办公场景 Agent，积分制、全模型可选，官方不公开逐模型倍率数值",
    grades: { coding: "B", research: "B", office: "S", automation: "A" },
    gradeBasis: "官方定价页与积分文档：项目/云服务/腾讯会议文档打通，办公闭环最完整；编码能力非主打",
    bestModel: { name: "Gemini 4 Carbon", score: 60.0, slug: "gemini-4-carbon" },
    billingMode: "积分制",
    models: ["全模型可选（含 Auto 调度）", "自定义模型（费用自付）"],
    plans: [
      { name: "体验版", monthly: 0, currency: "CNY", quota: "500 积分/月" },
      { name: "标准版", monthly: 99, promo: 70, currency: "CNY", quota: "4,000 积分（2,000 基础 + 2,000 赠送）" },
      { name: "高级版", monthly: 199, promo: 140, currency: "CNY", quota: "9,000 积分（4,000 + 5,000）" },
      { name: "旗舰版", monthly: 999, promo: 700, currency: "CNY", quota: "50,000 积分（20,000 + 30,000）" },
      { name: "Buddy One VIP", monthly: 999, promo: 700, currency: "CNY", quota: "50,000 共享积分 + 腾讯会议/文档/ima/网盘" },
    ],
    multipliers: [
      { model: "高级模型（Opus / Gemini 4 等）", note: "官方：Token 处理单价更高，同量 Token 消耗积分更多；未公布逐模型倍率数值" },
      { model: "三档模式", note: "极速/标准/极致三档：极致模式消耗更高，用于复杂任务；同样未公开倍率数值" },
      { model: "自定义模型", factor: 0, note: "不消耗套餐积分，Token 与订阅费用由用户自付" },
    ],
    priceCheckedAt: "2026-11-08",
    sources: [
      { label: "WorkBuddy 定价", url: "https://www.workbuddy.cn/pricing/" },
      { label: "WorkBuddy 积分规则", url: "https://www.workbuddy.cn/docs/workbuddy/Credits" },
      { label: "WorkBuddy 模型配置", url: "https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Model" },
    ],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    vendor: "OpenAI",
    category: "general",
    tagline: "通用助手，Pro 档已拆成 100 / 200 / 500 三档",
    grades: { coding: "A", research: "S", office: "A", automation: "A" },
    gradeBasis: "官方帮助中心与定价页：研究/长文/图像能力全面；Agent 编排偏对话式",
    bestModel: { name: "GPT-6 Astra", score: 57.0, slug: "gpt-6-astra" },
    billingMode: "订阅额度",
    models: ["GPT-6 Astra", "GPT-6.1 Sol", "GPT-5.6 系列"],
    plans: [
      { name: "Go", monthly: 8, currency: "USD", note: "轻量档；与 Codex 共用额度，模型限 GPT-6 Luna" },
      { name: "Plus", monthly: 20, currency: "USD" },
      { name: "Pro 100", monthly: 100, currency: "USD", quota: "不含极速模式" },
      { name: "Pro 200", monthly: 200, currency: "USD", quota: "含用量高于 Pro 100" },
      { name: "Pro 500", monthly: 500, currency: "USD", quota: "含极速模式" },
      { name: "Business Standard", monthly: 25, promo: 20, currency: "USD", perSeat: true, note: "年付 $20/席" },
      { name: "Business Premium", monthly: 125, promo: 100, currency: "USD", perSeat: true, note: "5 倍额度，解除 5 小时限制" },
    ],
    multipliers: [
      { model: "全部模型", note: "按档位给统一额度，不按模型区分倍率；模型选择由产品侧限定" },
    ],
    priceCheckedAt: "2026-11-07",
    sources: [
      { label: "ChatGPT Pro 档位说明", url: "https://help.openai.com/zh-hans-cn/articles/9793128-about-chatgpt-pro-tiers", overseas: true },
      { label: "ChatGPT Business 定价", url: "https://openai.com/zh-Hans-CN/business/pricing/", overseas: true },
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    category: "general",
    tagline: "通用助手 + 视频生成，Ultra 档 2026 年从 $250 降到 $200",
    grades: { coding: "A", research: "S", office: "A", automation: "B" },
    gradeBasis: "官方发布说明：多模态与搜索接地能力突出；Agent 编排弱于专用产品",
    bestModel: { name: "Gemini 4 Carbon", score: 60.0, slug: "gemini-4-carbon" },
    billingMode: "订阅额度",
    models: ["Gemini 4 Carbon", "Gemini 4 Argon", "Gemini 3.8 Flash"],
    plans: [
      { name: "Google AI Pro", monthly: 19.99, currency: "USD", quota: "4 倍用量上限 + 2TB 存储" },
      { name: "Google AI Ultra", monthly: 200, currency: "USD", quota: "20 倍用量上限（原 $250）", note: "另有 $100 起的入门 Ultra 档" },
      { name: "Gemini Enterprise", monthly: 30, currency: "USD", perSeat: true, note: "企业版起价，含 IT 管控" },
    ],
    multipliers: [
      { model: "全部 Gemini 模型", note: "按订阅档位给统一用量上限，不按模型区分倍率" },
    ],
    priceCheckedAt: "2026-11-08",
    sources: [
      { label: "Google AI 订阅更新（2026 I/O）", url: "https://blog.google/products-and-platforms/products/google-one/google-ai-subscriptions/?pubDate=20260521", overseas: true },
      { label: "Gemini 方案说明", url: "https://gemini.google/tw/about/?hl=zh-TW", overseas: true },
    ],
  },
  {
    id: "coze",
    name: "扣子 Coze",
    vendor: "字节跳动",
    category: "office",
    tagline: "Agent 搭建平台，积分制多档套餐，2026-11-12 起调价",
    grades: { coding: "B", research: "B", office: "A", automation: "S" },
    gradeBasis: "官方套餐文档：多 Agent 协作、模型自定义、工作流编排能力强；偏平台而非成品助手",
    bestModel: { name: "Gemini 4 Carbon", score: 60.0, slug: "gemini-4-carbon" },
    billingMode: "积分制",
    models: ["平台内置多模型可选", "自定义模型接入"],
    plans: [
      { name: "个人免费版", monthly: 0, currency: "CNY" },
      { name: "个人进阶版", monthly: 39.9, currency: "CNY", quota: "3 万积分/月" },
      { name: "个人高阶版", monthly: 99, currency: "CNY", quota: "9.9 万积分/月" },
      { name: "个人旗舰版", monthly: 199, currency: "CNY", quota: "19.9 万积分/月" },
      { name: "个人尊享版", monthly: 999, currency: "CNY", quota: "99 万积分/月" },
      { name: "企业标准版", monthly: 498, currency: "CNY", note: "起价，按席位数计" },
      { name: "企业旗舰版", monthly: 5980, currency: "CNY", note: "起价" },
      { name: "团队旗舰版", monthly: 283, currency: "CNY", perSeat: true, quota: "8,000 积分/席/月" },
    ],
    multipliers: [
      { model: "内置模型", note: "按模型 token 单价折算积分，官方未公布逐模型倍率表" },
      { model: "自定义模型", note: "接入自有模型，按外部账单结算" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [
      { label: "扣子订阅套餐", url: "https://docs.coze.cn/guides/edition" },
      { label: "扣子团队版定价", url: "https://docs.coze.cn/coze_pro_team_plan" },
      { label: "个人版调价公告（11-12 生效）", url: "https://docs.coze.cn/cozespace_coze_billing_overview" },
    ],
  },
  {
    id: "manus",
    name: "Manus",
    vendor: "Manus",
    category: "general",
    tagline: "自主执行型通用 Agent，个人档价格随地区浮动",
    grades: { coding: "B", research: "A", office: "A", automation: "S" },
    gradeBasis: "官方帮助中心：长任务自主执行、网页与文档产出完整；个人档定价透明度低于同行",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "订阅额度",
    models: ["内置多模型调度（具体型号未完全公开）"],
    plans: [
      { name: "Team", monthly: 20, currency: "USD", perSeat: true, note: "起价，年付享 17% 折扣" },
      { name: "个人档", monthly: 0, currency: "USD", quote: true, note: "官网 pricing 页按地区展示，未统一标价" },
    ],
    multipliers: [
      { model: "内置模型", note: "不对外公开逐模型倍率，按任务消耗计" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Manus 会员定价说明", url: "https://help.manus.im/zh-CN/articles/11711111-manus-%E7%9B%AE%E5%89%8D%E7%9A%84%E4%BC%9A%E5%91%98%E5%AE%9A%E4%BB%B7%E6%98%AF%E5%A4%9A%E5%B0%91" }],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    vendor: "Cognition",
    category: "coding",
    tagline: "IDE 形态的编码 Agent，2025 年被 Cognition 收购后与 Devin 共用 SWE-2 模型栈",
    grades: { coding: "A", automation: "A", research: "C" },
    gradeBasis: "官方定价页：Free 档即含不限量内联补全与 Tab 补全，Pro 起开放 Cloud Agents；多模型接入但未公布逐模型评测，按功能面与公开横评定 A/A/C",
    bestModel: { name: "SWE-2" },
    billingMode: "订阅额度",
    models: ["SWE-2（Cognition 自研）", "Claude 系列", "GPT 系列", "Gemini 系列"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "不限量内联补全 / Tab 补全" },
      { name: "Pro", monthly: 20, currency: "USD", quota: "含 Cloud Agents 与 Devin 云端能力" },
      { name: "Max", monthly: 200, currency: "USD", quota: "更高代理用量" },
      { name: "Teams", monthly: 40, currency: "USD", perSeat: true, note: "另收团队基础费 $80/月，按开发者席位 $40/月" },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true },
    ],
    multipliers: [
      { model: "SWE-2 / Claude / GPT", note: "官方定价页未公布逐模型倍率，按套餐额度消耗；额度用尽后按 API 原价加购用量" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Windsurf 定价", url: "https://windsurf.com/pricing", overseas: true }],
  },
  {
    id: "kiro",
    name: "Kiro",
    vendor: "Amazon",
    category: "coding",
    tagline: "AWS 出的规格驱动编码 Agent，先把需求写成 spec 再生成代码，按 credit 计费",
    grades: { coding: "A", automation: "B", research: "B" },
    gradeBasis: "官方定价页：spec 驱动的需求→设计→任务三段式流程是其差异化，Free 50 credits 起；模型侧仅点名 Claude Sonnet 4.5 与开源权重模型",
    bestModel: { name: "Claude Sonnet 4.5" },
    billingMode: "积分制",
    models: ["Claude Sonnet 4.5", "开源权重模型", "premium 模型（Pro 以上）"],
    plans: [
      { name: "Kiro Free", monthly: 0, currency: "USD", quota: "50 credits/月" },
      { name: "Pro", monthly: 20, currency: "USD", quota: "1,000 credits/月" },
      { name: "Pro+", monthly: 40, currency: "USD", quota: "2,000 credits/月" },
      { name: "Pro Max", monthly: 100, currency: "USD", quota: "5,000 credits/月" },
      { name: "Power", monthly: 200, currency: "USD", quota: "10,000 credits/月" },
      { name: "Teams / Enterprise", monthly: 0, currency: "USD", quote: true },
    ],
    multipliers: [
      { model: "全部模型", note: "统一折算为 credit 消耗，官方未公布逐模型倍率；超额 credit 按 $0.04/个 加购" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Kiro 定价", url: "https://kiro.dev/pricing", overseas: true }],
  },
  {
    id: "augment",
    name: "Augment Code",
    vendor: "Augment",
    category: "coding",
    tagline: "主打大仓库上下文理解的编码 Agent，扁平定价不按席位加价",
    grades: { coding: "A", automation: "B", research: "A" },
    gradeBasis: "官方定价页与产品页：Context Engine 面向大型代码库检索与理解，这是它区别于补全型产品的强项；官方未点名具体模型型号",
    billingMode: "订阅额度",
    models: ["官方未公开具体型号清单（按 usage 额度折算）"],
    plans: [
      { name: "Standard", monthly: 20, currency: "USD", quota: "含 $20 用量", note: "flat 定价，最多 50 席" },
      { name: "Business", monthly: 100, currency: "USD", quota: "含 $100 用量" },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true },
    ],
    multipliers: [
      { model: "全部能力（模型 / Context Engine / 算力）", note: "统一按 usage 额度计费，官方未公布逐模型倍率；可另行加购 top-up" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Augment Code 定价", url: "https://www.augmentcode.com/pricing", overseas: true }],
  },
  {
    id: "replit",
    name: "Replit",
    vendor: "Replit",
    category: "coding",
    tagline: "浏览器里的全栈开发 Agent，从一句描述直接生成并部署可运行应用",
    grades: { coding: "A", automation: "B", research: "C" },
    gradeBasis: "官方定价页：Agent 可直接读写文件、装依赖、跑数据库并部署，环境托管一体化；模型侧只写 powerful models，未点名型号",
    billingMode: "订阅额度",
    models: ["官方未公开具体型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "有额度上限" },
      { name: "Core", monthly: 20, promo: 18, currency: "USD", quota: "含 $20 等值用量", note: "年付 $18/月" },
      { name: "Pro", monthly: 100, promo: 90, currency: "USD", quota: "含 $100 等值用量", note: "年付 $90/月" },
    ],
    multipliers: [
      { model: "全部模型", note: "按订阅额度抵扣，官方未公布逐模型倍率；另有 $215 / $425 / $825 / $2000 等更高用量档" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Replit 定价", url: "https://replit.com/pricing", overseas: true }],
  },
  {
    id: "bolt",
    name: "bolt.new",
    vendor: "StackBlitz",
    category: "coding",
    tagline: "对话即生成完整 Web 应用，在浏览器里直接跑起来并一键部署",
    grades: { coding: "B", automation: "B", research: "C" },
    gradeBasis: "官方定价页：定位是全栈 Web 应用生成，适合原型与轻量产品；深度工程化能力弱于 IDE 型 Agent",
    billingMode: "订阅额度",
    models: ["官方未公开具体型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "每日 token 上限" },
      { name: "Pro", monthly: 25, currency: "USD", quota: "更高 token 上限" },
      { name: "Teams", monthly: 30, currency: "USD", perSeat: true },
    ],
    multipliers: [
      { model: "全部模型", note: "按 token 额度消耗，官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "bolt.new 定价", url: "https://bolt.new/pricing", overseas: true }],
  },
  {
    id: "v0",
    name: "v0",
    vendor: "Vercel",
    category: "coding",
    tagline: "生成式 UI 构建器，产出可直接部署到 Vercel 的前端代码",
    grades: { coding: "B", automation: "B", research: "C" },
    gradeBasis: "官方定价页：强在前端组件与页面生成，不覆盖后端与运维；模型侧写 Access to all models，未点名型号",
    billingMode: "订阅额度",
    models: ["官方未公开具体型号清单（可访问全部模型）"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "每日消息条数上限" },
      { name: "Plus", monthly: 30, currency: "USD", perSeat: true, quota: "含 $30/月 credits" },
      { name: "Business", monthly: 100, currency: "USD", perSeat: true, quota: "含更高 credits 与团队管控" },
    ],
    multipliers: [
      { model: "全部模型", note: "按 credits 折算，官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "v0 定价", url: "https://v0.app/pricing", overseas: true }],
  },
  {
    id: "warp",
    name: "Warp",
    vendor: "Warp",
    category: "coding",
    tagline: "终端 Agent，把命令行操作交给 AI 代理执行，代理用量按 API 原价折算",
    grades: { coding: "A", automation: "B", research: "C" },
    gradeBasis: "官方定价页：Build 档明确含每月 $20 agent 用量、按 API rates 计价，透明度高于多数同类；能力集中在终端与运维流程",
    billingMode: "订阅额度",
    models: ["官方未公开具体型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "基础终端功能" },
      { name: "Build", monthly: 20, currency: "USD", quota: "含 $20/月 agent 用量（按 API 原价）" },
      { name: "Max", monthly: 200, currency: "USD", quota: "更高代理容量" },
    ],
    multipliers: [
      { model: "全部模型", note: "agent 用量按 API 原始价格折算，官方未公布逐模型倍率；可另行加购用量" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Warp 定价", url: "https://www.warp.dev/pricing", overseas: true }],
  },
  {
    id: "zed",
    name: "Zed",
    vendor: "Zed Industries",
    category: "coding",
    tagline: "高性能协作编辑器，内置 Agent 并可接入 Claude Agent、Codex CLI 等外部代理",
    grades: { coding: "B", automation: "C", research: "C" },
    gradeBasis: "官方定价页：强项是编辑器性能与多人协作，AI 能力以接入外部 Agent 为主，自身不定位为编码 Agent；Pro 含 $5 token 额度",
    billingMode: "订阅额度",
    models: ["Claude Agent", "Codex CLI", "Gemini CLI", "自带 Key 的其他模型"],
    plans: [
      { name: "Personal", monthly: 0, currency: "USD", quota: "编辑器 + 协作，永久免费" },
      { name: "Pro", monthly: 10, currency: "USD", quota: "含 $5 token 额度 + 不限量编辑预测" },
      { name: "Business", monthly: 30, currency: "USD", perSeat: true },
    ],
    multipliers: [
      { model: "全部模型", note: "Pro 含 $5 token 额度，超出按用量计费；官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Zed 定价", url: "https://zed.dev/pricing", overseas: true }],
  },
  {
    id: "notion",
    name: "Notion AI",
    vendor: "Notion",
    category: "office",
    tagline: "文档库里的 AI 与自定义 Agent，能把重复性流程做成自动执行的 Agent",
    grades: { office: "A", research: "B", automation: "A", coding: "C" },
    gradeBasis: "官方定价页：AI 与 Agent 直接长在文档/数据库上，适合知识工作与流程自动化；不覆盖代码与终端场景；AI 用量走 credits 计费",
    billingMode: "积分制",
    models: ["官方未公开具体型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "有限 AI 试用额度" },
      { name: "Plus", monthly: 10, currency: "USD", perSeat: true },
      { name: "Business", monthly: 20, currency: "USD", perSeat: true },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true },
    ],
    multipliers: [
      { model: "Notion AI", note: "按 Notion credits 计费（$10 / 1,000 credits），官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Notion 定价", url: "https://www.notion.com/pricing", overseas: true }],
  },
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    category: "general",
    tagline: "通用对话与工作助手，Projects / Artifacts / Chrome 与 Microsoft 365 集成",
    grades: { research: "S", office: "A", coding: "B", automation: "B" },
    gradeBasis: "官方定价页：Projects 与 Artifacts 面向长文档与产出物，Chrome 与 M365 集成补齐办公场景；编码能力由同体系的 Claude Code 承担",
    bestModel: { name: "Claude Opus 5.5", score: 59.0, slug: "claude-opus-5-5" },
    billingMode: "订阅额度",
    models: ["Claude Opus 5.5", "Claude Sonnet 5.5", "Claude Fable 5.1", "Claude Haiku 5.5"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "每 5 小时有限用量" },
      { name: "Pro", monthly: 20, promo: 17, currency: "USD", quota: "含 Claude Code / Projects / Artifacts", note: "年付 $200 一次性，折合 $17/月；月付 $20" },
      { name: "Max", monthly: 100, currency: "USD", quota: "Pro 的 5 倍用量", note: "含每月 $100 Claude Platform API 额度" },
      { name: "Ultra", monthly: 200, currency: "USD", quota: "无 5 小时上限", note: "含 Max 全部权益，每月 API 额度提至 $200" },
      { name: "Team Standard", monthly: 25, promo: 20, currency: "USD", perSeat: true, quota: "标准席位", note: "年付 $20/席/月、月付 $25；2–150 人" },
      { name: "Team Premium", monthly: 125, promo: 100, currency: "USD", perSeat: true, quota: "含 Claude Code + Claude Cowork", note: "年付 $100/席/月、月付 $125；用量为标准席位的 5 倍" },
      { name: "Enterprise", monthly: 20, currency: "USD", perSeat: true, quota: "另按 API 价计用量", note: "年付 $20/席/月 + 使用量按 API 价计费；含 SCIM、审计日志、RBAC" },
    ],
    multipliers: [
      { model: "全部 Claude 模型", note: "不按模型算倍率，共用同一个月度额度池" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Claude 定价", url: "https://claude.com/pricing", overseas: true }],
  },
  {
    id: "figma",
    name: "Figma",
    vendor: "Figma",
    category: "design",
    tagline: "设计协作行业标杆，内置 Figma Make 提示词生成与 AI credits，覆盖 UI 设计、原型到 Dev Mode 研发交付",
    grades: { design: "S", automation: "A", office: "B" },
    gradeBasis:
      "官方定价页：专业版全席位每月含 3,000 AI credits，Figma Make 可由提示词直接生成可交互界面，Dev Mode 与 MCP Server 打通设计到研发；多人实时协作、组件与设计系统生态为行业基准，设计给 S；通用办公不是其场景。",
    billingMode: "订阅额度",
    models: ["Figma Make（AI 界面生成）", "官方未公开底层模型型号清单"],
    plans: [
      { name: "Starter", monthly: 0, currency: "USD", quota: "3 个设计文件；AI 额度 150 credits/日、上限 500/月" },
      { name: "Professional（全席位）", monthly: 16, currency: "USD", perSeat: true, quota: "3,000 AI credits/月", note: "年付价 $16/席/月；同档另有 Dev 席位 $12、Collab 席位 $3" },
      { name: "Organization（全席位）", monthly: 55, currency: "USD", perSeat: true, quota: "3,500 AI credits/月", note: "年付价；另有 Dev 席位 $25、Collab 席位 $5；含高级管理与 Dev Mode" },
      { name: "Enterprise（全席位）", monthly: 90, currency: "USD", perSeat: true, quota: "4,250 AI credits/月", note: "年付价；另有 Dev 席位 $35、Collab 席位 $5；联系销售开通" },
    ],
    multipliers: [
      { model: "AI credits", note: "按席位每月发放（专业 3,000 / 组织 3,500 / 企业 4,250），官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Figma 定价", url: "https://www.figma.com/pricing/", overseas: true }],
  },
  {
    id: "framer",
    name: "Framer",
    vendor: "Framer",
    category: "design",
    tagline: "提示词驱动的网站设计与发布平台，内置 AI credits、CMS 与托管，设计到上线一站式完成",
    grades: { design: "A", automation: "A" },
    gradeBasis:
      "官方定价页：免费档含 500 AI credits 与 Framer 子域，Basic/Pro 每月发放 1,000/3,000 credits，支持自定义域名、CMS 与 A/B 测试；擅长营销站与作品集的生成式搭建发布，但不覆盖通用平面设计与多人设计协作，设计给 A。",
    billingMode: "订阅额度",
    models: ["Framer AI（网站生成）", "官方未公开底层模型型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "500 AI credits，Framer 子域，1 GB 带宽" },
      { name: "Basic", monthly: 10, currency: "USD", quota: "1,000 AI credits/月，自定义域名", note: "年付价；额外编辑者 $20/月" },
      { name: "Pro", monthly: 30, currency: "USD", quota: "3,000 credits/月，50 GB 带宽与完整 CMS", note: "年付价；额外编辑者 $20/月" },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true, quota: "企业安全与专属支持" },
    ],
    multipliers: [
      { model: "AI credits", note: "按档位每月发放（500 / 1,000 / 3,000），官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Framer 定价", url: "https://www.framer.com/pricing/", overseas: true }],
  },
  {
    id: "uizard",
    name: "Uizard",
    vendor: "Uizard",
    category: "design",
    tagline: "AI 原生 UI/UX 设计工具，文字、截图与手绘草图都能生成线框图和高保真可交互原型",
    grades: { design: "A", automation: "B" },
    gradeBasis:
      "官方定价页：Autodesigner 1.5 支持文本/截图/草图多模态输入转界面，Pro 年付折合 $12/月，最多 100 个项目并开放全部模板；产品聚焦原型与线框，视觉精修与设计系统深度不及 Figma，设计给 A。",
    billingMode: "订阅额度",
    models: ["Autodesigner 1.5", "官方未公开底层模型型号清单"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "2 个项目，10 个免费模板" },
      { name: "Pro", monthly: 12, currency: "USD", quota: "最多 100 个项目、私有项目与全部模板", note: "年付折合 $12/月（官网标注年付省 40%）" },
      { name: "Business", monthly: 39, currency: "USD", quota: "团队协作、AI 数据 SLA 与自定义账单", note: "年付折合 $39/月" },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true, quota: "白手套入驻与企业合规" },
    ],
    multipliers: [
      { model: "订阅权益", note: "按档位开放项目数与模板，官方未公布 AI 生成的逐次倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Uizard 定价", url: "https://uizard.io/pricing/", overseas: true }],
  },
  {
    id: "recraft",
    name: "Recraft",
    vendor: "Recraft",
    category: "design",
    tagline: "品牌视觉与图像生成工作台，聚合 Nano Banana、Seedream、GPT Image、Flux 等模型，支持矢量、品牌素材与视频生成",
    grades: { design: "A", automation: "B" },
    gradeBasis:
      "官方定价页（中文站）：Basic 起含商用授权与私密生成，可调用多家主流图像模型与高级编辑工具，Pro 开放视频生成（Kling、Veo、Seedance 等）与并行任务；强在品牌素材和图像生产，不做协作式 UI 设计，设计给 A。",
    billingMode: "积分制",
    models: ["Nano Banana / Seedream / GPT Image / Flux 等图像模型", "Kling / Veo / Seedance 等视频模型（Pro 起）"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "每风格每天 3 次生成，图像公开且不可商用" },
      { name: "Basic", monthly: 10, currency: "USD", quota: "1,000 积分/月，商用授权、私密生成", note: "年付 $120/年，折合 $10/月" },
      { name: "Pro", monthly: 16, currency: "USD", quota: "2,000 积分/月，含视频生成与优先生成", note: "年付 $192/年，折合 $16/月" },
      { name: "Teams", monthly: 18, currency: "USD", perSeat: true, quota: "每席 2,000 积分/月，共享工作空间与 SSO", note: "年付 $211/席/年，折合 $18/席/月" },
    ],
    multipliers: [
      { model: "积分", note: "订阅积分每月重置、不结转，可另购永不过期的充值积分；官方未公布逐模型积分倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Recraft 定价", url: "https://www.recraft.ai/pricing", overseas: true }],
  },
  {
    id: "lovable",
    name: "Lovable",
    vendor: "Lovable",
    category: "design",
    tagline: "对话式应用与网站生成平台，内置设计系统、自定义域名与一键发布，提示词直达可上线产品",
    grades: { design: "A", automation: "S", coding: "B" },
    gradeBasis:
      "官方定价页：Pro/Business 各含 100 个月度 credits、设计系统与自定义域名，Business 增加团队工作区、SSO 与安全中心；从生成到发布的 Agent 化闭环成熟（自动化 S），但视觉风格受生成模板与设计系统约束，独立设计自由度弱于专业设计工具，设计给 A。",
    billingMode: "积分制",
    models: ["官方未公开具体模型型号清单（多模型路由）"],
    plans: [
      { name: "Free", monthly: 0, currency: "USD", quota: "5 个 lovable.app 子域，社区支持" },
      { name: "Pro", monthly: 25, currency: "USD", quota: "100 credits/月，自定义域名、设计系统，去除 Lovable 标识", note: "年付价（年付赠 2 个月），支持积分滚存与充值" },
      { name: "Business", monthly: 50, currency: "USD", quota: "100 credits/月，团队工作区、SSO 与安全中心", note: "年付价（年付赠 2 个月）" },
      { name: "Enterprise", monthly: 0, currency: "USD", quote: true, quota: "平台费，预约演示" },
    ],
    multipliers: [
      { model: "credits", note: "每月 100 个额度，未用完可滚存、可按需充值；官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "Lovable 定价", url: "https://lovable.dev/pricing", overseas: true }],
  },
  {
    id: "mastergo",
    name: "MasterGo",
    vendor: "莫高设计",
    category: "design",
    tagline: "国产产设研协作设计平台，AI 企业积分、MCP 与设计系统一体化，支持 Figma 文件导入与研发交付",
    grades: { design: "A", automation: "B", office: "B" },
    gradeBasis:
      "官方定价页：团队版与企业版按席位年费，含 AI 企业积分 2,500/席/年并支持 MCP，企业版具备 SAML SSO、RestAPI 与审计管控；协作与企业级管理完整，AI 生成能力仍在持续补齐，设计给 A。",
    billingMode: "订阅额度",
    models: ["MasterGo AI（UI 生成与设计系统）", "官方未公开底层模型型号清单"],
    plans: [
      { name: "初创版", monthly: 0, currency: "CNY", quota: "3 人团队、1 个编辑席位、3 个文件" },
      { name: "团队版·编辑席位", monthly: 0, annual: 624, currency: "CNY", perSeat: true, quota: "不限文件数与席位数，含全部团队库与字体", note: "限时 65 折，¥624/席/年（原价 ¥960）；研发席位 ¥364/席/年（原价 ¥560）" },
      { name: "企业版·设计席位", monthly: 0, annual: 1872, currency: "CNY", perSeat: true, quota: "企业团队库、SSO、RestAPI 与数据统计", note: "限时 65 折，¥1,872/席/年（原价 ¥2,880）；产品席位 ¥832、研发席位 ¥702" },
      { name: "私有部署版", monthly: 0, currency: "CNY", quote: true, quota: "网络隔离、系统集成与 7×12 专属支持" },
    ],
    multipliers: [
      { model: "AI 企业积分", note: "团队版/企业版每席位每年 2,500 积分，官方未公布逐模型倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "MasterGo 定价", url: "https://mastergo.com/pricing" }],
  },
  {
    id: "jsdesign",
    name: "即时设计",
    vendor: "即时设计",
    category: "design",
    tagline: "国产云端 UI 设计协作工具，基础功能永久免费，面向团队提供企业版权限管控与私有部署",
    grades: { design: "B", office: "B" },
    gradeBasis:
      "官方定价页：基础版永久免费，文件、图层、资源库与协作者额度宽松（最多 200 人团队），企业版主打成员权限与数据安全、私有部署需询价；核心设计能力完整但 AI Agent 化与企业管控深度弱于头部平台，设计给 B。",
    billingMode: "订阅额度",
    models: ["即时设计 AI（官方未公开底层模型型号清单）"],
    plans: [
      { name: "基础版", monthly: 0, currency: "CNY", quota: "文件/图层/资源库不限，200 人团队，永久免费" },
      { name: "企业版", monthly: 0, currency: "CNY", quota: "成员与团队管理、企业级安全功能", note: "官方标注限时体验，暂未公布固定定价" },
      { name: "私有部署版", monthly: 0, currency: "CNY", quote: true, quota: "本地部署、系统集成与 7×24 专属客服" },
    ],
    multipliers: [
      { model: "订阅权益", note: "当前开放功能与服务均永久免费，企业增值与私有部署需询价，无公开倍率" },
    ],
    priceCheckedAt: "2026-11-10",
    sources: [{ label: "即时设计定价", url: "https://js.design/pricing" }],
  },
];

export const AGENT_CATEGORY_LABEL: Record<AgentCategory, string> = {
  coding: "编码",
  office: "办公",
  general: "通用",
  design: "设计",
};

export function getAgent(id: string): AgentProduct | undefined {
  return AGENT_PRODUCTS.find((a) => a.id === id);
}

/** 起价：优先取最便宜的付费月付档；仅有年付报价时显示年付起价；都没有则显示询价 */
export function entryPrice(a: AgentProduct): string {
  const sym = (c: "USD" | "CNY") => (c === "USD" ? "$" : "¥");
  const monthly = a.plans.filter((p) => p.monthly > 0 && !p.quote);
  if (monthly.length > 0) {
    const min = monthly.reduce((x, y) => (x.monthly <= y.monthly ? x : y));
    return `${sym(min.currency)}${min.monthly}${min.perSeat ? "/席" : ""}/月起`;
  }
  const annual = a.plans.filter((p) => typeof p.annual === "number" && (p.annual as number) > 0 && !p.quote);
  if (annual.length > 0) {
    const min = annual.reduce((x, y) => ((x.annual as number) <= (y.annual as number) ? x : y));
    return `${sym(min.currency)}${min.annual}${min.perSeat ? "/席" : ""}/年起`;
  }
  return "询价";
}

/** 官方公开了数值倍率的模型条目数（factor=0 表示「不消耗积分」，不算倍率公开） */
export function hasPublishedMultiplier(a: AgentProduct): boolean {
  return (a.multipliers ?? []).some((m) => typeof m.factor === "number" && m.factor > 0);
}

/** 官方公开的正数倍率条目数 */
export function publishedMultiplierCount(a: AgentProduct): number {
  return (a.multipliers ?? []).filter((m) => typeof m.factor === "number" && m.factor > 0).length;
}
