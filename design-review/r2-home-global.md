# ModelRank 二次走查报告 · 首页 / 详情页 / 全局组件

- **走查日期**：2026-10-31
- **走查对象**：https://modelrank-1br.pages.dev
- **走查方式**：Headless Chrome 截图（桌面 1440 + 移动 375，亮色 + 深色）+ CDP 计算样式/布局测量 + 源码核对
- **走查范围**：首页 `/`、详情页 `/detail/gpt-5` 与 `/detail/claude-opus-4-5`、全局组件（nav-header / footer / compare-bar / theme-toggle / Toast）
- **基线**：`design-review/00-SUMMARY.md`，P0+P1 已修复上线，本报告只报线上仍存在或新发现的问题

---

## 问题清单

| # | 页面 | 位置 | 问题描述 | 严重度 | 证据文件 | 修复建议 |
|---|------|------|----------|--------|----------|----------|
| 1 | 详情页（全站） | 右侧栏「合规资质」卡片 | 灰色 chip 上写着「暂未取得：算法备案（示例）」，其中「（示例）」是开发占位文案，直接暴露给终端用户。每个模型详情页都出现。 | P1 | `detail-gpt5-desktop.png`、`detail-claude-desktop.png`、`detail-gpt5-mobile-cdp2.png`、`detail-gpt5-dark.png` | 删除「（示例）」后缀；或改为按厂商真实合规数据驱动，未取得时不显示该 chip。源码 `detail/[id]/page.tsx:329` 硬编码。 |
| 2 | 详情页（全站） | 左下「价格（API 按量）」卡片第三组 | 「同类中位数 ¥9 / ¥27」对所有模型都显示同一组数字，未从 UI_MODELS 派生计算。GPT-5 输入 ¥12、Claude 输入 ¥15，但中位数永远是 ¥9/¥27。 | P1 | `detail-gpt5-desktop.png`（¥12/¥60 旁标 ¥9/¥27）、`detail-claude-desktop.png`（¥15/¥75 旁标同样 ¥9/¥27） | 从 UI_MODELS 计算输入/输出价格的中位数（`[...UI_MODELS].sort()[Math.floor(n/2)]`），或标注「全站中位 · 2026-10」。源码 `detail/[id]/page.tsx:203` 硬编码。 |
| 3 | 详情页（全站） | 右下「规格」卡片 chips | 「最大输出 16K」「知识截止 2025-06」「参数规模未公开」三项对所有模型完全相同。GPT-5 上下文 128K、Claude 200K、Gemini 1M，但最大输出都写 16K，知识截止都写 2025-06，明显不真实。 | P1 | `detail-gpt5-desktop.png`（上下文 128K + 最大输出 16K）、`detail-claude-desktop.png`（上下文 200K + 同样最大输出 16K） | 将真实规格字段补入 UI_MODELS 数据结构（maxOutput / knowledgeCutoff / paramSize），未提供的字段不渲染 chip；不要全站写死同一组值。源码 `detail/[id]/page.tsx:223-225`。 |
| 4 | 详情页（DeepSeek 系） | 右侧栏「厂商背景」卡片 | 源码 VENDOR_BACKGROUND 以英文键 "DeepSeek" 索引，但 UI_MODELS 中厂商名是中文「深度求索」，查找 miss 后走通用兜底文案「深度求索，开源模型线厂商…」，而不是已写好的 DeepSeek 专属介绍（幻方孵化、杭州、开源权重等）。 | P1 | 需访问 `/detail/deepseek-r1` 验证；源码 `detail/[id]/page.tsx:15-24` vs `seed-data.ts` vendor 字段为「深度求索」 | 将 VENDOR_BACKGROUND 的 key 改为中文厂商名，或同时映射中英文别名。 |
| 5 | 全站 | Footer 与主内容左右边距不对齐 | Footer 使用 `mr-mx`（视口左右各 44px），主内容区使用 `.mr-container`（max-width 1200px 居中）。在 1440px 视口下，内容左缘在 x=120，Footer 链接左缘在 x=44，相差 76px，视觉上 Footer 明显偏左。 | P2 | CDP 测量：container x=120 w=1200；footer 外层 x=0 w=1440。`home-desktop-full.png` 底部 Footer 与上方表格左缘不对齐。 | 将 `<Footer />` 移入 `.mr-container` 内部，或 Footer 也包裹一层 `mr-container`，使 Footer 内容与正文同宽同边距。源码 `footer.tsx:6` 用 `mr-mx`。 |
| 6 | 详情页（非 OpenAI 厂商） | 右侧栏「地区可用性」卡片 | 仅 OpenAI 有逐国家列表（6 个可直连 + 3 个 blocked），Anthropic / Google / Meta / Mistral 等全部走一行兜底文案「中国大陆需合规代理接入 · 美国 / 欧洲可直连」。GPT-5 与 Claude 详情页该卡片信息密度和结构完全不一致。 | P2 | `detail-gpt5-desktop.png`（逐国列表）vs `detail-claude-desktop.png`（一行文字） | 为主要厂商补充 VENDOR_REGIONS 数据；或统一为一行摘要 + 「查看详细地区 →」链接，不要两个模板并存。源码 `detail/[id]/page.tsx:27-32, 312-314`。 |
| 7 | 详情页（25/28 模型） | 左下「相关新闻」卡片空状态 | 仅一行 12px 灰字「暂无相关新闻」，无图标、无 CTA、无兜底推荐。UI_NEWS 中仅 GPT-5（2 条）、Claude Opus 4.5（1 条）、DeepSeek-R1（1 条）、Qwen3-Max（1 条）、Gemini 3 Pro（1 条）有相关新闻，其余 25 个模型全部落空。 | P2 | 源码 `detail/[id]/page.tsx:247-249`；空状态截图见 `detail-claude-desktop.png`（仅 1 条新闻仍非空，需访问如 `/detail/doubao-pro-128k` 复现空态） | 空状态改为：轻量图标 + 「暂无该模型相关新闻」+ 「查看最新行业动态 →」链接到 `/news`。或在无相关新闻时 fallback 展示最新 2 条通用新闻。 |
| 8 | 404 页 `/detail/xxx` | 整页 | 404 页仅居中显示「404 页面走丢了 + 返回首页按钮 + 热门模型 chip」，没有 NavHeader 导航栏，也没有 Footer。用户从错误 URL 进入后除了「返回首页」按钮外无法跳转其他页面。 | P2 | `detail-notfound-desktop.png`（顶部无导航栏） | 在 `not-found.tsx` 中引入 `<NavHeader />` 和 `<Footer />`，与其他页面保持全局组件一致。 |
| 9 | 全站 Footer | 版权行 | 「© 2026 ModelRank 模型榜」年份硬编码，不会随年份自动更新。 | P2 | `home-desktop-full.png` 右下角、`footer.tsx:37` | 改为 `© {new Date().getFullYear()} ModelRank 模型榜`。 |
| 10 | 全站 | 通知反馈体系 | 代码库中无 Toast 组件（grep `toast/Toast` 0 匹配）。对比栏「清空」按钮点击后无任何反馈，主题切换仅靠图标变化，表单/操作均无 `aria-live` 区域。 | P2 | 源码 grep 确认；`compare-bar.tsx:41-49` 清空按钮无反馈 | 封装轻量 Toast 组件（`aria-live="polite"`），对比清空后提示「已清空对比选择」。 |
| 11 | 深色模式首页 | 表格行分隔线 | 深色模式下表头与卡片背景均为深色，行分隔线 `--mr-border` 过暗，28 行表格行间几乎无视觉分隔，长表格扫视串行风险高。 | P2 | `home-dark-desktop.png`（表格行之间分界线极淡） | 深色模式下将 `--mr-border` 提亮到 `#2a2f3a` 左右，或启用斑马纹（奇数行 `rgba(255,255,255,0.02)`）。 |
| 12 | 详情页深色模式 | 头部 ProductLogo | 深色模式下 GPT-5 旁的产品 logo 渲染为极小且对比度低的图标，与浅色模式下的 OpenAI 花朵 logo 视觉重量不一致；部分模型 PNG 自带白底在深色卡片上突兀。 | P2 | `detail-gpt5-dark.png`（标题旁 logo 偏小偏暗） | ProductLogo 增加 `filter: brightness(1.1)` 或在深色模式下加浅色底衬；统一 logo 视觉尺寸。 |

