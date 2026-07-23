# 杂研（blog-springboot）项目上下文

> 本文件用于跨会话续接。新会话开始时直接读本文件即可恢复关键状态，无需重读全部历史。

## 1. 项目路径与基本定位
- **项目根目录**：`D:\AI生成\blog-springboot`
- **项目名称**：杂研
- **风格**：暗色奢华编辑风（Dark LUXE Editorial）为默认；支持一键切「晨雾浅金画廊风（Misty Light Gold Gallery）」浅色主题，前后端分离（后端 API + 静态前端）
- **技术栈**：SpringBoot 3.2.5 + Spring Data JPA + MySQL + JWT 拦截器；Java 21；前端原生 HTML/CSS/JS
- **环境铁律**：本机 **无 mvn**，无法编译验证后端；前端用 `node --check` 校验语法

## 2. 当前模块清单（13 张表 / 12 个资源）
| 资源 | 表 | CRUD 状态 | 后端关键类 |
|------|----|-----------|-----------|
| 文章/档案 Article | article | 完整 | ArticleController/Service |
| 用户 User | user | 完整（含物理删除，待改软删） | UserController/Service |
| 商品 Product | product | 完整（Article 补齐后补齐） | ShopController/Service |
| 订单 Order | `order` | 完整（状态机 PENDING→PAID/CANCELLED） | ShopController/Service |
| 猜数成绩 Score | score | 完整 | PuzzleController/Service |
| 文物 Relic | relic | 完整 | RelicController/Service |
| 读者来信 Letter（前端改名"消息"） | letter | 完整 | LetterController/Service |
| 栏目 Category | category | 后端存在，**前端入口已删** | CategoryController（待拍板是否删表） |
| 评论 Comment | comment | 后端存在 | CommentController（articleId 暂用 0 占位） |
| 标签 Tag | tag | 后端存在，**前端入口已删** | TagController（待拍板是否删表） |
| 收藏 Bookmark | bookmark | 后端存在 | BookmarkController |
| 公告 Announcement | announcement | 后端存在 | AnnouncementController |

> 答辩 5 人分工：每人讲一个 CRUD 模块，对应 Category/Comment/Tag/Bookmark/Announcement。

