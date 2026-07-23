# -*- coding: utf-8 -*-
from pathlib import Path

PAIRS = [
    ('src/main/resources/static/css/premium.css', 'target/classes/static/css/premium.css'),
    ('src/main/resources/static/index.html', 'target/classes/static/index.html'),
    ('src/main/resources/static/js/index.js', 'target/classes/static/js/index.js'),
]

NEW_CSS = r'''.featured-river--main .rh-stage {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 40px;
    align-items: stretch;
    min-height: 540px;
    margin-top: 8px;
}
.rh-detail {
    position: sticky;
    top: 24px;
    align-self: start;
    padding: 26px 26px 24px;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r, 16px);
    box-shadow: var(--shadow-soft);
    min-height: 380px;
    display: flex;
    flex-direction: column;
    transition: border-color .3s, box-shadow .3s;
}
.rh-detail.is-active { border-color: var(--accent); box-shadow: var(--shadow-medium); }
.rh-detail-inner { display: flex; flex-direction: column; gap: 14px; height: 100%; }
.rh-detail-cat {
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
}
.rh-detail-title {
    font-family: var(--serif-display);
    font-size: clamp(20px, 2.2vw, 28px);
    font-weight: 500;
    line-height: 1.3;
    color: var(--text);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.rh-detail-excerpt {
    font-family: var(--sans);
    font-size: 13.5px;
    line-height: 1.7;
    color: var(--text-soft);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.rh-detail-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--sans);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--text-faded);
    text-transform: uppercase;
    padding-top: 10px;
}
.rh-detail-meta .sep { opacity: .4; }
.rh-detail-cta {
    display: inline-block;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    text-decoration: none;
    padding: 12px 0 0;
    border-top: 1px solid var(--rule);
    margin-top: 4px;
    transition: padding-left .25s;
}
.rh-detail-cta:hover { padding-left: 6px; }

.rh-titles { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; }
.rh-title {
    display: flex;
    align-items: baseline;
    gap: 18px;
    text-decoration: none;
    color: var(--text-faded);
    padding: 4px 0;
    transition: color .3s cubic-bezier(.2,.7,.2,1), padding-left .35s cubic-bezier(.2,.7,.2,1);
    position: relative;
}
.rh-title-text {
    font-family: var(--sans, system-ui);
    font-size: clamp(34px, 6.4vw, 72px);
    font-weight: 900;
    line-height: 1.02;
    letter-spacing: -0.015em;
    text-transform: uppercase;
    transition: transform .35s cubic-bezier(.2,.7,.2,1);
    flex: 0 1 auto;
    min-width: 0;
}
.rh-title-tag {
    font-family: var(--sans);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-faded);
    opacity: 0;
    transform: translateX(-8px);
    transition: opacity .3s, transform .35s, color .3s;
    white-space: nowrap;
    align-self: center;
    margin-left: auto;
}
.rh-title-num {
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 12px;
    color: var(--text-faded);
    align-self: center;
    transition: color .3s, opacity .3s;
    opacity: .55;
    flex: 0 0 auto;
}
.rh-title:hover, .rh-title.is-active { color: var(--text); padding-left: 14px; }
.rh-title:hover .rh-title-tag, .rh-title.is-active .rh-title-tag {
    opacity: 1; transform: translateX(0); color: var(--accent);
}
.rh-title:hover .rh-title-text, .rh-title.is-active .rh-title-text { transform: translateX(6px); }
.rh-title:hover .rh-title-num, .rh-title.is-active .rh-title-num { color: var(--accent); opacity: 1; }

@media (max-width: 860px) {
    .featured-river--main .rh-stage { grid-template-columns: 1fr; gap: 24px; min-height: 0; }
    .rh-detail { position: relative; top: 0; min-height: 0; }
    .rh-title-text { font-size: clamp(28px, 8vw, 44px); }
}

'''

NEW_HTML = r'''<div class='rh-stage' id='featured-stage'>
                <aside class='rh-detail' id='rh-detail' aria-live='polite'>
                    <div class='rh-detail-inner'>
                        <span class='rh-detail-cat'>— HOVER A TITLE —</span>
                        <h3 class='rh-detail-title'>悬停任意标题查看详情</h3>
                        <p class='rh-detail-excerpt'>从右侧列表中选中一篇文章，<br>这里会显示它的摘要与作者信息。</p>
                        <div class='rh-detail-meta'>
                            <span class='rh-detail-author'>—</span>
                            <span class='sep'>·</span>
                            <span class='rh-detail-time'>—</span>
                        </div>
                        <a class='rh-detail-cta' href='#' style='display:none;'>阅读全文 →</a>
                    </div>
                </aside>
                <div class='rh-titles' id='featured-list' role='list' aria-label='最新文章 · 巨字垂直堆叠'>
                    <!-- 兜底占位符：JS 跑起来会立刻覆盖这里 -->
                    <div class='rh-status'>⏳ Loading the river…（如果一直停留这一行，说明 JS 没跑 / 报错，按 F12 看 Console）</div>
                </div>
            </div>'''

