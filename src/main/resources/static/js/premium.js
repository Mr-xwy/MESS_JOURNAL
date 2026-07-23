/* =========================================================================
 * premium.js —— 杂研 · 高级感升级（B 组合）
 * ① View Transitions 站内页面切换
 * ② 数字滚动计数（IntersectionObserver 触发）
 * ③ 字符逐字显示（hero 标题）
 * ⑤ 期号 / 日期标识填充
 * ⑥ 磁性按钮（光标靠近放大/位移）
 * B  3D 浮卡博物馆（拖拽 / 滚轮 / 触摸旋转 + 自动漂移 + 数据加载）
 * 全部尊重 prefers-reduced-motion；不依赖任何新库。
 * ========================================================================= */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------------------------------------------------------------
     * ⑤ 期号 / 日期标识：填充 .js-issue-date 为「日 · 月 · 年」
     * ------------------------------------------------------------- */
    function fillIssue() {
        var el = document.querySelector('.js-issue-date');
        if (!el) return;
        var d = new Date();
        var months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
            'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
        el.textContent = d.getDate() + ' · ' + months[d.getMonth()] + ' · ' + d.getFullYear();
    }

    /* ---------------------------------------------------------------
     * ③ 字符逐字显示：把 .js-char-reveal 的文本拆成逐字 span，错落淡入
     * ------------------------------------------------------------- */
    function charReveal() {
        var titles = document.querySelectorAll('.js-char-reveal');
        Array.prototype.forEach.call(titles, function (t) {
            var text = t.getAttribute('data-text') || t.textContent;
            t.textContent = '';
            t.setAttribute('aria-label', text);
            var chars = Array.from(text);
            Array.prototype.forEach.call(chars, function (ch, i) {
                var span = document.createElement('span');
                span.className = 'cr-char' + (ch === ' ' ? ' cr-char--space' : '');
                span.textContent = ch === ' ' ? ' ' : ch;
                if (!reduce) span.style.transitionDelay = (i * 55) + 'ms';
                else { span.style.opacity = '1'; span.style.transform = 'none'; }
                t.appendChild(span);
            });
            if (!reduce) {
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        var spans = t.querySelectorAll('.cr-char');
                        Array.prototype.forEach.call(spans, function (s) { s.classList.add('is-in'); });
                    });
                });
            }
        });
    }

    /* ---------------------------------------------------------------
     * ② 数字滚动计数：进入视口后从 0 滚动到 data-count
     * ------------------------------------------------------------- */
    function countUp() {
        var nums = document.querySelectorAll('.js-count');
        if (!nums.length) return;
        if (reduce || !('IntersectionObserver' in window)) {
            Array.prototype.forEach.call(nums, function (n) {
                n.textContent = (parseInt(n.getAttribute('data-count'), 10) || 0).toLocaleString('en-US');
            });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            Array.prototype.forEach.call(entries, function (en) {
                if (!en.isIntersecting) return;
                var el = en.target;
                io.unobserve(el);
                var target = parseInt(el.getAttribute('data-count'), 10) || 0;
                var dur = 1500, start = null;
                function tick(ts) {
                    if (start === null) start = ts;
                    var p = Math.min((ts - start) / dur, 1);
                    var eased = 1 - Math.pow(1 - p, 3);   // easeOutCubic
                    el.textContent = Math.round(eased * target).toLocaleString('en-US');
                    if (p < 1) requestAnimationFrame(tick);
                    else el.textContent = target.toLocaleString('en-US');
                }
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.4 });
        Array.prototype.forEach.call(nums, function (n) { io.observe(n); });
    }

    /* ---------------------------------------------------------------
     * ⑥ 磁性按钮：光标靠近时朝光标方向位移
     * ------------------------------------------------------------- */
    function magnetic() {
        if (reduce || !fine) return;
        var els = document.querySelectorAll('.magnetic');
        Array.prototype.forEach.call(els, function (el) {
            var max = 10;
            el.addEventListener('pointermove', function (e) {
                var r = el.getBoundingClientRect();
                var mx = e.clientX - (r.left + r.width / 2);
                var my = e.clientY - (r.top + r.height / 2);
                var x = Math.max(-max, Math.min(max, mx * 0.35));
                var y = Math.max(-max, Math.min(max, my * 0.35));
                el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
            });
            el.addEventListener('pointerleave', function () { el.style.transform = ''; });
        });
    }

    /* ---------------------------------------------------------------
     * ① View Transitions：拦截站内 .html 链接，做原生视图过渡
     *    （页面需含 <meta name="view-transition" content="same-origin">）
     * ------------------------------------------------------------- */
    function viewTransitions() {
        if (reduce) return;
        if (!('startViewTransition' in document)) return;
        document.addEventListener('click', function (e) {
            var a = e.target.closest && e.target.closest('a[href]');
            if (!a) return;
            var href = a.getAttribute('href');
            if (!href || href.indexOf('#') === 0) return;
            if (/^(https?:)?\/\//.test(href)) return;          // 外链
            if (a.target && a.target !== '_self') return;
            if (a.hasAttribute('download')) return;
            var url;
            try { url = new URL(href, location.href); } catch (err) { return; }
            if (url.origin !== location.origin) return;
            e.preventDefault();
            document.startViewTransition(function () { location.href = href; });
        });
    }

    /* ---------------------------------------------------------------
     * B · 3D 浮卡博物馆
     * ------------------------------------------------------------- */
    function relicCarousel() {
        var stage = document.getElementById('relic-carousel');
        if (!stage) return;
        var track = stage.querySelector('.rc-track');
        if (!track) return;

        var angle = 0;            // 当前整组旋转角（度）
        var autoVel = 0.018;      // 自动漂移速度（度/帧）
        var dragging = false, lastX = 0, vel = 0, raf = null;

        // 卡片数据由调用方 setCards() 注入；先渲染空轨道
        function renderRing() {
            var cards = Array.prototype.slice.call(track.children);
            var n = cards.length;
            if (!n) return;
            var theta = 360 / n;
            // 依据卡片宽度与张角计算半径，保证不重叠且弧度自然
            var cardW = cards[0].offsetWidth || 230;
            var radius = Math.max(220, Math.round((cardW / 2) / Math.tan(Math.PI / n) + 40));
            stage.style.setProperty('--rc-radius', radius + 'px');
            Array.prototype.forEach.call(cards, function (c, i) {
                c.style.setProperty('--i', i);
                c.style.transform = 'rotateY(' + (theta * i) + 'deg) translateZ(' + radius + 'px)';
            });
            track.dataset.theta = theta;
        }

        function applyTransform() {
            track.style.transform = 'rotateY(' + angle + 'deg)';
        }

        function loop() {
            if (!dragging) {
                angle += autoVel + vel;
                vel *= 0.94;                 // 拖拽惯性衰减
                if (Math.abs(vel) < 0.001) vel = 0;
                applyTransform();
            }
            raf = requestAnimationFrame(loop);
        }

        function startLoop() { if (!raf && !reduce) raf = requestAnimationFrame(loop); }

        // 滚轮旋转（桌面）
        stage.addEventListener('wheel', function (e) {
            if (reduce) return;
            e.preventDefault();
            angle += (e.deltaY > 0 ? 6 : -6);
            applyTransform();
        }, { passive: false });

        // 指针拖拽（鼠标 / 触摸统一）
        stage.addEventListener('pointerdown', function (e) {
            if (reduce) return;
            dragging = true; lastX = e.clientX; vel = 0;
            stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
        });
        stage.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var dx = e.clientX - lastX;
            lastX = e.clientX;
            angle += dx * 0.3;
            vel = dx * 0.3;
            applyTransform();
        });
        function endDrag() { dragging = false; }
        stage.addEventListener('pointerup', endDrag);
        stage.addEventListener('pointercancel', endDrag);
        stage.addEventListener('pointerleave', endDrag);

        // 点击卡片（非拖拽）打开详情
        track.addEventListener('click', function (e) {
            if (Math.abs(vel) > 1.2) return;     // 刚拖拽过，忽略误触
            var card = e.target.closest && e.target.closest('.rc-card');
            if (!card) return;
            var id = card.getAttribute('data-id');
            if (id && typeof openDetail === 'function') openDetail(parseInt(id, 10));
        });

        // 暴露给数据加载：用文物列表填充轨道
        window.__relicCarousel = {
            setRelics: function (list) {
                if (!list || !list.length) {
                    track.innerHTML = '';
                    stage.insertAdjacentHTML('beforeend',
                        '<div class="rc-empty">馆内暂无文物，敬请期待。</div>');
                    return;
                }
                track.innerHTML = '';
                list.forEach(function (r, i) {
                    var catNo = String(i + 1).padStart(3, '0');
                    var bg = (typeof isImageSrc === 'function' && isImageSrc(r.image))
                        ? 'background-image:url(\'' + r.image + '\')' : '';
                    var frame = bg
                        ? '<div class="rc-frame" style="' + bg + '"><span class="rc-catno">NO. ' + catNo + '</span></div>'
                        : '<div class="rc-frame rc-frame--empty">无图<span class="rc-catno">NO. ' + catNo + '</span></div>';
                    var dynasty = r.dynasty ? '<div class="rc-meta">' + escapeHtml(r.dynasty) + '</div>' : '';
                    var card = document.createElement('div');
                    card.className = 'rc-card';
                    card.setAttribute('data-id', r.id);
                    card.innerHTML =
                        '<div class="rc-card-inner">' + frame +
                        '<div class="rc-body">' +
                        '<h3 class="rc-title">' + escapeHtml(r.title) + '</h3>' +
                        dynasty +
                        '<div class="rc-loc">藏地：' + escapeHtml(r.location || '未知') + '</div>' +
                        '</div></div>';
                    track.appendChild(card);
                });
                renderRing();
                applyTransform();
                startLoop();
            }
        };

        // 自适应：窗口变化时重算半径
        window.addEventListener('resize', function () {
            if (reduce) return;
            renderRing(); applyTransform();
        });

        // 若页面已准备好数据（museum.js 会调用），这里等待；否则尝试自助加载
        if (typeof getRelics === 'function') {
            getRelics(0, 7).then(function (data) {
                var list = (data && data.list) || [];
                // 仅展示已发布
                list = list.filter(function (r) { return r.status === 'PUBLISHED'; });
                if (window.__relicCarousel) window.__relicCarousel.setRelics(list);
            }).catch(function () {
                if (window.__relicCarousel) window.__relicCarousel.setRelics([]);
            });
        }
    }

    /* ---------------------------------------------------------------
     * 启动
     * ------------------------------------------------------------- */
    function init() {
        fillIssue();
        charReveal();
        countUp();
        magnetic();
        viewTransitions();
        relicCarousel();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
