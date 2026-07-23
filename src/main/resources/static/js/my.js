/* my.js —— 「我的」个人中心：仅保留「我的文章」。
 * 收藏 / 评论 / 读者来信 三模块已移除，相关功能一并下线。
 * 依赖：api.js、common.js（confirmModal / showToast / setupHeader）。
 */
(function () {
    'use strict';

    // 兜底：common.js 已提供 fmtTime / escapeHtml 时直接用全局，否则本地实现
    var fmtTime = window.fmtTime || function (t) {
        if (!t) return '';
        var d = new Date(t);
        var p = function (n) { return (n < 10 ? '0' : '') + n; };
        return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
    };
    var escapeHtml = window.escapeHtml || function (s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    };

    function statusLabel(s) {
        if (!s) return '';
        if (s === 'PENDING') return '待审';
        if (s === 'APPROVED' || s === 'PUBLISHED') return '已刊发';
        if (s === 'REJECTED') return '驳回';
        if (s === 'DRAFT') return '草稿';
        if (s === 'OFFLINE') return '已下线';
        return s;
    }

    function requireLogin(box) {
        if (isLoggedIn()) return true;
        box.innerHTML = '<div class="empty" style="text-align:center;padding:40px 0;">'
            + '<p style="margin-bottom:12px;">查看个人内容需要先登录</p>'
            + '<a href="login.html" class="btn">去登录</a></div>';
        return false;
    }

    /* ===================== 我的文章 ===================== */
    async function loadMyArticles() {
        var box = document.getElementById('my-articles');
        box.innerHTML = '<div class="empty">加载中…</div>';
        if (!requireLogin(box)) return;
        try {
            var data = await api('/api/articles?mine=true&page=0&size=20');
            var list = (data && data.list) || [];
            if (!list.length) {
                box.innerHTML = '<div class="empty">还没有文章，<a href="editor.html">去写一篇</a>。</div>';
                return;
            }
            var me = getUser();
            box.innerHTML = '';
            list.forEach(function (a) {
                var card = document.createElement('div');
                card.className = 'article-card';
                var canEdit = me && (me.id === a.authorId || me.role === 'ADMIN');
                var canModerate = me && (me.role === 'ADMIN' || me.role === 'MODERATOR');
                var actions = '';
                if (canEdit) {
                    actions += '<button class="btn" data-act="edit" data-id="' + a.id + '">编辑</button>';
                    actions += '<button class="btn danger" data-act="delete" data-id="' + a.id + '">删除</button>';
                }
                if (canModerate && a.status === 'PUBLISHED') actions += '<button class="btn danger" data-act="offline" data-id="' + a.id + '">下线</button>';
                if (canModerate && a.status === 'OFFLINE') actions += '<button class="btn" data-act="restore" data-id="' + a.id + '">恢复</button>';
                card.innerHTML = '<h3 data-id="' + a.id + '">' + escapeHtml(a.title) + '</h3>'
                    + '<p class="byline">By ' + escapeHtml(a.authorName || 'Anonymous') + ' · ' + fmtTime(a.publishedAt || a.createdAt) + '</p>'
                    + '<p class="summary">' + escapeHtml(a.summary || a.content || '') + '</p>'
                    + '<div class="card-meta"><span class="tag">' + escapeHtml(a.category || '未分类') + '</span>'
                    + '<span>👍 ' + (a.likeCount || 0) + ' LIKES</span>'
                    + (a.status && a.status !== 'PUBLISHED' ? '<span class="status-draft">' + statusLabel(a.status) + '</span>' : '')
                    + '</div>'
                    + (actions ? '<div class="card-actions">' + actions + '</div>' : '');
                card.querySelector('h3').onclick = function () { location.href = 'article.html?id=' + a.id; };
                card.querySelectorAll('.card-actions .btn').forEach(function (b) {
                    b.onclick = function () { articleAction(b.dataset.act, b.dataset.id); };
                });
                box.appendChild(card);
            });
        } catch (e) {
            box.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>';
        }
    }

    /* ===================== 我的收藏 ===================== */
    async function loadMyFavorites() {
        var box = document.getElementById('my-favorites');
        box.innerHTML = '<div class="empty">加载中…</div>';
        if (!requireLogin(box)) return;
        try {
            var data = await getMyFavorites();
            var list = Array.isArray(data) ? data : ((data && data.list) || []);
            if (!list.length) {
                box.innerHTML = '<div class="empty">还没有收藏的文章，去<a href="articles.html">文章页</a>看看吧。</div>';
                return;
            }
            var me = getUser();
            box.innerHTML = '';
            list.forEach(function (a) {
                var card = document.createElement('div');
                card.className = 'article-card';
                var canEdit = me && (me.id === a.authorId || me.role === 'ADMIN');
                var canModerate = me && (me.role === 'ADMIN' || me.role === 'MODERATOR');
                var actions = '';
                if (canEdit) {
                    actions += '<button class="btn" data-act="edit" data-id="' + a.id + '">编辑</button>';
                    actions += '<button class="btn danger" data-act="delete" data-id="' + a.id + '">删除</button>';
                }
                if (canModerate && a.status === 'PUBLISHED') actions += '<button class="btn danger" data-act="offline" data-id="' + a.id + '">下线</button>';
                if (canModerate && a.status === 'OFFLINE') actions += '<button class="btn" data-act="restore" data-id="' + a.id + '">恢复</button>';
                card.innerHTML = '<h3 data-id="' + a.id + '">' + escapeHtml(a.title) + '</h3>'
                    + '<p class="byline">By ' + escapeHtml(a.authorName || 'Anonymous') + ' · ' + fmtTime(a.publishedAt || a.createdAt) + '</p>'
                    + '<p class="summary">' + escapeHtml(a.summary || a.content || '') + '</p>'
                    + '<div class="card-meta"><span class="tag">' + escapeHtml(a.category || '未分类') + '</span>'
                    + '<span>👍 ' + (a.likeCount || 0) + ' LIKES</span>'
                    + (a.status && a.status !== 'PUBLISHED' ? '<span class="status-draft">' + statusLabel(a.status) + '</span>' : '')
                    + '</div>'
                    + (actions ? '<div class="card-actions">' + actions + '</div>' : '');
                card.querySelector('h3').onclick = function () { location.href = 'article.html?id=' + a.id; };
                card.querySelectorAll('.card-actions .btn').forEach(function (b) {
                    b.onclick = function () { articleAction(b.dataset.act, b.dataset.id); };
                });
                box.appendChild(card);
            });
        } catch (e) {
            box.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>';
        }
    }

    /* ===================== 我的古董（古董铺上架的闲置） ===================== */
    function renderProductCard(p) {
        var img = isImageSrc(p.image)
            ? '<img class="product-img" src="' + p.image + '" alt="' + escapeHtml(p.title) + '">'
            : '<div class="product-img product-img--empty">暂无图片</div>';
        var statusBadge = p.status === 'SOLD'
            ? '<span class="product-badge product-badge--sold">已售出</span>'
            : (p.status === 'REMOVED'
                ? '<span class="product-badge product-badge--off">已下架</span>'
                : '<span class="product-badge product-badge--on">在售</span>');
        var cond = p.itemCondition ? '<span class="product-cond">' + escapeHtml(p.itemCondition) + '</span>' : '';
        var cat = p.category ? '<span class="product-cat">' + escapeHtml(p.category) + '</span>' : '';
        var fmtPrice = function (n) {
            var v = Number(n);
            return '¥' + (isNaN(v) ? '0.00' : v.toFixed(2));
        };
        var card = document.createElement('article');
        card.className = 'product-card';
        card.dataset.id = p.id;
        card.innerHTML =
            '<div class="product-frame">' + img + statusBadge + '</div>' +
            '<div class="product-body">' +
                '<h3>' + escapeHtml(p.title) + '</h3>' +
                '<div class="product-meta">' + cat + cond + '</div>' +
                '<div class="product-foot">' +
                    '<span class="product-price">' + fmtPrice(p.price) + '</span>' +
                    '<span class="product-seller">by ' + escapeHtml(p.sellerName || '佚名') + '</span>' +
                '</div>' +
            '</div>';
        card.onclick = function () { location.href = 'product.html?id=' + p.id; };
        return card;
    }

    async function loadMyProducts() {
        var box = document.getElementById('my-relics');
        box.innerHTML = '<div class="empty">展柜整理中…</div>';
        if (!requireLogin(box)) return;
        try {
            var list = await getMyProducts();
            if (!list || !list.length) {
                box.innerHTML = '<div class="empty">还没有上架闲置，去<a href="shop.html">古董铺</a>发布一件吧。</div>';
                return;
            }
            box.innerHTML = '';
            list.forEach(function (p) { box.appendChild(renderProductCard(p)); });
        } catch (e) {
            box.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>';
        }
    }

    async function articleAction(act, id) {
        try {
            if (act === 'edit') { location.href = 'editor.html?id=' + id; return; }
            if (act === 'delete') {
                var ok = await confirmModal({ title: '删除文章', message: '确定删除这篇文章？此操作不可撤销。', okText: '删除', cancelText: '取消' });
                if (!ok) return;
                await api('/api/articles/' + id, { method: 'DELETE' });
                showToast('文章已删除', 'ok');
            } else if (act === 'offline') {
                await api('/api/articles/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status: 'OFFLINE' }) });
                showToast('已下线', 'ok');
            } else if (act === 'restore') {
                await api('/api/articles/' + id + '/status', { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) });
                showToast('已恢复', 'ok');
            }
            loadMyArticles();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }

    /* ===================== Tab 切换 ===================== */
    var loaded = {};
    function switchTab(name) {
        document.querySelectorAll('.tab').forEach(function (t) {
            var on = t.dataset.tab === name;
            t.classList.toggle('active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(function (p) {
            p.hidden = (p.dataset.panel !== name);
        });
        if (loaded[name]) return; // 懒加载：首次切到才请求
        loaded[name] = true;
        if (name === 'articles') loadMyArticles();
        else if (name === 'favorites') loadMyFavorites();
        else if (name === 'relics') loadMyProducts();
    }

    function initTabs() {
        document.querySelectorAll('.tab').forEach(function (t) {
            t.addEventListener('click', function () { switchTab(t.dataset.tab); });
        });
    }

    /* ===================== 初始化 ===================== */
    setupHeader();
    initTabs();
    switchTab('articles'); // 默认进入「我的文章」
})();
