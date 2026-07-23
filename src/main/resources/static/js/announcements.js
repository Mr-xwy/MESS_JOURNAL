/* announcements.js —— 公告管理页：列表(公开带已读标记) / 发布 / 置顶 / 已读（管理员可写） */
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }

    function init() {
        if (window.setupHeader) setupHeader();
        const me = getUser();
        const isAdmin = me && me.role === 'ADMIN';
        if (!isAdmin) document.getElementById('btn-new').style.display = 'none';
        document.getElementById('btn-new').onclick = function () { openForm(null); };
        document.getElementById('form-cancel').onclick = closeForm;
        document.getElementById('form').onsubmit = onSubmit;
        load();
    }

    async function load() {
        const rows = document.getElementById('rows');
        try {
            const list = await getAnnouncements();
            if (!list || !list.length) {
                rows.innerHTML = '<tr><td colspan="6" class="empty">暂无公告</td></tr>';
                return;
            }
            const me = getUser();
            const isAdmin = me && me.role === 'ADMIN';
            rows.innerHTML = list.map(function (item) {
                const a = item.announcement;
                const read = item.read;
                const ops = isAdmin
                    ? '<button class="link-btn" data-edit="' + a.id + '">编辑</button>' +
                      '<button class="link-btn danger" data-del="' + a.id + '">删除</button>'
                    : (read ? '<span class="pill read">已读</span>'
                            : '<button class="link-btn" data-read="' + a.id + '">标记已读</button>');
                return '<tr>' +
                    '<td>' + a.id + '</td>' +
                    '<td>' + escapeHtml(a.title) + '</td>' +
                    '<td>' + (a.pinned ? '<span class="pill pinned">置顶</span>' : '—') + '</td>' +
                    '<td>' + (read ? '<span class="pill read">已读</span>' : '<span class="pill unread">未读</span>') + '</td>' +
                    '<td>' + fmtTime(a.createdAt) + '</td>' +
                    '<td class="ops">' + ops + '</td></tr>';
            }).join('');
            rows.querySelectorAll('[data-edit]').forEach(function (b) {
                b.onclick = function () { openForm(find(list, b.getAttribute('data-edit'))); };
            });
            rows.querySelectorAll('[data-del]').forEach(function (b) {
                b.onclick = function () { doDelete(b.getAttribute('data-del')); };
            });
            rows.querySelectorAll('[data-read]').forEach(function (b) {
                b.onclick = function () { doRead(b.getAttribute('data-read')); };
            });
        } catch (e) {
            rows.innerHTML = '<tr><td colspan="6" class="empty">加载失败：' + escapeHtml(e.message) + '</td></tr>';
        }
    }

    function find(list, id) {
        const hit = list.find(function (x) { return String(x.announcement.id) === String(id); });
        return hit ? hit.announcement : null;
    }

    function openForm(a) {
        document.getElementById('form-title').textContent = a ? '编辑公告' : '发布公告';
        document.getElementById('f-id').value = a ? a.id : '';
        document.getElementById('f-title').value = a ? a.title : '';
        document.getElementById('f-content').value = a ? a.content : '';
        document.getElementById('f-pinned').checked = a ? !!a.pinned : false;
        document.getElementById('form-mask').style.display = 'flex';
    }
    function closeForm() { document.getElementById('form-mask').style.display = 'none'; }

    async function onSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('f-id').value;
        const payload = {
            title: document.getElementById('f-title').value.trim(),
            content: document.getElementById('f-content').value.trim(),
            pinned: document.getElementById('f-pinned').checked
        };
        if (!payload.title || !payload.content) { showToast('标题和内容不能为空', 'error'); return; }
        try {
            if (id) { await updateAnnouncement(id, payload); showToast('已保存', 'ok'); }
            else { await createAnnouncement(payload); showToast('已发布', 'ok'); }
            closeForm();
            load();
        } catch (err) { showToast(err.message, 'error'); }
    }

    async function doRead(id) {
        try { await markAnnouncementRead(id); showToast('已标记已读', 'ok'); load(); }
        catch (err) { showToast(err.message, 'error'); }
    }

    async function doDelete(id) {
        const ok = await confirmModal({ title: '删除公告', message: '确定删除该公告？', okText: '删除' });
        if (!ok) return;
        try { await deleteAnnouncement(id); showToast('已删除', 'ok'); load(); }
        catch (err) { showToast(err.message, 'error'); }
    }
})();
