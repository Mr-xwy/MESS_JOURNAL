/* =========================================================================
 * common.js —— 通用 UI 逻辑：主题切换、侧栏渲染、工具函数、导航高亮
 * （依赖 api.js 中定义的全局函数，因此页面中要先引入 api.js）
 * ========================================================================= */

/* ============ 线性图标精灵（黑线描边 / currentColor，学术期刊风） ============ */
const ICON_DEFS = `
<symbol id="icon-home" viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></symbol>
<symbol id="icon-pen" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></symbol>
<symbol id="icon-folder" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></symbol>
<symbol id="icon-brain" viewBox="0 0 24 24"><path d="M12 4.5C10 4.5 8.5 6 8.5 8c-1.3.2-2.2 1.3-2.2 2.6 0 .7.3 1.3.7 1.8-.5.4-.8 1-.8 1.7 0 1.2.9 2.2 2.1 2.3.2 1.2 1.2 2.1 2.5 2.1.4 0 .6-.3.6-.7V5.2c0-.4-.2-.7-.6-.7z"/><path d="M12 4.5C14 4.5 15.5 6 15.5 8c1.3.2 2.2 1.3 2.2 2.6 0 .7-.3 1.3-.7 1.8.5.4.8 1 .8 1.7 0 1.2-.9 2.2-2.1 2.3-.2 1.2-1.2 2.1-2.5 2.1-.4 0-.6-.3-.6-.7V5.2c0-.4.2-.7.6-.7z"/><path d="M12 4.5v14.8"/><path d="M10 8.6c.8.3 1.2 1 1.2 2.1"/><path d="M14 8.6c-.8.3-1.2 1-1.2 2.1"/></symbol>
<symbol id="icon-trend" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5h-5"/></symbol>
<symbol id="icon-doc" viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/><path d="M9 13h6"/><path d="M9 17h6"/></symbol>
<symbol id="icon-alert" viewBox="0 0 24 24"><path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17.6" r=".9"/></symbol>
<symbol id="icon-trash" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/></symbol>
<symbol id="icon-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.2 4 2.3.8-1.1 2-2.3 4-2.3 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20z"/></symbol>
<symbol id="icon-type" viewBox="0 0 24 24"><path d="M5 6h14"/><path d="M12 6v13"/></symbol>
<symbol id="icon-tag" viewBox="0 0 24 24"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12.2V5a2 2 0 0 1 2-2h7.2a2 2 0 0 1 1.4.6l7 7a2 2 0 0 1 0 2.8z"/><circle cx="8.5" cy="8.5" r="1.3"/></symbol>
<symbol id="icon-align" viewBox="0 0 24 24"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></symbol>
<symbol id="icon-file" viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/><path d="M9 13h6"/><path d="M9 17h6"/></symbol>
<symbol id="icon-send" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/></symbol>
<symbol id="icon-save" viewBox="0 0 24 24"><path d="M5 3h12l4 4v14H5z"/><path d="M8 3v6h8V3"/><path d="M8 21v-7h8v7"/></symbol>
<symbol id="icon-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></symbol>
<symbol id="icon-x" viewBox="0 0 24 24"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></symbol>
<symbol id="icon-refresh" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></symbol>
<symbol id="icon-menu" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M4 12h16"/><path d="M4 17h16"/></symbol>
<symbol id="icon-off" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></symbol>
<symbol id="icon-museum" viewBox="0 0 24 24"><path d="M3 9l9-5 9 5"/><path d="M4 9v9h16V9"/><path d="M8 18v-6M12 18v-6M16 18v-6"/></symbol>
<symbol id="icon-star" viewBox="0 0 24 24"><path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.8 6.1 21l1.2-6.5L2.5 9.9 9.1 9z"/></symbol>
<symbol id="icon-inbox" viewBox="0 0 24 24"><path d="M3 13l3-8h12l3 8"/><path d="M3 13h6l1.5 3h3L15 13h6v6H3z"/></symbol><symbol id="icon-brush" viewBox="0 0 24 24"><path d="M4 20l3-1 11-11-2-2L5 17z"/><path d="M14 4l3 3 3-3-3-3z"/></symbol>
<symbol id="icon-upload" viewBox="0 0 24 24"><path d="M12 4v10"/><path d="M8 8l4-4 4 4"/><path d="M4 18v2h16v-2"/></symbol>
<symbol id="icon-download" viewBox="0 0 24 24"><path d="M12 4v10"/><path d="M8 12l4 4 4-4"/><path d="M4 18v2h16v-2"/></symbol>
<symbol id="icon-letter" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/></symbol>
<symbol id="icon-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></symbol>
<symbol id="icon-shop" viewBox="0 0 24 24"><path d="M4 8h16l-1 11H5z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/><path d="M4 8l1-3h14l1 3"/></symbol>
<symbol id="icon-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/><path d="M6 15l6 6 6-6" transform="translate(0 -6)"/></symbol>
<symbol id="icon-avatar" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></symbol>
<symbol id="icon-arrow-left" viewBox="0 0 24 24"><path d="M14 6l-6 6 6 6"/><path d="M8 12h12"/></symbol>

`;

