"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import type { UIModelRecord } from "@/lib/types";
import { EChart } from "./echart";

export function DetailCharts({ model }: { model: UIModelRecord }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const primary = dark ? "#5B8DEF" : "#2A5CAA";
  const gridLine = dark ? "#232B3D" : "#F2F3F5";
  const axisText = dark ? "#86909C" : "#86909C";

  const hasTrend = model.trendHistory.length >= 2;

  const lineOption = useMemo<EChartsOption>(() => {
    const weeks = model.trendHistory.map((_, i) => `W${i + 1}`);
    return {
      grid: { left: 30, right: 12, top: 12, bottom: 20 },
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: weeks,
        axisLine: { lineStyle: { color: gridLine } },
        axisLabel: { color: axisText, fontSize: 12 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: (v: { min: number }) => Math.floor(v.min - 1),
        max: (v: { max: number }) => Math.ceil(v.max + 1),
        splitLine: { lineStyle: { color: gridLine } },
        axisLabel: { color: axisText, fontSize: 12 },
      },
      series: [
        {
          data: model.trendHistory,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 5,
          showSymbol: false,
          lineStyle: { color: primary, width: 2.5 },
          itemStyle: { color: primary },
          areaStyle: { color: primary, opacity: dark ? 0.12 : 0.08 },
        },
      ],
    };
  }, [model, primary, gridLine, axisText, dark]);

  // 无历史时序时不用空折线占位：改展示 AA 官方评测子项（真实分数，横向条形）
  const benchItems = model.benchmarks ?? [];
  const benchOption = useMemo<EChartsOption>(() => {
    const labels = benchItems.map((b) => b.label);
    return {
      grid: { left: 118, right: 44, top: 4, bottom: 4 },
      tooltip: {
        trigger: "item",
        formatter: (p: unknown) => {
          const i = (p as { dataIndex: number }).dataIndex;
          const b = benchItems[i];
          return b ? `${b.label}：${b.value}${b.unit === "pct" ? "%" : " 分"}` : "";
        },
      },
      xAxis: {
        type: "value",
        max: 100,
        splitLine: { lineStyle: { color: gridLine } },
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: "category",
        data: labels,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: axisText, fontSize: 11 },
      },
      series: [
        {
          type: "bar",
          data: benchItems.map((b) => b.value),
          barWidth: 11,
          itemStyle: { color: primary, borderRadius: 4 },
          label: {
            show: true,
            position: "right",
            fontSize: 11,
            color: axisText,
            formatter: (p: unknown) => {
              const i = (p as { dataIndex: number }).dataIndex;
              const b = benchItems[i];
              return b ? `${b.value}${b.unit === "pct" ? "%" : ""}` : "";
            },
          },
        },
      ],
    };
  }, [benchItems, primary, gridLine, axisText]);

  const radarOption = useMemo<EChartsOption>(
    () => ({
      radar: {
        indicator: [
          { name: "财务", max: 100 },
          { name: "战略", max: 100 },
          { name: "法律", max: 100 },
          { name: "工程", max: 100 },
          { name: "经济", max: 100 },
        ],
        radius: 96,
        center: ["50%", "55%"],
        axisName: { color: axisText, fontSize: 11 },
        splitLine: { lineStyle: { color: gridLine } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: gridLine } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: [
                model.dims?.financeAndAccounting ?? 0,
                model.dims?.strategyAndOps ?? 0,
                model.dims?.legal ?? 0,
                model.dims?.engineering ?? 0,
                model.dims?.economics ?? 0,
              ],
              name: model.name,
              lineStyle: { color: primary, width: 2 },
              itemStyle: { color: primary },
              areaStyle: { color: primary, opacity: dark ? 0.25 : 0.18 },
            },
          ],
        },
      ],
    }),
    [model, primary, gridLine, axisText, dark]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* 上半：有 ≥2 期历史采样才画趋势折线；否则用 AA 官方评测子项条形图（真实数据） */}
      {hasTrend ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <EChart option={lineOption} height={200} />
        </div>
      ) : benchItems.length >= 2 ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "var(--mr-text-3)", marginBottom: 4 }}>
            AA 官方评测子项（当前快照，非时序）
          </div>
          <EChart option={benchOption} height={Math.max(150, benchItems.length * 26 + 12)} />
        </div>
      ) : (
        <div
          style={{
            padding: "18px 0",
            fontSize: 12,
            color: "var(--mr-text-3)",
            lineHeight: 1.7,
          }}
        >
          暂无可用的评测子项数据；评分趋势需逐期采样累积，本期为首期。
        </div>
      )}
      {/* 下半：能力五维雷达 */}
      <div className="w-full">
        <EChart option={radarOption} height={280} />
      </div>
    </div>
  );
}
