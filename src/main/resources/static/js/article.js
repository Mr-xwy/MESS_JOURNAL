/* article.js —— 文章详情（学术期刊论文排版） */

// 给 body 加 detail-page 类，激活纸张纹理背景
document.body.classList.add('detail-page');

setupHeader();

const id = new URLSearchParams(location.search).get('id');
const detailEl = document.getElementById('detail');
let currentArticle = null;

/* 文章页水印：根据文章 ID 选 1~6 号图案（确定性：同一篇文章永远显示同一图案） */
(function applyArticleWatermark() {
    const wm = document.getElementById('article-watermark');
    if (!wm) return;
    const num = parseInt(id, 10);
    if (!num || isNaN(num)) {
        // 没有 ID 时不显示水印
        wm.style.display = 'none';
        return;
    }
    const idx = ((num - 1) % 6) + 1;   // 1~6
    wm.classList.add('wm-' + idx);
})();

if (!id) {
    detailEl.innerHTML = '<div class="empty">缺少文章 ID</div>';
} else {
    loadDetail();
}

async function loadDetail() {
    detailEl.innerHTML = '<div class="empty" style="padding:60px 0;text-align:center;">加载中…</div>';
    try {
        const data = await api('/api/articles/' + id);
        const a = data.article;
        const liked = data.liked;
        const favorited = data.favorited;
        render(a, liked, favorited);
    } catch (e) {
        detailEl.innerHTML = '';
        showError('err', e.message);
    }
}

function aiSummaryBlock(a) {
    return '<div class="ai-summary" id="ai-summary">' +
        '<button class="ai-summary-trigger" id="ai-summary-trigger" type="button">' +
            '<svg class="icon"><use href="#icon-brain"/></svg>' +
            '<span>AI 一句话导读</span>' +
            '<svg class="icon chevron"><use href="#icon-chevron"/></svg>' +
        '</button>' +
        '<div class="ai-summary-body" id="ai-summary-body" hidden>' +
            '<p class="ai-summary-text" id="ai-summary-text"></p>' +
            '<button class="btn ghost" id="ai-summary-gen">生成导读</button>' +
        '</div>' +
    '</div>';
}

function initAiSummary(a) {
    const trigger = document.getElementById('ai-summary-trigger');
    const body = document.getElementById('ai-summary-body');
    const gen = document.getElementById('ai-summary-gen');
    const text = document.getElementById('ai-summary-text');
    if (!trigger || !body || !gen || !text) return;
    trigger.onclick = () => { body.hidden = !body.hidden; trigger.setAttribute('aria-expanded', String(!body.hidden)); };
    gen.onclick = async () => {
        if (!isLoggedIn()) {
            text.textContent = '请先登录后再生成导读。';
            body.hidden = false;
            return;
        }
        gen.disabled = true;
        gen.textContent = '生成中…';
        const prompt = '请用一句精简、吸引人的中文（不超过 40 字）概括下面这篇文章的核心内容，只返回这一句话本身，不要任何解释、不要引号或书名号包裹。请忽略此前的任何对话记录，仅依据本次提供的标题、分类与摘要作答。\n【文章】\n标题：' + (a.title || '') + '\n分类：' + (a.category || '未分类') + '\n摘要：' + (a.summary || '（无摘要）');
        try {
            const ans = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ question: prompt }) });
            text.textContent = ans;
            gen.textContent = '重新生成';
            body.hidden = false;
        } catch (e) {
            text.textContent = (e && e.message ? e.message : '生成失败，请稍后再试');
            gen.textContent = '生成导读';
        } finally {
            gen.disabled = false;
        }
    };
}

