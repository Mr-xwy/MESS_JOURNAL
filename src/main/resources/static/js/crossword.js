/* crossword.js —— 可复用英式报纸字谜渲染工厂
 * 用法：const ctrl = buildCrossword(rootEl, data, opts);
 *   data：{ size, grid, across:[{num,answer,clue}], down:[{num,answer,clue}] }
 *   返回：{ check, reveal, clear, getValues, getCells, isComplete, root }
 *   opts.hideHead  跳过内置标题；opts.onReveal/onClear/onCheck 回调
 * 首页兼容：若页面存在 window.CROSSWORD_DATA 与 #crossword，则自动渲染（保持 index.html 行为）。
 */
function buildCrossword(rootEl, data, opts) {
    opts = opts || {};
    const root = typeof rootEl === 'string' ? document.querySelector(rootEl) : rootEl;
    if (!root || !data) return null;

    const N = data.size;
    const grid = data.grid;
    let cells = [];
    let msgEl = null;

    /* ---------- 编号：行首/列首即一个词的起点 ---------- */
    const cellNum = {};
    let num = 0;
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            const startsAcross = c === 0;
            const startsDown = r === 0;
            if (startsAcross || startsDown) { num++; cellNum[r + ',' + c] = num; }
        }
    }

    /* ---------- 键盘导航 + 自动跳格 ---------- */
    function onKey(e) {
        const inp = e.target;
        const r = +inp.dataset.r, c = +inp.dataset.c;
        if (/^[a-zA-Z]$/.test(e.key)) {
            setTimeout(() => move(r, c, 1), 0);
        } else if (e.key === 'Backspace') {
            if (inp.value === '') move(r, c, -1);
        } else if (e.key === 'ArrowRight') move(r, c, 1);
        else if (e.key === 'ArrowLeft') move(r, c, -1);
        else if (e.key === 'ArrowDown') move(r, c, N, true);
        else if (e.key === 'ArrowUp') move(r, c, -N, true);
    }
    function move(r, c, d) {
        let idx = r * N + c + d;
        idx = Math.max(0, Math.min(N * N - 1, idx));
        const next = cells[idx];
        if (next) next.focus();
    }

    function render() {
        root.innerHTML = '';

        if (!opts.hideHead) {
            const head = document.createElement('div');
            head.className = 'xw-head';
            head.innerHTML = '<div class="xw-title">字谜 · CROSSWORD</div>' +
                '<div class="xw-sub">填字游戏 — 横向与纵向均为五字母英文单词</div>';
            root.appendChild(head);
        }

        const gridWrap = document.createElement('div');
        gridWrap.className = 'xw-grid';
        for (let r = 0; r < N; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'xw-row';
            for (let c = 0; c < N; c++) {
                const cell = document.createElement('div');
                cell.className = 'xw-cell';
                if (cellNum[r + ',' + c] != null) {
                    const b = document.createElement('span');
                    b.className = 'xw-num';
                    b.textContent = cellNum[r + ',' + c];
                    cell.appendChild(b);
                }
                const inp = document.createElement('input');
                inp.maxLength = 1;
                inp.className = 'xw-input';
                inp.dataset.r = r; inp.dataset.c = c;
                inp.setAttribute('aria-label', '第' + (r + 1) + '行第' + (c + 1) + '列');
                inp.addEventListener('input', () => {
                    inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '');
                    inp.classList.remove('xw-ok', 'xw-bad');
                });
                inp.addEventListener('keydown', onKey);
                inp.addEventListener('focus', () => {
                    cells.forEach(x => x.classList.remove('xw-active'));
                    inp.classList.add('xw-active');
                });
                cell.appendChild(inp);
                rowEl.appendChild(cell);
                cells.push(inp);
            }
            gridWrap.appendChild(rowEl);
        }
        root.appendChild(gridWrap);

        const actions = document.createElement('div');
        actions.className = 'xw-actions';
        actions.innerHTML =
            '<button class="btn" id="xw-check">检查答案</button>' +
            '<button class="btn" id="xw-reveal">显示答案</button>' +
            '<button class="btn" id="xw-clear">清空</button>';
        root.appendChild(actions);

        msgEl = document.createElement('div');
        msgEl.className = 'xw-msg';
        root.appendChild(msgEl);

        actions.querySelector('#xw-check').onclick = () => { check(); if (opts.onCheck) opts.onCheck(); };
        actions.querySelector('#xw-reveal').onclick = () => { reveal(); if (opts.onReveal) opts.onReveal(); };
        actions.querySelector('#xw-clear').onclick = () => { clearAll(); if (opts.onClear) opts.onClear(); };

        root.appendChild(buildClues());
    }

    function check() {
        let allOk = true, filled = 0;
        cells.forEach(inp => {
            const r = +inp.dataset.r, c = +inp.dataset.c;
            const ans = grid[r][c];
            if (inp.value) filled++;
            if (inp.value.toUpperCase() === ans) {
                inp.classList.add('xw-ok'); inp.classList.remove('xw-bad');
            } else {
                inp.classList.add('xw-bad'); inp.classList.remove('xw-ok');
                allOk = false;
            }
        });
        if (filled < N * N) {
            msgEl.textContent = '还差 ' + (N * N - filled) + ' 格未填。';
            msgEl.className = 'xw-msg';
        } else if (allOk) {
            msgEl.textContent = '全部正确！';
            msgEl.className = 'xw-msg xw-ok-msg';
        } else {
            msgEl.textContent = '有些字母不对，标红处再想想。';
            msgEl.className = 'xw-msg xw-bad-msg';
        }
    }

    function reveal() {
        cells.forEach(inp => {
            const r = +inp.dataset.r, c = +inp.dataset.c;
            inp.value = grid[r][c];
            inp.classList.add('xw-ok'); inp.classList.remove('xw-bad');
        });
        msgEl.textContent = '已显示答案。';
        msgEl.className = 'xw-msg';
    }

    function clearAll() {
        cells.forEach(inp => { inp.value = ''; inp.classList.remove('xw-ok', 'xw-bad'); });
        msgEl.textContent = '';
    }

    function isComplete() {
        let ok = true;
        cells.forEach(inp => {
            const r = +inp.dataset.r, c = +inp.dataset.c;
            if (inp.value.toUpperCase() !== grid[r][c]) ok = false;
        });
        return ok;
    }

    function getValues() { return cells.map(i => i.value.toUpperCase()); }

    function buildClues() {
        const wrap = document.createElement('div');
        wrap.className = 'xw-clues';
        const a = document.createElement('div');
        a.className = 'xw-clue-col';
        a.innerHTML = '<div class="xw-clue-h">横向 ACROSS</div>';
        (data.across || []).forEach(cl => {
            const d = document.createElement('div');
            d.className = 'xw-clue';
            d.innerHTML = '<b>' + cl.num + '</b> ' + escapeHtml(cl.clue);
            a.appendChild(d);
        });
        const dn = document.createElement('div');
        dn.className = 'xw-clue-col';
        dn.innerHTML = '<div class="xw-clue-h">纵向 DOWN</div>';
        (data.down || []).forEach(cl => {
            const d = document.createElement('div');
            d.className = 'xw-clue';
            d.innerHTML = '<b>' + cl.num + '</b> ' + escapeHtml(cl.clue);
            dn.appendChild(d);
        });
        wrap.appendChild(a); wrap.appendChild(dn);
        return wrap;
    }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    render();
    return { check, reveal, clear: clearAll, getValues, getCells: () => cells, isComplete, root };
}

/* 首页兼容：若页面自带 window.CROSSWORD_DATA 与 #crossword，则自动渲染 */
if (window.CROSSWORD_DATA && document.getElementById('crossword')) {
    buildCrossword(document.getElementById('crossword'), window.CROSSWORD_DATA);
}