---

## 空状态清单

| 页面/区块 | 触发方式 | 当前表现 | 可复用数据填充方案 |
|-----------|----------|----------|---------------------|
| 详情页「相关新闻」 | 访问无相关新闻的模型，如 `/detail/doubao-pro-128k`、`/detail/kimi-k2`、`/detail/step-3` 等（25/28 模型） | 一行 12px 灰字「暂无相关新闻」，无图标无按钮 | ① 兜底展示 UI_NEWS 中最新 2 条通用新闻（不按 relatedModel 过滤）；② 或加「查看全部新闻 →」链接到 `/news`；③ 加轻量图标（如 Newspaper icon）。 |
| 详情页「XX 其他模型」 | 访问仅有 1 个模型的厂商，如 `/detail/doubao-pro-128k`（字节跳动仅 1 个）、`/detail/hunyuan-pro`（腾讯仅 1 个） | 已有设计良好的空状态：「该厂商暂无其他已收录模型，后续会随榜单更新补充。」+「浏览完整榜单 →」链接。✅ 无需修改。 | 已实现，无需改动。源码 `lead-form.tsx:26-38`。 |
| 404 页 `/detail/不存在的id` | 访问 `/detail/nonexistent-model-xyz` | 居中大「404」+「页面走丢了」+「← 返回首页」按钮 + 4 个热门模型 chip（按 score 排序取前 4）。✅ 空状态设计合理，但缺 NavHeader/Footer。 | ① 补全局导航；② 热门模型已从 UI_MODELS 派生（`[...UI_MODELS].sort((a,b)=>b.score-a.score).slice(0,4)`），无需改动数据层。 |
| 对比栏 CompareBar | 未勾选任何模型 | `if (selected.length === 0) return null` —— 完全不渲染，页面底部无任何占位。✅ 设计合理（避免干扰）。 | 无需改动。 |
| 留资表单 LeadForm | —— | 已移除，替换为 SameVendorModels 组件。原表单不再存在。 | N/A。 |
| 首页榜单表格 | 筛选 S/A/B/C 后无结果（当前数据每档都有模型，难触发） | 未单独走查；源码 `leaderboard-table.tsx` 未审。 | 建议后续补充：筛选无结果时显示「该档位暂无模型」+ 清除筛选按钮。 |

