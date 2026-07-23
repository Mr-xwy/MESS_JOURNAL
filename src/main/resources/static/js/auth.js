/* auth.js —— 处理登录页与注册页（根据页面上存在的表单按钮自适应） */

setupHeader();

const isRegister = !!document.getElementById('nickname'); // 注册页才有昵称框
const btn = document.getElementById('submit');
const errEl = document.getElementById('err');

btn.onclick = async () => {
    errEl.style.display = 'none';
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) { showError('err', '用户名和密码不能为空'); return; }

    try {
        if (isRegister) {
            const nickname = document.getElementById('nickname').value.trim();
            const email = document.getElementById('email').value.trim();
            await api('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({ username, password, nickname, email })
            });
            alert('注册成功，请登录');
            location.href = 'login.html';
        } else {
            const data = await api('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            setSession(data.token, data.user); // 把 JWT 与用户信息存入 localStorage
            location.href = 'index.html';
        }
    } catch (e) {
        showError('err', e.message);
    }
};

// 回车提交
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btn.click();
});
