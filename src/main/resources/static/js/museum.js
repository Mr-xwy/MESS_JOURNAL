/* museum.js —— 线上博物馆：画廊、详情、提交（角色感知的审核流） */

// 文物图片由用户上传 base64，不再使用预设 SVG


let state = { page: 0, size: 8, mine: false };
let currentRelic = null;

function fillMastheadDate() {
    const el = document.getElementById('masthead-date');
    if (!el) return;
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    el.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

async function loadRelics() {
    const grid = document.getElementById('relic-grid');
    grid.innerHTML = '<div class="empty">展柜整理中…</div>';
    try {
        if (state.mine) {
            if (!isLoggedIn()) {
                grid.innerHTML = '<div class="empty" style="text-align:center;padding:40px 0;">请先<a href="login.html" class="btn" style="margin-left:8px;">登录</a>后查看你的提交。</div>';
                return;
            }
            const list = await getMyRelics();
            renderGrid(list);
            document.getElementById('relic-pager').innerHTML = '';
        } else {
            const data = await getRelics(state.page, state.size);
            renderGrid(data.list || []);
            renderPager(data);
        }
    } catch (e) {
        grid.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>';
    }
}

function renderGrid(list) {
    const grid = document.getElementById('relic-grid');
    if (!list.length) {
        grid.innerHTML = '<div class="empty">馆内暂无文物，敬请期待。</div>';
        return;
    }
    grid.innerHTML = '';
    list.forEach((r, i) => {
        const card = document.createElement('div');
        card.className = 'relic-card';
        const catNo = String(i + 1 + state.page * state.size).padStart(3, '0');
        const img = isImageSrc(r.image)
            ? '<div class="relic-frame"><img class="relic-img" src="' + r.image + '" alt="' + escapeHtml(r.title) + '"><span class="relic-catno">NO. ' + catNo + '</span></div>'
            : '<div class="relic-frame relic-frame--empty"><div class="relic-img relic-img--empty">无图</div><span class="relic-catno">NO. ' + catNo + '</span></div>';
        const statusTag = r.status !== 'PUBLISHED'
            ? '<span class="relic-status relic-status--' + r.status.toLowerCase() + '">' + (r.status === 'PENDING' ? '待审核' : '已驳回') + '</span>'
            : '';
        const dynasty = r.dynasty ? '<span class="relic-dynasty">' + escapeHtml(r.dynasty) + '</span>' : '';
        const material = r.material ? '<span class="relic-material">' + escapeHtml(r.material) + '</span>' : '';
        const meta = dynasty && material
            ? dynasty + '<span class="relic-meta-sep">·</span>' + material
            : (dynasty || material);
        card.innerHTML =
            img +
            '<div class="relic-body">' +
                '<h3>' + escapeHtml(r.title) + '</h3>' +
                '<div class="relic-meta">' + (meta || '<span class="relic-meta-empty">年代 / 材质不详</span>') + '</div>' +
                '<div class="relic-loc">藏地：' + escapeHtml(r.location || '未知') + '</div>' +
                statusTag +
            '</div>';
        card.onclick = () => openDetail(r.id);
        grid.appendChild(card);
    });
}

function renderPager(data) {
    const pager = document.getElementById('relic-pager');
    const totalPages = data.totalPages || 1;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    let html = '<button class="btn" ' + (state.page === 0 ? 'disabled' : '') + ' data-p="prev">上一页</button>';
    html += '<span class="pager-info">' + (state.page + 1) + ' / ' + totalPages + '</span>';
    html += '<button class="btn" ' + (state.page >= totalPages - 1 ? 'disabled' : '') + ' data-p="next">下一页</button>';
    pager.innerHTML = html;
    pager.querySelector('[data-p="prev"]').onclick = () => { if (state.page > 0) { state.page--; loadRelics(); } };
    pager.querySelector('[data-p="next"]').onclick = () => { if (state.page < totalPages - 1) { state.page++; loadRelics(); } };
}

async function openDetail(id) {
    const modal = document.getElementById('detail-modal');
    const box = document.getElementById('detail-content');
    box.innerHTML = '<div class="empty">展签调取中…</div>';
    modal.hidden = false;
    try {
        const r = await getRelic(id);
        const img = isImageSrc(r.image)
            ? '<div class="relic-frame"><img class="relic-img" src="' + r.image + '" alt="' + escapeHtml(r.title) + '"></div>'
            : '<div class="relic-frame relic-frame--empty"><div class="relic-img relic-img--empty">无图</div></div>';
        const statusTag = r.status !== 'PUBLISHED'
            ? '<span class="relic-status relic-status--' + r.status.toLowerCase() + '">' + (r.status === 'PENDING' ? '待审核' : '已驳回') + '</span>'
            : '';
        box.innerHTML =
            '<div class="relic-detail">' +
                '<div class="relic-detail-plate">' +
                    img +
                    '<div class="relic-plate-caption">馆藏编号 ' + r.id + ' · ' + escapeHtml(r.title) + '</div>' +
                '</div>' +
                '<div class="relic-detail-panel">' +
                    '<h2>' + escapeHtml(r.title) + ' ' + statusTag + '</h2>' +
                    '<div class="relic-detail-meta">' +
                        row('年代', r.dynasty) + row('材质', r.material) +
                        row('出土地', r.origin) + row('收藏地', r.location) +
                        row('提交人', r.authorName) +
                    '</div>' +
                    '<div class="relic-detail-desc">' +
                        '<div class="relic-desc-label">Curator\'s Note</div>' +
                        '<p>' + escapeHtml(r.description || '（暂无介绍）') + '</p>' +
                    '</div>' +
                    (r.reviewNote ? '<div class="relic-detail-review"><div class="relic-desc-label" style="color:var(--accent)">Review Note</div>' + escapeHtml(r.reviewNote) + '</div>' : '') +
                    curatorBlock(r) +
                '</div>' +
            '</div>';
        currentRelic = r;
        initCurator(r);
    } catch (e) {
        box.innerHTML = '<div class="empty">' + escapeHtml(e.message) + '</div>';
    }
}

function curatorBlock(r) {
    return '<div class="curator" id="curator">' +
        '<button class="curator-trigger" id="curator-trigger" type="button">' +
            '<svg class="icon"><use href="#icon-brain"/></svg>' +
            '<span>问策展人</span>' +
            '<svg class="icon curator-chevron"><use href="#icon-chevron"/></svg>' +
        '</button>' +
        '<div class="curator-panel" id="curator-panel" hidden>' +
            '<div class="curator-msgs" id="curator-msgs">' +
                '<div class="curator-hint">向策展人提问这件文物的工艺、历史或背后的故事。</div>' +
            '</div>' +
            '<div class="curator-input">' +
                '<input id="curator-q" class="curator-q" placeholder="例如：这件文物的工艺有什么特别？" />' +
                '<button class="btn" id="curator-send">提问</button>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function initCurator(r) {
    const trigger = document.getElementById('curator-trigger');
    const panel = document.getElementById('curator-panel');
    if (!trigger || !panel) return;
    trigger.onclick = () => { panel.hidden = !panel.hidden; trigger.setAttribute('aria-expanded', String(!panel.hidden)); };
    const sendBtn = document.getElementById('curator-send');
    const input = document.getElementById('curator-q');
    const msgs = document.getElementById('curator-msgs');
    if (!sendBtn || !input || !msgs) return;

    async function ask() {
        const q = input.value.trim();
        if (!q) return;
        if (!isLoggedIn()) {
            msgs.insertAdjacentHTML('beforeend',
                '<div class="curator-msg curator-ai">请先<a href="login.html">登录</a>后再向策展人提问。</div>');
            msgs.scrollTop = msgs.scrollHeight;
            return;
        }
        msgs.insertAdjacentHTML('beforeend', '<div class="curator-msg curator-user">' + escapeHtml(q) + '</div>');
        input.value = '';
        const thinking = document.createElement('div');
        thinking.className = 'curator-msg curator-ai thinking';
        thinking.textContent = '策展人正在查阅资料…';
        msgs.appendChild(thinking);
        msgs.scrollTop = msgs.scrollHeight;

        const prompt = '你是学术期刊《M.E.S.S Journal》线上博物馆的资深策展人。请仅基于下面提供的这件文物的资料，用专业而通俗的中文回答读者的问题；若资料不足以回答，请如实说明，不要编造。请忽略此前的任何对话记录，仅依据本次提供的资料作答。\n【文物资料】\n名称：' + (r.title || '') + '\n年代：' + (r.dynasty || '不详') + '\n材质：' + (r.material || '不详') + '\n出土地：' + (r.origin || '不详') + '\n收藏地：' + (r.location || '不详') + '\n馆藏编号：' + (r.id || '') + '\n简介：' + (r.description || '（暂无）') + '\n【读者提问】\n' + q;

        try {
            const ans = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ question: prompt }) });
            thinking.classList.remove('thinking');
            thinking.textContent = ans;
        } catch (e) {
            thinking.classList.remove('thinking');
            thinking.textContent = (e && e.message ? e.message : '提问失败，请稍后再试');
        }
        msgs.scrollTop = msgs.scrollHeight;
    }

    sendBtn.onclick = ask;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ask(); } });
}

