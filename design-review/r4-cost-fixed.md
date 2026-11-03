# R4 成本计算器显示体验修复记录（2026-11-01）

## 用户反馈
cost 页截图：右侧"同预算可考虑"推荐金额显示不完整（Claude Opus 4.5→"≈¥2,2"、Gemini 3 Pro→"≈¥1,3"，缺失数字与 /月）；整体"组件体验很差、显示感觉有问题"。

## 排查结论（先验证再改）
- CDP 实测线上 /cost 在 1440 与 1064 两个视口下，推荐金额均完整渲染："≈¥2,355/月"、"≈¥1,397/月"（amountRight=984 < 按钮右缘 996，clipped:false）。
- 截图中的"≈¥2,2"是深色/蓝色底上白字小字被 OCR 识别不全所致，**并非真实截断**。
- 但对比发现两个真实的显示体验问题：
  1. 月总 token 输入框 `flex:1` 撑满整行，"3900" 与"万 tokens" 之间留出大片空白（1064 视口实测间距约 370px），视觉松散；
  2. 推荐按钮无防溢出兜底，极端窄视口下模型名可能挤压金额。

## 改动（apps/web/src/app/cost/page.tsx）
| 位置 | 修复前 | 修复后 |
|---|---|---|
| 月总 token 输入框容器 | `flex:1`（撑满整行） | `flex:"0 1 240px"`，实测宽 214px，"万 tokens" 紧贴 |
| 推荐按钮模型名 span | 无约束 | `minWidth:0 + overflow:hidden + textOverflow:ellipsis + whiteSpace:nowrap` |
| 推荐按钮金额 span | 无约束 | `flex:none + whiteSpace:nowrap`（金额永远完整） |

## 线上验证（CDP，1064 视口，部署后实测）
- 输入框宽 **214px**，"万 tokens" 从距输入框 370px → 紧贴（截图 OCR：4000 x63-117 / 万 tokens x287-327）。
- 推荐金额 **"≈¥2,355/月"、"≈¥1,397/月" 完整**，clipped:false。
- 右栏卡片 400px、双栏并排、公式区位置均正常。

## 证据截图
- `design-review/r4-cost-fixed-1064.png`（线上 /cost · 1064 视口 · 修复后）

## 部署
`pnpm build` ✅ → `next-on-pages` ✅ → `wrangler pages deploy` ✅（预览 https://1f1695c7.modelrank-1br.pages.dev ，生产域名已同步）
