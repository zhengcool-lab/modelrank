"use client";

import { useState } from "react";

/** 厂商名（中文/英文） → 厂商 logo 文件 slug */
const VENDOR_SLUG: Record<string, string> = {
  OpenAI: "openai",
  Anthropic: "anthropic",
  Google: "google",
  深度求索: "deepseek",
  DeepSeek: "deepseek",
  阿里: "alibaba",
  阿里通义: "alibaba",
  Alibaba: "alibaba",
  字节跳动: "bytedance",
  Meta: "meta",
  月之暗面: "moonshot",
  Moonshot: "moonshot",
  Mistral: "mistral",
  "Mistral AI": "mistral",
  腾讯: "tencent",
  Tencent: "tencent",
  百度: "baidu",
  阶跃星辰: "stepfun",
  StepFun: "stepfun",
  MiniMax: "minimax",
  美团: "meituan",
  零一万物: "yi",
  智谱: "zhipu",
  Zhipu: "zhipu",
  Microsoft: "microsoft",
  百川: "baichuan",
  NVIDIA: "nvidia",
  Cohere: "cohere",
};

/**
 * 厂商 logo 文件扩展名映射。
 * 直接按实际文件加载，避免先请求不存在的 .png 触发 404 裂图后再回退。
 */
const VENDOR_EXT: Record<string, "png" | "svg"> = {
  alibaba: "png",
  anthropic: "png",
  baichuan: "png",
  baidu: "png",
  bytedance: "png",
  deepseek: "svg",
  google: "svg",
  meituan: "png",
  meta: "svg",
  microsoft: "png",
  minimax: "png",
  mistral: "svg",
  moonshot: "png",
  openai: "svg",
  stepfun: "svg",
  tencent: "png",
  yi: "png",
  zhipu: "png",
  nvidia: "svg",
  cohere: "png",
};

/**
 * 模型 id → 产品 logo 家族文件名（public/product-logos/ 下）。
 * AI 模型经常迭代版本号（gpt-6-astra → gpt-6-luna 等），同一家族复用同一图标，
 * 避免每个版本号都拷贝一份 png；未映射的 id 走默认 {modelId}.png/.svg 加载。
 */
const MODEL_LOGO: Record<string, string> = {
  "gemini-4-carbon": "gemini.png",
  "gemini-4-argon": "gemini.png",
  "gemini-3-8-flash": "gemini.png",
  "gemini-3-5-flash-lite": "gemini.png",
  "claude-opus-5-5": "claude.png",
  "claude-sonnet-5-5": "claude.png",
  "claude-fable-5-1": "claude.png",
  "claude-haiku-5-5": "claude.png",
  "gpt-6-astra": "openai.png",
  "gpt-6-1-sol": "openai.png",
  "gpt-6-1-terra": "openai.png",
  "gpt-6-luna": "openai.png",
  "kimi-k3-1-pro": "kimi.png",
  "kimi-k3": "kimi.png",
  "kimi-k3-low": "kimi.png",
  "kimi-k2": "kimi-k2.png",
  "kimi-k2-5": "kimi-k2.png",
  "kimi-k2-6": "kimi-k2.png",
  "kimi-k2-7-code": "kimi-k2.png",
  "kimi-k2-thinking": "kimi-k2.png",
  "kimi-k2-0905": "kimi-k2.png",
  "kimi-linear-48b-a3b-instruct": "kimi.png",
  "qwen3-8-max": "qwen.png",
  "qwen3-8-27b": "qwen.png",
  "deepseek-v4-1-flash-1017": "deepseek.png",
  "deepseek-v4-pro-0813": "deepseek.png",
  "glm-5-3": "glm.png",
  "glm-5-3-flash": "glm.png",
  "minimax-m3-1-flash": "minimax.png",
  "minimax-m3": "minimax.png",
  "step-5-preview": "step.png",
  "ling-3-1-flash-1019": "hunyuan.png",
  "inkling-small": "hunyuan.png",
  "inkling-2-small": "hunyuan.png",
  inkling: "hunyuan.png",
  "mistral-large-4": "mistral.png",
  "mistral-small-4": "mistral.png",
  "mistral-medium-3-5": "mistral.png",
  "nemotron-3-5-super-vl": "nvidia.svg",
  "nemotron-3-ultra": "nvidia.svg",
  "nemotron-3-5-lightning": "nvidia.svg",
  "nemotron-3-nano-4b": "nvidia.svg",
  "command-a": "cohere.png",
  "grok-4-7": "grok.png",
};

