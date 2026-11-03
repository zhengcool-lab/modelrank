# R3 表格行间距修复记录（2026-11-01）

## 问题（用户反馈：深色模式首页排行榜截图）
表格行固定 `height:64px` 且垂直 padding 为 0；模型列含三行信息（模型名+标签 / 厂商·查看详情 / 上下文·更新时间），内容总高约 65px 超出行高，文字上下贴着行边缘，观感拥挤。

## 改动
| 文件 | 修复前 | 修复后 |
|---|---|---|
| `apps/web/src/components/leaderboard-table.tsx`（首页表格行） | `height:64, padding:"0 20px"` | `minHeight:76, padding:"12px 20px"`（内容自适应） |
| 同上（模型列内部） | 厂商行 `marginTop:6`、上下文行 `marginTop:3` | `marginTop:4` / `marginTop:2`，三行间距均匀 |
| `apps/web/src/app/library/page.tsx`（模型库表格行） | `height:56, padding:"0 24px"` | `minHeight:58, padding:"10px 24px"` |

## 线上验证（CDP 计算样式，2026-11-01 部署后实测）
- 首页表格：行高 **64px → 88px**（computed 88px）；paddingTop/Bottom **0 → 12px**；模型列首行文字距行顶 **14px**，末行文字距行底约 **15px**，不再贴边。
- 模型库表格：行高 **56px → 60px**（computed 60px）；paddingTop/Bottom **0 → 10px**；10 行全部命中。

## 证据截图
- `design-review/r3-home-table-spacing-dark.png`（线上首页·深色·修复后）
- `design-review/r3-library-table-spacing.png`（线上模型库·修复后）

## 部署
`pnpm build` ✅ → `next-on-pages` ✅ → `wrangler pages deploy` ✅（预览 https://173625f8.modelrank-1br.pages.dev ，生产域名已同步）
