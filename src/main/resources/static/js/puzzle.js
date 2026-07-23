/* puzzle.js —— 拼诗华容道（滑动拼图）页面逻辑
 * 依赖：api.js（getTodayPuzzle / getPuzzleLeaderboard / submitPuzzleScore / getMyPuzzleScore）
 *       common.js（setupHeader / isLoggedIn / escapeHtml）
 * 玩法：点击与任意空格相邻的方块滑动，把诗句/词句拼回正确顺序（行优先）。
 * - 轻松：七言绝句，4×7，每行一句；末格为空格，拼好后补全末字。
 * - 困难：长短词（含标点），自动凑成矩形，允许多个空格。
 * 榜单 key = 诗id + "-" + 难度（easy/hard），轻松与困难各一张榜。
 */
(function () {
    const board = document.getElementById('puzzle-grid');
    const timerEl = document.getElementById('puzzle-timer');
    const dateEl = document.getElementById('puzzle-date');
    const themeEl = document.getElementById('puzzle-theme');
    const statusEl = document.getElementById('puzzle-status');
    const lbEl = document.getElementById('leaderboard-list');
    const mineEl = document.getElementById('my-score');
    const submitBtn = document.getElementById('puzzle-submit');
    const startOverlay = document.getElementById('start-overlay');
    const startBtn = document.getElementById('puzzle-start');
    const diffWrap = document.getElementById('puzzle-diff');
    const hintEl = document.getElementById('puzzle-hint');
    const reshuffleBtn = document.getElementById('puzzle-reshuffle');
    const revealBtn = document.getElementById('puzzle-reveal');
    const poemRevealEl = document.getElementById('poem-reveal');

    let today = null;
    let difficulty = 'easy';
    let rows = 4, cols = 7;
    let solvedState = [];      // 已解状态，长度 = rows*cols，空格为 null
    let boardState = [];       // 当前盘面
    let blankPositions = [];   // 当前空格下标数组（支持多空格）
    let started = false, finished = false, revealed = false;
    let startTime = 0, timerId = null, moves = 0;

    /* ---------- 计时 ---------- */
    function fmt(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    function stopTimer() { if (timerId) { clearTimeout(timerId); timerId = null; } }
    function tick() {
        if (finished) return;
        const el = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = fmt(el);
        timerId = setTimeout(tick, 1000);
    }
    function startTimer() {
        startTime = Date.now();
        timerEl.textContent = fmt(0);
        stopTimer(); tick();
    }
    function elapsed() { return Math.floor((Date.now() - startTime) / 1000); }

    function escapeHtml(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    /* ---------- 当前难度数据 ---------- */
    function currentBoard() { return difficulty === 'easy' ? today.easy : today.hard; }
    function currentKey() {
        const b = currentBoard();
        return b.id + '-' + difficulty;
    }

    function neighborsOf(idx) {
        const r = Math.floor(idx / cols), c = idx % cols;
        const res = [];
        if (r > 0) res.push(idx - cols);
        if (r < rows - 1) res.push(idx + cols);
        if (c > 0) res.push(idx - 1);
        if (c < cols - 1) res.push(idx + 1);
        return res;
    }

    /* 由当前难度棋盘构造「已解状态」与空格列表 */
    function buildSolved() {
        const b = currentBoard();
        rows = b.rows; cols = b.cols;
        const n = rows * cols;
        solvedState = new Array(n).fill(null);
        let k = 0;
        for (let i = 0; i < n; i++) {
            if (b.blankIndices.indexOf(i) !== -1) solvedState[i] = null;
            else solvedState[i] = b.tiles[k++];
        }
        blankPositions = b.blankIndices.slice();
    }

    /* 从已解状态出发做若干次随机合法移动，保证可解且不依赖外部求解；
     * 支持多空格：每步任选一个空格，与相邻非空格方块交换。 */
    function scramble() {
        const b = currentBoard();
        boardState = solvedState.slice();
        blankPositions = b.blankIndices.slice();
        const n = rows * cols;
        const steps = 60 + n * 4;
        let lastMoved = -1;
        for (let s = 0; s < steps; s++) {
            const bi = Math.floor(Math.random() * blankPositions.length);
            const bPos = blankPositions[bi];
            let cands = neighborsOf(bPos).filter(p => boardState[p] !== null && p !== lastMoved);
            if (!cands.length) cands = neighborsOf(bPos).filter(p => boardState[p] !== null);
            if (!cands.length) continue;
            const pick = cands[Math.floor(Math.random() * cands.length)];
            boardState[bPos] = boardState[pick];
            boardState[pick] = null;
            blankPositions[bi] = pick;
            lastMoved = pick;
        }
        // 极小概率打乱完仍是已解，再走一步
        if (isSolved()) {
            const bPos = blankPositions[0];
            const cands = neighborsOf(bPos).filter(p => boardState[p] !== null);
            if (cands.length) {
                const pick = cands[Math.floor(Math.random() * cands.length)];
                boardState[bPos] = boardState[pick];
                boardState[pick] = null;
                blankPositions[0] = pick;
            }
        }
    }

    function render() {
        board.style.setProperty('--cols', cols);
        board.innerHTML = '';
        const b = currentBoard();
        const revealChar = (finished && b.reveal) ? b.tiles[b.tiles.length - 1] : null;
        for (let i = 0; i < boardState.length; i++) {
            const cell = document.createElement('div');
            if (boardState[i] === null) {
                cell.className = 'slide-tile slide-tile--blank';
                if (revealChar !== null) {
                    cell.textContent = revealChar;
                    cell.classList.add('slide-tile--solved');
                }
            } else {
                cell.className = 'slide-tile';
                cell.textContent = boardState[i];
                if (finished) cell.classList.add('slide-tile--solved');
                else {
                    cell.onclick = (function (idx) {
                        return function () { onTileClick(idx); };
                    })(i);
                }
            }
            board.appendChild(cell);
        }
    }

    function isSolved() {
        for (let i = 0; i < boardState.length; i++) if (boardState[i] !== solvedState[i]) return false;
        return true;
    }

    function onTileClick(i) {
        if (finished || !started) return;
        const bi = blankPositions.findIndex(bPos => neighborsOf(bPos).indexOf(i) !== -1);
        if (bi === -1) return; // 仅与任意空格相邻可移动
        const bPos = blankPositions[bi];
        boardState[bPos] = boardState[i];
        boardState[i] = null;
        blankPositions[bi] = i;
        moves++;
        if (moves === 1) startTimer(); // 首次移动才开始计时
        render();
        if (isSolved()) onSolved();
    }

    function showPoem() {
        const b = currentBoard();
        poemRevealEl.innerHTML =
            '<div class="poem-title">《' + escapeHtml(b.title) + '》</div>' +
            '<div class="poem-author">' + escapeHtml(b.dynasty || '') +
                (b.dynasty ? ' · ' : '') + escapeHtml(b.author) + '</div>' +
            '<div class="poem-body">' + escapeHtml(b.full) + '</div>';
        poemRevealEl.style.display = 'block';
    }

    function onSolved() {
        finished = true;
        stopTimer();
        render();
        showPoem();
        submitBtn.disabled = !isLoggedIn() || revealed;
        loadLeaderboard();
        loadMine();
        setStatus('拼好啦！' + (revealed ? '（已看原诗，本局不计）' : '') + ' 可提交成绩 🎉', 'ok');
    }

    function setStatus(msg, kind) {
        statusEl.textContent = msg || '';
        statusEl.className = 'puzzle-status' + (kind ? ' puzzle-status--' + kind : '');
    }

    function showStartOverlay() {
        started = false; finished = false; revealed = false;
        stopTimer();
        timerEl.textContent = '00:00';
        if (startOverlay) startOverlay.style.display = 'flex';
        submitBtn.disabled = true;
    }
    function hideStartOverlay() {
        if (startOverlay) startOverlay.style.display = 'none';
    }

    function resetRound() {
        finished = false; started = false; revealed = false; moves = 0;
        stopTimer();
        timerEl.textContent = '00:00';
        const b = currentBoard();
        buildSolved();
        scramble();
        render();
        hintEl.textContent = '《' + (b.title || '') + '》 · ' + (b.dynasty || '') + ' · ' + (b.author || '');
        poemRevealEl.style.display = 'none';
        setStatus('', '');
        loadLeaderboard();
        loadMine();
        showStartOverlay();
    }

    /* ---------- 榜单 / 我的成绩 ---------- */
    async function loadLeaderboard() {
        try {
            const list = await getPuzzleLeaderboard(null, currentKey());
            renderLeaderboard(list);
        } catch (e) { /* 忽略 */ }
    }
    function renderLeaderboard(list) {
        if (!list || !list.length) {
            lbEl.innerHTML = '<div class="lb-empty">今日尚无成绩，抢先拿下第一名！</div>';
            return;
        }
        lbEl.innerHTML = list.map((s, i) => {
            const top = i === 0 ? ' lb-row--top' : '';
            return '<div class="lb-row' + top + '">' +
                '<span class="lb-rank">' + (i + 1) + '</span>' +
                '<span class="lb-name">' + escapeHtml(s.username) + '</span>' +
                '<span class="lb-time">' + fmt(s.seconds) + '</span>' +
                '</div>';
        }).join('');
    }
    async function loadMine() {
        if (!isLoggedIn()) {
            mineEl.innerHTML = '<span class="muted">登录后记录你的最佳成绩</span>';
            return;
        }
        try {
            const m = await getMyPuzzleScore(null, currentKey());
            if (m.hasScore) {
                mineEl.innerHTML = '我的最佳 <b>' + fmt(m.seconds) + '</b> · 第 <b>' + m.rank + '</b> 名';
            } else {
                mineEl.innerHTML = '<span class="muted">今日尚未完成，加油！</span>';
            }
        } catch (e) {
            mineEl.innerHTML = '<span class="muted">—</span>';
        }
    }

    /* ---------- 交互 ---------- */
    submitBtn.addEventListener('click', async () => {
        if (!started || finished) return;
        if (!isLoggedIn()) { setStatus('请先登录后再提交成绩。', 'bad'); return; }
        if (revealed) { setStatus('本局已查看原诗，成绩不计。重新打乱后可再挑战。', 'muted'); return; }
        if (!isSolved()) { setStatus('诗句还没拼对哦，继续加油。', 'bad'); return; }
        const sec = elapsed();
        submitBtn.disabled = true;
        try {
            const r = await submitPuzzleScore(null, currentKey(), sec);
            finished = true; stopTimer();
            setStatus('成绩已提交！最佳 ' + fmt(r.best) + ' · 第 ' + r.rank + ' 名 🎉', 'ok');
            loadLeaderboard();
            loadMine();
        } catch (e) {
            submitBtn.disabled = false;
            setStatus(e && e.message ? e.message : '提交失败，请稍后再试', 'bad');
        }
    });

    startBtn.addEventListener('click', () => {
        hideStartOverlay();
        started = true;
        submitBtn.disabled = !isLoggedIn() || revealed;
    });

    diffWrap.querySelectorAll('.diff-btn').forEach(b => {
        b.addEventListener('click', () => {
            if (!today) return;
            const d = b.dataset.diff;
            if (d === difficulty) return;
            difficulty = d;
            diffWrap.querySelectorAll('.diff-btn').forEach(x => x.classList.toggle('active', x === b));
            resetRound();
        });
    });

    reshuffleBtn.addEventListener('click', () => {
        if (!today) return;
        resetRound();
    });

    revealBtn.addEventListener('click', () => {
        if (!today) return;
        revealed = true; finished = true; started = true;
        stopTimer();
        submitBtn.disabled = true;
        showPoem();
        setStatus('已查看原诗，本局成绩不再计入榜单。可「重新打乱」后再次挑战。', 'muted');
    });

    /* ---------- 启动 ---------- */
    async function loadToday() {
        try {
            const p = await getTodayPuzzle();
            today = p;
            dateEl.textContent = new Date().toLocaleDateString('zh-CN');
            themeEl.textContent = '拼诗华容道';
            resetRound();
        } catch (e) {
            setStatus(e && e.message ? e.message : '加载失败，请刷新重试', 'bad');
        }
    }

    setupHeader();
    loadToday();
})();