export function vendorSlug(vendor: string): string | null {
  return VENDOR_SLUG[vendor] ?? null;
}

/**
 * 产品 logo：从 /product-logos/{modelId}.png 加载，失败回退首字母方块。
 */
export function ProductLogo({
  modelId,
  modelName,
  size = 32,
  radius = 8,
  strict = false,
}: {
  modelId: string;
  modelName: string;
  size?: number;
  radius?: number;
  /** 严格模式：无映射时直接用首字母方块，不猜测 {modelId}.png（避免 404 破图） */
  strict?: boolean;
}) {
  const [error, setError] = useState(false);
  const mapped = MODEL_LOGO[modelId];
  const [useSvg, setUseSvg] = useState(false);

  // 未映射的模型：strict 模式直接回退字母方块；否则尝试 {modelId}.png → {modelId}.svg
  const src = mapped
    ? `/product-logos/${mapped}`
    : useSvg
      ? `/product-logos/${modelId}.svg`
      : `/product-logos/${modelId}.png`;
  const showFallback = error || (strict && !mapped);

  if (showFallback) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: radius,
          background: "var(--mr-primary)",
          color: "#fff",
          fontSize: Math.max(10, size * 0.32),
          fontWeight: 600,
          flex: "none",
        }}
      >
        {modelName.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        /* 瓷片化：白底 + 发丝边框，深色卡片上不再是突兀的裸白底方块 */
        background: "#fff",
        border: "1px solid var(--mr-border)",
        borderRadius: radius,
        boxSizing: "border-box",
        /* 资源已统一归一化（内容占画布 90%），瓷片内边距收紧让视觉与其它图标一致 */
        padding: Math.max(1, size * 0.04),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={modelName}
        onError={() => {
          if (mapped) {
            // 家族映射明确指定了文件，加载失败直接回退方块
            setError(true);
          } else if (!useSvg) {
            setUseSvg(true);
          } else {
            setError(true);
          }
        }}
        style={{
          width: size * 0.84,
          height: size * 0.84,
          objectFit: "contain",
        }}
      />
    </span>
  );
}

/**
 * 厂商 logo：按 VENDOR_EXT 映射直接加载正确扩展名，失败回退另一种，再失败回退厂商文字首字母。
 */
export function VendorLogo({
  vendor,
  size = 48,
  radius = 8,
}: {
  vendor: string;
  size?: number;
  radius?: number;
}) {
  const [error, setError] = useState(false);
  const slug = vendorSlug(vendor);
  const [triedExt, setTriedExt] = useState<"png" | "svg" | null>(null);

  if (!slug || error) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: radius,
          background: "var(--mr-card-2)",
          color: "var(--mr-text-3)",
          fontSize: Math.max(12, size * 0.35),
          fontWeight: 600,
          flex: "none",
        }}
      >
        {vendor.slice(0, 1)}
      </span>
    );
  }

  const primaryExt = VENDOR_EXT[slug] ?? "png";
  const ext = triedExt ?? primaryExt;
  const fallbackExt = primaryExt === "png" ? "svg" : "png";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        flex: "none",
        /* 瓷片化：白底 + 发丝边框，深色卡片上不再是突兀的裸白底方块 */
        background: "#fff",
        border: "1px solid var(--mr-border)",
        borderRadius: radius,
        boxSizing: "border-box",
        padding: Math.max(1, size * 0.04),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/vendor-logos/${slug}.${ext}`}
        onError={() => {
          if (triedExt !== fallbackExt) {
            setTriedExt(fallbackExt);
          } else {
            setError(true);
          }
        }}
        alt={vendor}
        style={{
          width: size * 0.84,
          height: size * 0.84,
          objectFit: "contain",
        }}
      />
    </span>
  );
}
