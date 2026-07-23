# 杂研 · M.E.S.S Journal —— Spring Boot 全栈学术博客与文创社区

> 一个聚焦「**前后端协同 + 权限模型 + 领域功能闭环**」的综合性全栈学习项目。
> 技术栈：**Spring Boot 3.2.5 + Spring Data JPA + MySQL + JWT**，前端为原生 HTML/CSS/JS（由 Spring Boot 同源托管，无需额外前端工程与域名）。
> 视觉风格参考 **S.H.I.T（shitjournal.org）** 的「期刊式克制排版」：大量留白、衬线标题、编号式榜单、墨色点缀，内置明/暗双主题。

本项目在基础博客之上，逐步扩展了 **线上博物馆、读者来信、每日谜题、版画工坊、古董铺闲置商城、AI 策展人** 等模块，是一个可用于课程答辩、团队分工演练的完整站点。

---

## 一、如何运行（复制进 IDEA 直接跑）

1. 把整个 `blog-springboot` 文件夹复制到本地。
2. 用 **IDEA 打开**（File → Open），选择该文件夹，IDEA 会识别 `pom.xml` 自动按 **Maven 项目**导入。
   - 本机无需安装 Maven：IDEA 自带 Maven（若提示无 Maven，点右侧 Maven 面板「Reload All Maven Projects」即可）。
   - JDK 要求 17+（本机为 JDK 21，满足）。若 IDEA 未识别 JDK，在 `File → Project Structure → SDK` 选择本机 JDK。
3. 找到 `src/main/java/com/example/blog/BlogApplication.java`，右键 **Run 'BlogApplication'**。
4. 启动前准备（MySQL 必做）：
   - 本机需已安装并运行 **MySQL 8.x**。
   - 确认 MySQL 账号密码。本项目 `application.yml` 默认用 `username: root / password: 123456`，请按你本机 MySQL 修改 `datasource.username` 与 `datasource.password`。
   - 无需手动建库：`url` 中带了 `createDatabaseIfNotExist=true`，首次启动自动创建 `blog` 库并建表、写入体验数据。
5. 启动后访问：
   - 前端首页：<http://localhost:8080/>
   - 接口基址：`http://localhost:8080/api/...`

> 首次启动会自动建表并写入体验账号与示例数据；之后改实体类字段，Hibernate 的 `ddl-auto: update` 会自动同步表结构，无需手动执行 SQL。
> 若你之前以旧字段结构跑过应用（如 `t_user.avatar` 还是 `VARCHAR(255)`），需手动执行 `ALTER TABLE t_user MODIFY avatar MEDIUMTEXT;` 等语句，否则大图会被截断。

### 体验账号（启动后自动种子）

| 用户名 | 密码 | 权限 | 能力 |
|--------|------|------|------|
| `admin` | `admin123` | ADMIN（最高） | 删除/修改**所有人**内容；审核文物与来信；下架任意商品 |
| `moderator` | `mod123` | MODERATOR（中级） | 将**他人**文章/文物/来信「下线·驳回 / 恢复」（内容审核） |
| `alice` | `user123` | USER（普通） | 仅管理**自己**的文章、文物、来信、闲置；下单购买 |

---

## 二、技术栈

| 层 | 技术 | 说明 |
|----|------|------|
| 后端框架 | Spring Boot 3.2.5 | 内嵌 Tomcat，同源托管前端静态资源 |
| 持久化 | Spring Data JPA + Hibernate | 实体即表，`ddl-auto: update` 自动建表 |
| 数据库 | MySQL 8.x | 库名 `blog`，表由 JPA 生成 |
| 安全 | JWT（jjwt 0.12.5）+ 拦截器 | 登录签发令牌，请求经 `JwtInterceptor` 校验 |
| 密码 | MD5 + 随机盐 | 学习用途，生产请换 BCrypt |
| 校验 | spring-boot-starter-validation | DTO 入参 `@NotNull/@NotBlank` 等注解校验 |
| 工具 | Lombok | `@RequiredArgsConstructor` 等减少样板代码 |
| 前端 | 原生 HTML / CSS / JS | 无构建步骤，`fetch` + JWT 调后端 |
| AI | OpenRouter（直连）+ Python 代理回退 | `AiService` 优先直连大模型，失败回退本地 Python 服务 |

---

## 三、目录结构（当前）

