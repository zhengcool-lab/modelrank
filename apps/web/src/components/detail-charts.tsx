"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import type { EChartsOption } from "echarts";
import type { ModelRecord } from "@modelrank/shared";
import { EChart } from "./echart";

export function DetailCharts({ model }: { model: ModelRecord }) {
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
        axisLabel: { color: axisText, fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: (v: { min: number }) => Math.floor(v.min - 1),
        max: (v: { max: number }) => Math.ceil(v.max + 1),
        splitLine: { lineStyle: { color: gridLine } },
        axisLabel: { color: axisText, fontSize: 10 },
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
          { name: "推理", max: 100 },
          { name: "代码", max: 100 },
          { name: "数学", max: 100 },
          { name: "中文", max: 100 },
          { name: "多模态", max: 100 },
        ],
        radius: 62,
        center: ["50%", "52%"],
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
                model.dims.reasoning,
                model.dims.code,
                model.dims.math,
                model.dims.chinese,
                model.dims.multimodal,
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
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <div style={{ flex: 1 }}>
        <EChart option={lineOption} height={140} />
      </div>
      <div style={{ width: 150, flex: "none" }}>
        <EChart option={radarOption} height={150} />
      </div>
    </div>
  );
}