---

## 已修复确认（基线问题复核，不再报告为问题）

以下基线问题在线上已修复，截图确认：

1. **P0-1 厂商 logo 404 裂图** → 已修复。VendorLogo 有扩展名回退 + 首字母兜底；ProductLogo 有 png→svg→蓝底首字母三级回退。
2. **P0-2 模型总数矛盾** → 已修复。首页表头「已收录 28 个模型」与表格底部「共 28 个模型」一致。
3. **详情页雷达图右侧标签被裁切** → 已修复。雷达图与折线图改为上下堆叠，5 个轴标签（推理/代码/数学/中文/多模态）完整可见。
4. **维度口径不一致（首页 4 维 vs 雷达 5 维）** → 已修复。首页表格能力列已改为 5 维（推理/代码/数学/中文/多模态），与雷达图一致。
5. **右栏强插企业咨询留资表单** → 已修复。留资表单移除，替换为「XX 其他模型」列表（SameVendorModels）。
6. **导航激活态无 aria-current** → 已修复。`nav-header.tsx:115` 已加 `aria-current={active ? "page" : undefined}`。
7. **汉堡菜单无 Esc/无滚动锁定** → 已修复。`nav-header.tsx:30-48` 已实现 body 滚动锁定 + Esc 关闭 + 路由变化自动收起。
8. **Footer 链接无下划线对比度低** → 已修复。`footer.tsx:9-18` 加了 `.footer-link` 下划线样式。
9. **移动端横向溢出（CLI 截图误报）** → CDP 测量确认 `documentElement.scrollWidth = 375 = window.innerWidth`，无横向溢出。此前 `--virtual-time-budget` 截图中 ECharts 未完成布局导致的裁切是 headless 渲染时序问题，非真实 bug。
