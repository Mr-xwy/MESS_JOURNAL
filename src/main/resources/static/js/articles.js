/* articles.js —— 文章流页：A 方案大字杂志排版 + 投稿入口
 * 复用 api.js / common.js 的全局函数：api / getUser / escapeHtml / fmtTime / setupHeader
 */

const CATEGORIES = ['全部', '技术', '职场', '随笔', '其他'];

let state = {
    category: '',
    keyword: '',
    page: 0,
    size: 12
};

function renderChips() {
    const box = document.getElementById('chips');
    box.innerHTML = '';
    CATEGORIES.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'chip' + ((cat === '全部' && state.category === '') || cat === state.category ? ' active' : '');
        el.textContent = cat;
        el.onclick = () => {
            state.category = cat === '全部' ? '' : cat;
            state.page = 0;
            renderChips();
            loadArticles();
        };
        box.appendChild(el);
    });
}

async function loadArticles() {
    const listEl = document.getElementById('article-rows');
    listEl.innerHTML = '<div class="empty">加载中…</div>';

    const params = new URLSearchParams({
        page: state.page,
        size: state.size
    });
    if (state.category) params.set('category', state.category);
    if (state.keyword) params.set('keyword', state.keyword);

    try {
        const data = await api('/api/articles?' + params.toString());
        renderArticles(data.list || []);
        renderPager(data);
    } catch (e) {
        listEl.innerHTML = `<div class="empty">${escapeHtml(e.message)}</div>`;
    }
}

function renderArticles(list) {
    const box = document.getElementById('article-rows');
    if (!list.length) { box.innerHTML = '<div class="empty">暂无文章。</div>'; return; }
    box.innerHTML = '';
    const base = state.page * state.size;
    const now = Date.now();
    list.forEach((a, i) => {
        const row = document.createElement('a');
        row.className = 'article-row';
        row.href = 'article.html?id=' + a.id;

        const num = String(base + i + 1).padStart(2, '0');
        const ts = a.publishedAt || a.createdAt;
        const fresh = ts && (now - new Date(ts).getTime()) < 7 * 86400000;

        const meta =
            (fresh ? '<span class="ar-badge">NEW</span>' : '') +
            '<span class="ar-likes">&#10084; ' + (a.likeCount || 0) + '</span>';

        row.innerHTML =
            '<span class="ar-num">' + num + '</span>' +
            '<span class="ar-main">' +
                '<span class="ar-title">' + escapeHtml(a.title) + '</span>' +
                '<span class="ar-byline">By ' + escapeHtml(a.authorName || 'Anonymous') +
                    ' &middot; ' + escapeHtml(a.category || '未分类') +
                    ' &middot; ' + fmtTime(ts) + '</span>' +
            '</span>' +
            '<span class="ar-meta">' + meta + '</span>';
        box.appendChild(row);
    });
}

function renderPager(data) {
    const pager = document.getElementById('pager');
    const totalPages = data.totalPages || 1;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    let html = '<button class="btn" ' + (state.page === 0 ? 'disabled' : '') + ' data-p="prev">上一页</button>';
    html += '<span class="pager-info">' + (state.page + 1) + ' / ' + totalPages + '</span>';
    html += '<button class="btn" ' + (state.page >= totalPages - 1 ? 'disabled' : '') + ' data-p="next">下一页</button>';
    pager.innerHTML = html;
    const prev = pager.querySelector('[data-p="prev"]');
    const next = pager.querySelector('[data-p="next"]');
    if (prev) prev.onclick = () => { if (state.page > 0) { state.page--; loadArticles(); } };
    if (next) next.onclick = () => { if (state.page < totalPages - 1) { state.page++; loadArticles(); } };
}

// 初始化
setupHeader();
renderChips();
loadArticles();

document.getElementById('search').addEventListener('input', (e) => {
    clearTimeout(window._t);
    window._t = setTimeout(() => {
        state.keyword = e.target.value.trim();
        state.page = 0;
        loadArticles();
    }, 350);
});