## 3. 已完成项
- [x] **SaaS 落地页**：独立目录 `D:\AI生成\saas-landing\`（深色编辑风，Tailwind CDN）
- [x] **前端优化落地**（基于实读代码）：
  - P0 侧栏无障碍（移出 tab 顺序、aria 属性）
  - P0 去 `alert/confirm` 改 `showToast` / `confirmModal`（Promise 化）
  - P1 AI 接 SSE 流式（`streamAiChat`，回退同步）
  - P1 焦点环 `:focus-visible`、SEO（meta/OG/Twitter/JSON-LD）
  - P0 命名空间收口（`window.MESS` + `js/config.js`）
  - P2 工程化脚手架（`vite.config.js` / `package.json` / eslint / CI / 测试）
- [x] **7 资源 CRUD 补全**：以 Article 为模板补齐 Product/Order/Score/Relic/Letter 的 Update、Order/Score/User 的 Delete，新增 `OrderUpdateRequest` / `ScoreUpdateRequest` DTO
- [x] **CRUD 模块说明.md**：7 资源功能 + 代码路径（后更新为 12 资源 + 答辩分工）
- [x] **后端格式化**：google-java-format 1.22.0 全量 66 文件，保留 4 空格（用户明确反对收 2 空格）；备份 `D:\AI生成\.workbuddy\backup\src-20260722`
- [x] **新增 5 答辩模块**：表 8→13，后端 29 文件 + 前端 10 文件；`api.js` 加 20 个 MESS 函数；`modules.css` 加管理表样式
- [x] **侧边栏收敛**：删栏目/标签/评论/收藏/读者来信独立入口；新建 `my.html` + `js/my.js`（4 Tab：我的文章/我的收藏/我的评论/我的消息）；读者来信前端改名"消息"（后端 Letter 未动）
- [x] **高级感 B 组合（🅱 冲击组合）**：新增 `css/premium.css` + `js/premium.js`（加法叠加，不动 style.css/modules.css）。含 A 编辑风 intro（字符揭示 hero + 期号 + 竖排类目计数带）、B 3D 浮卡博物馆展厅（CSS 3D 环形卡阵，museum.html 自助 getRelics 取前 7 文物）、D 戏剧 marquee 暗墨金带（index.html 顶部）、通用 ① View Transitions 站内导航 ② 数字滚动 ③ 字符逐字 ⑤ 期号标识 ⑥ 磁性按钮；全部 `prefers-reduced-motion` 降级。详见 `高级感升级方案.md`。
- [x] **文章流页 + 主页精选河流 + 侧栏入口改造（2026-07-22）**：新建 `articles.html` + `js/articles.js` + `css/articles.css`（A 方案大字杂志排版：序号 01/02/03 + 衬线大标题 + eyebrow 小字 + 金线 hover 划入/标题右移/序号变金 + NEW 角标，明暗自适应），顶部「投稿」金色胶囊按钮跳 `editor.html`；主页 `index.html` 新增 C 方案「精选河流」区块（`js/index.js` 的 `loadFeatured()` 拉 `/api/articles?size=100` 前端过滤 `likeCount>=10` 按发布时间降序，渲染横向金色时间轴，节点卡片上下错落、hover 浮起、点击进详情，窄屏降级纵向、reduce 降级）；22 个 html 侧栏 `nav-write`(写文章)→`nav-articles`(文章) 批量替换（common.js 的 nav-write 引用因 id 不再存在自动 null 安全，无需改动）。

## 4. 待办项 / 待拍板
- [ ] **jpackage + 便携 MySQL 分发方案**：已选方案但被侧边栏重构打断，未落地（需 BlogApplication 启动类、application.yml 环境变量化、打包便携 MySQL、构建脚本，Windows 实测）
- [ ] **后端 Category/Tag 模块是否彻底删除（连表）**：前端入口已删，后端模块保留，待用户拍板（需先确认 Article 不依赖）
- [ ] **孤儿页清理**：`categories.html` / `tags.html` / `comments.html` / `bookmarks.html` / `letters.html` 是否删除
- [ ] **可选优化**：Comment 编辑 `articleId:0` 占位改真实值；5 新接口补 Swagger；User 物理删除改软删除

## 5. 关键约束与踩坑记录
- **中文文件编码**：`Edit` 工具破坏中文 → 含中文文件一律用 Python（utf-8）或整体 `Write` 重写
- **路径**：Bash 传 Windows 风格路径（`D:/AI生成/...`），git bash 的 `/d/` 会叠盘符出错
- **node 校验**：`C:/Users/34888/.workbuddy/binaries/node/versions/22.22.2/node.exe --check file.js`
- **格式化**：google-java-format 默认 2 空格 → 必须用 `reindent4.py` 后处理还原 4 空格（用户要求保持 4 空格）
- **前端聚合页范式**：Tab 懒加载 + 三态（加载/空/错误）+ `confirmModal` + `showToast`
- **后端样板**：Entity + Repository + DTO + Service + Controller；`@RequestAttribute` 取用户；`BusinessException`；`PageResult` 分页
- **保存此文件**：每次大改动后同步更新本文件，保持新会话可秒读
- [x] **全站暗色奢华编辑风翻新（2026-07-22）**：新增 `css/theme.css` 作为最终视觉覆盖层（加载于 style.css/modules.css/premium.css 之后），重定义 :root 令牌与全部共享组件（侧栏/导航/按钮/输入/卡片/报头/热点榜/博物馆/古董铺/来信/谜题/弹窗/Toast/页脚）为近黑暖墨底 + 香槟金 + 奶白文字 + 玻璃面/圆角/柔影；隐藏 lily/bigben 装饰与报头巨型水印；UI 字体切 Manrope/Noto Sans SC，展示标题保留 Cormorant/Noto Serif SC。22 个 html 已注入 theme.css + premium.css + 字体 link。原报纸风样式保留为底层、未删。
- [x] **一键浅色主题（2026-07-22 下午）**：新增 `css/theme-light.css`（晨雾浅金画廊风，暖雾白底 + 墨字 + 沉稳香槟金），用 `:root[data-theme="light"]` 高特异性覆盖 theme.css，明亮模式不破坏入口页 splash（其使用独立 --ink* 暗色令牌，故意保留暗色电影感）。`common.js` 末尾 `initThemeToggle` 在右下角生成玻璃切换按钮（sun/moon 图标），点按互翻并用 `localStorage['mess_theme']` 记忆；各页 `<head>` 内联脚本在解析前设好 data-theme 防闪烁。校验：theme.css/theme-light.css 括号平衡、22/22 页含 theme-light.css 与防闪脚本（无重复）、common.js node --check 通过。
- [x] **修复 avatar 字段长度不够报错（15:19）**：User.java avatar 加 @Lob，UserService 1.6MB→5MB 上限；`fix-avatar-longtext.sql` 一次性 ALTER LONGTEXT（**用户需手动跑**，JPA update 不会改列类型）
