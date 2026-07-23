# 杂研项目 CRUD 模块说明

> 本文档盘点项目的 **12 个 CRUD 业务资源**（原 7 个 + 答辩新增 5 个），说明每个资源「是干什么的、有哪些功能、CRUD 代码写在哪」。
> 代码位置统一以 `src/main/java/com/example/blog/` 为根给出相对路径。
> 最后更新：2026-07-22（新增 5 个答辩模块：栏目 / 评论 / 标签 / 收藏 / 公告，数据库表 8 → 13 张）。

---

## 一、总览

| # | 资源 | 路由前缀 | 对应实体 | Controller | Service |
|---|------|----------|----------|-----------|---------|
| 1 | 文章 Article | `/api/articles` | `entity/Article` | `controller/ArticleController` | `service/ArticleService` |
| 2 | 商品 Product | `/api/shop/products` | `entity/Product` | `controller/ShopController` | `service/ShopService` |
| 3 | 订单 Order | `/api/shop/orders` | `entity/Order` | `controller/ShopController` | `service/ShopService` |
| 4 | 字谜成绩 Score | `/api/puzzles/scores` | `entity/Score` | `controller/PuzzleController` | `service/PuzzleService` |
| 5 | 古董 Relic | `/api/relics` | `entity/Relic` | `controller/RelicController` | `service/RelicService` |
| 6 | 读者来信 Letter | `/api/letters` | `entity/Letter` | `controller/LetterController` | `service/LetterService` |
| 7 | 用户 User | `/api/auth/register` + `/api/user` | `entity/User` | `controller/AuthController` + `controller/UserController` | `service/UserService` |
| 8 | 栏目 Category | `/api/categories` | `entity/Category` | `controller/CategoryController` | `service/CategoryService` |
| 9 | 评论 Comment | `/api/comments` | `entity/Comment`（状态枚举 `CommentStatus`） | `controller/CommentController` | `service/CommentService` |
| 10 | 标签 Tag | `/api/tags` | `entity/Tag`（多对多 `t_article_tag`） | `controller/TagController` | `service/TagService` |
| 11 | 收藏 Bookmark | `/api/bookmarks` | `entity/Bookmark`（类型枚举 `BookmarkTarget`） | `controller/BookmarkController` | `service/BookmarkService` |
| 12 | 公告 Announcement | `/api/announcements` | `entity/Announcement` + `entity/AnnouncementRead` | `controller/AnnouncementController` | `service/AnnouncementService` |

> 注意：商品与订单共用 `ShopController` / `ShopService`；用户的 Create 在 `AuthController`，Read/Update/Delete 在 `UserController`。
> 第 8–12 项为答辩新增模块，每个均含独立数据库表与完整 CRUD，前端对应 `categories.html / comments.html / tags.html / bookmarks.html / announcements.html`。

---

## 二、各资源详解

### 1. 文章 Article

**是干什么的**：平台核心内容单元，作者发布、编辑、上下线、删除的期刊文章。

**功能点**
- 发布文章（标题/正文/封面/标签）
- 列表与详情查询
- 整篇整改（PUT）
- 状态流转：发布 / 下线（PATCH status）
- 作者本人或管理员可删除

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/articles` |
| Read | GET | `/api/articles`（列表）、`/api/articles/{id}`（详情） |
| Update | PUT | `/api/articles/{id}`（整改） |
| Update(局部) | PATCH | `/api/articles/{id}/status`（上下线） |
| Delete | DELETE | `/api/articles/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/ArticleController.java`
- `src/main/java/com/example/blog/service/ArticleService.java`
- `src/main/java/com/example/blog/entity/Article.java`
- `src/main/java/com/example/blog/dto/ArticleRequest.java`

---

### 2. 商品 Product

**是干什么的**：二手/文创商品上架与购买。卖家发布商品，买家浏览下单。

**功能点**
- 卖家上架商品（名称/描述/价格/库存/图片）
- 商品列表与详情
- 整条编辑（PUT，原缺，本次补齐）
- 下架删除

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/shop/products` |
| Read | GET | `/api/shop/products`（列表）、`/api/shop/products/{id}`（详情） |
| Update | PUT | `/api/shop/products/{id}` ← 本次新增 |
| Delete | DELETE | `/api/shop/products/{id}`（下架） |

