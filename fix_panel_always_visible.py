# -*- coding: utf-8 -*-
from pathlib import Path

PAIRS = [
    ('src/main/resources/static/css/premium.css', 'target/classes/static/css/premium.css'),
    ('src/main/resources/static/js/index.js', 'target/classes/static/js/index.js'),
]

# === CSS: 1) .rh-detail 默认就有金色边框/阴影（不要 is-active 才显示） ===
#            2) 加 .rh-detail-badge 样式
#            3) 删 .rh-detail.is-active（与默认态合并）
#            4) .rh-title.is-active 加永久左边框 + 强色（让默认选中那条明显）
CSS_REPLACEMENTS = [
    # 1) .rh-detail 默认就有金色边框 + 中等阴影（不再依赖 is-active）
    (
        '''.rh-detail {
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
.rh-detail.is-active { border-color: var(--accent); box-shadow: var(--shadow-medium); }''',
        '''.rh-detail {
    position: sticky;
    top: 24px;
    align-self: start;
    padding: 26px 26px 24px;
    background: var(--surface);
    border: 1.5px solid var(--accent);
    border-radius: var(--r, 16px);
    box-shadow: var(--shadow-medium);
    min-height: 380px;
    display: flex;
    flex-direction: column;
    transition: border-color .3s, box-shadow .3s;
}
/* hover 态加深阴影/微亮边框 */
.rh-detail.is-active { border-color: var(--accent); box-shadow: 0 12px 40px -10px color-mix(in srgb, var(--accent) 30%, transparent); }''',
    ),
    # 2) .rh-detail-badge 徽标
    (
        '''.rh-detail-inner { display: flex; flex-direction: column; gap: 14px; height: 100%; }''',
        '''.rh-detail-inner { display: flex; flex-direction: column; gap: 14px; height: 100%; }
.rh-detail-badge {
    display: inline-block;
    align-self: flex-start;
    font-family: var(--sans);
    font-size: 9.5px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    padding: 3px 9px 3px;
    border-radius: 999px;
    margin-bottom: -2px;
}''',
    ),
    # 3) .rh-title.is-active 加永久左边框（让默认选中那条在右侧巨字列也明显）
    (
        '''.rh-title:hover, .rh-title.is-active { color: var(--text); padding-left: 14px; }''',
        '''.rh-title:hover, .rh-title.is-active {
    color: var(--text);
    padding-left: 14px;
    border-left: 2px solid var(--accent);
}
.rh-title.is-active { border-left-color: var(--accent); }''',
    ),
    # 4) .rh-title 默认 padding-left 给边框留位（避免 hover 时跳动）
    (
        '''    padding: 4px 0;
    transition: color .3s cubic-bezier(.2,.7,.2,1), padding-left .35s cubic-bezier(.2,.7,.2,1);
    position: relative;
}''',
        '''    padding: 4px 0 4px 14px;
    border-left: 2px solid transparent;
    transition: color .3s cubic-bezier(.2,.7,.2,1), padding-left .35s cubic-bezier(.2,.7,.2,1), border-left-color .3s;
    position: relative;
}''',
    ),
]

# === JS: 在 .rh-detail-inner 最前面插入 badge，更新 setDetail 同步更新徽标文案 ===
JS_REPLACEMENTS = [
    # 2) setDetail 改：更新徽标
    (
        '''        const setDetail = (a) => {
            detail.classList.add('is-active');
            detail.querySelector('.rh-detail-cat').textContent = (a.dataset.category || '未分类').toUpperCase();''',
        '''        const setDetail = (a, isDefault) => {
            detail.classList.add('is-active');
            const badge = detail.querySelector('.rh-detail-badge');
            if (badge) badge.textContent = isDefault ? '默认 · 第 1 篇' : '正在预览';
            detail.querySelector('.rh-detail-cat').textContent = (a.dataset.category || '未分类').toUpperCase();''',
    ),
    # 3) 调 setDetail 时传 isDefault
    (
        '''        if (items[0]) { items[0].classList.add('is-active'); setDetail(items[0]); }
        if (stage) {
            stage.addEventListener('mouseleave', () => {
                clearActive();
                if (items[0]) { items[0].classList.add('is-active'); setDetail(items[0]); }
            });
        }''',
        '''        const activate = (it, isDefault) => { clearActive(); it.classList.add('is-active'); setDetail(it, isDefault); };
        if (items[0]) activate(items[0], true);
        items.forEach(link => {
            link.addEventListener('mouseenter', () => activate(link, false));
            link.addEventListener('focus', () => activate(link, false));
        });
        if (stage) {
            stage.addEventListener('mouseleave', () => activate(items[0], true));
        }''',
    ),
    # 4) 老的 mouseenter/focus 重复监听块（要替换为更简单的版本）
    (
        '''        const clearActive = () => items.forEach(it => it.classList.remove('is-active'));
        items.forEach(link => {
            link.addEventListener('mouseenter', () => { clearActive(); link.classList.add('is-active'); setDetail(link); });
            link.addEventListener('focus', () => { clearActive(); link.classList.add('is-active'); setDetail(link); });
        });''',
        '''        const clearActive = () => items.forEach(it => it.classList.remove('is-active'));''',
    ),
]

for src, tgt in PAIRS:
    sp = Path(src)
    tp = Path(tgt)
    t = sp.read_text(encoding='utf-8')

    if src.endswith('.css'):
        for old, new in CSS_REPLACEMENTS:
            cnt = t.count(old)
            if cnt != 1:
                raise SystemExit(f'[{sp.name}] CSS 块出现 {cnt} 次（预期 1）: {old[:60]}...')
            t = t.replace(old, new, 1)
    else:  # js
        for old, new in JS_REPLACEMENTS:
            cnt = t.count(old)
            if cnt != 1:
                raise SystemExit(f'[{sp.name}] JS 块出现 {cnt} 次（预期 1）: {old[:60]}...')
            t = t.replace(old, new, 1)

    sp.write_text(t, encoding='utf-8')
    tp.write_text(t, encoding='utf-8')
    print(f'  [{sp.name}] + [{tp.name}] 已更新')

# === HTML: 注入 badge span（同步到 index.html） ===
for src, tgt in [
    ('src/main/resources/static/index.html', 'target/classes/static/index.html'),
]:
    sp = Path(src)
    tp = Path(tgt)
    t = sp.read_text(encoding='utf-8')
    old = '''<div class="rh-detail-inner">
                        <span class="rh-detail-cat">— HOVER A TITLE —</span>'''
    new = '''<div class="rh-detail-inner">
                        <span class="rh-detail-badge" id="rh-detail-badge">默认 · 第 1 篇</span>
                        <span class="rh-detail-cat">— HOVER A TITLE —</span>'''
    if old not in t:
        raise SystemExit(f'[{sp.name}] HTML badge 注入失败')
    t = t.replace(old, new, 1)
    sp.write_text(t, encoding='utf-8')
    tp.write_text(t, encoding='utf-8')
    print(f'  [{sp.name}] + [{tp.name}] HTML badge 已注入')

print('done')