function row(k, v) {
    if (!v) return '';
    return '<div class="rd-row"><span class="rd-k">' + escapeHtml(k) + '</span><span class="rd-v">' + escapeHtml(v) + '</span></div>';
}

function openSubmit() {
    if (!isLoggedIn()) { location.href = 'login.html'; return; }
    const me = getUser();
    const sub = document.getElementById('submit-sub');
    if (me && (me.role === 'ADMIN' || me.role === 'MODERATOR')) {
        sub.textContent = '管理员发布：提交后将直接上线展示。';
    } else {
        sub.textContent = '普通用户提交：将由管理员审核通过后上线。';
    }
    document.getElementById('relic-error').style.display = 'none';
    document.getElementById('relic-form').reset();
    showRelicPreview('');
    document.getElementById('submit-modal').hidden = false;
}

async function submitForm(e) {
    e.preventDefault();
    const f = e.target;
    const data = {
        title: f.title.value.trim(),
        dynasty: f.dynasty.value.trim(),
        material: f.material.value.trim(),
        origin: f.origin.value.trim(),
        location: f.location.value.trim(),
        description: f.description.value.trim(),
        image: document.getElementById('image').value,
        submitterNote: f.submitterNote.value.trim()
    };
    if (!data.title) { showErr('请填写文物名称'); return; }
    try {
        await createRelic(data);
        const me = getUser();
        const msg = (me && (me.role === 'ADMIN' || me.role === 'MODERATOR'))
            ? '已发布上线。' : '已提交，等待管理员审核。';
        closeSubmit();
        state.mine = !(me && (me.role === 'ADMIN' || me.role === 'MODERATOR'));
        document.getElementById('mine-btn').style.display = isLoggedIn() ? '' : 'none';
        loadRelics();
        alert(msg);
    } catch (err) {
        showErr(err.message);
    }
}