**代码位置**
- `src/main/java/com/example/blog/controller/ShopController.java`
- `src/main/java/com/example/blog/service/ShopService.java`
- `src/main/java/com/example/blog/entity/Product.java`
- `src/main/java/com/example/blog/dto/ProductRequest.java`

---

### 3. 订单 Order

**是干什么的**：商品交易的订单记录，由买家下单生成，记录买卖双方、金额、状态。

**功能点**
- 买家下单（快照商品信息，标记售出，禁止买自己的商品）
- 订单列表与详情查询
- 状态变更（PUT：买家取消 / 卖家标记付款，状态机护栏）
- 删除（仅未付款 PENDING 订单可物理删除，已付款保护）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/shop/orders` |
| Read | GET | `/api/shop/orders`（列表）、`/api/shop/orders/{id}`（详情） |
| Update | PUT | `/api/shop/orders/{id}` ← 本次新增 |
| Delete | DELETE | `/api/shop/orders/{id}` ← 本次新增 |

**代码位置**
- `src/main/java/com/example/blog/controller/ShopController.java`
- `src/main/java/com/example/blog/service/ShopService.java`
- `src/main/java/com/example/blog/entity/Order.java`
- `src/main/java/com/example/blog/dto/OrderUpdateRequest.java`（本次新增）

> 状态机：`PENDING → PAID`（卖家）、`PENDING → CANCELLED`（买家）；已付款订单禁止物理删除。

---

### 4. 字谜成绩 Score

**是干什么的**：字谜（crossword）游戏的成绩记录，玩家每日挑战后上报用时与正确率。

**功能点**
- 提交成绩（puzzleKey / 用时 seconds / 是否完成）
- 个人成绩查询、排行榜、今日字谜
- 成绩编辑（PUT，用于补录/纠错）
- 成绩删除

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/puzzles/scores` |
| Read | GET | `/api/puzzles/scores`（列表）、`/api/puzzles/scores/my`、`/api/puzzles/leaderboard`、`/api/puzzles/today` |
| Update | PUT | `/api/puzzles/scores/{id}` ← 本次新增 |
| Delete | DELETE | `/api/puzzles/scores/{id}` ← 本次新增 |

**代码位置**
- `src/main/java/com/example/blog/controller/PuzzleController.java`
- `src/main/java/com/example/blog/service/PuzzleService.java`
- `src/main/java/com/example/blog/entity/Score.java`
- `src/main/java/com/example/blog/dto/PuzzleScoreRequest.java`、`src/main/java/com/example/blog/dto/ScoreUpdateRequest.java`（本次新增）

---

### 5. 古董 Relic

**是干什么的**：用户投稿的古董/藏品条目，需经审核后公开。

**功能点**
- 投稿古董（名称/年代/描述/图片）
- 列表与详情查询
- 整条编辑（PUT，原缺，本次补齐）
- 审核（review 动作：通过/驳回）
- 作者或管理员删除

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/relics` |
| Read | GET | `/api/relics`（列表）、`/api/relics/{id}`（详情）、`/api/relics/pending`（审核箱） |
| Update | PUT | `/api/relics/{id}` ← 本次新增 |
| Update(动作) | POST | `/api/relics/{id}/review`（审核） |
| Delete | DELETE | `/api/relics/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/RelicController.java`
- `src/main/java/com/example/blog/service/RelicService.java`
- `src/main/java/com/example/blog/entity/Relic.java`
- `src/main/java/com/example/blog/dto/RelicRequest.java`

---

### 6. 读者来信 Letter

**是干什么的**：读者给编辑部的留言/投稿，需经审核后展示。

**功能点**
- 提交来信（标题/内容/署名）
- 列表与详情查询
- 整条编辑（PUT，原缺，本次补齐）
- 审核（review 动作：通过/驳回）
- 作者或管理员删除

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/letters` |
| Read | GET | `/api/letters`（列表）、`/api/letters/{id}`（详情）、`/api/letters/pending`（审核箱） |
| Update | PUT | `/api/letters/{id}` ← 本次新增 |
| Update(动作) | POST | `/api/letters/{id}/review`（审核） |
| Delete | DELETE | `/api/letters/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/LetterController.java`
- `src/main/java/com/example/blog/service/LetterService.java`
- `src/main/java/com/example/blog/entity/Letter.java`
- `src/main/java/com/example/blog/dto/LetterRequest.java`

