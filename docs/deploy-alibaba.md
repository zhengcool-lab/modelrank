# 阿里云部署指南（从零到 `docker compose up`）

本指南把 ModelRank 从一台空 ECS 跑到 `https://你的域名/` 可访问。腾讯云步骤几乎一致，只需把控制台菜单换成「轻量应用服务器 / 云服务器 CVM + COS」。

> ## ⚠️ 部署前必读：ICP 备案
>
> 只要你把域名解析到**中国大陆境内**的 ECS（阿里云北京/杭州/上海/深圳等节点），该域名**必须先完成 ICP 备案**。
> **未备案域名无法解析到国内 ECS**：阿里云会在网络层拦截 80/443 入站流量，域名解析也会被运营商阻断。
>
> - 备案入口：阿里云控制台 → 「ICP 备案」。免费，通常需要 **7–20 个工作日**。
> - 备案期间可以先用 ECS 的公网 IP + `http://<ip>/` 联调，但**不能**用未备案域名访问。
> - 不想备案？只能选中国香港 / 新加坡节点的 ECS（延迟略高，免去备案）。

---

## 1. ECS 选购建议

| 项 | 起步配置 | 说明 |
|---|---|---|
| 规格 | **2 vCPU / 4 GiB 内存** 起步 | Next.js SSR + NestJS + Postgres + Redis 同机，2C4G 是下限；跑批量评测任务建议升到 4C8G |
| 系统盘 | 40–60 GiB ESSD | Docker 镜像 + Postgres 数据 |
| 镜像 | Alibaba Cloud Linux 3 / Ubuntu 22.04 LTS | 下面命令按 Ubuntu 22.04 写 |
| 公网带宽 | 按固定带宽 5 Mbps 起，或按流量 | 起步够用；评测报表走 OSS CDN，不占 ECS 带宽 |
| 区域 | 离你用户最近的大陆节点 | 决定备案主体所在地 |

**安全组放行**：
- `22/tcp`（SSH，建议限制源 IP 为你的办公网）
- `80/tcp`、`443/tcp`（HTTP/HTTPS，源 0.0.0.0/0）
- **不要**对外暴露 `5432`、`6379`、`3000`、`3001`——这些只走 Docker 内网。

## 2. 安装 Docker 与 Compose 插件

```bash
# SSH 登录 ECS
ssh root@<your-eip>

# Ubuntu 22.04
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 验证
docker --version
docker compose version
```

> 国内拉 Docker Hub 镜像慢，可以在 `/etc/docker/daemon.json` 配阿里云镜像加速器（控制台 → 容器镜像服务 → 镜像加速器，有你专属的地址）。

## 3. 拉代码

```bash
mkdir -p /opt/modelrank && cd /opt/modelrank
git clone https://github.com/<your-org>/modelrank.git .
# 如果仓库是私有的，先在 ECS 上配 Deploy Key。
```

## 4. 配置环境变量

```bash
cp deploy/.env.production.example .env
vi .env
```

至少改这几项：

| 变量 | 怎么填 |
|---|---|
| `APP_BASE_URL` | 你的已备案域名，例如 `https://modelrank.example.com` |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` |
| `JWT_SECRET` / `SESSION_SECRET` | `openssl rand -hex 32` |
| `OSS_*` | 在阿里云对象存储 OSS 建一个 bucket，把 AccessKey 填进来；不要用主账号 AK，建一个子账号只授该 bucket 权限 |
| `OPENAI_API_KEY` 等 | 有评测需求再填 |

## 5. 启动栈

```bash
cd /opt/modelrank
docker compose --env-file .env -f deploy/docker-compose.yml up -d --build

