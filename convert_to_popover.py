# -*- coding: utf-8 -*-
from pathlib import Path

CSS = 'src/main/resources/static/css/premium.css'
CSS_T = 'target/classes/static/css/premium.css'
JS = 'src/main/resources/static/js/index.js'
JS_T = 'target/classes/static/js/index.js'
HTML = 'src/main/resources/static/index.html'
HTML_T = 'target/classes/static/index.html'

# ===== 1. CSS: 删 .rh-detail 整块，替换为 .rh-popover 系列 =====
NEW_POPOVER = '''.rh-popover {
    position: fixed;
    z-index: 1000;
    width: min(340px, 88vw);
    padding: 20px 22px 18px;
    background: var(--surface);
    border: 1.5px solid var(--accent);
    border-radius: var(--r, 16px);
    box-shadow: 0 18px 50px -12px color-mix(in srgb, var(--accent) 35%, transparent);
    opacity: 0;
    visibility: hidden;
    transform: translateY(6px);
    transition: opacity .22s ease, transform .22s ease, visibility .22s;
    pointer-events: none;
}
.rh-popover.show { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
.rh-popover-cat {
    display: block;
    font-family: var(--sans);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 8px;
}
.rh-popover-title {
    font-family: var(--serif-display);
    font-size: clamp(18px, 2vw, 24px);
    font-weight: 500;
    line-height: 1.3;
    color: var(--text);
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.rh-popover-excerpt {
    font-family: var(--sans);
    font-size: 13px;
    line-height: 1.65;
    color: var(--text-soft);
    margin: 0 0 12px;
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
.rh-popover-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--sans);
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: var(--text-faded);
    text-transform: uppercase;
    padding-top: 10px;
    border-top: 1px solid var(--rule);
}
.rh-popover-meta .sep { opacity: .4; }
.rh-popover-cta {
    display: block;
    font-family: var(--sans);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    text-decoration: none;
    margin-top: 10px;
    padding-left: 0;
    transition: padding-left .25s;
}
.rh-popover-cta:hover { padding-left: 6px; }
'''

for f in (CSS, CSS_T):
    p = Path(f)
    t = p.read_text(encoding='utf-8')
    start = t.index('.rh-detail {\n')
    end_marker = '.rh-detail-cta:hover { padding-left: 6px; }\n'
    end = t.index(end_marker) + len(end_marker)
    t = t[:start] + NEW_POPOVER + t[end:]
    # grid 改单栏
    if 'grid-template-columns: 1fr 1.5fr;' in t:
        t = t.replace('grid-template-columns: 1fr 1.5fr;', 'grid-template-columns: 1fr;', 1)
    # 窄屏删 .rh-detail 规则
    t = t.replace("    .rh-detail { position: relative; top: 0; min-height: 0; }\n", "", 1)
    # is-active -> focus-visible（键盘可达）
    t = t.replace('.rh-title:hover, .rh-title.is-active {',
                  '.rh-title:hover, .rh-title:focus-visible {', 1)
    t = t.replace('.rh-title:hover .rh-title-tag, .rh-title.is-active .rh-title-tag {',
                  '.rh-title:hover .rh-title-tag, .rh-title:focus-visible .rh-title-tag {', 1)
    t = t.replace('.rh-title:hover .rh-title-text, .rh-title.is-active .rh-title-text {',
                  '.rh-title:hover .rh-title-text, .rh-title:focus-visible .rh-title-text {', 1)
    t = t.replace('.rh-title:hover .rh-title-num, .rh-title.is-active .rh-title-num {',
                  '.rh-title:hover .rh-title-num, .rh-title:focus-visible .rh-title-num {', 1)
    # 删残留 .rh-title.is-active 单行
    t = t.replace(".rh-title.is-active { border-left-color: var(--accent); }\n", "", 1)
    p.write_text(t, encoding='utf-8')
    print(f'  [{p.name}] CSS 已更新（删 .rh-detail，加 .rh-popover）')

# ===== 2. JS: 删 detail 相关 + setDetail/activate 块 -> popover 定位逻辑 =====
OLD_JS = '''        const setDetail = (a, isDefault) => {
            detail.classList.add('is-active');
            const badge = detail.querySelector('.rh-detail-badge');
            if (badge) badge.textContent = isDefault ? '默认 · 第 1 篇' : '正在预览';
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
        const activate = (it, isDefault) => { clearActive(); it.classList.add('is-active'); setDetail(it, isDefault); };
        items.forEach(link => {
            link.addEventListener('mouseenter', () => activate(link, false));
            link.addEventListener('focus', () => activate(link, false));
        });
        if (items[0]) activate(items[0], true);
        if (stage) {
            stage.addEventListener('mouseleave', () => activate(items[0], true));
        }'''

