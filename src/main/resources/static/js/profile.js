/* profile.js —— 查看 / 修改当前用户信息 */

setupHeader();

const errEl = document.getElementById('err');

// 进入即拉取当前用户信息并预填
(async () => {
    try {
        const u = await api('/api/user/info');
        document.getElementById('username').value = u.username || '';
        document.getElementById('nickname').value = u.nickname || '';
        document.getElementById('email').value = u.email || '';
        document.getElementById('avatar').value = u.avatar || '';
        showAvatarPreview(u.avatar);
        // 同步顶栏昵称（若已登录）
        const me = getUser();
        if (me) { me.nickname = u.nickname; localStorage.setItem('blog_user', JSON.stringify(me)); }
    } catch (e) {
        showError('err', e.message);
    }
})();

function showAvatarPreview(src) {
    const prev = document.getElementById('avatarPreview');
    const ph = document.getElementById('avatarPlaceholder');
    const clearBtn = document.getElementById('avatarClear');
    if (isImageSrc(src)) {
        prev.src = src; prev.hidden = false; ph.hidden = true; clearBtn.hidden = false;
    } else {
        prev.hidden = true; ph.hidden = false; clearBtn.hidden = true;
        document.getElementById('avatar').value = '';
    }
}
document.getElementById('avatarPick').onclick = () => document.getElementById('avatarFile').click();
// 头像：交互式正方裁剪（可拖动选择区域，圆形取景，类似微信头像上传）256x256 + JPEG 压缩
document.getElementById('avatarFile').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
        const r = await ImageUtils.crop(file, {
            aspect: 1, maxSize: 256, quality: 0.85, maxBytes: 200_000, round: true
        });
        if (!r) return;
        document.getElementById('avatar').value = r.dataUrl;
        showAvatarPreview(r.dataUrl);
        if (window.showToast) showToast('头像已处理：' + r.width + 'x' + r.height, 'success');
    } catch (err) {
        showError('err', err.message);
    } finally {
        e.target.value = '';
    }
});
document.getElementById('avatarClear').onclick = () => {
    document.getElementById('avatar').value = '';
    document.getElementById('avatarFile').value = '';
    showAvatarPreview('');
};
document.getElementById('save').onclick = async () => {
    errEl.style.display = 'none';
    const payload = {
        nickname: document.getElementById('nickname').value.trim(),
        email: document.getElementById('email').value.trim(),
        avatar: document.getElementById('avatar').value.trim(),
        oldPassword: document.getElementById('oldPassword').value,
        newPassword: document.getElementById('newPassword').value
    };
    // 没填密码就不传密码字段
    if (!payload.oldPassword && !payload.newPassword) {
        delete payload.oldPassword;
        delete payload.newPassword;
    }
    try {
        const u = await api('/api/user/info', { method: 'PUT', body: JSON.stringify(payload) });
        // 更新本地缓存
        const me = getUser() || {};
        me.nickname = u.nickname; me.email = u.email; me.avatar = u.avatar;
        localStorage.setItem('blog_user', JSON.stringify(me));
        alert('资料已更新');
        location.href = 'index.html';
    } catch (e) {
        showError('err', e.message);
    }
};
