# -*- coding: utf-8 -*-
"""将首页'最新文章'从杂志头条式改为纯文字新闻列表式。同步 src + target。"""
import io, sys
from pathlib import Path

PAIRS = [
    ('src/main/resources/static/css/premium.css', 'target/classes/static/css/premium.css'),
    ('src/main/resources/static/js/index.js', 'target/classes/static/js/index.js'),
]

NEW_CSS = '''.featured-river--main .fr-list {
    display: flex;
    flex-direction: column;
}
.fr-item {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    padding: 20px 10px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid var(--rule);
    border-left: 2px solid transparent;
    transition: background .25s, border-color .25s, padding-left .25s;
}
.fr-item:first-child { padding-top: 6px; }
.fr-item:last-child { border-bottom: none; padding-bottom: 6px; }
.fr-item:hover {
    background: var(--surface-2, rgba(255, 255, 255, .03));
    border-left-color: var(--accent);
    padding-left: 18px;
}
.fr-item-no {
    flex: 0 0 auto;
    width: 30px;
    font-family: var(--serif-display);
    font-size: 19px;
    line-height: 1.5;
    color: var(--text-faded);
    text-align: center;
}
.fr-item-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.fr-item-title {
    font-family: var(--serif-display);
    font-size: clamp(18px, 2vw, 22px);
    font-weight: 500;
    line-height: 1.3;
    color: var(--text);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.fr-item-excerpt {
    font-family: var(--sans);
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-soft);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.fr-item-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--sans);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--text-faded);
    text-transform: uppercase;
}
.fr-item-meta .sep { opacity: .45; }
.fr-item-likes { margin-left: auto; color: var(--text-soft); letter-spacing: .03em; }

'''

OLD_CSS_START = '.featured-river--main .fr-layout {'
OLD_CSS_END = '\n\n/* ==================== 精选河流'

NEW_JS = '''        // 新闻列表式：统一格式，序号 + 标题 + 摘要 + meta，纵向堆叠
        box.className = 'fr-list';
        box.innerHTML = '';
        const shown = picks.slice(0, 8);
        shown.forEach((a, i) => {
            const item = document.createElement('a');
            item.className = 'fr-item';
            item.href = 'article.html?id=' + a.id;
            item.innerHTML = `
                <span class="fr-item-no">${i + 1}</span>
                <span class="fr-item-body">
                    <span class="fr-item-title">${escapeHtml(a.title)}</span>
                    <span class="fr-item-excerpt">${escapeHtml(a.summary || '')}</span>
                    <span class="fr-item-meta">
                        <span>${escapeHtml(a.category || '未分类')}</span>
                        <span class="sep">·</span>
                        <span>By ${escapeHtml(a.authorName || 'Anonymous')}</span>
                        <span class="sep">·</span>
                        <span>${fmtTime(a.publishedAt || a.createdAt)}</span>
                        <span class="fr-item-likes">&#10084; ${a.likeCount || 0}</span>
                    </span>
                </span>
            `;
            box.appendChild(item);
        });
        console.log('[featured-river] 渲染完成 · 新闻列表', shown.length, '篇');'''

OLD_JS_START = "        // 杂志头条式：左大卡(最新一篇) + 右列表(其余最多 5 篇)"
OLD_JS_END = "        console.log('[featured-river] 渲染完成 · 头条 1 + 列表', rest.length, '篇');"

errors = []
for src, tgt in PAIRS:
    sp = Path(src)
    tp = Path(tgt)
    t = sp.read_text(encoding='utf-8')

    if src.endswith('.css'):
        s = t.index(OLD_CSS_START)
        e = t.index(OLD_CSS_END)
        t = t[:s] + NEW_CSS + t[e:]
    else:
        s = t.index(OLD_JS_START)
        e = t.index(OLD_JS_END) + len(OLD_JS_END)
        t = t[:s] + NEW_JS + t[e:]

    sp.write_text(t, encoding='utf-8')
    if tp.exists():
        tp.write_text(t, encoding='utf-8')
    print(f'  [{sp.name}] + [{tp.name}] 已更新')

print('done')
