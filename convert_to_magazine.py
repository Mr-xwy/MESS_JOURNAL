#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最新文章区块：从"横向时间河流"改为"杂志头条式"（左大卡 + 右列表）。
- premium.css: 413-534 行（.fr-track 整套 + 窄屏 @media）整体替换为新布局
- premium.css: 删 .featured-river--main .fr-track { min-height } 改注释
- index.js: loadFeatured 渲染逻辑改为 headline + list
- index.html: aria-label 改文案
- 升级 premium.css ?v=9 -> ?v=10, index.js ?v=51 -> ?v=52
"""
import sys
from pathlib import Path

BASE = Path(r'D:\AI生成\blog-springboot')
CSS_FILES = [BASE / 'src/main/resources/static/css/premium.css',
             BASE / 'target/classes/static/css/premium.css']
HTML_FILES = [BASE / 'src/main/resources/static/index.html',
              BASE / 'target/classes/static/index.html']
JS_FILES = [BASE / 'src/main/resources/static/js/index.js',
            BASE / 'target/classes/static/js/index.js']

# ===== 新布局 CSS（替换 413-534） =====
NEW_LAYOUT = '''/* ==================== 最新文章 · 杂志头条式（左大卡 + 右列表） ==================== */
.featured-river--main .fr-layout {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 28px;
    align-items: stretch;
}
/* ---- 左侧：头条大卡 ---- */
.fr-headline {
    display: flex;
    flex-direction: column;
    text-decoration: none;
    color: inherit;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r, 16px);
    overflow: hidden;
    box-shadow: var(--shadow-soft);
    transition: transform .4s cubic-bezier(.2,.7,.2,1), box-shadow .4s, border-color .4s;
}
.fr-headline:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-medium);
    border-color: var(--rule-gold, var(--accent));
}
.fr-headline-cover {
    flex: 0 0 auto;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif-display);
    font-size: 76px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 55%, #14142a) 100%);
    letter-spacing: 0.04em;
}
.fr-headline-body {
    flex: 1 1 auto;
    padding: 24px 26px 26px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.fr-cat {
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
}
.fr-headline-title {
    font-family: var(--serif-display);
    font-size: clamp(24px, 2.6vw, 32px);
    font-weight: 500;
    line-height: 1.25;
    color: var(--text);
    margin: 0;
}
.fr-headline-excerpt {
    font-family: var(--sans);
    font-size: 14px;
    line-height: 1.65;
    color: var(--text-soft);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.fr-headline-meta {
    margin-top: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 6px;
}
.fr-byline {
    font-family: var(--sans);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-faded);
}
.fr-likes {
    font-family: var(--sans);
    font-size: 13px;
    letter-spacing: 0.04em;
    color: var(--text-soft);
}
/* ---- 右侧：列表 ---- */
.fr-list {
    display: flex;
    flex-direction: column;
}
.fr-list-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 6px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid var(--rule);
    transition: background .25s, padding-left .25s, border-color .25s;
}
.fr-list-item:first-child { padding-top: 2px; }
.fr-list-item:last-child { border-bottom: none; padding-bottom: 2px; }
.fr-list-item:hover {
    background: var(--surface-2, rgba(255, 255, 255, .03));
    padding-left: 12px;
    border-color: var(--rule-gold, var(--accent));
}
.fr-list-index {
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--surface-2, rgba(255, 255, 255, .06));
    border: 1px solid var(--rule);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 13px;
    color: var(--text-faded);
}
.fr-list-body {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.fr-list-title {
    font-family: var(--serif-display);
    font-size: 16px;
    font-weight: 500;
    line-height: 1.35;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.fr-list-meta {
    font-family: var(--sans);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--text-faded);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.fr-list-likes {
    flex: 0 0 auto;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--text-soft);
}
/* 窄屏：上下堆叠 */
@media (max-width: 860px) {
    .featured-river--main .fr-layout {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}'''


def patch_css(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    lines = text.split('\n')
    # 413 行 = index 412, 534 行 = index 533 (inclusive)
    old_block = '\n'.join(lines[412:534])
    if not old_block.strip().startswith('.fr-track {'):
        raise SystemExit(f'[{path.name}] 413 行不是 .fr-track，实际: {lines[412][:40]!r}')
    if not old_block.strip().endswith('}'):
        raise SystemExit(f'[{path.name}] 534 行不是 }} 结束')
    new_text = '\n'.join(lines[:412]) + NEW_LAYOUT + '\n' + '\n'.join(lines[534:])
    # 删 .featured-river--main .fr-track { min-height: 220px; }
    new_text = new_text.replace(
        '.featured-river--main .fr-track { min-height: 220px; }',
        '/* .fr-track 已弃用，fr-layout 用 grid 自动高度 */')
    op = new_text.count('{'); cl = new_text.count('}')
    if op != cl:
        raise SystemExit(f'[{path.name}] 括号不平衡: {{ {op} vs }} {cl}')
    path.write_text(new_text, encoding='utf-8')
    print(f'  [{path.name}] 413-534 整块替换为杂志头条式 · {op} 对括号')


# ===== JS 渲染逻辑 =====
OLD_JS = """        box.innerHTML = '';
        picks.forEach((a, i) => {
            const node = document.createElement('a');
            node.className = 'fr-node' + (i % 2 === 0 ? ' fr-node--up' : ' fr-node--down');
            node.href = 'article.html?id=' + a.id;
            // 顺序：date(顶) → fr-card(主体，dot 在 fr-card 内部顶部作为"图钉")。
            // dot 锁 fr-card 顶部中心（absolute top:0 + translate -50% -50%），凸出 6.5px。
            node.innerHTML = `
                <span class="fr-date">${fmtTime(a.publishedAt || a.createdAt)}</span>
                <span class="fr-card">
                    <span class="fr-dot"></span>
                    <span class="fr-cat">${escapeHtml(a.category || '未分类')}</span>
                    <span class="fr-title">${escapeHtml(a.title)}</span>
                    <span class="fr-byline">By ${escapeHtml(a.authorName || 'Anonymous')} · ${fmtTime(a.publishedAt || a.createdAt)}</span>
                    <span class="fr-likes">&#10084; ${a.likeCount || 0}</span>
                </span>
            `;
            box.appendChild(node);
        });
        console.log('[featured-river] 渲染完成 · 节点数:', box.children.length, '· 滚动控制: 原生横向滚动条');"""

NEW_JS = """        // 杂志头条式：左大卡(最新一篇) + 右列表(其余最多 5 篇)
        box.className = 'fr-layout';
        box.innerHTML = '';
        if (picks.length >= 1) {
            const h = picks[0];
            const coverChar = (h.category || '★').trim().slice(0, 1).toUpperCase();
            const headline = document.createElement('a');
            headline.className = 'fr-headline';
            headline.href = 'article.html?id=' + h.id;
            headline.innerHTML = `
                <div class="fr-headline-cover">${escapeHtml(coverChar)}</div>
                <div class="fr-headline-body">
                    <span class="fr-cat">${escapeHtml(h.category || '未分类')}</span>
                    <h3 class="fr-headline-title">${escapeHtml(h.title)}</h3>
                    <p class="fr-headline-excerpt">${escapeHtml(h.summary || h.title)}</p>
                    <div class="fr-headline-meta">
                        <span class="fr-byline">By ${escapeHtml(h.authorName || 'Anonymous')} · ${fmtTime(h.publishedAt || h.createdAt)}</span>
                        <span class="fr-likes">&#10084; ${h.likeCount || 0}</span>
                    </div>
                </div>
            `;
            box.appendChild(headline);
        }
        const rest = picks.slice(1, 6);
        if (rest.length) {
            const list = document.createElement('div');
            list.className = 'fr-list';
            rest.forEach((a, i) => {
                const item = document.createElement('a');
                item.className = 'fr-list-item';
                item.href = 'article.html?id=' + a.id;
                item.innerHTML = `
                    <span class="fr-list-index">${i + 2}</span>
                    <div class="fr-list-body">
                        <span class="fr-list-title">${escapeHtml(a.title)}</span>
                        <span class="fr-list-meta">${escapeHtml(a.category || '未分类')} · By ${escapeHtml(a.authorName || 'Anonymous')}</span>
                    </div>
                    <span class="fr-list-likes">&#10084; ${a.likeCount || 0}</span>
                `;
                list.appendChild(item);
            });
            box.appendChild(list);
        }
        console.log('[featured-river] 渲染完成 · 头条 1 + 列表', rest.length, '篇');"""


def patch_js(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text.count(OLD_JS)
    if n != 1: raise SystemExit(f'[{path.name}] JS 渲染块出现 {n} 次')
    text = text.replace(OLD_JS, NEW_JS, 1)
    path.write_text(text, encoding='utf-8')
    print(f'  [{path.name}] 渲染逻辑改为 headline + list')


def patch_html(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    text = text.replace('aria-label="最新文章 · 自动循环滚动"',
                        'aria-label="最新文章 · 杂志头条式"')
    changed = False
    if 'premium.css?v=9' in text:
        text = text.replace('premium.css?v=9', 'premium.css?v=10', 1); changed = True
    if 'index.js?v=51' in text:
        text = text.replace('index.js?v=51', 'index.js?v=52', 1); changed = True
    path.write_text(text, encoding='utf-8')
    if changed:
        print(f'  [{path.name}] aria-label 改 · premium ?v=9->10 · index.js ?v=51->52')
    else:
        print(f'  [{path.name}] 版本号已最新')


def main():
    print('== 改 premium.css ==')
    for f in CSS_FILES:
        if f.exists(): patch_css(f)
        else: print(f'  ⚠️  跳过: {f}')
    print('== 改 index.js ==')
    for f in JS_FILES:
        if f.exists(): patch_js(f)
        else: print(f'  ⚠️  跳过: {f}')
    print('== 改 index.html ==')
    for f in HTML_FILES:
        if f.exists(): patch_html(f)
        else: print(f'  ⚠️  跳过: {f}')
    print('\n✅ 全部完成')


if __name__ == '__main__':
    main()