(function injectIconSprite(){
    if (document.getElementById('icon-sprite')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('id','icon-sprite');
    svg.setAttribute('aria-hidden','true');
    svg.style.position = 'absolute';
    svg.style.width = '0'; svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.innerHTML = ICON_DEFS;
    document.body.appendChild(svg);
})();

/* ============ 通用「返回」按钮：右上角，绑定 #top-back-btn ============
 * 用法：在二层页面（不是侧栏 9 个一级入口的页面）的 <div class="top-bar"> 里放
 *   <button class="top-back" id="top-back-btn" type="button" aria-label="返回上一页">
 *       <svg class="icon"><use href="#icon-arrow-left"/></svg><span>返回</span>
 *   </button>
 *  点击时 history.back()；若 history 为空（直接打开），回落到首页。
 *  一级入口页面（侧栏 9 个）不要放此按钮，遵循用户「首页等一层不显示返回」的要求。
 */
function initBackButton() {
    var btn = document.getElementById('top-back-btn');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
        e.preventDefault();
        // document.referrer 优先（同源则回 referrer），否则 history.back()，再否则回首页
        var ref = document.referrer;
        try {
            if (ref && new URL(ref, location.href).origin === location.origin) {
                history.back();
                return;
            }
        } catch (_) { /* 忽略解析错误 */ }
        if (window.history && window.history.length > 1) {
            history.back();
        } else {
            location.href = 'index.html';
        }
    });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBackButton);
} else {
    initBackButton();
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/* 将图片文件压缩为 base64 dataURL（前端上传前调用，控制入库体积） */
function fileToDataURL(file, maxDim, quality) {
    return new Promise(function (resolve, reject) {
        if (!file || !file.type || file.type.indexOf('image/') !== 0) {
            reject(new Error('请选择图片文件'));
            return;
        }
        const reader = new FileReader();
        reader.onerror = function () { reject(new Error('读取文件失败')); };
        reader.onload = function () {
            const img = new Image();
            img.onerror = function () { reject(new Error('图片解析失败')); };
            img.onload = function () {
                let width = img.width, height = img.height;
                if (width > maxDim || height > maxDim) {
                    const scale = maxDim / Math.max(width, height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

/* 判断字符串是否为可用图片地址（base64 或 http(s) 外链） */
function isImageSrc(v) {
    return typeof v === 'string' && (v.indexOf('data:image') === 0
        || v.indexOf('http://') === 0 || v.indexOf('https://') === 0);
}

function fmtTime(t) {
    if (!t) return '';
    const d = new Date(t);
    if (isNaN(d.getTime())) return String(t);
    return d.toLocaleString('zh-CN', { hour12: false });
}

function roleText(r) {
    return r === 'ADMIN' ? '管理员' : r === 'MODERATOR' ? '审核员' : '用户';
}

function statusText(s) {
    return s === 'DRAFT' ? '草稿' : s === 'OFFLINE' ? '已下线' : '已发布';
}

/* ---------- 汉堡菜单（移动端） ---------- */
function initSidebarToggle() {
    const hamburger = document.getElementById('hamburger');
    const sidebar   = document.getElementById('sidebar');
    const trigger   = document.getElementById('sidebar-trigger');
    const overlay   = document.getElementById('sidebar-overlay');

    // 初始：侧栏隐藏 → 移出无障碍树（屏幕阅读器跳过）+ hamburger 折叠态
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');

    function openSidebar() {
        if (sidebar) { sidebar.classList.add('open'); sidebar.setAttribute('aria-hidden', 'false'); }
        if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
        if (overlay) overlay.classList.add('show');
        document.body.classList.add('show-sidebar');
    }
    function closeSidebar() {
        if (sidebar) { sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden', 'true'); }
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
        if (overlay) overlay.classList.remove('show');
        document.body.classList.remove('show-sidebar');
        document.removeEventListener('mousemove', onDocMove);   // 收起时解绑自动收起监听
    }

    // 桌面端（>1024px）：浮动覆盖式 —— 鼠标移出侧栏 / 触发区 / 汉堡即自动收起
    // 抽屉模式（≤1024px）：侧栏推开主内容，保持点击锁定，不随鼠标移走而收（触屏/阅读更稳）
    function onDocMove(e) {
        if (window.innerWidth <= 1024) return;
        const t = e.target;
        if (!t) return;
        if (sidebar   && sidebar.contains(t))   return;
        if (trigger  && trigger.contains(t))    return;
        if (hamburger && hamburger.contains(t)) return;
        closeSidebar();
    }

    // 汉堡：点击锁定打开 / 关闭
    if (hamburger) hamburger.onclick = () => {
        if (sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        } else {
            openSidebar();
            // 延迟一拍绑定，避免本次点击的 mousemove 把刚打开的侧栏又收起；仅桌面端启用"移开即收"
            setTimeout(function () {
                if (sidebar && sidebar.classList.contains('open') && window.innerWidth > 1024) {
                    document.addEventListener('mousemove', onDocMove);
                }
            }, 0);
        }
    };
    if (overlay) overlay.onclick = closeSidebar;
    // 点击侧栏内链接后自动收起
    if (sidebar) {
        sidebar.addEventListener('click', function (e) {
            const a = e.target.closest && e.target.closest('a[href]');
            if (a) closeSidebar();
        });
    }
}

/* ---------- 导航高亮当前页 ---------- */
function highlightNav() {
    const path = location.pathname;          // 如 /index.html, /article.html
    const search = location.search;          // 如 ?mine=1
    const isMineMode = search.includes('mine=1');

    const links = document.querySelectorAll('.nav a[href]');
    links.forEach(a => {
        let href = a.getAttribute('href') || '';

        // 精确匹配：mine 模式下只高亮"我的"，且跳过首页
        if (isMineMode) {
            if (href.includes('mine=1')) { a.classList.add('active'); return; }
            if (href === 'index.html' || href === './index.html' || href === '/index.html') return;
        } else {
            // 非 mine 模式："我的"链接（含 mine=1 参数）不参与通用匹配，避免与首页同时高亮
            if (href.includes('mine=1')) return;
        }

        // 去掉 .html 后比较路径名部分
        const hrefPath = href.split('?')[0].replace(/^\.\//, '');
        const curPath  = path.replace(/^\/|\/$/g, '');
        if (hrefPath && curPath.endsWith(hrefPath)) a.classList.add('active');
    });

    // 首页兜底：如果没有其他高亮，且当前是 index.html（无 mine），高亮首页
    const hasActive = !!document.querySelector('.nav a.active');
    if (!hasActive && (path.endsWith('/') || path.endsWith('index.html')) && !isMineMode) {
        const homeLink = document.getElementById('nav-home');
        if (homeLink) homeLink.classList.add('active');
    }
}

/* ---------- AI 助手浮窗 ---------- */
function initAiAssistant() {
    const fab = document.getElementById('ai-fab');
    const panel = document.getElementById('ai-panel');
    const closeBtn = document.getElementById('ai-close');
    const messages = document.getElementById('ai-messages');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send');
    if (!fab || !panel || !messages || !input || !sendBtn) return;

    // 展开 / 收起
    fab.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        if (!panel.hidden) input.focus();
    });
    if (closeBtn) closeBtn.addEventListener('click', () => { panel.hidden = true; });

    function addMsg(role, text) {
        const div = document.createElement('div');
        div.className = 'ai-msg ' + (role === 'user' ? 'ai-user' : 'ai-ai');
        div.textContent = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
    }

    async function send() {
        const q = input.value.trim();
        if (!q) return;

        // 未登录：友好提示，避免无谓消耗外部 AI 额度
        if (!isLoggedIn()) {
            addMsg('ai', '请先登录后再使用 AI 助手（右上角可登录）。');
            input.value = '';
            return;
        }

        addMsg('user', q);
        input.value = '';
        input.style.height = 'auto';

        const thinking = addMsg('ai', '思考中…');
        thinking.classList.add('thinking');
        sendBtn.disabled = true;

        try {
            // 优先 SSE 流式（打字机体验）；后端不可用时自动回退同步调用
            await streamAiChat(q, function (delta) {
                if (thinking.classList.contains('thinking')) { thinking.classList.remove('thinking'); thinking.textContent = ''; }
                thinking.textContent += delta;
                messages.scrollTop = messages.scrollHeight;
            });
        } catch (e) {
            thinking.classList.remove('thinking');
            thinking.textContent = (e && e.message ? e.message : '请求失败，请稍后再试');
        } finally {
            sendBtn.disabled = false;
            messages.scrollTop = messages.scrollHeight;
            input.focus();
        }
    }

    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
    // 输入框随内容自适应高度
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
}

/* ---------------- 侧栏渲染 ---------------- */
function setupHeader() {
    initSidebarToggle();

    const user = getUser();
    const userArea = document.getElementById('user-area');

    if (userArea) {
        if (user) {
            const av = user.avatar;
            const avHtml = isImageSrc(av)
                ? '<img class="header-avatar" src="' + av + '" alt="头像">'
                : '<span class="header-avatar header-avatar--default"><svg class="icon"><use href="#icon-avatar"/></svg></span>';
            userArea.innerHTML =
                '<div class="sidebar-user-row">' +
                avHtml +
                '<span class="user-name">' + escapeHtml(user.nickname || user.username) + '</span>' +
                '<span class="role-badge role-' + user.role + '">' + roleText(user.role) + '</span>' +
                '</div>' +
                '<div class="sidebar-actions">' +
                '<a href="profile.html" class="link-btn"><svg class="icon"><use href="#icon-doc"/></svg> 资料</a>' +
                '<button id="logout-btn" class="link-btn">退出</button>' +
                '</div>';
            const lb = document.getElementById('logout-btn');
            if (lb) lb.onclick = async () => {
                try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* 忽略 */ }
                clearSession();
                location.href = 'index.html';
            };

            // 显示需要登录的导航项
            const writeLink     = document.getElementById('nav-write');
            const mineLink      = document.getElementById('nav-mine');
            if (writeLink)     writeLink.style.display = '';
            if (mineLink)      mineLink.style.display = '';
        } else {
            userArea.innerHTML =
                '<div class="sidebar-actions">' +
                '<a href="login.html" class="link-btn">登录</a>' +
                '<a href="register.html" class="link-btn">注册</a>' +
                '</div>';

            // 隐藏需要登录的导航项
            const writeLink     = document.getElementById('nav-write');
            const mineLink      = document.getElementById('nav-mine');
            if (writeLink)     writeLink.style.display = 'none';
            if (mineLink)      mineLink.style.display = 'none';
        }
    }

    highlightNav();

    // 信息箱（审核队列）仅管理员 / 审核员可见，普通用户侧栏不显示入口
    const inboxLink = document.getElementById('nav-inbox');
    if (inboxLink) {
        const u = getUser();
        inboxLink.style.display = (u && (u.role === 'ADMIN' || u.role === 'MODERATOR')) ? '' : 'none';
    }
    initAiAssistant();
}

/* 通用错误提示 */
function showError(elId, msg) {
    const el = document.getElementById(elId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

/* =========================================================================
 * 前端优化 P0-③：Toast 轻提示 + 确认弹层（替代 alert / confirm）
 * ========================================================================= */

/** 轻提示。type: '', 'error', 'ok' */
function showToast(msg, type) {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () {
        t.classList.remove('show');
        setTimeout(function () { t.remove(); }, 320);
    }, 3200);
}

/** Promise 化确认弹层（替代阻塞的 confirm()） */
function confirmModal(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
        let mask = document.querySelector('.modal-mask');
        if (!mask) { mask = document.createElement('div'); mask.className = 'modal-mask'; document.body.appendChild(mask); }
        mask.innerHTML =
            '<div class="modal" role="dialog" aria-modal="true">' +
            '<h3>' + escapeHtml(opts.title || '请确认') + '</h3>' +
            '<p>' + escapeHtml(opts.message || '') + '</p>' +
            '<div class="modal-actions">' +
            '<button class="btn" data-r="cancel">' + escapeHtml(opts.cancelText || '取消') + '</button>' +
            '<button class="btn danger" data-r="ok">' + escapeHtml(opts.okText || '确定') + '</button>' +
            '</div></div>';
        mask.classList.add('show');
        function done(v) {
            mask.classList.remove('show');
            mask.removeEventListener('click', onMask);
            resolve(v);
        }
        function onMask(e) { if (e.target === mask) done(false); }
        mask.addEventListener('click', onMask);
        mask.querySelector('[data-r="cancel"]').onclick = function () { done(false); };
        mask.querySelector('[data-r="ok"]').onclick = function () { done(true); };
    });
}

/* =========================================================================
 * 前端优化 P1-④：AI 流式对话 —— 消费后端 SSE（/api/ai/chat/stream）
 * 返回 true 表示走流式；false 表示已回退到同步 /api/ai/chat。
 * ========================================================================= */
async function streamAiChat(question, onDelta) {
    const token = getToken();
    let res;
    try {
        res = await fetch(API_BASE + '/api/ai/chat/stream', {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { 'Authorization': 'Bearer ' + token } : {}),
            body: JSON.stringify({ question: question })
        });
    } catch (e) { res = null; }

    if (!res || !res.ok || !res.body) {
        const answer = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ question: question }) });
        onDelta(answer);
        return false;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    try {
        while (true) {
            const step = await reader.read();
            if (step.done) break;
            buf += decoder.decode(step.value, { stream: true });
            let idx;
            while ((idx = buf.indexOf('\n\n')) !== -1) {
                const chunk = buf.slice(0, idx); buf = buf.slice(idx + 2);
                chunk.split('\n').forEach(function (line) {
                    if (line.indexOf('data:') !== 0) return;
                    const data = line.slice(5).trim();
                    if (!data || data === '[DONE]') return;
                    if (data.indexOf('[ERROR]') === 0) throw new Error(data.slice(7).trim() || 'AI 返回错误');
                    onDelta(data);
                });
            }
        }
        return true;
    } catch (e) {
        // 流中途失败：若尚未输出任何内容，回退同步调用
        if (!buf.trim()) {
            const answer = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ question: question }) });
            onDelta(answer);
            return false;
        }
        throw e;
    }
}


