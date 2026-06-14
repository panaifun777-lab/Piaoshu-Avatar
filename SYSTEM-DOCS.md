# 飘叔 Avatar OS — 系统完成度 & 技术说明 & 使用手册

> **版本**: v0.1 · **最后更新**: 2026-06-14  
> **仓库**: [panaifun777-lab/Piaoshu-Avatar](https://github.com/panaifun777-lab/Piaoshu-Avatar)  
> **最新 commit**: `444c181`

---

## 目录

1. [系统总览 & 完成度](#1-系统总览--完成度)
2. [技术架构说明书](#2-技术架构说明书)
3. [使用手册](#3-使用手册)
4. [待完善项（明确标记）](#4-待完善项明确标记)

---

## 1. 系统总览 & 完成度

### 1.1 整体完成度：75%

```
基础设施     ████████░░ 80%   PG+Redis+BullMQ+代理，部分本地DB兜底
API 层       ████████░░ 85%   95+ 端点，核心模块全覆盖
前端页面     ████████░░ 80%   16 模块视图 + LandingPage + /swarm
微服务       ████████░░ 75%   5 个微服务，TG Bot 双通道运行
测试         ██████░░░░ 60%   7 文件 39 测试，覆盖率待提升
CI/CD        ████████░░ 80%   GitHub Actions + Vercel 部署
TG Bot       █████████░ 90%   10 命令 + 语音 + 每日复盘
存储层       ████████░░ 80%   IPFS/Arweave/SHA256，Pinata 集成
沙箱         ████████░░ 80%   E2B + bun.spawn 本地 fallback
设计系统     ██████░░░░ 65%   色彩统一完成，令牌单源化，交互待打磨
文档         ██████░░░░ 60%   本文档 + design-audit.md + data-brief.md
```

### 1.2 模块逐项评级

| # | 模块 | 前端 | 后端API | 数据 | 评级 | 说明 |
|---|------|------|---------|------|------|------|
| 1 | 总控台 | ✅ | ✅ | ✅ | **A** | Mission Control + 分身广场 + 活动流 |
| 2 | 分身系统 | ✅ | ✅ 7端点 | ✅ | **A** | 4分身+日程+产出动态+活动流 |
| 3 | 认知引擎 | ✅ | ✅ 8端点 | ⚠️ 种子数据 | **B+** | SOUL.md+红蓝对抗+向量搜索 |
| 4 | 记忆宫殿 | ✅ | ✅ 8端点 | ⚠️ 种子数据 | **B+** | 6Tab宫殿架构，知识图谱 |
| 5 | 可信证据链 | ✅ | ✅ 3端点 | ⚠️ 种子数据 | **B+** | VC签发+上链存证 |
| 6 | 联邦信任层 | ✅ | ✅ 5端点 | ⚠️ 种子数据 | **B+** | DID管理+VC验证+信任拓扑 |
| 7 | 媒体矩阵 | ⚠️ SPA | ✅ 7端点 | ⚠️ 种子数据 | **B** | API完整，UI较简 |
| 8 | 合作管线 | ⚠️ SPA | ✅ 5端点 | ⚠️ 种子数据 | **B** | API完整，UI较简 |
| 9 | GEO优化 | ⚠️ SPA | ✅ 4端点 | ⚠️ 种子数据 | **B** | API完整，UI较简 |
| 10 | 邮件跟踪 | ⚠️ SPA | ✅ 6端点 | ⚠️ 种子数据 | **B** | API完整，UI较简 |
| 11 | 流体调度 | ⚠️ SPA | ✅ 2端点 | ⚠️ 种子数据 | **B** | API完整，UI较简 |
| 12 | 蜂群协作 | ✅ | ✅ 7端点 | ✅ | **A** | /swarm终端+独立仪表盘+双向链接 |
| 13 | 共生沙盒 | ✅ | ✅ 4端点 | ⚠️ | **B+** | E2B+本地fallback，3D视口 |
| 14 | 路线图 | ✅ | ✅ 2端点 | ⚠️ | **B** | 90天里程碑 |
| 15 | 订阅方案 | ✅ | ✅ 5端点 | ⚠️ | **B** | AFC代币+Stripe支付 |
| 16 | 创始人致辞 | ✅ | — | — | **A** | 纯静态 |

### 1.3 基础设施清单

| 组件 | 状态 | 详情 |
|------|------|------|
| Next.js 16.1.3 (Turbopack) | ✅ 运行中 | port 3000 |
| Bun 1.3.12 运行时 | ✅ | 替代 Node.js |
| Tailwind CSS v4 | ✅ | `@theme inline` (tailwind.config.ts 已删除) |
| shadcn/ui 组件库 | ✅ | 35+ 组件 |
| NextAuth v4 (Credentials+JWT) | ✅ | SQLite / Vercel PG |
| PostgreSQL 18.1 | ✅ | avatar_os 数据库 |
| Redis 7 (ZSET+Streams) | ✅ | BullMQ 队列 |
| Prisma ORM | ✅ | schema.prisma |
| Vercel 部署 | ✅ | vercel.json |
| GitHub Actions CI/CD | ✅ | .github/workflows/ci.yml |
| 代理 (Clash Meta) | ✅ | 127.0.0.1:7890 |
| vitest 测试框架 | ✅ | 7 suites, 39 tests |

### 1.4 微服务清单

| 服务 | 端口 | 运行时 | 状态 |
|------|------|--------|------|
| swarm-service | 3007 | Bun/TypeScript | ✅ 6 Agent 在线 |
| tg-bot-service | — | Bun/TypeScript | ✅ 双通道 |
| blockchain-service | — | Bun/TypeScript | ⚠️ 待验证 |
| vector-service | — | Bun/TypeScript | ⚠️ 待验证 |
| ws-service | — | Bun/TypeScript | ⚠️ 待验证 |
| swarm-dashboard | 3001 | Bun | ✅ 独立仪表盘 |

---

## 2. 技术架构说明书

### 2.1 技术栈

```
前端:  Next.js 16 (Turbopack) + TypeScript + Tailwind v4 + shadcn/ui + Framer Motion
后端:  Next.js API Routes + Prisma ORM
数据库: PostgreSQL 18.1 (主) + SQLite (本地开发)
缓存:  Redis 7 (ZSET 排行榜 + Streams 事件)
队列:  BullMQ 4
认证:  NextAuth v4 (Credentials Provider + JWT Session)
支付:  Stripe
存储:  IPFS (Pinata) + Arweave + SHA256 本地 fallback
沙箱:  E2B SDK + bun.spawn 本地 fallback
AI:    OpenAI API (via 代理)
运行时: Bun 1.3.12
部署:  Vercel (生产) / Windows (本地)
```

### 2.2 系统架构（四层）

```
┌─────────────────────────────────────────────────────────┐
│  应用层  │ 认知引擎 · 记忆宫殿 · 数字分身 · 证据链      │
├─────────────────────────────────────────────────────────┤
│  智能层  │ SOUL.md人格 · 红蓝对抗 · AAAK压缩 · 向量搜索  │
├─────────────────────────────────────────────────────────┤
│  协议层  │ AFC公链 · W3C DID · XDP协议 · 蜂群协作       │
├─────────────────────────────────────────────────────────┤
│  存储层  │ IPFS · Arweave · SQLite/PG · 向量数据库      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 数据流

```
用户浏览器
  │
  ├── Next.js SSR → React SPA (page.tsx)
  │     ├── useSession() → NextAuth JWT
  │     ├── API Routes → Prisma → PostgreSQL/SQLite
  │     └── WebSocket → ws-service (实时事件)
  │
  ├── /swarm 终端
  │     ├── fetch → swarm-service (3007) → 6 Agent 内存
  │     └── 独立仪表盘 (3001) → swarm metrics
  │
  └── TG Bot
        ├── Hermes Gateway → @AvatarHermesbot (30 cmd)
        └── Mini-Service (3006) → @AvatarOS_Bot (10 cmd)
```

### 2.4 认证流程

```
1. 浏览器 → /api/auth/csrf → 获取 CSRF token
2. 浏览器 → POST /api/auth/callback/credentials → NextAuth
3. NextAuth → bcrypt.compare() → Prisma DB lookup
4. NextAuth → JWT 签发 → Set-Cookie: next-auth.session-token
5. SessionProvider → useSession() → status='authenticated'
6. page.tsx → isAuthenticated=true → 管理后台
```

> ⚠️ **已知陷阱**: `setTimeout + window.location.reload()` 会在 cookie 写入前触发，导致刷新后仍显示 landing page。已修复为 SessionProvider 自动驱动。

### 2.5 设计令牌体系

```
CSS Variables (globals.css @theme inline):
  --color-background / --color-foreground        语义色
  --color-primary / --color-secondary            品牌色
  --color-muted / --color-accent                 辅助色
  --color-destructive                            危险色
  --color-border / --color-input / --color-ring   边框/输入
  --color-chart-1 ~ --color-chart-5              图表色板
  --radius-sm / --radius-md / --radius-lg         圆角梯度
  --font-sans (Geist) / --font-mono (Geist Mono)  字体

导航色: 统一 text-emerald-500 (16项同色)
```

### 2.6 目录结构

```
Piaoshu-Avatar/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # 主页 (LandingPage + 管理后台)
│   │   ├── swarm/page.tsx              # 蜂群终端
│   │   ├── globals.css                 # Tailwind v4 @theme
│   │   └── api/                        # 95+ API routes
│   ├── components/
│   │   ├── piaoshu/                    # 30 领域组件
│   │   ├── ui/                         # 35 shadcn/ui 组件
│   │   └── providers/                  # SessionProvider
│   ├── lib/                            # db, auth, storage, sandbox
│   └── __tests__/                      # 7 suites, 39 tests
├── mini-services/                      # 5 微服务
├── swarm_core/                         # Python 蜂群核心 (8 modules)
├── swarm-dashboard/                    # 独立仪表盘 HTML
├── prisma/                             # schema + migrations
├── .github/workflows/ci.yml            # CI/CD
└── vercel.json                         # 部署配置
```

---

## 3. 使用手册

### 3.1 快速启动

```bash
# 1. 进入项目目录
cd "D:\飘叔 PiaoshuAI AVATAR OS v0.1  -6.13   第二版完善中"

# 2. 启动 Next.js 主应用 (port 3000)
bun run next dev -p 3000

# 3. 启动 Swarm 蜂群服务 (port 3007)
cd mini-services/swarm-service && bun --hot index.ts

# 4. 启动独立仪表盘 (port 3001)
cd swarm-dashboard && bun --hot -e "Bun.serve({port:3001,fetch(){return new Response(Bun.file('index.html'))}})"
```

### 3.2 访问地址

| 地址 | 说明 |
|------|------|
| `http://localhost:3000` | 主应用（着陆页 + 管理后台） |
| `http://localhost:3000/swarm` | 蜂群终端 |
| `http://localhost:3001` | 独立仪表盘 |
| `http://localhost:3007/api/swarm/status` | Swarm API (6 Agent) |

### 3.3 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| `demo@piaoshu.ai` | `demo123` | 演示用户 |
| `Piaoshu001` | (管理员密码) | 超级管理员 |

### 3.4 登录流程

1. 打开 `http://localhost:3000` → 着陆页
2. 点击右上角「登录」或 Hero 区「登录系统」
3. 弹窗中输入凭证 → 点「登录」
4. **自动进入管理后台**（16模块侧边栏 + 总控台仪表盘）
5. 已登录用户着陆页显示「进入后台 →」快捷入口

### 3.5 蜂群协作使用

1. 侧边栏点击「蜂群协作」→ 进入终端模式
2. 或直接访问 `http://localhost:3000/swarm`
3. 输入命令：`status` / `tasks` / `metrics` / `help`
4. 点击「← 返回总控台」回到管理后台
5. 点击「terminal v2 ⊞」打开独立仪表盘

### 3.6 运行测试

```bash
bun run test          # vitest run (7 files, 39 tests)
bun run test:watch    # watch mode
bun run typecheck     # TypeScript 类型检查
```

### 3.7 环境变量 (.env)

```ini
DATABASE_URL="file:./dev.db"         # SQLite (本地) 或 PG URL (生产)
NEXTAUTH_SECRET="your-secret"
# 以下可选：
CLOUDFLARE_R2_*                       # Cloudflare R2 存储
YOUTUBE_API_KEY                       # YouTube API
STRIPE_SECRET_KEY                     # Stripe 支付
```

### 3.8 代理设置

```bash
# Windows 本地开发需设置代理访问外网 API
export HTTPS_PROXY=http://127.0.0.1:7890
export HTTP_PROXY=http://127.0.0.1:7890
```

### 3.9 常见问题

| 问题 | 解决方案 |
|------|----------|
| Turbopack Runtime Error | 删除 `.next` 目录 + 重新 `bun run next dev` |
| 登录后回到 landing page | 清除浏览器 cookie + 刷新；已修复 SessionProvider 自动切换 |
| 端口被占用 | `netstat -ano \| findstr :3000` 查找 PID，`taskkill /F /PID <pid>` |
| 无法连接 GitHub | 确认代理 `127.0.0.1:7890` 可用，`git config http.proxy` 设置正确 |
| 视频 logo 触发下载 | 已添加 `controlsList="nodownload"` + `onError` 兜底 |

---

## 4. 待完善项（明确标记）

### 🔴 P0 — 阻塞性问题

- [ ] **TG Bot 端到端验证**: blockchain-service / vector-service / ws-service 三个微服务在生产环境未经完整验证
- [ ] **PostgreSQL 数据库迁移**: 当前本地开发用 SQLite，生产 Vercel 用 PG，需要确保 seed 数据在 PG 上正确初始化

### 🟡 P1 — 重要但非阻塞

- [ ] **SPA 模块 UI 完善** (#7-11): 媒体矩阵、合作管线、GEO优化、邮件跟踪、流体调度 — API 已齐全，前端仅基础渲染
- [ ] **图表色彩硬编码消除**: `dashboard.tsx` 中 `#10b981`、`#06b6d4`、`#f59e0b` 等应替换为 CSS 变量引用
- [ ] **测试覆盖率提升**: 当前 39 tests 覆盖 API 健康检查 + 反射 + 影子 + 天梯榜 + 3个组件；需扩展到所有 API 路由和核心组件
- [ ] **深色模式全模块验证**: 14 个模块视图未逐一验证深色模式下的对比度和色彩适配
- [ ] **移动端响应式**: 管理后台侧边栏在移动端的折叠/展开体验待优化

### 🟢 P2 — 体验优化

- [ ] **Loading/Empty/Error 状态统一**: 多个模块使用 ModuleSkeleton (`animate-pulse`) 而非 shadcn `<Skeleton>` 组件
- [ ] **过渡动画令牌**: 所有 `transition` 使用 Tailwind 默认值，未定义 `--ease-out`/`--duration-fast` 等动画令牌
- [ ] **WebSocket 实时连接**: 当前 `useWebSocket()` 标记「连接断开」，需验证 ws-service 集成
- [ ] **Command Palette 搜索**: 当前仅支持快捷键序号导航，缺少模糊搜索过滤
- [ ] **种子数据**: 认知引擎、记忆宫殿、证据链等模块缺少初始种子数据（数据库为空时显示空状态）
- [ ] **i18n 多语言**: 系统有 `next-intl` 依赖但未激活语言切换

### 📝 P3 — 远期规划

- [ ] **AFC 公链集成**: 联邦信任层 + 证据链的 DID/VC 签发仅前端 mock，需对接真实链
- [ ] **Swarm Scheduler**: 蜂群自动任务调度（来自 `未完成想成.md`）
- [ ] **Knowledge Mesh**: 跨分身知识同步网络
- [ ] **仪表盘数据实时化**: 总控台的 CPU/内存/Memory 数据为静态占位值
- [ ] **端到端 (E2E) 测试**: Playwright 已安装但无测试用例

---

## 附录

### A. 已修复的技术债务（本会话）

| 问题 | 修复 | commit |
|------|------|--------|
| MP4 Logo 视频触发下载弹窗 | `controlsList="nodownload"` + `onError`兜底 | `d042317` |
| 16 导航项 14 种不同颜色 | 统一 `text-emerald-500` | `dc31351` |
| `tailwind.config.ts` 双源冲突 | 删除，Tailwind v4 用 `@theme inline` | `dc31351` |
| Cmd+K 在输入框内误触发 | 添加 `tagName` 检测 | `dc31351` |
| 登录后 setTimeout 重定向竞争 | 移除重定向，SessionProvider 自动切换 | `444c181` |
| 已登录用户无后台入口 | LandingPage 添加「进入后台 →」 | `61bcc26` |

### B. Cron 自动任务

| 任务 | 周期 | 产出 |
|------|------|------|
| 数据分身 | 每2h | `data-brief.md` (Polymarket 市场分析) |
| 设计分身 | 每日 | `design-audit-report.md` (设计审计) |
| 每日复盘 | 22:30 | TG Bot 自动推送 |

### C. 分支与部署

```
main → Vercel (生产)
└── 本地开发 (Windows, port 3000/3001/3007)
```

---

*文档生成时间: 2026-06-14 · Hermes Agent · deepseek-v4-pro*
