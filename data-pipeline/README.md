# data-pipeline

ModelRank 数据抓取管道。当前阶段是 **dry-run**：只抓（或 mock）数据并写到 `out/*.json`，**不写 PostgreSQL**。

## 目录结构

```
data-pipeline/
├── requirements.txt
├── README.md
├── out/                     # 运行产物（models.json / news.json）
└── pipeline/               # Python 包：python -m pipeline ...
    ├── __main__.py          # CLI 入口
    ├── common.py            # HTTP client / schema helpers
    ├── fetcher_arena.py     # LMArena 排行榜
    ├── fetcher_aa.py        # Artificial Analysis 价格/速率
    ├── fetcher_hf.py        # HuggingFace Open LLM Leaderboard
    ├── fetcher_vendors.py   # OpenAI/Anthropic/Google/DeepSeek/Qwen 官方价格页
    └── news.py              # vendor blog RSS → out/news.json
```

## 安装

```bash
cd data-pipeline
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

## 运行（重要：先 dry-run review JSON，确认后再加 --write-db 开关）

```bash
# 1) dry-run：抓 + 写 out/models.json + out/news.json，不碰数据库
python -m pipeline run --dry-run

# 2) review JSON：人工核对 vendors / prices / scores 是否合理
#    命令行会打印 [REAL] vs [MOCK] 报告，明确哪些站抓到了、哪些退化到 mock。

# 3) 确认无误后再打开写库开关（TODO，当前未实现）：
python -m pipeline run --write-db
```

**纪律**：在 C 同学把 `out/models.json` / `out/news.json` 字段对接好、并且至少有一个真实抓取器从 mock 切换到 REAL 之前，不要开 `--write-db`。现在打开它也只会写本地 JSON（留了 TODO）。

## 输出契约

`out/models.json`（数组，每项一个模型）：

```json
{
  "vendor": "OpenAI",
  "name": "GPT-5",
  "score": 96.3,
  "price_input_per_mtok": 12,
  "price_output_per_mtok": 60,
  "throughput_tps": null,
  "context_length": 128000,
  "source_url": "https://openai.com/api/pricing/",
  "captured_at": "2026-10-26T00:00:00Z"
}
```

`out/news.json`：

```json
{
  "title": "...",
  "category": "发布|评测|融资|政策|价格",
  "source_url": "...",
  "published_at": "...",
  "related_model": "GPT-5"
}
```

## 抓取策略与反爬纪律

- 全部用 `httpx` 普通 GET，**不**模拟浏览器指纹、**不**打 Cloudflare。
- 每个 fetcher 独立 `try/except`：一个站挂了不影响其他站。
- 反爬严 / JS 渲染的站（目前 Artificial Analysis、HuggingFace Leaderboard、大部分 vendor 价格页）：**主动退化为 curated mock 数据**，并在控制台报告里标 `[MOCK]`，附 TODO。
- 不要在 dry-run 阶段硬刚反爬——那是 headless browser / 付费 API 的独立工程项。

## TODO（下一步）

- [ ] `fetcher_vendors.py`：给每家 vendor 写专属 HTML/OpenAPI 解析器，替换 mock。
- [ ] `fetcher_aa.py`：接 Artificial Analysis 付费 API（或 headless Chromium）。
- [ ] `fetcher_hf.py`：用 `gradio_client` 拉 Open LLM Leaderboard 表。
- [ ] `pipeline/__main__.py`：实现 `--write-db`（SQLAlchemy upsert 到 PG）。
- [ ] 给 `news.py` 加关键词分类，把 `category` 从默认 "发布" 升级为真实分类。
- [ ] cron：每天 UTC 02:00 跑一次 `--dry-run`，人工 review 后再手动 `--write-db`。
