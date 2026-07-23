/* editor.js —— 新建 / 编辑文章（学术投稿风格） */

setupHeader();

const editId = new URLSearchParams(location.search).get('id');
document.getElementById('editor-title').innerHTML = editId
    ? '<svg class="icon"><use href="#icon-pen"/></svg> 编辑文章 / Edit Paper'
    : '<svg class="icon"><use href="#icon-pen"/></svg> 投稿 / Write Paper';

// 字数统计
const contentEl = document.getElementById('content');
const wordCountEl = document.getElementById('word-count');
const charNumEl = document.getElementById('char-num');

function updateWordCount() {
    const text = contentEl.value;
    const chars = text.length;
    // 中文字符算 1，英文单词按空格分割
    const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const english = text.replace(/[\u4e00-\u9fa5\s\n\r]/g, '').length;
    // 纯英文单词计数
    const words = text.match(/[a-zA-Z]+/g) || [];
    const enWords = w => w.length > 0 ? `${w.length} 词` : '';

    charNumEl.textContent = `${chars} 字（中文 ${chinese} + 英文 ${english} 字符）`;
    if (chars > 0) wordCountEl.classList.add('visible');
    else wordCountEl.classList.remove('visible');
}
contentEl.addEventListener('input', updateWordCount);

if (editId) {
    (async () => {
        try {
            const data = await api('/api/articles/' + editId);
            const a = data.article;
            document.getElementById('title').value = a.title || '';
            document.getElementById('category').value = a.category || '';
            document.getElementById('summary').value = a.summary || '';
            document.getElementById('content').value = a.content || '';
            updateWordCount(); // 填充后立即更新字数
        } catch (e) {
            showError('err', e.message);
        }
    })();
}

async function save(draft) {
    const errEl = document.getElementById('err');
    errEl.style.display = 'none';
    const payload = {
        title: document.getElementById('title').value.trim(),
        category: document.getElementById('category').value.trim(),
        summary: document.getElementById('summary').value.trim(),
        content: document.getElementById('content').value,
        draft: draft
    };
    if (!payload.title) { showError('err', '标题不能为空'); return; }

    try {
        let result;
        if (editId) {
            result = await api('/api/articles/' + editId, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            result = await api('/api/articles', { method: 'POST', body: JSON.stringify(payload) });
        }
        location.href = 'article.html?id=' + result.id;
    } catch (e) {
        showError('err', e.message);
    }
}

document.getElementById('publish').onclick = () => save(false);
document.getElementById('draft').onclick = () => save(true);

// Ctrl+S 快捷键保存草稿
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        save(true); // 默认存草稿
    }
});
