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
      <div style={{ flex: 1, minWidth: 0 }}>
        <EChart option={lineOption} height={200} />
      </div>
      {/* 桌面端同样上下堆叠，避免雷达图右侧标签被卡片裁切 */}
      <div className="w-full">
        <EChart option={radarOption} height={280} />
      </div>
    </div>
  );
}