```
blog-springboot/
├── pom.xml
├── README.md
├── 功能模块介绍.md
├── src/main/java/com/example/blog/
│   ├── BlogApplication.java
│   ├── common/        # Result 统一返回、PageResult 分页、BusinessException、GlobalExceptionHandler、Role 枚举
│   ├── config/        # JwtProperties、WebConfig(拦截器+CORS)、DataInitializer(种子数据)
│   ├── entity/        # User/Article/LikeRecord/Relic/Letter/Puzzle(词方POJO)/Score/Product/Order 及各自状态枚举
│   ├── repository/    # 各 JPA Repository（含查询方法）
│   ├── dto/           # 请求入参对象（含校验注解）
│   ├── util/          # Md5Util、JwtUtil、TokenBlacklist（注销黑名单）
│   ├── interceptor/   # JwtInterceptor（鉴权，含半公开只读白名单）
│   ├── service/       # 业务逻辑与权限判断（User/Article/Relic/Letter/Puzzle/Shop/Ai）
│   └── controller/    # Auth/User/Article/Hot/Relic/Letter/Puzzle/Shop/Ai 等 RestController
└── src/main/resources/
    ├── application.yml   # 数据源、JWT、OpenRouter、Python 代理地址
    └── static/           # 前端（由 Spring Boot 同源托管）
        ├── index.html / login.html / register.html / profile.html
        ├── article.html / editor.html        # 文章详情 / 写文章
        ├── museum.html / letters.html / inbox.html   # 博物馆 / 读者来信 / 审核信箱
        ├── puzzle.html / engraving.html      # 每日谜题 / 版画工坊
        ├── shop.html / product.html / checkout.html / orders.html / payment.html  # 古董铺交易闭环
        ├── css/style.css + css/modules.css   # 全局样式 + 模块样式（报纸学术风）
        └── js/  (api.js 通信核心 · common.js 通用UI/工具 · 各页面逻辑)
```

---

## 四、功能模块总览

| 模块 | 入口页面 | 后端 Controller | 状态 / 亮点 |
|------|----------|-----------------|-------------|
| 用户与鉴权 | login.html / register.html / profile.html | Auth / User | 注册登录注销、JWT、MD5+盐、头像 base64 |
| 文章与热点 | index.html / article.html / editor.html | Article / Hot | 发布/草稿/分页/分类/搜索/点赞、热点榜 |
| 线上博物馆 | museum.html | Relic | 文物画廊、提交审核、详情展板、AI 问策展人 |
| 读者来信 | letters.html / inbox.html | Letter | 来信选登、提交审核、管理员信箱 |
| 每日谜题 | puzzle.html | Puzzle | 对称词方、计时挑战、今日榜单 |
| 版画工坊 | engraving.html | （纯前端） | Canvas 老照片/木刻线描、本地下载 |
| 古董铺闲置商城 | shop.html / product.html / checkout.html / orders.html / payment.html | Shop | 发布闲置、下单锁库存、订单、付款页（按钮置灰） |
| AI 助手 / 策展人 | 右侧浮窗 / museum / article | Ai | 直连 OpenRouter，文章一句话导读、问策展人 |
| 图片系统 | 各上传处 | （字段层） | 前端压缩→base64→MEDIUMTEXT 入库 |

---

## 五、API 一览

> 约定：所有接口返回统一结构 `Result<T>`（`code===0` 成功，`data` 为业务数据）。带「🔓公开」表示 `JwtInterceptor` 半公开白名单允许免登录 GET；其余需登录（请求头带 `Authorization: Bearer <token>`）。

### 鉴权 Auth `/api/auth`
- `POST /register` 注册
- `POST /login` 登录（返回 JWT + 用户信息）
- `POST /logout` 注销（token 加入黑名单）

### 用户 User `/api/user`（需登录）
- `GET /info` 当前用户信息
- `PUT /info` 修改昵称/邮箱/头像/密码

### 文章 Article `/api/articles`
- `GET /` 🔓 列表（支持 `category`/`keyword`/`page`/`size`；`mine=true` 仅看自己含草稿）
- `GET /{id}` 🔓 详情（已下线/草稿受权限限制）
- `POST /` 发布/存草稿（需登录）
- `PUT /{id}` 修改（作者本人或 ADMIN）
- `DELETE /{id}` 删除（作者本人或 ADMIN）
- `PATCH /{id}/status` 下线/恢复（MODERATOR 或 ADMIN）
- `POST /{id}/like` 点赞/取消（需登录，按用户去重）

### 热点 Hot `/api/hot` 🔓
- `GET /?limit=10` 已发布文章按点赞量倒序排行

### 线上博物馆 Relic `/api/relics`
- `GET /` 🔓 已上线文物列表
- `GET /mine` 我的提交（需登录）
- `GET /{id}` 🔓 详情（待审/驳回有权限限制）
- `POST /` 提交（管理员直接上线，普通用户进入待审）
- `GET /inbox` 审核信箱（仅 MODERATOR/ADMIN）
- `POST /{id}/review` 通过/驳回（仅 MODERATOR/ADMIN）
- `DELETE /{id}` 删除（作者本人或 ADMIN）

