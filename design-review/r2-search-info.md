# ModelRank 二次细节走查报告 · 搜索页 & 信息页

- **走查日期**：2026-10-31
- **走查对象**：https://modelrank-1br.pages.dev/
- **走查范围**：/search（空输入/有结果/零结果）、/about、/data-sources、/disclaimer、/definitely-not-exist（404）
- **走查方式**：headless Chrome 桌面 1440 + 移动 375 截图 + 深色模式（localStorage theme=dark）+ 源码核对
- **基线对照**：基线搜索页 P1（聚焦光晕、autoFocus、关键词高亮、建议下拉）与信息页 P1（44px padding、maxWidth 居中、污染风险徽章）已修复上线，本次不重复报告

---

## 问题清单

| # | 页面 | 位置 | 问题描述 | 严重度 | 证据文件 | 修复建议 |
|---|---|---|---|---|---|---|
| 1 | /search（所有状态） | 移动端搜索框右侧 | 移动端 375px 下「搜索」按钮完全不可见，输入框撑满整行。源码中按钮存在（flex 子元素，height:36），但渲染时被挤出视口或宽度为 0。桌面端正常显示。 | P1 | search-deepseek-mobile.png、search-empty-mobile.png、search-zero-dark-mobile.png | 检查 flex 布局：移动端可将按钮改为输入框内嵌右侧图标按钮，或减小 padding 确保按钮不溢出；也可移动端隐藏按钮（即时搜索下按钮冗余） |
| 2 | /search?q=deepseek | 输入框下方 | autoFocus 触发后，建议下拉层在页面首屏即展开，并遮挡下方第一条模型结果（DeepSeek-R1 行被下拉阴影覆盖上半部分）。用户进入带 ?q= 的搜索结果页时第一眼看到的是下拉层盖住结果，而非完整结果列表。 | P1 | search-deepseek-desktop.png、search-deepseek-mobile.png、search-deepseek-dark-desktop.png | autoFocus 时不要自动展开下拉（focused 状态初始为 false，仅用户主动聚焦时展开）；或延迟 300ms 后再展开下拉 |
| 3 | /search?q=zzzzz | 全页 | 零结果时「模型 (0)」和「新闻 (0)」两个分区各自显示一行灰字"未找到相关模型/新闻"，无统一空状态。无热门搜索推荐词 chips、无"您是不是要找"提示、无一键恢复路径。用户只能手动清空输入重新搜索。 | P1 | search-zero-desktop.png、search-zero-mobile.png、search-zero-dark-mobile.png | 全空时合并为一个统一空态卡片：大图标 + "未找到与「zzzzz」相关的结果" + 推荐搜索 chips（从 UI_MODELS 名称派生前 6 个热门词，如 GPT-5、DeepSeek-R1、Claude Opus 4.5 等可点击 chips）+ "清除搜索"按钮 |
| 4 | /about、/data-sources、/disclaimer | 移动端全页 | 移动端 375px 下内容卡片右边缘超出视口：About 页正文每行右侧被裁切、Data-sources 页右侧"污染风险"徽章被切掉一半、Disclaimer 页正文右侧被裁切。桌面端正常居中。 | P1 | about-mobile.png、data-sources-mobile.png、disclaimer-mobile.png | 检查 mr-pad-x + maxWidth:760/820 + margin:0 auto 的组合在移动端是否产生宽度溢出；可能原因：maxWidth 与 padding 叠加后未用 box-sizing: border-box，或内部 flex 子元素 min-width 未设 0。建议容器加 `overflow-wrap: break-word`，flex 行加 `min-width: 0` |
| 5 | /definitely-not-exist (404) | 整页 | 404 页是独立页面，无 NavHeader 导航栏、无 Footer 页脚。用户落在 404 后只能点"返回首页"一个按钮，无法直接跳转到榜单/模型库/搜索等其他页面。 | P2 | 404-desktop.png、404-mobile.png | 404 页复用 NavHeader + Footer 布局，或至少在 404 内容区增加"去榜单看看""去搜索"两个次级链接 |
| 6 | /definitely-not-exist (404) | 热门模型区 | 移动端 375px 下 4 个热门模型卡片横向排列溢出视口右侧："Claude Opus 4.5""Claude Sonnet 4.5"等卡片名称被裁切。虽然设了 flexWrap，但卡片宽度未约束，一行塞两个仍然溢出。 | P2 | 404-mobile.png | 热门模型卡片改为 grid 两行两列，或移动端改为单列纵向列表；卡片加 `max-width: 45%` 确保每行两个不溢出 |
| 7 | /data-sources | 第二卡片正文 | 公开页面仍暴露内部源码路径 `apps/web/src/lib/seed-data.ts`（以 `<code>` 灰底块形式渲染）。用户可由此推断技术栈和文件结构。 | P2 | data-sources-desktop.png、data-sources-mobile.png | 改为"内部数据仓库统一维护"，不暴露具体文件路径 |
| 8 | /disclaimer | 页头 | 免责声明页缺副标题。兄弟页 About 有"独立、透明、可申诉的大模型能力排行榜"，Data-sources 有"所有榜单分数均可追溯到下列公开来源"，唯独 Disclaimer 页标题下直接是正文卡片，页头结构不一致。 | P2 | disclaimer-desktop.png | 补一句副标题："信息仅供参考，最终以厂商官方文档为准" |
| 9 | /about、/data-sources、/disclaimer | 页头标题 | 三页大标题均用 `<div>` 而非 `<h1>`，整页无标题层级。搜索引擎和读屏用户无法按标题导航。 | P2 | 源码确认 + about-desktop.png | 页头大标题改 `<h1>`，卡片标题改 `<h2>` |
| 10 | /about vs /data-sources vs /disclaimer | 内容容器宽度 | 三页内容区 maxWidth 不统一：About=760px、Data-sources=820px、Disclaimer=760px。视觉上 Data-sources 明显比另外两页宽。 | P2 | about-desktop.png、data-sources-desktop.png | 统一为 760px（或 720px），三兄弟页保持一致 |
| 11 | /about | 第一卡片第二段 | 核心信任声明"我们承诺：不接受付费排名、不接受厂商充值上榜"仅用 `<b>` 加粗混在正文里，无视觉强调。作为全站最重要的信任背书，淹没在三段灰文字中。 | P2 | about-desktop.png、about-dark-desktop.png | 改为左侧主色边条 + 浅蓝底 callout 块，独立成段突出展示 |
| 12 | /search（空输入） | 空状态卡片内 | 空状态引导文案"试试「GPT」「开源」「价格」"是纯文本，不可点击。用户看到示例词仍需手动输入，增加操作成本。 | P2 | search-empty-desktop.png、search-empty-mobile.png | 将示例词改为可点击 chips（与 recent searches chips 同样式），点击即触发搜索 |
| 13 | /search（所有状态） | 搜索框右侧 | 输入框高度仍为 36px（移动端触控目标偏小），且"搜索"按钮与即时搜索逻辑重复——输入即过滤，按钮仅用于写 localStorage。 | P2 | search-deepseek-desktop.png | 输入框高度提到 40px+；移动端隐藏"搜索"按钮（即时搜索下冗余），桌面端保留用于提交历史记录 |

