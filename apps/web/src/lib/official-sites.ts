/**
 * 厂商 → 官方站点 URL 映射。
 *
 * 键必须与 `UI_MODELS` 中 `vendor` 字段的取值精确一致（见 lib/seed-data.ts）。
 * 每个 URL 均已用 curl 验证可访问（HTTP < 400 或正常反爬 403/429）；
 * 未收录的 vendor 在列表页渲染为「暂无数据」。
 */
export const OFFICIAL_SITES: Record<string, string> = {
  OpenAI: "https://openai.com",
  Anthropic: "https://anthropic.com",
  Google: "https://deepmind.google",
  DeepSeek: "https://www.deepseek.com",
  xAI: "https://x.ai",
  NVIDIA: "https://www.nvidia.com",
  Tencent: "https://yuanbao.tencent.com",
  Alibaba: "https://tongyi.aliyun.com",
  Zhipu: "https://www.zhipuai.cn",
  MiniMax: "https://www.minimaxi.com",
  Mistral: "https://mistral.ai",
  Meta: "https://about.fb.com",
  Moonshot: "https://www.kimi.com",
  StepFun: "https://www.stepfun.com",
  Cohere: "https://cohere.com",
  Reflection: "https://reflection.ai",
  // 2026-11 扩白名单新增：MiMo 官方站、IBM Granite 官方产品页（均已 curl 验证 200）；
  // LG AI Research 与 IFM（K2 Horizon）未找到可验证的独立官网，故不收录，前端显示「暂无数据」。
  Xiaomi: "https://mimo.xiaomi.com",
  IBM: "https://www.ibm.com/granite",
};

/** 从 URL 提取裸域名用于展示（去掉 https:// 与路径）。 */
export function displayDomain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}