### 读者来信 Letter `/api/letters`
- 与 Relic 同构：`GET /` 🔓、`GET /mine`、`GET /{id}` 🔓、`POST /`、`GET /inbox`、`POST /{id}/review`、`DELETE /{id}`

### 每日谜题 Puzzle `/api/puzzles`
- `GET /today` 🔓 今日词方（网格 + 线索）
- `GET /leaderboard` 🔓 榜单（按 `date`/`key` 筛选）
- `POST /scores` 提交成绩（需登录）
- `GET /scores/mine` 我的成绩（需登录）

### 古董铺 Shop `/api/shop`
- `GET /products` 🔓 在售列表（分页 + `category`/`keyword`）
- `GET /products/{id}` 🔓 商品详情
- `POST /products` 发布闲置（需登录）
- `GET /products/mine` 我的发布（需登录）
- `DELETE /products/{id}` 下架（作者本人或 ADMIN）
- `POST /orders` 下单（需登录，快照+标记售出锁库存）
- `GET /orders/mine` 我买的（需登录）
- `GET /orders/sold` 我卖的（需登录）
- `GET /orders/{id}` 订单详情（买家/卖家/ADMIN 可见）

### AI `/api/ai`
- `POST /chat` 对话（需登录，按用户名隔离记忆；右侧助手、问策展人、一句话导读共用）
- `GET /query` 🔓 内部查询接口（供 Python ai-assistant 服务检索博客数据：`hot_articles`/`recent_articles`/`categories`/`article_search`/`site_stats`）

> 版画工坊（engraving）为**纯前端**模块，无后端接口，图片在浏览器内用 Canvas 处理并下载。

---

## 六、前后端协作机制（团队重点）

本质一句话：**前端 `fetch()` 发 HTTP 请求，后端 `@RestController` 返回 JSON，两边通过 URL + JSON 约定通信。**

- 后端返回统一结构 `Result<T>`（`code/message/data`），前端按 `code===0` 判断成败。
- 登录成功后，前端把 JWT 存 `localStorage`，之后每个请求头带 `Authorization: Bearer <token>`。
- `JwtInterceptor` 在 Controller 前拦截 `/api/**`：校验令牌，把 `userId/username/role/jti` 放入 request，Controller 用 `@RequestAttribute` 取用；缺失/伪造/过期返回 `401`，前端跳登录页。
- 前端把样板封装进 `api.js` 的 `api(path, options)`：自动带 JSON 头、解析、处理 `code!==0` 与 `401`。
- 前端页面由 Spring Boot 同源托管在 `:8080`，用相对路径 `/api/...` 即可，无需跨域配置；若前后端分离部署，改 `api.js` 的 `API_BASE` 并放行 CORS（`WebConfig` 已配）。

### 半公开只读白名单
`JwtInterceptor.isPublicRead()` 允许以下 GET 免登录（避免列表/详情页必须登录才能看）：
`/api/articles`、`/api/hot`、`/api/relics`、`/api/letters`、`/api/puzzles`、`/api/shop/products`、`/api/ai/query`。
其余写操作与私有数据均要求有效令牌。

---

## 七、数据库设计（实体 → 表）

| 实体 | 表名 | 关键字段 |
|------|------|----------|
| User | `t_user` | username/password(盐+MD5)/nickname/email/avatar(MEDIUMTEXT base64)/role |
| Article | `t_article` | title/content/category/summary/status/likeCount/authorId/authorName/时间 |
| LikeRecord | `t_like_record` | userId/articleId（去重点赞） |
| Relic | `t_relic` | title/dynasty/material/origin/location/description/image(MEDIUMTEXT)/status/reviewNote |
| Letter | `t_letter` | title/content/author/contact/status/reviewNote |
| Puzzle | （POJO，非持久化） | 词方数据在 `PuzzleService` 内存题库，按日期取今日词方 |
| Score | `t_puzzle_score` | userId/username/date/key/seconds（每人每天每词方留最小秒数） |
| Product | `t_product` | title/description/price/image(MEDIUMTEXT)/category/itemCondition/status/sellerId/sellerName |
| Order | `t_order` | orderNo/productId/商品快照/price/buyerId/sellerId/收货信息/status |

