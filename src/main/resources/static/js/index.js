/* index.js —— 首页逻辑：加载文章列表、分类筛选、搜索、分页、热点榜 */

const CATEGORIES = ['全部', '技术', '职场', '随笔', '其他'];

let state = {
    category: '',
    keyword: '',
    page: 0,
    size: 6,
    mine: new URLSearchParams(location.search).get('mine') === '1'
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
    const listEl = document.getElementById('article-list');
    const titleEl = document.getElementById('list-title');
    // 容器已下线（首页主文章区改为精选河流），no-op 即可
    if (!listEl || !titleEl) return;
    listEl.innerHTML = '<div class="empty">加载中…</div>';
    titleEl.textContent = state.mine ? '我的文章' : '最新文章';

    // 「我的文章」需要登录，未登录时直接引导去登录
    if (state.mine && !isLoggedIn()) {
        listEl.innerHTML = `<div class="empty" style="text-align:center;padding:40px 0;">
            <p style="margin-bottom:12px;">查看自己的文章需要先登录</p>
            <a href="login.html" class="btn">去登录</a>
        </div>`;
        return;
    }

    const params = new URLSearchParams({
        page: state.page,
        size: state.size,
        mine: state.mine ? 'true' : 'false'
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
    const box = document.getElementById('article-list');
    if (!list.length) { box.innerHTML = '<div class="empty">暂无文章。</div>'; return; }
    const me = getUser();
    box.innerHTML = '';
    list.forEach(a => {
        const card = document.createElement('div');
        card.className = 'article-card';
        const canEdit = me && (me.id === a.authorId || me.role === 'ADMIN');
        const canModerate = me && (me.role === 'ADMIN' || me.role === 'MODERATOR');

        let actions = '';
        if (canEdit) {
            actions += `<button class="btn" data-act="edit" data-id="${a.id}">编辑</button>`;
            actions += `<button class="btn danger" data-act="delete" data-id="${a.id}">删除</button>`;
        }
        if (canModerate && a.status === 'PUBLISHED') {
            actions += `<button class="btn danger" data-act="offline" data-id="${a.id}">下线</button>`;
        }
        if (canModerate && a.status === 'OFFLINE') {
            actions += `<button class="btn" data-act="restore" data-id="${a.id}">恢复</button>`;
        }

        card.innerHTML = `
            <h3 data-id="${a.id}">${escapeHtml(a.title)}</h3>
            <p class="byline">By ${escapeHtml(a.authorName || 'Anonymous')} · ${fmtTime(a.publishedAt || a.createdAt)}</p>
            <p class="summary">${escapeHtml(a.summary || a.content || '')}</p>
            <div class="card-meta">
                <span class="tag">${escapeHtml(a.category || '未分类')}</span>
                <span>👍 ${a.likeCount || 0} LIKES</span>
                ${a.status === 'DRAFT' ? '<span class="status-draft">DRAFT</span>' : ''}
                ${a.status === 'OFFLINE' ? '<span class="status-draft">OFFLINE</span>' : ''}
            </div>
            ${actions ? `<div class="card-actions">${actions}</div>` : ''}
        `;
        // 点击标题进详情
        card.querySelector('h3').onclick = () => location.href = 'article.html?id=' + a.id;
        // 操作按钮
        card.querySelectorAll('.card-actions .btn').forEach(btn => {
            btn.onclick = () => handleAction(btn.dataset.act, btn.dataset.id);
        });
        box.appendChild(card);
    });
}

async function handleAction(act, id) {
    try {
        if (act === 'edit') { location.href = 'editor.html?id=' + id; return; }
        if (act === 'delete') {
            const ok = await confirmModal({
                title: '删除文章',
                message: '确定删除这篇文章？此操作不可撤销。',
                okText: '删除', cancelText: '取消'
            });
            if (!ok) return;
            await api('/api/articles/' + id, { method: 'DELETE' });
            showToast('文章已删除', 'ok');
        }
        if (act === 'offline') {
            await api('/api/articles/' + id + '/status', {
                method: 'PATCH', body: JSON.stringify({ status: 'OFFLINE' })
            });
            showToast('已下线', 'ok');
        }
        if (act === 'restore') {
            await api('/api/articles/' + id + '/status', {
                method: 'PATCH', body: JSON.stringify({ status: 'PUBLISHED' })
            });
            showToast('已恢复', 'ok');
        }
        // 主页已下线老卡片区，刷新精选河流；老入口（mine=1 仍存在容器时）走原路径
        if (document.getElementById('article-list')) loadArticles();
        else loadFeatured();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function renderPager(data) {
    const pager = document.getElementById('pager');
    const totalPages = data.totalPages || 1;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    let html = `<button class="btn" ${state.page === 0 ? 'disabled' : ''} data-p="prev">上一页</button>`;
    html += `<span style="font-size:13px;color:var(--text-soft)">${state.page + 1} / ${totalPages}</span>`;
    html += `<button class="btn" ${state.page >= totalPages - 1 ? 'disabled' : ''} data-p="next">下一页</button>`;
    pager.innerHTML = html;
    pager.querySelector('[data-p="prev"]').onclick = () => { if (state.page > 0) { state.page--; loadArticles(); } };
    pager.querySelector('[data-p="next"]').onclick = () => { if (state.page < totalPages - 1) { state.page++; loadArticles(); } };
}

async function loadHot() {
    const box = document.getElementById('hot-list');
    box.innerHTML = '<div class="hot-empty">Loading the leading stories…</div>';
    try {
        const list = await api('/api/hot?limit=10');
        if (!list.length) { box.innerHTML = '<div class="hot-empty">还没有文章上榜。</div>'; return; }
        box.innerHTML = '';
        list.forEach((a, i) => {
            const item = document.createElement('div');
            item.className = 'hot-item';
            item.innerHTML = `
                <span class="hot-rank">${i + 1}</span>
                <span class="hot-title">${escapeHtml(a.title)}</span>
                <span class="hot-count">👍 ${a.likeCount || 0}</span>
            `;
            item.onclick = () => location.href = 'article.html?id=' + a.id;
            box.appendChild(item);
        });
    } catch (e) {
        box.innerHTML = `<div class="hot-empty">${escapeHtml(e.message)}</div>`;
    }
}

/* C 方案：精选河流 —— 主页主文章区，展示全部已发布文章，按发布时间倒序
 * 注意：限制规则「点赞 ≥ 10」已彻底移除 —— 个人/测试库通常没有高赞文章，硬过滤会让首页空白。
 * 状态展示统一用 .fr-status（加载/错误），空态用 .fr-empty，三种情况都有明显视觉差异。 */
async function loadFeatured() {
    const stage = document.getElementById('featured-stage');
    const box = document.getElementById('featured-list');
    const emptyEl = document.getElementById('featured-empty');
    console.log('[rh] loadFeatured() called · stage:', !!stage, '· box:', !!box, '· pop:', !!document.getElementById('rh-popover'));
    if (!box) {
        console.warn('[rh] 必要 DOM 缺失，区块没渲染');
        return;
    }
    box.innerHTML = `<div class='rh-status'>⏳ Loading the river… 正在捞文章</div>`;
    try {
        const data = await api('/api/articles?page=0&size=100');
        console.log('[rh] API 返回 data:', data);
        const all = (data && data.list) || [];
        const picks = all
            .slice()
            .sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt))
            .slice(0, 7);
        console.log('[rh] 排序后 picks 数:', picks.length, '· 前 3:', picks.slice(0, 3).map(a => a.title));

        if (!picks.length) {
            box.innerHTML = '';
            if (emptyEl) emptyEl.style.display = '';
            console.log('[rh] 空态：没有已发布文章');
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        box.innerHTML = '';
        const items = [];
        picks.forEach((a, i) => {
            const link = document.createElement('a');
            link.className = 'rh-title';
            link.href = 'article.html?id=' + a.id;
            link.setAttribute('data-id', a.id);
            link.setAttribute('data-title', a.title || '');
            link.setAttribute('data-summary', a.summary || '');
            link.setAttribute('data-category', a.category || '未分类');
            link.setAttribute('data-author', a.authorName || 'Anonymous');
            link.setAttribute('data-time', fmtTime(a.publishedAt || a.createdAt));
            link.setAttribute('data-likes', String(a.likeCount || 0));
            link.innerHTML = `
                <span class='rh-title-num'>${String(i + 1).padStart(2, '0')}</span>
                <span class='rh-title-text'>${escapeHtml(a.title)}</span>
                <span class='rh-title-tag'>${escapeHtml((a.category || 'UNCLASSIFIED').toUpperCase())}</span>
            `;
            box.appendChild(link);
            items.push(link);
        });
        const pop = document.getElementById('rh-popover');
        const showPop = (link) => {
            if (!pop) return;
            pop.querySelector('.rh-popover-cat').textContent = (link.dataset.category || '未分类').toUpperCase();
            pop.querySelector('.rh-popover-title').textContent = link.dataset.title || '';
            pop.querySelector('.rh-popover-excerpt').textContent = link.dataset.summary || '（这篇文章还没有摘要）';
            pop.querySelector('.rh-popover-author').textContent = 'By ' + link.dataset.author;
            pop.querySelector('.rh-popover-time').textContent = link.dataset.time;
            pop.querySelector('.rh-popover-cta').href = link.getAttribute('href') || '#';
            pop.classList.add('show');
            const r = link.getBoundingClientRect();
            const pw = pop.offsetWidth, ph = pop.offsetHeight;
            let left = r.right + 16;
            if (left + pw > window.innerWidth - 12) left = r.left - pw - 16;
            if (left < 12) left = Math.max(12, (window.innerWidth - pw) / 2);
            let top = r.top + (r.height - ph) / 2;
            if (top < 12) top = 12;
            if (top + ph > window.innerHeight - 12) top = window.innerHeight - ph - 12;
            pop.style.left = Math.round(left) + 'px';
            pop.style.top = Math.round(top) + 'px';
        };
        const hidePop = () => { if (pop) pop.classList.remove('show'); };
        let hideTimer = null;
        items.forEach(link => {
            link.addEventListener('mouseenter', () => { if (hideTimer) clearTimeout(hideTimer); showPop(link); });
            link.addEventListener('focus', () => { if (hideTimer) clearTimeout(hideTimer); showPop(link); });
            link.addEventListener('mouseleave', () => { hideTimer = setTimeout(hidePop, 140); });
        });
        if (pop) {
            pop.addEventListener('mouseenter', () => { if (hideTimer) clearTimeout(hideTimer); });
            pop.addEventListener('mouseleave', () => { hideTimer = setTimeout(hidePop, 140); });
        }
        console.log('[rh] 渲染完成 · 巨字标题', items.length, '篇');
    } catch (e) {
        console.error('[rh] 加载失败:', e.message);
        box.innerHTML = `<div class='rh-status rh-status--error'>精选河流加载失败：${escapeHtml(e.message)}</div>`;
    }
}

/* 报头日期：自动填充今天 */
function fillMastheadDate() {
    const el = document.getElementById('masthead-date');
    if (!el) return;
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    el.textContent = `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// 初始化
setupHeader();
fillMastheadDate();
renderChips();
// loadArticles() 已下线（首页主文章区改为精选河流，老容器 article-list 不再存在），不再调用

// 「我的」页面是个人归档区，不需要公共热点榜：跳过加载 + 加 CSS 类隐藏整块
if (state.mine) {
    document.body.classList.add('hide-hot');
    const subEl = document.querySelector('.section-heading .sub');
    if (subEl && window.MESS && window.MESS.COPY) subEl.textContent = window.MESS.COPY.archiveLabel;
} else {
    loadHot();
    loadFeatured();
}

document.getElementById('refresh-hot').onclick = loadHot;

// 热点榜：关闭 → 收成搜索栏左侧的「热点榜」按钮；点击该按钮 → 重新展开
document.getElementById('hot-close').onclick = () => document.body.classList.add('hot-collapsed');
document.getElementById('hot-toggle').onclick = () => document.body.classList.remove('hot-collapsed');
document.getElementById('search').addEventListener('input', (e) => {
    // 简单防抖
    clearTimeout(window._t);
    window._t = setTimeout(() => {
        state.keyword = e.target.value.trim();
        state.page = 0;
        loadArticles();
    }, 350);
});