/* =========================================================================
 * 杂研 · 全局动效：滚动揭示 + 页面淡入（尊重 prefers-reduced-motion）
 * ========================================================================= */
(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 页面首次加载淡入
    document.body.classList.add('page-fade-in');

    function initReveal() {
        var reveals = document.querySelectorAll('.reveal');
        if (reduce || !('IntersectionObserver' in window)) {
            reveals.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-visible');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        reveals.forEach(function (el) { io.observe(el); });

        // 容器错落：为 .reveal-group 内带 .reveal 的子元素按顺序设置索引
        var groups = document.querySelectorAll('.reveal-group');
        groups.forEach(function (g) {
            var items = g.querySelectorAll('.reveal');
            items.forEach(function (el, i) { el.style.setProperty('--reveal-i', i); });
        });

        // 对动态插入的卡片（如文章列表）也做延迟揭示
        var grid = document.getElementById('article-list');
        if (grid && 'MutationObserver' in window) {
            var mo = new MutationObserver(function (muts) {
                muts.forEach(function (m) {
                    m.addedNodes.forEach(function (n) {
                        if (n.nodeType !== 1) return;
                        var card = n.classList && n.classList.contains('article-card') ? n
                                 : (n.querySelector ? n.querySelector('.article-card') : null);
                        if (card && !card.classList.contains('reveal')) {
                            card.classList.add('reveal');
                            io.observe(card);
                        }
                    });
                });
            });
            mo.observe(grid, { childList: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initReveal);
    } else {
        initReveal();
    }
})();

/* =========================================================================
 * 杂研 · 自定义光标（触摸 / 减少运动设备自动禁用，保留原生光标）
 * ========================================================================= */
(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduce || !fine) return;

    var dot = document.createElement('div'); dot.className = 'cursor-dot';
    var ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    var mx = 0, my = 0, rx = 0, ry = 0;
    function loop() {
        rx += (mx - rx) * 0.18;
        ry += (my - ry) * 0.18;
        dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
        ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
        requestAnimationFrame(loop);
    }
    window.addEventListener('pointermove', function (e) {
        mx = e.clientX; my = e.clientY;
        document.body.classList.add('cursor-on');
    }, { passive: true });

    var targets = 'a, button, .card, [data-cursor], input, textarea, select, .sidebar a, .relic-card, .product-card, .link-btn';
    document.addEventListener('pointerover', function (e) {
        if (e.target.closest && e.target.closest(targets)) {
            ring.classList.add('is-hover'); dot.classList.add('is-hover');
        }
    });
    document.addEventListener('pointerout', function (e) {
        if (e.target.closest && e.target.closest(targets)) {
            ring.classList.remove('is-hover'); dot.classList.remove('is-hover');
        }
    });
    loop();
})();