---

## 空状态清单

### 1. /search 空输入态（未搜索时）
- **当前表现**：虚线边框卡片，居中显示"输入关键词开始搜索"+ 引导文字"试试「GPT」「开源」「价格」，或浏览全量模型库"
- **有 recent searches 时**：卡片下方显示最近搜索 chips（最多 6 个，从 localStorage 读取）
- **问题**：
  - 示例词"GPT/开源/价格"是纯文本，不可点击（问题 #12）
  - 移动端空状态卡片文字右溢（约"全量模型库"被裁切）
  - 无热门搜索推荐（仅靠 localStorage recent，首次用户看不到任何推荐）

### 2. /search?q=zzzzz 零结果态
- **当前表现**：两个分区各自提示——"模型 (0)"卡片内"未找到相关模型"，"新闻 (0)"卡片内"未找到相关新闻"
- **问题**：
  - ❌ 无统一空状态（两个割裂卡片）
  - ❌ 无推荐词 chips（无法从 UI_MODELS 20 个模型名/8 条新闻标题派生热门搜索词填充）
  - ❌ 无"您是不是要找"拼写纠正建议
  - ❌ 无一键恢复路径（只能手动清空输入框）
  - ❌ 无插画/图标增强空状态视觉

### 3. 信息页（about / data-sources / disclaimer）
- **About 页**：无占位/缺失内容模块，三段正文完整
- **Data-sources 页**：无占位模块，5 条 benchmark + 价格说明完整；但暴露内部源码路径
- **Disclaimer 页**：无占位模块，四段正文完整；缺副标题

### 4. 404 页
- **有返回首页 CTA**：✅ "← 返回首页"蓝色主按钮
- **有热门模型推荐**：✅ 4 个高分模型卡片（GPT-5、Claude Opus 4.5、Gemini 3 Pro、Claude Sonnet 4.5）
- **问题**：无导航栏和页脚（问题 #5）、热门卡片移动端溢出（问题 #6）

### 5. 假数据/写死内容检查
- ✅ 搜索页结果来自 UI_MODELS / UI_NEWS 真实数据（非写死）
- ✅ 零结果提示为动态判断（modelHits.length === 0）
- ✅ 404 热门模型从 UI_MODELS 按 score 排序动态取前 4
- ⚠️ 新闻时间通过 fmtRelative() 动态计算（已从基线修复，不再写死"2 小时前"）
- ⚠️ About 页提到"当前站点为示例/mockup 版本"——这是有意声明，非 bug
