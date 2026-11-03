# R6 模型搜索覆盖增强（2026-11-01）

## 用户需求
"收录的模型还是不全，搜索里搜索 GPT 就出来仨"——搜索"GPT"只返回 3 个结果，感觉模型收录不全。

## 根因定位
- 模型库 UI_MODELS 共 28 个模型，其中 OpenAI 系 4 款：GPT-5、GPT-5 mini、GPT-4o、o4-mini
- 搜索匹配逻辑只按 **名称/厂商/简介子串**：搜"GPT"时名称含 gpt 的只有 GPT-5、GPT-5 mini、GPT-4o 三个；o4-mini 名称不含 "gpt" 被漏掉 → 用户看到"仨"

## 修复（可复用数据层，无写死）
在 `src/lib/derived-data.ts` 新增纯函数 **`matchModelsByQuery(models, query)`** + **品牌别名表 BRAND_ALIASES**：
- 搜品牌词时命中该厂商全部模型：`gpt/chatgpt/openai → OpenAI 全系`、`claude/anthropic → Anthropic`、`gemini/google → Google`、`qwen/千问/通义 → 阿里`、`deepseek/llama/meta/kimi/豆包/混元/文心/glm/minimax/longcat/百川/step` 等均已覆盖
- 搜索页 `suggestions`（前缀建议）与 `modelHits`（结果列表）统一走该函数

## 线上验证（headless Chrome 实测 /search?q=GPT）
- **模型 (4)**：GPT-5（综合 96.3）、GPT-5 mini（90.0）、o4-mini（85.6）、GPT-4o（82.4）——o4-mini 已通过品牌别名命中
- **新闻 (5)**：真实 OpenAI 新闻按关键词匹配
- 截图：design-review/r6-search-gpt.png

## 部署
预览 https://3340ed98.modelrank-1br.pages.dev （生产域名已同步，硬刷新查看）

## 关于"收录更全"的说明
模型库现有 28 个模型已覆盖主流厂商（OpenAI/Anthropic/Google/DeepSeek/阿里/字节/月之暗面/腾讯/百度/智谱/阶跃/MiniMax/美团/百川/零一/Meta/Mistral 等）。每条模型记录含综合分/五维能力/价格/趋势采样等完整字段，**综合分是 ModelRank 人工评测数据，不能凭空编造**。如需继续扩充（如 GPT-4.1 / GPT-4.5 / o1 / o3 等），需有真实分数依据：可由用户提供评测分，或授权"官方价格真实 + 综合分标注评测中"方案（需前端兼容无分数模型，待确认后实现）。