/* =========================================================================
 * 杂研 · 自动揭示：将滚动揭示铺到每页主区块（不碰卡片，避免与 hover 冲突）
 * ========================================================================= */
(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function run() {
        var sel = '.main-wrapper > section, main.auth-wrap, .panel, .container > .section-heading';
        var nodes = document.querySelectorAll(sel);
        if (reduce || !('IntersectionObserver' in window)) {
            nodes.forEach(function (el) { el.classList.add('reveal', 'is-visible'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-visible');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
        nodes.forEach(function (el) {
            if (!el.classList.contains('reveal')) el.classList.add('reveal');
            io.observe(el);
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();

/* =========================================================================
 * 杂研 · 主题切换（暗色默认 / 浅色可选，localStorage 记忆）
 * 与 theme-light.css 配合：<html data-theme="light"> 时启用浅色覆盖层。
 * 防闪由各页 <head> 内联脚本在解析前设好 data-theme，这里只负责按钮与持久化。
 * ========================================================================= */
(function initThemeToggle() {
    var KEY = 'mess_theme';
    var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>';
    var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5z"/></svg>';

    function isLight() { return document.documentElement.getAttribute('data-theme') === 'light'; }
    function apply(theme) {
        if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
        else document.documentElement.removeAttribute('data-theme');
    }

    // 与 <head> 内联脚本保持一致：以 localStorage 为准（内联已先设过，这里兜底）
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved === 'light' || saved === 'dark') apply(saved);

    if (document.getElementById('theme-toggle')) return; // 避免重复注入

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', '切换浅色 / 深色主题');
    btn.setAttribute('title', '切换浅色 / 深色');

    function paint() { btn.innerHTML = isLight() ? MOON : SUN; }
    paint();

    btn.addEventListener('click', function () {
        var next = isLight() ? 'dark' : 'light';
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        paint();
    });

    document.body.appendChild(btn);
})();