状态枚举：`ArticleStatus`(DRAFT/PUBLISHED/OFFLINE)、`RelicStatus`/`LetterStatus`(PENDING/PUBLISHED或APPROVED/REJECTED)、`ProductStatus`(AVAILABLE/SOLD/REMOVED)、`OrderStatus`(PENDING/PAID/CANCELLED)。

---

## 八、AI 助手架构

`AiService` 采用「**优先直连 OpenRouter，否则回退 Python 代理**」双模式：

1. 当 `application.yml` 的 `openrouter.api-key` 非空时，直接构造 OpenAI 兼容请求体调用大模型，按 `username` 维护最近 10 轮内存对话历史做会话隔离；
2. 若 key 为空，则回退转发到本地 Python ai-assistant 微服务（`ai.python-url: http://localhost:8000/api/ai/chat`）。

`application.yml` 关键配置：
```yaml
openrouter:
  api-key: "sk-or-v1-..."           # 填入真实 Key 后重启即可真实调用
  model: "openrouter/free"          # 免费路由（自动选可用免费模型）；也可换具体 :free 模型名
  base-url: "https://openrouter.ai/api/v1/chat/completions"
ai:
  python-url: "http://localhost:8000/api/ai/chat"
```

三个前端入口共用 `/api/ai/chat`：右侧 AI 助手浮窗、博物馆「问策展人」、文章「一句话导读」。

---

## 九、图片 / 头像系统

图片采用「**前端压缩 → base64 → 入库**」方案（按需求直接存关系库）：

- 字段：`User.avatar`、`Relic.image`、`Product.image` 均用 `MEDIUMTEXT`（原 `VARCHAR(255)`/`TEXT` 存 base64 会溢出截断）。
- 前端 `common.js` 的 `fileToDataURL()`：Canvas 等比缩放 + JPEG 压缩（头像 240px、文物/商品 900px、质量 0.82）后再转 base64，控制体积。
- 后端对 base64 长度设上限（头像 ~1.6M 字符、文物/商品 ~3.2M 字符），超限拒绝，防库被撑爆。
- 渲染时 `isImageSrc()` 判定：仅当值是 `data:image` 才渲染图片，旧路径/无图自动显示占位，避免破图。

> 工程提示：base64 进库会膨胀约 33%，且列表接口会把大图一起捞出。当前项目规模完全跑得动、备份简单；若上量，应演进为「图片存磁盘/对象存储 + 库存路径 + 列表不返回原图」。

---

## 十、权限模型

三级角色：`ADMIN > MODERATOR > USER`。

- **ADMIN**：可删除/修改所有人内容，审核文物与来信，下架任意商品。
- **MODERATOR**：可将他人文章/文物/来信「下线·驳回 / 恢复」（内容审核）。
- **USER**：仅管理自己的内容；可发布闲置并下单购买。

审核流统一模式（Relic / Letter）：普通用户提交 → `PENDING`；MODERATOR/ADMIN 在 `/inbox` 信箱通过(`APPROVE/PUBLISH`)或驳回(`REJECT`) → 通过后方可公开。古董铺下单即锁库存（`ProductStatus.SOLD`）防超卖，且禁止买自己的商品。

> **安全要点**：权限校验集中在 Service 层，前端隐藏按钮只是体验，真正安全在后端；改判断逻辑务必在 Service 而非 Controller 或前端。

---

## 十一、团队质量提示 / 已知限制

1. **密码安全**：按需求用 MD5，但 MD5 已不安全；生产请改 **BCrypt**（`PasswordEncoder`）。此处「随机盐 + MD5」仅降低彩虹表风险。
2. **JWT 密钥**：`application.yml` 的 `jwt.secret` 生产环境务必换成足够长且保密的随机串。
3. **统一返回与异常收敛**：所有接口走 `Result<T>`，`GlobalExceptionHandler` 把业务异常转统一结构，不把堆栈甩给前端。
4. **注销黑名单**为内存实现，集群部署需换 Redis。
5. **图片存库**：如第九节所述，规模上量后建议改为文件/对象存储。
6. **古董铺付款**：`payment.html` 的「立即付款」按钮按需求**置灰（disabled）**，支付网关未接；`ShopService` 预留「付款后才锁库存」改造点。
7. **AI 依赖外部**：`openrouter/free` 为免费路由（模型不固定、有限流）；如需稳定可复现回答，改用具体 `:free` 模型名（如 `qwen/qwen3-next-80b-a3b-instruct:free`）。若未配 key，则需启动本地 Python ai-assistant 服务（8000 端口）。

---

## 十二、版本说明

- 后端 `blog` 1.0.0（Spring Boot 3.2.5）
- 前端静态资源统一带 `?v=36` 版本号，改前端后刷新可破浏览器缓存