HTML_OLD = '''<div class="fr-track" id="featured-list" tabindex="0" role="region" aria-label="最新文章 · 杂志头条式">
                <!-- 兜底占位符：JS 跑起来会立刻覆盖这里 -->
                <div class="fr-status">⏳ Loading the river…（如果一直停留这一行，说明 JS 没跑 / 报错，按 F12 看 Console）</div>
            </div>'''

NEW_JS = r'''async function loadFeatured() {
    const stage = document.getElementById('featured-stage');
    const box = document.getElementById('featured-list');
    const detail = document.getElementById('rh-detail');
    const emptyEl = document.getElementById('featured-empty');
    console.log('[rh] loadFeatured() called · stage:', !!stage, '· box:', !!box, '· detail:', !!detail);
    if (!box || !detail) {
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
        const setDetail = (a) => {
            detail.classList.add('is-active');
            detail.querySelector('.rh-detail-cat').textContent = (a.dataset.category || '未分类').toUpperCase();
            detail.querySelector('.rh-detail-title').textContent = a.dataset.title || '';
            detail.querySelector('.rh-detail-excerpt').textContent = a.dataset.summary || '（这篇文章还没有摘要）';
            detail.querySelector('.rh-detail-author').textContent = 'By ' + a.dataset.author;
            detail.querySelector('.rh-detail-time').textContent = a.dataset.time;
            const cta = detail.querySelector('.rh-detail-cta');
            cta.href = a.getAttribute('href') || '#';
            cta.style.display = '';
        };
        const clearActive = () => items.forEach(it => it.classList.remove('is-active'));
        items.forEach(link => {
            link.addEventListener('mouseenter', () => { clearActive(); link.classList.add('is-active'); setDetail(link); });
            link.addEventListener('focus', () => { clearActive(); link.classList.add('is-active'); setDetail(link); });
        });
        if (items[0]) { items[0].classList.add('is-active'); setDetail(items[0]); }
        if (stage) {
            stage.addEventListener('mouseleave', () => {
                clearActive();
                if (items[0]) { items[0].classList.add('is-active'); setDetail(items[0]); }
            });
        }
        console.log('[rh] 渲染完成 · 巨字标题', items.length, '篇');
    } catch (e) {
        console.error('[rh] 加载失败:', e.message);
        box.innerHTML = `<div class='rh-status rh-status--error'>精选河流加载失败：${escapeHtml(e.message)}</div>`;
    }
}
'''

CSS_OLD_START = '.featured-river--main .fr-list {'
CSS_END = '\n\n/* ==================== 精选河流'
JS_OLD_START = 'async function loadFeatured() {'
JS_END = '\n/* 报头日期'

for src, tgt in PAIRS:
    sp = Path(src)
    tp = Path(tgt)
    t = sp.read_text(encoding='utf-8')

    if src.endswith('.css'):
        if CSS_OLD_START not in t:
            raise SystemExit(f'[{sp.name}] 未找到 CSS_OLD_START')
        if CSS_END not in t:
            raise SystemExit(f'[{sp.name}] 未找到 CSS_END')
        s = t.index(CSS_OLD_START)
        e = t.index(CSS_END)
        t = t[:s] + NEW_CSS + t[e:]
    elif src.endswith('.html'):
        if HTML_OLD not in t:
            raise SystemExit(f'[{sp.name}] HTML_OLD 未找到')
        t = t.replace(HTML_OLD, NEW_HTML, 1)
    else:
        if JS_OLD_START not in t:
            raise SystemExit(f'[{sp.name}] JS_OLD_START 未找到')
        if JS_END not in t:
            raise SystemExit(f'[{sp.name}] JS_END 未找到')
        s = t.index(JS_OLD_START)
        e = t.index(JS_END)
        t = t[:s] + NEW_JS + t[e:]

    sp.write_text(t, encoding='utf-8')
    tp.write_text(t, encoding='utf-8')
    print(f'  [{sp.name}] + [{tp.name}] 已更新')

print('done')
