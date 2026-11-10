# r4 多视角评审统一规范（三组子代理共同遵守）

## 0. 铁律
- 纯评审：只审查线上站点、只产出 Markdown 与截图。**禁止修改 apps/web 及任何源码、禁止 build/deploy/wrangler、禁止跑数据管道写库**。允许在 design-review/ 下写文件。
- 一切结论以当前线上为准：主域 `https://modelrank-1br.pages.dev`（部署 f2008aef）。旧报告 design-review/r2*、r3* 可参考但**严禁照抄**，每个问题必须本轮重新复现后才能写。
- **禁止编造**：客观缺陷必须能在截图/诊断 JSON/线上复现；主观建议放进「可发散方向」，与缺陷严格分开。
- 每个可点击页面都必须实际打开（不是只看代码）。代码可只读检查以定位成因，但现象以线上为准。

## 1. 工具链（已验证可用，不要另起炉灶）
- Python：`/Users/zhengyingbo/development/ModelRank/data-pipeline/.venv/bin/python`
- 仅 **webkit** 可用，不要 launch chromium/firefox。
- 统一截图脚本：`design-review/r4-assets/shot.py`（在仓库根目录运行）
  - 示例：`data-pipeline/.venv/bin/python design-review/r4-assets/shot.py --url <URL> --name <名称> --vp 390x844 --theme dark`
  - `--compare id1,id2` 预置 localStorage `modelrank:compare`（对比/成本页选中态）；主题通过 localStorage `theme=dark|light` 预置。
  - 每次运行产出 `<名称>__<宽>x<高>__<主题>.png` 整页截图 + 同名 `.json` 诊断（failedRequests≥400、consoleErrors、横向溢出 overflow、移动端 <34px 触控目标 smallTargets、损坏图片 brokenImages）。
  - 诊断 JSON 是线索不是结论：smallTargets 里表格行内文字链接（高 23px 一类）需目视判断是否成问题，不得机械搬运。
- 网络命令前先 `unset HTTPS_PROXY HTTP_PROXY ALL_PROXY https_proxy http_proxy`；curl 必须带 `-A "Mozilla/5.0"`，否则 403。
- 命令超过 15 秒会自动转后台，用 TaskOutput(block=true) 等结果。
- 整页截图很长，Read 可能因超长被过滤：用 `sips -Z 1200 a.png --out _tmp.png` 缩小或 `sips -c <高> <宽> --cropOffset ...` 裁剪后再看（临时图用 `_` 前缀，结束前删除）。
- 交互态（汉堡菜单、筛选/下拉、弹窗、hover、focus、键盘 Tab）shot.py 不覆盖：在 r4-assets/ 内自建 `grp<组号>-*.py`（同样只用 webkit、device_scale_factor 关键字参数），截图命名 `<名称>__<宽>x<高>__<主题>__<状态>.png`。
- SEO/元信息检查：`curl -s -A "Mozilla/5.0" <URL>` 查看 head 中 title/description/OG/ canonical/JSON-LD。

## 2. 视口与主题矩阵
- PC：1440×900 浅色（每个页面/状态必拍）；1280×800 浅色每组至少拍 2 个代表页验证中等断点。
- 移动：390×844 浅色（每个页面/状态必拍）；320×700 浅色至少覆盖 home、library、search、compare、cost、detail、news、agents 列表，其余页面怀疑窄屏错位时加拍。
- 深色：390 深色每个页面至少 1 张；首页、/cost、详情页（gemini-4-carbon）额外拍 1440 深色（强制）。
- 必查：响应式错位、汉堡菜单可达性与返回路径、信息层级、触控区≥34px、文字截断/溢出、图片图标 404/变形、sticky 遮挡、表格横向滚动、首屏/骨架、对比度/focus/alt/aria/按钮语义。

## 3. 三视角标注（每条发现至少一个视角，可多标）
- **投资人**：商业价值/差异化壁垒/增长留存钩子/转化路径/数据可信度叙事/SEO 与分享元信息。
- **资深用户**：功能深度/数据口径与可追溯（来源链接、更新日期、方法论入口）/效率（筛选对比搜索路径长度）/可信度（模糊措辞、价格是否标注估算）。
- **小白**：术语理解（token、缓存价、AA 智能指数、开源闭源、上下文长度等）、首次引导、空态提示、按钮文案自解释、信息密度。

## 4. 严重程度 / 优先级（固定措辞）
- 严重程度：P0阻断 / P1严重 / P2一般 / P3轻微
- 优先级：P0立即 / P1本周 / P2迭代 / P3备选

## 5. 已定稿/已接受，禁止当作问题上报
- /cost 右侧浅底渐变 + 主色 42px 大数字 + 实心主按钮（已定稿）。
- IBM/LG/IFM 三张 logo（已接受）。
- 深色 token 蓝灰系（已统一，不报配色风格问题，只报真实对比度/错色缺陷）。
- 底部对比条窄屏单行（f2008aef 刚修复）：可验证，**不得重报**旧的竖排「清空」问题；若有新缺陷再报。
- 新闻 6 源与 Atom 时间、闭源许可证「专有（权重未公开）」、metadataBase 为本轮刚修复项，验证即可、不得重报旧问题。

## 6. 章节文件格式（写入指定 chapter 文件）
每组一个文件：r4-chapter-A.md / r4-chapter-B.md / r4-chapter-C.md，用三级标题分页：
```
## /path 页面中文名
- 实际访问 URL：
- 测试矩阵：视口/主题/状态清单（实际拍了哪些）
- 截图清单：文件名罗列
### 已发现问题
| # | 问题描述（含复现条件） | 视角 | 影响范围 | 严重程度 | 优先级 | 证据截图 |
### 可发散方向
| # | 机会点描述 | 视角 | 优先级 |
```
- 显示类问题的「证据截图」必须填 r4-assets 内真实存在的文件名；非显示类（如 SEO、文案口径）证据列填 curl/页面位置说明。
- 没有问题的区块写「未发现」并注明已测矩阵，不得留空。
- 文件名只用分配到的 --name 前缀，避免组间撞名。

## 7. 收尾
- 删除自带 `_` 前缀的临时预览图；保留全部正式 png/json 与自建 grp 脚本。
- 最终返回：chapter 文件绝对路径、本组截图文件名清单、P0/P1 问题摘要（每条一句话+证据文件名）、矩阵覆盖情况（哪些页面×视口实际测过）。
