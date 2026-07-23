#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
放弃自动无缝循环横滚，改回"原生横向滚动条"控制：
- 删 .fr-track--auto 整套（overflow-x: hidden + animation + keyframes + 隐藏滚动条）
- 删 @media (prefers-reduced-motion: reduce) 对 fr-track--auto 的引用
- 删 @keyframes fr-scroll
- 保留 fr-track overflow-x: auto (默认显示原生横向滚动条)
- 保留 .fr-track--auto::-webkit-scrollbar 隐藏规则（已废弃，可一并删）

JS 改动：
- 删克隆双份逻辑
- 删 box.classList.add('fr-track--auto')

升级 premium.css ?v=8 -> ?v=9, index.js ?v=50 -> ?v=51
"""
import sys
from pathlib import Path

BASE = Path(r'D:\AI生成\blog-springboot')
CSS_FILES = [
    BASE / 'src/main/resources/static/css/premium.css',
    BASE / 'target/classes/static/css/premium.css',
]
HTML_FILES = [
    BASE / 'src/main/resources/static/index.html',
    BASE / 'target/classes/static/index.html',
]
JS_FILES = [
    BASE / 'src/main/resources/static/js/index.js',
    BASE / 'target/classes/static/js/index.js',
]

# ===== 1. 删 .fr-track--auto 整套（11 行 + 动画 + 媒体查询） =====
old_auto = """.featured-river--main .fr-track { min-height: 220px; }
/* ====== 无缝循环横滚：克隆双份内容，从 0 平移到 -50% ====== */
.featured-river--main .fr-track--auto {
    overflow-x: hidden;
    scroll-snap-type: none;
    scrollbar-width: none;
    -ms-overflow-style: none;
    animation: fr-scroll 36s linear infinite;
    will-change: transform;
}
.featured-river--main .fr-track--auto::-webkit-scrollbar { display: none; height: 0; }
.featured-river--main .fr-track--auto:hover,
.featured-river--main .fr-track--auto:focus-within {
    animation-play-state: paused;
}
@keyframes fr-scroll {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
    .featured-river--main .fr-track--auto { animation: none; }
}"""
new_auto = """.featured-river--main .fr-track { min-height: 220px; }
/* 原生横向滚动：浏览器自动显示底部/右侧滚动条，鼠标滚轮 / 触摸板左右滑动 / 拖滚动条均可控制。
   无缝循环动画已取消（用户反馈 dot 错位/视觉残缺，改回最朴素的滚动条控制）。 */"""


def patch_css(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text.count(old_auto)
    if n != 1: raise SystemExit(f'[{path.name}] .fr-track--auto 整段出现 {n} 次')
    text = text.replace(old_auto, new_auto, 1)
    op = text.count('{'); cl = text.count('}')
    if op != cl: raise SystemExit(f'[{path.name}] 括号不平衡: {{ {op} vs }} {cl}')
    path.write_text(text, encoding='utf-8')
    print(f'  [{path.name}] 删 .fr-track--auto + keyframes + reduced-motion 引用 · {op} 对括号')


# ===== 2. JS 删克隆双份 + 删 fr-track--auto class =====
old_js = """        box.innerHTML = '';
        const originalNodes = [];
        picks.forEach((a, i) => {
            const node = document.createElement('a');
            node.className = 'fr-node' + (i % 2 === 0 ? ' fr-node--up' : ' fr-node--down');
            node.href = 'article.html?id=' + a.id;
            // 顺序：date(顶) → fr-card(主体，dot 在 fr-card 内部顶部作为"图钉")。
            // dot 锁 fr-card 顶部中心（absolute top:0 + translate -50% -50%），凸出 6.5px。
            // 不再用 fr-track 中心时间线（物理上 dot 必然被 card 覆盖）。
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
            originalNodes.push(node);
        });
        // 无缝循环：克隆一份追加到末尾（≥2 篇才有意义）
        if (originalNodes.length >= 2) {
            originalNodes.forEach(n => {
                const clone = n.cloneNode(true);
                clone.setAttribute('aria-hidden', 'true');
                clone.setAttribute('tabindex', '-1');
                box.appendChild(clone);
            });
            box.classList.add('fr-track--auto');
        }
        console.log('[featured-river] 渲染完成 · 节点数:', box.children.length, '· 自动滚动:', box.classList.contains('fr-track--auto'));"""

new_js = """        box.innerHTML = '';
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


def patch_js(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text.count(old_js)
    if n != 1: raise SystemExit(f'[{path.name}] JS 渲染块出现 {n} 次')
    text = text.replace(old_js, new_js, 1)
    path.write_text(text, encoding='utf-8')
    print(f'  [{path.name}] 删克隆双份 + 删 fr-track--auto 触发')


def bump_html(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    changed = False
    if 'premium.css?v=8' in text:
        text = text.replace('premium.css?v=8', 'premium.css?v=9', 1); changed = True
    if 'index.js?v=50' in text:
        text = text.replace('index.js?v=50', 'index.js?v=51', 1); changed = True
    if changed:
        path.write_text(text, encoding='utf-8')
        print(f'  [{path.name}] premium ?v=8->9 · index.js ?v=50->51')
    else:
        print(f'  [{path.name}] 版本号已是最新')


def main():
    print('== 改 premium.css (src + target) ==')
    for f in CSS_FILES:
        if not f.exists(): print(f'  ⚠️  跳过: {f}'); continue
        patch_css(f)

    print('== 改 index.js (src + target) ==')
    for f in JS_FILES:
        if not f.exists(): print(f'  ⚠️  跳过: {f}'); continue
        patch_js(f)

    print('== 升 index.html 版本号 (src + target) ==')
    for f in HTML_FILES:
        if not f.exists(): print(f'  ⚠️  跳过: {f}'); continue
        bump_html(f)

    print('\n✅ 全部完成')


if __name__ == '__main__':
    main()