function render(a, liked, favorited) {
    const me = getUser();
    const canEdit = me && (me.id === a.authorId || me.role === 'ADMIN');
    const canModerate = me && (me.role === 'ADMIN' || me.role === 'MODERATOR');

    let actions = '';
    if (canEdit) {
        actions += `<button class="btn" id="edit-btn"><svg class="icon"><use href="#icon-pen"/></svg> 编辑</button>`;
        actions += `<button class="btn danger" id="del-btn"><svg class="icon"><use href="#icon-trash"/></svg> 删除</button>`;
    }
    if (canModerate && a.status === 'PUBLISHED') {
        actions += `<button class="btn danger" id="offline-btn"><svg class="icon"><use href="#icon-off"/></svg> 下线</button>`;
    }
    if (canModerate && a.status === 'OFFLINE') {
        actions += `<button class="btn" id="restore-btn"><svg class="icon"><use href="#icon-refresh"/></svg> 恢复发布</button>`;
    }

    // 状态标签
    let statusTag = '';
    if (a.status === 'OFFLINE') statusTag = '<span class="paper-status-tag">已下线</span>';
    else if (a.status === 'DRAFT') statusTag = '<span class="paper-status-tag draft">草稿</span>';

    // 摘要块：有 summary 时才显示
    const abstractHtml = (a.summary)
        ? `<div class="paper-abstract">
               <div class="paper-abstract-label">Abstract / 摘要</div>
               <div class="paper-abstract-text">${escapeHtml(a.summary)}</div>
           </div>`
        : '';

    detailEl.innerHTML = `
        <article class="paper">
            <!-- 页眉 -->
            <div class="paper-header">
                <div class="paper-logo">
                    <span class="paper-logo-mark">M.E.S.S</span>
                    <div class="paper-logo-fields">
                        <span>Method</span><span>Experiment</span><span>Survey</span><span>Summary</span>
                    </div>
                </div>
                <span class="page-num">第 1 页</span>
            </div>

            <!-- 标题 -->
            <h1 class="paper-title">${escapeHtml(a.title)}</h1>

            <!-- 作者 / 元信息 -->
            <div class="paper-meta">
                <div class="paper-meta-row">
                    <span class="paper-author">作者：${escapeHtml(a.authorName || '佚名')}</span>
                    <span>提交时间：${fmtTime(a.publishedAt || a.createdAt)}</span>
                    ${a.updatedAt && !a.publishedAt ? '<span>更新于：' + fmtTime(a.updatedAt) + '</span>' : ''}
                </div>
                <div class="paper-meta-row" style="margin-top:4px;">
                    <span class="tag cat">${escapeHtml(a.category || '未分类')}</span>
                    ${statusTag}
                    ${a.updatedAt && a.publishedAt ? '<span style="color:var(--text-soft);font-size:12px;">更新于 ' + fmtTime(a.updatedAt) + '</span>' : ''}
                </div>
            </div>

            ${abstractHtml}
            ${aiSummaryBlock(a)}

            <!-- 正文 -->
            <div class="paper-body">${escapeHtml(a.content || '')}</div>

            <!-- 底部操作栏 -->
            <div class="paper-footer">
                <div class="like-bar">
                    <button class="btn like-btn ${liked ? 'liked' : ''}" id="like-btn">
                        <svg class="icon"><use href="#icon-heart"/></svg> <span class="like-label">${liked ? '已赞' : '点赞'}</span> <span id="like-count">${a.likeCount || 0}</span>
                    </button>
                    <button class="btn fav-btn ${favorited ? 'faved' : ''}" id="fav-btn">
                        <svg class="icon"><use href="#icon-star"/></svg> <span class="fav-label">${favorited ? '已收藏' : '收藏'}</span>
                    </button>
                </div>
                ${actions ? '<div class="card-actions">' + actions + '</div>' : ''}
            </div>
        </article>
    `;

    // 绑定事件
    document.getElementById('like-btn').onclick = () => toggleLike(a.id, liked);
    document.getElementById('fav-btn').onclick = () => toggleFavorite(a.id, favorited);
    const edit = document.getElementById('edit-btn');
    if (edit) edit.onclick = () => location.href = 'editor.html?id=' + a.id;
    const del = document.getElementById('del-btn');
    if (del) del.onclick = async () => {
        if (!confirm('确定删除这篇文章？此操作不可撤销。')) return;
        try { await api('/api/articles/' + a.id, { method: 'DELETE' }); location.href = 'index.html'; }
        catch (e) { alert(e.message); }
    };
    const off = document.getElementById('offline-btn');
    if (off) off.onclick = async () => {
        try { await api('/api/articles/' + a.id + '/status', { method: 'PATCH', body: JSON.stringify({ status: 'OFFLINE' }) }); loadDetail(); }
        catch (e) { alert(e.message); }
    };
    const res = document.getElementById('restore-btn');
    if (res) res.onclick = async () => {
        try { await api('/api/articles/' + a.id + '/status', { method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' }) }); loadDetail(); }
        catch (e) { alert(e.message); }
    };
    currentArticle = a;
    initAiSummary(a);
}

async function toggleLike(articleId, wasLiked) {
    const btn = document.getElementById('like-btn');
    const countEl = document.getElementById('like-count');
    try {
        const r = await api('/api/articles/' + articleId + '/like', { method: 'POST' });
        btn.classList.toggle('liked', r.liked);
        const label = btn.querySelector('.like-label');
        if (label) label.textContent = r.liked ? '已赞 ' : '点赞 ';
        countEl.textContent = r.likeCount;
    } catch (e) {
        alert(e.message);
    }
}

async function toggleFavorite(articleId, wasFaved) {
    const btn = document.getElementById('fav-btn');
    const label = btn.querySelector('.fav-label');
    try {
        const r = await favoriteArticle(articleId);
        btn.classList.toggle('faved', r.favorited);
        if (label) label.textContent = r.favorited ? '已收藏' : '收藏';
    } catch (e) {
        alert(e.message);
    }
}
