"use client";

import * as echarts from "echarts";
import { useEffect, useRef, useState } from "react";

export function EChart({
  option,
  height = 140,
}: {
  option: echarts.EChartsOption;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  /* echarts chunk 在 edge/CDN 上首屏要几百毫秒到数秒才到位，期间容器只是个空盒子。
     SSR 阶段就渲染骨架占位，画出来后再撤掉，避免用户把加载态当成「图表坏了」。 */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener("resize", onResize);
    /* hydration 后容器宽度才确定，首次 init 可能拿到 0 宽导致整图空白，用 ResizeObserver 兜住 */
    const ro = new ResizeObserver(() => chartRef.current?.resize());
    ro.observe(ref.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
    chartRef.current?.resize();
    setReady(true);
  }, [option]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <div ref={ref} style={{ width: "100%", height }} />
      {!ready && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--mr-text-4)",
            background: "var(--mr-card)",
          }}
        >
          图表加载中…
        </div>
      )}
    </div>
  );
}