NEW_JS = '''        const pop = document.getElementById('rh-popover');
        const showPop = (link) => {
            if (!pop) return;
            pop.querySelector('.rh-popover-cat').textContent = (link.dataset.category || '未分类').toUpperCase();
            pop.querySelector('.rh-popover-title').textContent = link.dataset.title || '';
            pop.querySelector('.rh-popover-excerpt').textContent = link.dataset.summary || '（这篇文章还没有摘要）';
            pop.querySelector('.rh-popover-author').textContent = 'By ' + link.dataset.author;
            pop.querySelector('.rh-popover-time').textContent = link.dataset.time;
            pop.querySelector('.rh-popover-cta').href = link.getAttribute('href') || '#';
            pop.classList.add('show');
            const r = link.getBoundingClientRect();
            const pw = pop.offsetWidth, ph = pop.offsetHeight;
            let left = r.right + 16;
            if (left + pw > window.innerWidth - 12) left = r.left - pw - 16;
            if (left < 12) left = Math.max(12, (window.innerWidth - pw) / 2);
            let top = r.top + (r.height - ph) / 2;
            if (top < 12) top = 12;
            if (top + ph > window.innerHeight - 12) top = window.innerHeight - ph - 12;
            pop.style.left = Math.round(left) + 'px';
            pop.style.top = Math.round(top) + 'px';
        };
        const hidePop = () => { if (pop) pop.classList.remove('show'); };
        let hideTimer = null;
        items.forEach(link => {
            link.addEventListener('mouseenter', () => { if (hideTimer) clearTimeout(hideTimer); showPop(link); });
            link.addEventListener('focus', () => { if (hideTimer) clearTimeout(hideTimer); showPop(link); });
            link.addEventListener('mouseleave', () => { hideTimer = setTimeout(hidePop, 140); });
        });
        if (pop) {
            pop.addEventListener('mouseenter', () => { if (hideTimer) clearTimeout(hideTimer); });
            pop.addEventListener('mouseleave', () => { hideTimer = setTimeout(hidePop, 140); });
        }'''

for f in (JS, JS_T):
    p = Path(f)
    t = p.read_text(encoding='utf-8')
    # 删 detail 声明
    if "    const detail = document.getElementById('rh-detail');\n" in t:
        t = t.replace("    const detail = document.getElementById('rh-detail');\n", "", 1)
    # if 检查改
    t = t.replace("    if (!box || !detail) {", "    if (!box) {", 1)
    if OLD_JS not in t:
        raise SystemExit(f'[{p.name}] OLD_JS 未找到')
    t = t.replace(OLD_JS, NEW_JS, 1)
    p.write_text(t, encoding='utf-8')
    print(f'  [{p.name}] JS 已更新（popover 定位逻辑）')

# ===== 3. HTML: 删 aside.rh-detail 块，加 .rh-popover 块 =====
OLD_HTML = '''            <aside class='rh-detail' id='rh-detail' aria-live='polite'>
                <div class='rh-detail-inner'>
                    <span class='rh-detail-badge' id='rh-detail-badge'>默认 · 第 1 篇</span>
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
'''

NEW_HTML = '''            <div class='rh-popover' id='rh-popover' role='status'>
                <span class='rh-popover-cat'></span>
                <h3 class='rh-popover-title'></h3>
                <p class='rh-popover-excerpt'></p>
                <div class='rh-popover-meta'>
                    <span class='rh-popover-author'></span>
                    <span class='sep'>·</span>
                    <span class='rh-popover-time'></span>
                </div>
                <a class='rh-popover-cta' href='#'>阅读全文 →</a>
            </div>
'''

for f in (HTML, HTML_T):
    p = Path(f)
    t = p.read_text(encoding='utf-8')
    if OLD_HTML not in t:
        raise SystemExit(f'[{p.name}] OLD_HTML 未找到')
    t = t.replace(OLD_HTML, NEW_HTML, 1)
    p.write_text(t, encoding='utf-8')
    print(f'  [{p.name}] HTML 已更新（popover 容器）')

print('done')
