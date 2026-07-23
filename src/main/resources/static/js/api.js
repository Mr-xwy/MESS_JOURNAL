/* =========================================================================
 * api.js —— 前后端通信的核心封装（团队重点学习文件）
 *
 * 关键点：
 * 1. 后端地址是“同源”的（前端页面由 Spring Boot 直接托管在 8080 端口），
 *    所以请求一律用相对路径，例如 fetch('/api/articles')。
 * 2. 登录后后端返回 JWT，前端把它存到 localStorage，之后每个请求的
 *    Authorization 请求头都带上它：Bearer <token>。
 * 3. 后端统一返回结构：{ code:0, message:"ok", data:{...} }。
 *    code===0 表示成功，data 里才是真正的业务数据。
 * 4. 收到 401 表示 token 失效/未登录，自动清空并跳转到登录页。
 * ========================================================================= */

const API_BASE = ''; // 同源，留空即可。若前后端分离部署再改成 'http://localhost:8080'

const TOKEN_KEY = 'blog_token';
const USER_KEY = 'blog_user';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getUser() { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } }
function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}
function isLoggedIn() { return !!getToken(); }
function roleRank(role) { return role === 'ADMIN' ? 3 : role === 'MODERATOR' ? 2 : 1; }

/**
 * 通用请求方法。
 * @param path   接口路径，如 '/api/articles'
 * @param options fetch 配置（method/body/headers...）
 * @returns 后端返回的 data 字段
 */
async function api(path, options = {}) {
    const url = API_BASE + path;
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
        res = await fetch(url, { ...options, headers });
    } catch (e) {
        throw new Error('网络错误，无法连接后端：' + e.message);
    }

    let data = {};
    try { data = await res.json(); } catch (e) { /* 可能无响应体 */ }

    // 401：未登录 / 已失效
    if (res.status === 401) {
        clearSession();
        const onAuthPage = location.pathname.endsWith('login.html') || location.pathname.endsWith('register.html');
        if (!onAuthPage) location.href = 'login.html';
        throw new Error((data && data.message) || '登录已失效，请重新登录');
    }

    // 业务错误（code !== 0）或 HTTP 错误
    if (!res.ok || (data && data.code !== 0 && data.code !== undefined)) {
        throw new Error((data && data.message) || ('请求失败(' + res.status + ')'));
    }
    return data.data;
}


/* ===================== 线上博物馆 / 审核信息箱（团队重点学习文件） =====================
 * 这些封装只是对通用 api() 的薄包装：统一拼路径、序列化 body、自动带 JWT。
 * 业务语义（权限、审核流）全部在后端 RelicController / RelicService 处理。
 * --------------------------------------------------------------------------------- */

/** 已上线文物列表（公开，分页） */
async function getRelics(page = 0, size = 8) {
    return api('/api/relics?page=' + page + '&size=' + size);
}

/** 文物详情（已上线公开；待审/驳回仅作者或审核员可见） */
async function getRelic(id) {
    return api('/api/relics/' + id);
}

/** 我的提交（含待审/驳回；需登录） */
async function getMyRelics() {
    return api('/api/relics/mine');
}

/** 提交/发布文物：管理员直接上线，普通用户进入待审 */
async function createRelic(payload) {
    return api('/api/relics', { method: 'POST', body: JSON.stringify(payload) });
}

/** 审核信息箱：待审队列（仅管理员/审核员） */
async function getInbox() {
    return api('/api/relics/inbox');
}

/** 审核：action = APPROVE | REJECT */
async function reviewRelic(id, action, note) {
    return api('/api/relics/' + id + '/review', {
        method: 'POST',
        body: JSON.stringify({ action: action, note: note || '' })
    });
}

/** 删除文物（作者本人或管理员） */
async function deleteRelic(id) {
    return api('/api/relics/' + id, { method: 'DELETE' });
}




/* ===================== 每日谜题 / 排行榜 =====================
 * 与 relic/letter 封装同构：业务语义（按日选词方、成绩排名）全部在后端 PuzzleController / PuzzleService 处理。
 * --------------------------------------------------------------------------------- */

/** 今日词方（公开） */
async function getTodayPuzzle() {
    return api('/api/puzzles/today');
}

/** 榜单（公开，date/key 省略则默认今日） */
async function getPuzzleLeaderboard(date, key) {
    const qs = [];
    if (date) qs.push('date=' + encodeURIComponent(date));
    if (key) qs.push('key=' + encodeURIComponent(key));
    return api('/api/puzzles/leaderboard' + (qs.length ? '?' + qs.join('&') : ''));
}