---

### 7. 用户 User

**是干什么的**：平台注册用户，承载登录态、个人资料、角色（普通用户/管理员/审核员）。

**功能点**
- 注册（Create，在 AuthController）
- 登录 / 登出（动作，在 AuthController）
- 个人信息查询（Read）
- 修改资料（Update：昵称/头像/简介）
- 删除用户（Delete，本次补齐；⚠️ 当前为物理删除，建议改软删避免孤儿数据）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/auth/register`（在 AuthController） |
| Read | GET | `/api/user`（个人信息） |
| Update | PUT | `/api/user`（修改资料） |
| Delete | DELETE | `/api/user/{id}` ← 本次新增（在 UserController） |

**代码位置**
- 注册/登录：`src/main/java/com/example/blog/controller/AuthController.java`
- 信息/修改/删除：`src/main/java/com/example/blog/controller/UserController.java`
- `src/main/java/com/example/blog/service/UserService.java`
- `src/main/java/com/example/blog/entity/User.java`
- `src/main/java/com/example/blog/dto/UpdateUserRequest.java`

---

---

### 8. 栏目 Category

**是干什么的**：期刊的分栏配置（如文学 / 历史 / 科技…），作为文章的归类维度。

**功能点**
- 栏目列表（公开）、详情查询
- 新建 / 修改 / 删除栏目（管理员 / 审核员）
- slug 唯一校验、排序字段

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/categories` |
| Read | GET | `/api/categories`（列表）、`/api/categories/{id}`（详情） |
| Update | PUT | `/api/categories/{id}` |
| Delete | DELETE | `/api/categories/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/CategoryController.java`
- `src/main/java/com/example/blog/service/CategoryService.java`
- `src/main/java/com/example/blog/entity/Category.java`
- `src/main/java/com/example/blog/dto/CategoryRequest.java`
- 前端：`categories.html` + `js/categories.js`

---

### 9. 评论 Comment

**是干什么的**：文章下的读者评论，支持楼中楼与审核流（发表后进入待审，审核通过才公开展示）。

**功能点**
- 发表评论（登录，进入待审）
- 文章评论列表（公开，仅已通过，分页）
- 我的评论（含待审）、审核信息箱（待审队列）
- 编辑 / 删除（本人或管理员）
- 审核动作：通过 / 驳回（管理员 / 审核员）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/comments` |
| Read | GET | `/api/comments`（文章列表）、`/api/comments/mine`、`/api/comments/inbox`（审核箱） |
| Update | PUT | `/api/comments/{id}` |
| Update(动作) | POST | `/api/comments/{id}/review`（审核） |
| Delete | DELETE | `/api/comments/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/CommentController.java`
- `src/main/java/com/example/blog/service/CommentService.java`
- `src/main/java/com/example/blog/entity/Comment.java`、`entity/CommentStatus.java`（枚举）
- `src/main/java/com/example/blog/dto/CommentRequest.java`
- 前端：`comments.html` + `js/comments.js`

---

### 10. 标签 Tag

**是干什么的**：跨栏目的检索标签，与文章多对多关联（自动生成 `t_article_tag` 中间表）。

**功能点**
- 标签列表（公开）、详情查询
- 标签下的文章列表（分页）
- 新建 / 修改 / 删除标签（管理员 / 审核员，删除时自动解除文章关联）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/tags` |
| Read | GET | `/api/tags`（列表）、`/api/tags/{id}`（详情）、`/api/tags/{id}/articles`（关联文章） |
| Update | PUT | `/api/tags/{id}` |
| Delete | DELETE | `/api/tags/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/TagController.java`
- `src/main/java/com/example/blog/service/TagService.java`
- `src/main/java/com/example/blog/entity/Tag.java`
- `src/main/java/com/example/blog/dto/TagRequest.java`
- 前端：`tags.html` + `js/tags.js`

