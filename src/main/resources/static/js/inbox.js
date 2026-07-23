/* inbox.js —— 审核信息箱：管理员/审核员处理待审文物（通过 / 驳回）
 * 依赖：api.js（getInbox/reviewRelic）、common.js（escapeHtml/fmtTime/setupHeader）
 */

function fillMastheadDate() {
    const el = document.getElementById('masthead-date');
    if (!el) return;
    const d = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    el.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function row(k, v) {
    if (!v) return '';
    return '<div class="rd-row"><span class="rd-k">' + escapeHtml(k) + '</span><span class="rd-v">' + escapeHtml(v) + '</span></div>';
}

let currentTab = 'relic';

/* ---------- 待审文物 ---------- */
function renderInbox(list) {
    const box = document.getElementById('inbox-list');
    if (!list.length) {
        box.innerHTML = '<div class="empty">📭 暂无待审文物，队列为空。</div>';
        return;
    }
    box.innerHTML = '';
    list.forEach(r => {
        const card = document.createElement('div');
        card.className = 'inbox-card';
        card.innerHTML =
            '<div class="inbox-card-head">' +
                '<h3>' + escapeHtml(r.title) + '</h3>' +
                '<span class="inbox-meta">提交人 ' + escapeHtml(r.authorName || '—') + ' · ' + fmtTime(r.createdAt) + '</span>' +
            '</div>' +
            '<div class="inbox-card-body">' +
                row('年代', r.dynasty) + row('材质', r.material) +
                row('出土地', r.origin) + row('收藏地', r.location) +
                (r.description ? '<p class="relic-detail-desc">' + escapeHtml(r.description) + '</p>' : '') +
            '</div>' +
            (r.submitterNote ? '<div class="inbox-note">提交留言：' + escapeHtml(r.submitterNote) + '</div>' : '') +
            '<div class="inbox-actions">' +
                '<button class="btn primary" data-act="approve" data-id="' + r.id + '">通过并上线</button>' +
                '<button class="btn danger" data-act="reject" data-id="' + r.id + '">驳回</button>' +
            '</div>' +
            '<div class="inbox-review-note" id="note-' + r.id + '" hidden>' +
                '<textarea class="textarea" id="note-input-' + r.id + '" placeholder="驳回意见（可选，将回传给提交人）"></textarea>' +
                '<div class="editor-actions">' +
                    '<button class="btn danger" data-act="reject-confirm" data-id="' + r.id + '">确认驳回</button>' +
                    '<button class="link-btn" data-act="reject-cancel" data-id="' + r.id + '">取消</button>' +
                '</div>' +
            '</div>';
        box.appendChild(card);
    });
    box.querySelectorAll('[data-act]').forEach(btn => {
        btn.onclick = () => handleInbox(btn.dataset.act, btn.dataset.id);
    });
}

/* ---------- 统一调度 ---------- */
async function handleInbox(act, id) {
    if (act === 'reject') { document.getElementById('note-' + id).hidden = false; return; }
    if (act === 'reject-cancel') { document.getElementById('note-' + id).hidden = true; return; }

    if (act === 'approve') {
        if (!confirm('确认通过该文物并上线展示？')) return;
        await doReview(id, 'APPROVE', '');
    }
    if (act === 'reject-confirm') {
        const note = document.getElementById('note-input-' + id).value.trim();
        await doReview(id, 'REJECT', note);
    }
}

async function doReview(id, action, note) {
    try {
        await reviewRelic(id, action, note);
        loadCurrent();
    } catch (e) {
        alert(e.message || '操作失败');
    }
}

async function loadCurrent() {
    await loadRelicInbox();
}

async function loadRelicInbox() {
    const box = document.getElementById('inbox-list');
    box.innerHTML = '<div class="empty">加载中…</div>';
    try {
        const list = await getInbox();
        renderInbox(list || []);
    } catch (e) {
        box.innerHTML = '<div class="empty">' + escapeHtml(e.message || '加载失败') + '</div>';
    }
}

/* ---------------- 初始化 ---------------- */
setupHeader();
fillMastheadDate();

// 权限护栏：信息箱仅管理员 / 审核员可见
const me = getUser();
const allowed = me && (me.role === 'ADMIN' || me.role === 'MODERATOR');
if (!allowed) {
    document.getElementById('inbox-list').innerHTML =
        '<div class="empty">⛔ 无权限访问审核信息箱（仅管理员 / 审核员可见）。</div>';
} else {
    document.querySelectorAll('.inbox-tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.inbox-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            loadCurrent();
        };
    });
    loadCurrent();
}
