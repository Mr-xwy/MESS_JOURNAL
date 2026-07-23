#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把 fr-track / fr-node 改成"直线衔接"布局：
- 所有 fr-node 取消上下错落（transform: none）
- fr-track 固定高度 260px + align-items: stretch
- fr-dot 改 absolute top:50% 锁在 fr-track 中心时间线
- fr-card margin-top: auto 贴 fr-node 底部
- 删除 .fr-node--down 相关的 order 重排（已无意义）
同步 src + target 两份，升级 premium.css?v=6 -> ?v=7
"""
import re
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

# ===== 1. .fr-track 整块替换 =====
old_track = """.fr-track {
    position: relative;
    display: flex;
    gap: 30px;
    align-items: center;
    padding: 70px 8px 70px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
}"""
new_track = """.fr-track {
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

# ===== 2. .fr-node 整块替换（增加 height:100% + padding 留 dot/card 空间） =====
old_node = """.fr-node {
    position: relative;
    flex: 0 0 auto;
    width: 240px;
    scroll-snap-align: center;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
}"""
new_node = """.fr-node {
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

# ===== 3. 错落整段替换（取消 + 清理 .fr-node--down 的 order 重排） =====
old_wave = """/* 节点上下错落 */
.fr-node--up   { transform: translateY(-34px); }
.fr-node--down { transform: translateY(34px); }
.fr-dot {
    width: 13px; height: 13px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 5px var(--surface), 0 0 0 6px var(--rule);
    z-index: 2;
}
.fr-card {
    margin-top: 16px;
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
}
.fr-node--down .fr-card { margin-top: 0; margin-bottom: 16px; order: 2; }
.fr-node--down { display: flex; flex-direction: column; }
.fr-node--down .fr-dot { order: 3; }
.fr-node--down .fr-date { order: 1; margin-bottom: 8px; }"""

new_wave = """/* 全部节点统一布局：取消上下错落，dot 用 absolute 锁在 fr-track 中心时间线 */
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


def patch_css(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    n = text

    n1 = n.count(old_track)
    if n1 != 1:
        raise SystemExit(f'[{path.name}] .fr-track 块出现 {n1} 次，期望 1')
    n = n.replace(old_track, new_track, 1)

    n2 = n.count(old_node)
    if n2 != 1:
        raise SystemExit(f'[{path.name}] .fr-node 块出现 {n2} 次，期望 1')
    n = n.replace(old_node, new_node, 1)

    n3 = n.count(old_wave)
    if n3 != 1:
        raise SystemExit(f'[{path.name}] 错落整段出现 {n3} 次，期望 1')
    n = n.replace(old_wave, new_wave, 1)

    # 校验括号平衡
    op = n.count('{')
    cl = n.count('}')
    if op != cl:
        raise SystemExit(f'[{path.name}] 括号不平衡: {{ {op} vs }} {cl}')
    print(f'  [{path.name}] 替换完成 · {op} 对括号平衡')

    path.write_text(n, encoding='utf-8')


def bump_index_html(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    if 'premium.css?v=6' in text:
        new = text.replace('premium.css?v=6', 'premium.css?v=7', 1)
        path.write_text(new, encoding='utf-8')
        print(f'  [{path.name}] premium.css?v=6 -> ?v=7')
    elif 'premium.css?v=7' in text:
        print(f'  [{path.name}] 已经是 v=7，跳过')
    else:
        print(f'  [{path.name}] ⚠️  找不到 premium.css?v=6，请检查', file=sys.stderr)


def main():
    print('== 改 premium.css (src + target) ==')
    for f in CSS_FILES:
        if not f.exists():
            print(f'  ⚠️  跳过不存在: {f}')
            continue
        patch_css(f)

    print('== 升 index.html 版本号 (src + target) ==')
    for f in HTML_FILES:
        if not f.exists():
            print(f'  ⚠️  跳过不存在: {f}')
            continue
        bump_index_html(f)

    print('\n✅ 全部完成')


if __name__ == '__main__':
    main()
