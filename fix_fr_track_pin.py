#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
最新文章"链表"布局最终方案：
- 删时间线 ::before（dot 锁不住时间线，物理上不可能）
- 改 dot 为 fr-card 顶部的"图钉"（凸出在 card 顶部正中）
- 错落保留，幅度缩小 ±34 -> ±18
- fr-track 改 height: auto, 让内容自然撑开
- 删 fr-track::before 时间线 + 删 fr-node--down 相关 order 修饰
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

# ===== 1. .fr-track 整块替换 =====
old_track = """.fr-track {
    position: relative;
    display: flex;
    gap: 30px;
    align-items: stretch;
    padding: 0 8px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    height: 260px;
}"""
new_track = """.fr-track {
    position: relative;
    display: flex;
    gap: 30px;
    align-items: stretch;
    padding: 28px 8px 32px;
    overflow-x: auto;
    overflow-y: visible;        /* dot 凸出 fr-card 顶部必须可见 */
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
    min-height: 220px;
}"""

# ===== 2. 删 .fr-track::before 时间线（彻底放弃） =====
old_timeline = """/* 横贯时间线（居中） */
.fr-track::before {
    content: "";
    position: absolute;
    left: 0; right: 0;
    top: 50%;
    height: 2px;
    background: linear-gradient(90deg,
        transparent 0,
        var(--rule) 6%,
        var(--accent) 50%,
        var(--rule) 94%,
        transparent 100%);
    opacity: 0.85;
}
"""
new_timeline = """/* 时间线 ::before 已删除：dot 作为 fr-card 顶部"图钉"装饰，节点间不再有横贯连线。
   链表式无缝循环靠 JS 克隆双份 + translateX(-50%) 实现视觉衔接。 */
"""

# ===== 3. .fr-node 整块 =====
old_node = """.fr-node {
    position: relative;
    flex: 0 0 auto;
    width: 240px;
    height: 100%;
    scroll-snap-align: center;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 22px 0 24px;
}"""
new_node = """.fr-node {
    position: relative;
    flex: 0 0 auto;
    width: 240px;
    height: auto;                  /* 改回 auto，让 fr-card 撑开 */
    scroll-snap-align: center;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0;
}"""

# ===== 4. 错落 + dot + fr-card + fr-date 整段 =====
old_wave = """/* 全部节点统一布局：取消上下错落，dot 用 absolute 锁在 fr-track 中心时间线 */
.fr-node--up,
.fr-node--down { transform: none; }
.fr-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 13px; height: 13px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 5px var(--surface), 0 0 0 6px var(--rule);
    z-index: 3;
}
.fr-card {
    margin-top: auto;
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r, 16px);
    padding: 18px 18px 16px;
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform .4s cubic-bezier(.2,.7,.2,1), box-shadow .4s, border-color .4s;
}"""

new_wave = """/* 节点上下错落：用户能接受"河流"波浪感，幅度从 ±34 缩小到 ±18 让克隆节点不显突兀 */
.fr-node--up   { transform: translateY(-18px); }
.fr-node--down { transform: translateY(18px); }
/* dot = fr-card 顶部"图钉"：absolute 锁 fr-card 顶部，凸出 6.5px 显锚定 */
.fr-dot {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 13px; height: 13px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 5px var(--surface), 0 0 0 6px var(--rule);
    z-index: 3;
}
.fr-card {
    position: relative;            /* 让 dot 锁 fr-card 顶部 */
    margin-top: 0;                 /* 紧贴 fr-date 下方（fr-node flex column） */
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--r, 16px);
    padding: 22px 18px 16px;       /* padding-top 加大给 dot 留位 */
    box-shadow: var(--shadow-soft);
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform .4s cubic-bezier(.2,.7,.2,1), box-shadow .4s, border-color .4s;
}"""

# ===== 5. .fr-date 改 =====
old_date = """.fr-date {
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--text-faded);
    margin-top: 10px;
}"""
new_date = """.fr-date {
    font-family: var(--mono, 'JetBrains Mono', monospace);
    font-size: 11px;
    letter-spacing: 0.08em;
    color: var(--text-faded);
    margin: 8px 0 0;
    text-align: center;
}"""

# ===== 6. 删 .fr-node--down 残留修饰（若仍存在） =====
old_down_remain = """.fr-node--down .fr-card { margin-top: 0; margin-bottom: 16px; order: 2; }
.fr-node--down { display: flex; flex-direction: column; }
.fr-node--down .fr-dot { order: 3; }
.fr-node--down .fr-date { order: 1; margin-bottom: 8px; }"""
new_down_remain = """/* fr-node--down 旧修饰已清理：order/margin 全部交给 .fr-node--down { transform } 一行控制 */"""