/** 提交成绩（需登录）：{ date, key, seconds } */
async function submitPuzzleScore(date, key, seconds) {
    return api('/api/puzzles/scores', {
        method: 'POST',
        body: JSON.stringify({ date: date || '', key: key || '', seconds: seconds })
    });
}

/** 我的成绩（需登录） */
async function getMyPuzzleScore(date, key) {
    const qs = [];
    if (date) qs.push('date=' + encodeURIComponent(date));
    if (key) qs.push('key=' + encodeURIComponent(key));
    return api('/api/puzzles/scores/mine' + (qs.length ? '?' + qs.join('&') : ''));
}

/* ===================== 古董铺 / 闲置集市 =====================
 * 与 relic/letter/puzzle 封装同构：业务语义（在售筛选、下单锁库存、订单归属）全部在后端 ShopController / ShopService 处理。
 * --------------------------------------------------------------------------------- */

/** 在售商品列表（公开，分页 + 分类 / 关键词筛选） */
async function getShopProducts(page = 0, size = 12, category, keyword) {
    const qs = [];
    if (category) qs.push('category=' + encodeURIComponent(category));
    if (keyword) qs.push('keyword=' + encodeURIComponent(keyword));
    qs.push('page=' + page);
    qs.push('size=' + size);
    return api('/api/shop/products?' + qs.join('&'));
}

/** 商品详情（公开） */
async function getShopProduct(id) { return api('/api/shop/products/' + id); }

/** 我的发布（需登录） */
async function getMyProducts() { return api('/api/shop/products/mine'); }

/** 发布闲置（需登录） */
async function createProduct(payload) {
    return api('/api/shop/products', { method: 'POST', body: JSON.stringify(payload) });
}

/** 下架 / 删除商品（需登录，作者本人或管理员） */
async function deleteProduct(id) {
    return api('/api/shop/products/' + id, { method: 'DELETE' });
}

/** 下单（需登录）：{ productId, contactName, contactPhone, contactAddress, note } */
async function createOrder(payload) {
    return api('/api/shop/orders', { method: 'POST', body: JSON.stringify(payload) });
}

/** 我买的（需登录） */
async function getMyOrders() { return api('/api/shop/orders/mine'); }

/** 我卖的（需登录） */
async function getSoldOrders() { return api('/api/shop/orders/sold'); }

/** 订单详情（买家 / 卖家 / 管理员可见） */
async function getOrder(id) { return api('/api/shop/orders/' + id); }

/* =========================================================================
 * 前端优化 P0-②（渐进式）：把全局函数收口到 window.MESS 命名空间。
 * 全局函数仍保留（向后兼容，不破坏现有页面），同时挂到 MESS 便于迁移 ES Module。
 * config.js 已先创建 window.MESS 并写入 BRAND。
 * ========================================================================= */
/* ===================== 新增模块（答辩用）：栏目 / 评论 / 标签 / 收藏 / 公告 =====================
 * 与 relic/letter/shop 封装同构：权限、审核流、分页全部在后端处理。
 * 命名约定：get* 读取、create* 新建、update* 修改、delete* 删除、review* 审核动作。
 * --------------------------------------------------------------------------------- */

/* 公告 Announcement（管理员可写，公开读，登录可标记已读） */
async function getAnnouncements() { return api('/api/announcements'); }
async function markAnnouncementRead(id) {
    return api('/api/announcements/' + id + '/read', { method: 'POST' });
}
async function createAnnouncement(payload) {
    return api('/api/announcements', { method: 'POST', body: JSON.stringify(payload) });
}
async function updateAnnouncement(id, payload) {
    return api('/api/announcements/' + id, { method: 'PUT', body: JSON.stringify(payload) });
}
async function deleteAnnouncement(id) {
    return api('/api/announcements/' + id, { method: 'DELETE' });
}

/* 文章收藏（需登录）：Toggle 收藏状态 */
async function favoriteArticle(id) {
    return api('/api/articles/' + id + '/favorite', { method: 'POST' });
}

/* 我的收藏（需登录）：返回收藏的文章列表 */
async function getMyFavorites() {
    return api('/api/articles/favorites/mine');
}

window.MESS = Object.assign(window.MESS || {}, {
    api, getToken, getUser, setSession, clearSession, isLoggedIn, roleRank,
    getRelics, getRelic, getMyRelics, createRelic, getInbox, reviewRelic, deleteRelic,
    getTodayPuzzle, getPuzzleLeaderboard, submitPuzzleScore, getMyPuzzleScore,
    getShopProducts, getShopProduct, getMyProducts, createProduct, deleteProduct,
    createOrder, getMyOrders, getSoldOrders, getOrder,
    getAnnouncements, markAnnouncementRead, createAnnouncement, updateAnnouncement, deleteAnnouncement,
    favoriteArticle, getMyFavorites
});