# 看状态
docker compose -f deploy/docker-compose.yml ps
docker compose -f deploy/docker-compose.yml logs -f api
```

首次启动会：
- 拉 `postgres:18.6`、`redis:8`、`nginx:1.27-alpine`；
- 构建 `web`（Next.js standalone）和 `api`（NestJS dist）镜像；
- `worker` 用同一份 api 镜像，先以占位命令 `sleep infinity` 挂着，等后面接评测队列时再换入口。

健康检查：

```bash
curl http://<eip>/healthz        # 应返回 {"status":"ok",...}
curl http://<eip>/                # 应返回 Next.js 的 HTML
```

## 6. Nginx 反向代理

`deploy/nginx.conf` 已经在 compose 里挂到 nginx 容器，不需要在 ECS 上再装系统 nginx：

- `/` → `web:3000`（Next.js SSR）
- `/api/` → `api:3001`（剥掉 `/api` 前缀）
- `/healthz` → `api:3001/health`
- `/_next/static/` → 长缓存 1 年

改完 `nginx.conf` 后热加载：

```bash
docker compose -f deploy/docker-compose.yml exec nginx nginx -s reload
```

## 7. 域名解析与 HTTPS（certbot）

前置：备案已经批下来。

```bash
# 1) 在阿里云 DNS 加一条 A 记录：modelrank.example.com -> <你的 EIP>
#    等 1 分钟，dig modelrank.example.com 应能解析到 EIP。

# 2) 先用 80 端口跑通 HTTP，再申请证书
apt-get install -y certbot

# 3) 建 webroot 目录（compose 里已经把 ./certbot/www 挂进 nginx）
mkdir -p deploy/certbot/www deploy/certbot/conf

certbot certonly --webroot -w /opt/modelrank/deploy/certbot/www \
  -d modelrank.example.com \
  --email you@example.com \
  --agree-tos --no-eff-email
```

证书会落到 `deploy/certbot/conf/live/modelrank.example.com/`。

然后打开 `deploy/nginx.conf` 末尾被注释的 443 server 块，把 `server_name`、证书路径改成你的域名，再 reload：

```bash
docker compose -f deploy/docker-compose.yml exec nginx nginx -t
docker compose -f deploy/docker-compose.yml exec nginx nginx -s reload
```

自动续期（certbot 默认会装 timer）：

```bash
systemctl status certbot.timer
# 续期后 reload nginx：
certbot renew --deploy-hook "docker compose -f /opt/modelrank/deploy/docker-compose.yml exec nginx nginx -s reload"
```

## 8. 上线后检查清单

- [ ] `https://modelrank.example.com/healthz` 返回 200
- [ ] `https://modelrank.example.com/` 首页 SSR 正常，浏览器 DevTools 里 `/_next/static/...` 命中缓存
- [ ] `https://modelrank.example.com/api/...` 走通（实际接口名以 B/C 阶段为准）
- [ ] 安全组里 `5432/6379/3000/3001` 没对公网开放
- [ ] `docker compose -f deploy/docker-compose.yml logs --tail=100` 没有报错
- [ ] OSS bucket 的跨域 / 读写权限验证通过

## 9. 常见问题

| 现象 | 排查 |
|---|---|
| `curl http://<eip>/` 超时 | 安全组没放 80；或备案没下来被阿里云拦截 |
| nginx 启动报 `host not found in upstream "web"` | `web`/`api` 容器还在 build，`docker compose ps` 看一眼，等 healthy |
| `pnpm install` 在容器里卡住 | 换阿里云 npm 镜像：在 Dockerfile 的 `pnpm install` 前加 `RUN pnpm config set registry https://registry.npmmirror.com` |
| Postgres 容器反复重启 | `POSTGRES_PASSWORD` 没在 `.env` 里设置，compose 会直接退出 |
| certbot 验证失败 | 先确认 `http://modelrank.example.com/.well-known/acme-challenge/test` 能从公网返回 200 |

---

## 你需要准备好的凭证 / 资源

部署前把下面这些列在一张表里，到对应章节一次性填完：

1. **已备案域名**（含备案号；未备案无法解析到大陆 ECS）
2. **阿里云 AccessKey**（RAM 子账号，只授 OSS 权限）
3. **OSS bucket 名 + region**（例如 `oss-cn-beijing`）
4. **GitHub/GitLab 仓库 Deploy Key**（私有仓库时）
5. **LLM Provider API Key**（OpenAI / Anthropic / DeepSeek，按需）
