# ModelRank 二次细节走查 · 模型库 / 对比器

- **走查日期**：2026-10-31
- **走查对象**：https://modelrank-1br.pages.dev（/library、/compare 空态、/compare?ids=2模型、/compare?ids=4模型）
- **走查方式**：headless Chrome 真实截图（桌面 1440 + 移动 375，浅色 + 深色）+ CDP 模拟搜索/筛选空态 + 源码定位
- **基线参考**：`00-SUMMARY.md`（P0/P1 已修项不重复报告，以下均为新发现或回归项）

---

## 问题清单

| # | 页面 | 位置 | 问题描述 | 严重度 | 证据文件 | 修复建议 |
|---|---|---|---|---|---|---|
| 1 | /library | 桌面端整页 | 1440px 下桌面表格（`hidden md:block`）与移动卡片列表（`md:hidden`）**同时渲染**，同一批 10 个模型展示两遍，空态文案也出现两遍。Tailwind 响应式断点未生效。 | P1 | library-1440-light.png, library-1440-dark.png, library-search-empty-1440-light.png | 检查 Tailwind v4 的 `md:` 断点是否正确生成；确认 `hidden`/`md:block`/`md:hidden` 类是否被 PostCSS 正确编译。 |
| 2 | /compare（2/4模型） | 横表移动端 | 375px 下对比横表 `overflow:hidden` 直接裁切右侧模型列：2 模型时 Claude 列被切一半，4 模型时第 3、4 个模型完全不可见，无横向滚动。 | P1 | compare-2-375-light.png, compare-4-375-light.png | 横表外层容器改 `overflowX:auto`，或移动端降级为纵向堆叠卡片。 |
| 3 | /compare（4模型） | 价格行 | 4 模型时价格单元格 `whiteSpace:nowrap` 在窄列中溢出，4 列价格文字粘连成一行："输入12/输出6输入15/输出7输入1.5/输出3输入2/输出6"。 | P1 | compare-4-1440-light.png | 价格行去掉 nowrap，允许换行；或减少"输入/输出"文字，只显示数字。 |
| 4 | /compare 空态 | 空态下方 | 无选中模型时，虚线空态框下方仍渲染月预算卡片和三张结论推荐卡，空态被夹在中间像半成品，用户不知道下一步该做什么。 | P1 | compare-empty-1440-light.png, compare-empty-375-light.png | 空态时隐藏月预算卡和结论卡，或把空态框做成全宽居中、独占首屏。 |
| 5 | /compare（全态） | 底部三张推荐卡 | "综合最强 GPT-5""性价比最高 Yi-1.5-9B""预算内推荐 GPT-5"是写死的全局推荐，与当前对比的模型无关；空态时也出现。用户以为是对比结论，实际是固定推荐。 | P1 | compare-empty-1440-light.png, compare-2-1440-light.png, compare-4-1440-light.png | 有选中模型时才显示结论卡，且结论应基于当前对比集计算（如"你选的模型中综合最高是 X"）；空态时隐藏。 |
| 6 | /library | 空态 | 搜索无结果或筛选无结果时仅一行灰字"没有符合条件的模型，试试调整筛选或搜索关键词"，无图标、无"清除筛选"按钮、无恢复路径。 | P2 | library-search-empty-1440-light.png, library-filter-empty-1440-light.png | 加空状态插画 + "清除全部筛选"按钮 + 热门模型推荐 chips。 |
| 7 | /compare 空态 | 空态框内 | 空态只有"去模型库挑选模型"一个按钮，未利用 UI_MODELS 做热门模型快速添加 chips 或内嵌搜索框，用户需跳转两跳才能开始对比。 | P2 | compare-empty-1440-light.png | 空态框内加"热门模型"chips（GPT-5 / Claude Opus / DeepSeek-R1 / Qwen3-Max），点击直接加入对比。 |
| 8 | /compare（2/4模型） | 价格行标签 | 指标列宽 150px，"价格（输入/输出 ¥/M token）"折成两行，与其他单行标签不对齐。 | P2 | compare-2-1440-light.png, compare-4-1440-light.png | 缩短标签为"价格（¥/M）"，或指标列加宽到 170px。 |
| 9 | /library + /compare | 移动端筛选区 | 厂商 chip 行最后一个 chip（Google/Mistral/零一万物）紧贴屏幕右缘被切；月预算分段按钮"¥500+"也被切。 | P2 | library-375-light.png, compare-empty-375-light.png | chip 容器加 `padding-right` 或 `overflow-x:auto` 横向滚动；分段按钮组允许横向滚动。 |
| 10 | /compare（全态） | 底部推荐卡 | 三张推荐卡 `flex:1 1 220px` 在 375px 下并排溢出，第二张卡"查看详情"按钮被切到屏幕外。 | P2 | compare-empty-375-light.png, compare-2-375-light.png | 移动端推荐卡改单列堆叠（`flex:1 1 100%`）。 |
| 11 | /library | 桌面表格 | 性价比 S/A 徽章紧贴价格数字（"12 / 60S"），两列之间无间距，视觉粘连。 | P2 | library-1440-light.png | 性价比列加 `padding-left` 或价格列加 `padding-right`，拉开间距。 |
| 12 | /library | 深色模式徽章 | B/C 级徽章用浅灰底（`#e5e6eb` / `var(--mr-card-2)`），深色模式下像白色方块刺眼，未适配暗色 token。 | P2 | library-1440-dark.png | B/C 徽章深色模式改深灰底 + 浅灰字，用 `.dark` 选择器覆盖。 |

---

## 空状态清单

| 空状态 | 当前表现 | 问题 | 建议 |
|---|---|---|---|
| **对比器 /compare 无选中** | 虚线框"尚未选择模型——从模型库挑选 2-4 个模型后，此处出现对比横表" + "去模型库挑选模型"按钮 | ① 按钮已修（P0-3 已修）；② 但下方仍渲染月预算卡和三张推荐卡，空态不纯粹；③ 无热门模型快速添加 chips，需跳转模型库 | 空态独占首屏，加热门模型 chips 一键加入；隐藏月预算卡和结论卡 |
| **模型库搜索无结果** | 表格区一行灰字"没有符合条件的模型，试试调整筛选或搜索关键词" | ① 无图标无插画；② 无"清除搜索"按钮；③ 无推荐搜索词；④ 空态文案同时在桌面表格和移动卡片出现两遍（因 #1 响应式 bug） | 加搜索图标 + "清除搜索"按钮 + 热门搜索词 chips |
| **模型库筛选无结果** | 同上，一行灰字 | ① 无"清除全部筛选"按钮；② 不提示当前选中了哪些筛选条件导致无结果 | 加"清除全部筛选"按钮 + 显示当前已选筛选条件摘要 |
| **对比器 4 模型信息密度** | 价格行文字重叠（#3），表头模型名换行 2-3 行 | 4 模型时列宽不足，价格 nowrap 导致溢出 | 价格行允许换行，或移动端降级为纵向卡片对比 |
| **写死假数据检查** | 三张推荐卡中"综合最强 GPT-5""性价比最高 Yi-1.5-9B"是从 UI_MODELS 全局计算的，不是写死第 2、3 个；但"预算内推荐"是写死 pick 字段（deepseek-r1/gpt-5/claude-opus-4-5），与用户实际预算输入无关 | 预算推荐是写死映射，不随自定义金额变化；且三张卡在空态也出现 | 预算推荐应随自定义金额实时计算；空态时隐藏结论卡 |