---

### 11. 收藏 Bookmark

**是干什么的**：用户把文章 / 商品 / 古董收入个人收藏夹，带备注。

**功能点**
- 添加收藏（登录，按 类型+目标ID 去重）
- 我的收藏列表、编辑备注、取消收藏（仅本人）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/bookmarks` |
| Read | GET | `/api/bookmarks/mine`（我的收藏） |
| Update | PUT | `/api/bookmarks/{id}`（改备注） |
| Delete | DELETE | `/api/bookmarks/{id}`（取消收藏） |

**代码位置**
- `src/main/java/com/example/blog/controller/BookmarkController.java`
- `src/main/java/com/example/blog/service/BookmarkService.java`
- `src/main/java/com/example/blog/entity/Bookmark.java`、`entity/BookmarkTarget.java`（枚举）
- `src/main/java/com/example/blog/dto/BookmarkRequest.java`
- 前端：`bookmarks.html` + `js/bookmarks.js`

---

### 12. 公告 Announcement

**是干什么的**：期刊公告 / 站内信，管理员发布，支持置顶与已读跟踪。

**功能点**
- 公告列表（公开，置顶优先，带当前用户已读标记）
- 标记已读（登录）
- 发布 / 修改 / 删除（仅管理员）

**CRUD 端点**

| 操作 | 方法 | 路径 |
|------|------|------|
| Create | POST | `/api/announcements` |
| Read | GET | `/api/announcements`（列表）、`/api/announcements/{id}`（详情） |
| Update | PUT | `/api/announcements/{id}` |
| Update(动作) | POST | `/api/announcements/{id}/read`（标记已读） |
| Delete | DELETE | `/api/announcements/{id}` |

**代码位置**
- `src/main/java/com/example/blog/controller/AnnouncementController.java`
- `src/main/java/com/example/blog/service/AnnouncementService.java`
- `src/main/java/com/example/blog/entity/Announcement.java`、`entity/AnnouncementRead.java`（已读记录）
- `src/main/java/com/example/blog/dto/AnnouncementRequest.java`
- 前端：`announcements.html` + `js/announcements.js`

---

## 二（附）、答辩 5 人分工建议

新增 5 个模块各自独立成表 + 完整 CRUD，天然适配 5 人答辩每人讲一个：

| 队友 | 认领模块 | 表 | 可演示的亮点 |
|------|----------|----|--------------|
| A | 栏目 Category | `t_category` | slug 唯一校验、排序、管理后台表单 |
| B | 评论 Comment | `t_comment` | 楼中楼 + 审核流（inbox / review）+ 分页 |
| C | 标签 Tag | `t_tag` + `t_article_tag` | JPA 多对多自动建中间表、关联文章查询 |
| D | 收藏 Bookmark | `t_bookmark` | 按 用户+类型+目标 去重、本人权限隔离 |
| E | 公告 Announcement | `t_announcement` + `t_announcement_read` | 置顶排序 + 已读跟踪（独立已读表） |

> 权限基线：栏目/标签由「管理员或审核员」管理；评论/收藏为「本人或管理员」；公告仅「管理员」。与 Article 标杆完全一致。

---

## 三、非 CRUD 控制器（对照说明）

以下控制器不属于 CRUD 资源，是动作 / 只读查询，供团队区分边界：

| 控制器 | 路径 | 性质 |
|--------|------|------|
| `AuthController` | `/api/auth` | 登录/登出动作（之外含 User 的 Register） |
| `AiController` | `/api/ai` | AI 对话（chat / chat/stream 动作） |
| `AiQueryController` | `/api/ai` | AI 知识库查询动作 |
| `HotController` | `/api/hot` | 热点榜聚合查询（只读） |

---

*文档由高级开发工程师整理，作为团队代码评审与新人 onboarding 的参考。*