function showErr(m) {
    const el = document.getElementById('relic-error');
    el.textContent = m; el.style.display = 'block';
}
function closeSubmit() { document.getElementById('submit-modal').hidden = true; }

/* ---------- 初始化 ---------- */
setupHeader();
fillMastheadDate();
loadRelics();

const me0 = getUser();
document.getElementById('mine-btn').style.display = isLoggedIn() ? '' : 'none';

document.getElementById('submit-btn').onclick = openSubmit;
document.getElementById('submit-cancel').onclick = closeSubmit;
document.getElementById('relic-form').addEventListener('submit', submitForm);
document.getElementById('detail-close').onclick = () => document.getElementById('detail-modal').hidden = true;
document.getElementById('submit-close').onclick = closeSubmit;
document.getElementById('detail-modal').addEventListener('click', e => { if (e.target.id === 'detail-modal') e.currentTarget.hidden = true; });
document.getElementById('submit-modal').addEventListener('click', e => { if (e.target.id === 'submit-modal') closeSubmit(); });
document.getElementById('mine-btn').onclick = () => {
    state.mine = !state.mine;
    document.getElementById('mine-btn').textContent = state.mine ? '返回馆藏' : '我的提交';
    document.getElementById('mine-btn').classList.toggle('primary', state.mine);
    loadRelics();
};

// 填充示意插图下拉
// 文物图片：上传 -> 压缩为 base64 -> 存入隐藏字段 #image
document.getElementById('relicPick').onclick = () => document.getElementById('relicImage').click();
// 文物图片：交互式 4:3 裁剪（可拖动选择保留区域）800x600 + JPEG 压缩
document.getElementById('relicImage').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
        const r = await ImageUtils.crop(file, {
            aspect: 4/3, maxSize: 800, quality: 0.85, maxBytes: 2_500_000
        });
        if (!r) return;
        document.getElementById('image').value = r.dataUrl;
        showRelicPreview(r.dataUrl);
        if (window.showToast) showToast('图片已处理：' + r.width + 'x' + r.height, 'success');
    } catch (err) {
        if (window.showToast) showToast(err.message, 'error'); else alert(err.message);
    } finally {
        e.target.value = '';
    }
});
document.getElementById('relicClear').onclick = () => {
    document.getElementById('image').value = '';
    document.getElementById('relicImage').value = '';
    showRelicPreview('');
};
function showRelicPreview(src) {
    const prev = document.getElementById('relicPreview');
    const ph = document.getElementById('relicPlaceholder');
    const clearBtn = document.getElementById('relicClear');
    if (isImageSrc(src)) {
        prev.src = src; prev.hidden = false; ph.hidden = true; clearBtn.hidden = false;
    } else {
        prev.hidden = true; ph.hidden = false; clearBtn.hidden = true;
    }
}