def patch_css(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text

    n1 = n.count(old_track)
    if n1 != 1: raise SystemExit(f'[{path.name}] .fr-track 块出现 {n1} 次')
    n = n.replace(old_track, new_track, 1)

    n2 = n.count(old_timeline)
    if n2 != 1: raise SystemExit(f'[{path.name}] .fr-track::before 块出现 {n2} 次')
    n = n.replace(old_timeline, new_timeline, 1)

    n3 = n.count(old_node)
    if n3 != 1: raise SystemExit(f'[{path.name}] .fr-node 块出现 {n3} 次')
    n = n.replace(old_node, new_node, 1)

    n4 = n.count(old_wave)
    if n4 != 1: raise SystemExit(f'[{path.name}] 错落整段出现 {n4} 次')
    n = n.replace(old_wave, new_wave, 1)

    n5 = n.count(old_date)
    if n5 != 1: raise SystemExit(f'[{path.name}] .fr-date 块出现 {n5} 次')
    n = n.replace(old_date, new_date, 1)

    n6 = n.count(old_down_remain)
    if n6 == 1:
        n = n.replace(old_down_remain, new_down_remain, 1)
        print(f'  [{path.name}] 同时清掉 .fr-node--down 残留 4 行')
    elif n6 == 0:
        print(f'  [{path.name}] .fr-node--down 残留已不存在（上一轮已删），跳过')
    else:
        raise SystemExit(f'[{path.name}] fr-node--down 残留出现 {n6} 次')

    op = n.count('{')
    cl = n.count('}')
    if op != cl:
        raise SystemExit(f'[{path.name}] 括号不平衡: {{ {op} vs }} {cl}')
    print(f'  [{path.name}] 替换完成 · {op} 对括号')

    path.write_text(n, encoding='utf-8')


# ===== 7. index.js innerHTML 调整：dot 移入 fr-card 内 =====
old_js_block = """            // 顺序：date(顶) → dot(abs 中) → card(底)。card 用 margin-top:auto 贴底，
            // dot 用 absolute 锁 fr-track 中心时间线，date 自然排在顶部。三者共线不交错。
            node.innerHTML = `
                <span class="fr-date">${fmtTime(a.publishedAt || a.createdAt)}</span>
                <span class="fr-dot"></span>
                <span class="fr-card">
                    <span class="fr-cat">${escapeHtml(a.category || '未分类')}</span>
                    <span class="fr-title">${escapeHtml(a.title)}</span>
                    <span class="fr-byline">By ${escapeHtml(a.authorName || 'Anonymous')} · ${fmtTime(a.publishedAt || a.createdAt)}</span>
                    <span class="fr-likes">&#10084; ${a.likeCount || 0}</span>
                </span>
            `;"""

new_js_block = """            // 顺序：date(顶) → fr-card(主体，dot 在 fr-card 内部顶部作为"图钉")。
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
            `;"""


def patch_js(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text.count(old_js_block)
    if n != 1: raise SystemExit(f'[{path.name}] innerHTML 块出现 {n} 次')
    text = text.replace(old_js_block, new_js_block, 1)
    path.write_text(text, encoding='utf-8')
    print(f'  [{path.name}] innerHTML 调整完成')


def bump_html(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    changed = False
    if 'premium.css?v=7' in text:
        text = text.replace('premium.css?v=7', 'premium.css?v=8', 1)
        changed = True
    if 'index.js?v=49' in text:
        text = text.replace('index.js?v=49', 'index.js?v=50', 1)
        changed = True
    if changed:
        path.write_text(text, encoding='utf-8')
        print(f'  [{path.name}] premium ?v=7->8 · index.js ?v=49->50')
    else:
        print(f'  [{path.name}] 版本号已是最新，跳过')


def main():
    print('== 改 premium.css (src + target) ==')
    for f in CSS_FILES:
        if not f.exists(): print(f'  ⚠️  跳过不存在: {f}'); continue
        patch_css(f)

    print('== 改 index.js innerHTML (src + target) ==')
    for f in JS_FILES:
        if not f.exists(): print(f'  ⚠️  跳过不存在: {f}'); continue
        patch_js(f)

    print('== 升 index.html 版本号 (src + target) ==')
    for f in HTML_FILES:
        if not f.exists(): print(f'  ⚠️  跳过不存在: {f}'); continue
        bump_html(f)

    print('\n✅ 全部完成')


if __name__ == '__main__':
    main()
