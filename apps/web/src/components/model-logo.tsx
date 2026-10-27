"use client";

import { useState } from "react";

/** 厂商中文名 → 厂商 logo 文件 slug */
const VENDOR_SLUG: Record<string, string> = {
  OpenAI: "openai",
  Anthropic: "anthropic",
  Google: "google",
  深度求索: "deepseek",
  DeepSeek: "deepseek",
  阿里: "alibaba",
  阿里通义: "alibaba",
  字节跳动: "bytedance",
  Meta: "meta",
  月之暗面: "moonshot",
  Mistral: "mistral",
  "Mistral AI": "mistral",
  腾讯: "tencent",
  百度: "baidu",
  阶跃星辰: "stepfun",
  MiniMax: "minimax",
  美团: "meituan",
  零一万物: "yi",
  智谱: "zhipu",
  Microsoft: "microsoft",
  百川: "baichuan",
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
}: {
  modelId: string;
  modelName: string;
  size?: number;
  radius?: number;
}) {
  const [error, setError] = useState(false);
  const src = `/product-logos/${modelId}.png`;
  const fallbackSvg = `/product-logos/${modelId}.svg`;
  const [useSvg, setUseSvg] = useState(false);

  if (error) {
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={useSvg ? fallbackSvg : src}
      alt={modelName}
      width={size}
      height={size}
      onError={() => {
        if (!useSvg) {
          setUseSvg(true);
        } else {
          setError(true);
        }
      }}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "contain",
        flex: "none",
        background: "transparent",
      }}
    />
  );
}

/**
 * 厂商 logo：从 /vendor-logos/{slug}.png 加载，失败回退厂商文字首字母。
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/vendor-logos/${slug}.png`}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.src.endsWith(".svg")) {
          img.src = `/vendor-logos/${slug}.svg`;
        } else {
          setError(true);
        }
      }}
      alt={vendor}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "contain",
        flex: "none",
      }}
    />
  );
}
