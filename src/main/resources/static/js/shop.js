/* 古董铺 —— 闲置集市首页：浏览、筛选、搜索、发布 */
(function () {
    const grid = document.getElementById('product-grid');
    const pager = document.getElementById('shop-pager');
    const hint = document.getElementById('shop-hint');
    const catFilter = document.getElementById('cat-filter');
    const kwInput = document.getElementById('kw-input');
    const mineBtn = document.getElementById('mine-btn');
    const publishBtn = document.getElementById('publish-btn');

    const submitModal = document.getElementById('submit-modal');
    const submitClose = document.getElementById('submit-close');
    const submitCancel = document.getElementById('submit-cancel');
    const productForm = document.getElementById('product-form');
    const productError = document.getElementById('product-error');

    // 错误显示：.error-msg 默认 display:none，必须显式切到 block 才看得见
    const setErr = (m) => { if (!productError) return; productError.textContent = m || ''; productError.style.display = m ? 'block' : 'none'; };

    let curPage = 0;
    let curCat = '';
    let curKw = '';
    let mineMode = false;
    let totalPages = 1;

    function fmtPrice(n) {
        const v = Number(n);
        return '¥' + (isNaN(v) ? '0.00' : v.toFixed(2));
    }

    function statusBadge(p) {
        if (p.status === 'SOLD') return '<span class="product-badge product-badge--sold">已售出</span>';
        if (p.status === 'REMOVED') return '<span class="product-badge product-badge--off">已下架</span>';
        return '<span class="product-badge product-badge--on">在售</span>';
    }

    function cardHtml(p) {
        const img = isImageSrc(p.image)
            ? '<img class="product-img" src="' + p.image + '" alt="' + escapeHtml(p.title) + '">'
            : '<div class="product-img product-img--empty">暂无图片</div>';
        const cond = p.itemCondition ? '<span class="product-cond">' + escapeHtml(p.itemCondition) + '</span>' : '';
        const cat = p.category ? '<span class="product-cat">' + escapeHtml(p.category) + '</span>' : '';
        return '<article class="product-card" data-id="' + p.id + '">' +
            '<div class="product-frame">' + img + statusBadge(p) + '</div>' +
            '<div class="product-body">' +
            '<h3>' + escapeHtml(p.title) + '</h3>' +
            '<div class="product-meta">' + cat + cond + '</div>' +
            '<div class="product-foot">' +
            '<span class="product-price">' + fmtPrice(p.price) + '</span>' +
            '<span class="product-seller">by ' + escapeHtml(p.sellerName || '佚名') + '</span>' +
            '</div>' +
            '</div>' +
            '</article>';
    }

    function renderGrid(list) {
        if (!list || list.length === 0) {
            grid.innerHTML = '<div class="empty-note">这里还没有闲置宝贝。' +
                (mineMode ? '' : '点击「发布闲置」上架第一件吧。') + '</div>';
            return;
        }
        grid.innerHTML = list.map(cardHtml).join('');
        grid.querySelectorAll('.product-card').forEach(c => {
            c.onclick = () => { location.href = 'product.html?id=' + c.dataset.id; };
        });
    }

    function renderPager() {
        if (totalPages <= 1) { pager.innerHTML = ''; return; }
        const prev = curPage > 0
            ? '<button class="btn" id="pg-prev">上一页</button>'
            : '<button class="btn" disabled>上一页</button>';
        const next = curPage < totalPages - 1
            ? '<button class="btn" id="pg-next">下一页</button>'
            : '<button class="btn" disabled>下一页</button>';
        pager.innerHTML = prev + '<span class="pager-info">第 ' + (curPage + 1) + ' / ' + totalPages + ' 页</span>' + next;
        const pv = document.getElementById('pg-prev');
        const nx = document.getElementById('pg-next');
        if (pv) pv.onclick = () => { curPage--; load(); };
        if (nx) nx.onclick = () => { curPage++; load(); };
    }

    async function load() {
        try {
            let data;
            if (mineMode) {
                data = await getMyProducts();
                totalPages = 1;
                renderGrid(data);
                pager.innerHTML = '';
            } else {
                data = await getShopProducts(curPage, 12, curCat, curKw);
                totalPages = data.totalPages || 1;
                renderGrid(data.list);
                renderPager();
            }
        } catch (e) {
            grid.innerHTML = '<div class="empty-note">加载失败：' + (e.message || '请稍后再试') + '</div>';
        }
    }

    /* ---------- 筛选 / 搜索 ---------- */
    catFilter.onchange = () => { curCat = catFilter.value; curPage = 0; load(); };
    let kwTimer = null;
    kwInput.oninput = () => {
        clearTimeout(kwTimer);
        kwTimer = setTimeout(() => { curKw = kwInput.value.trim(); curPage = 0; load(); }, 300);
    };

    /* ---------- 我的闲置 ---------- */
    mineBtn.onclick = () => {
        mineMode = !mineMode;
        mineBtn.classList.toggle('primary', mineMode);
        hint.textContent = mineMode ? '你发布的闲置（已售出的可在订单中查看）。' : '点击任意宝贝查看详情并下单。';
        curPage = 0;
        load();
    };

    /* ---------- 发布弹窗 ---------- */
    function openSubmit() {
        if (!isLoggedIn()) { location.href = 'login.html'; return; }
        productForm.reset();
        document.getElementById('image').value = '';
        document.getElementById('relicPreview').style.display = 'none';
        document.getElementById('relicClearBtn').style.display = 'none';
        setErr('');
        submitModal.hidden = false;
    }
    function closeSubmit() { submitModal.hidden = true; }
    publishBtn.onclick = openSubmit;
    submitClose.onclick = closeSubmit;
    submitCancel.onclick = closeSubmit;

    // 图片选择
    const relicPick = document.getElementById('relicPick');
    const relicPickBtn = document.getElementById('relicPickBtn');
    const relicClearBtn = document.getElementById('relicClearBtn');
    const relicPreview = document.getElementById('relicPreview');
    relicPickBtn.onclick = () => relicPick.click();
    // 宝贝图片：交互式 4:3 裁剪（可拖动选择保留区域）800x600 + JPEG 压缩
    relicPick.onchange = async () => {
        const file = relicPick.files && relicPick.files[0];
        if (!file) return;
        try {
            const r = await ImageUtils.crop(file, {
                aspect: 4/3, maxSize: 800, quality: 0.85, maxBytes: 2_500_000
            });
            if (!r) return;
            document.getElementById('image').value = r.dataUrl;
            relicPreview.innerHTML = '<img src="' + r.dataUrl + '" alt="预览">';
            relicPreview.style.display = 'block';
            relicClearBtn.style.display = '';
            setErr('');
            if (window.showToast) showToast('图片已处理：' + r.width + 'x' + r.height, 'success');
        } catch (e) {
            setErr(e.message || '图片处理失败');
        } finally {
            relicPick.value = '';
        }
    };
    relicClearBtn.onclick = () => {
        relicPick.value = '';
        document.getElementById('image').value = '';
        relicPreview.style.display = 'none';
        relicPreview.innerHTML = '';
        relicClearBtn.style.display = 'none';
    };

    productForm.onsubmit = async (e) => {
        e.preventDefault();
        setErr('');
        const fd = new FormData(productForm);
        const payload = {
            title: (fd.get('title') || '').toString().trim(),
            description: (fd.get('description') || '').toString().trim(),
            price: parseFloat(fd.get('price')),
            category: (fd.get('category') || '').toString().trim(),
            itemCondition: (fd.get('itemCondition') || '').toString().trim(),
            image: (fd.get('image') || '').toString().trim()
        };
        if (!payload.title) { setErr('标题不能为空'); return; }
        if (isNaN(payload.price) || payload.price < 0) { setErr('请填写正确的价格'); return; }
        publishBtn.disabled = true;
        try {
            await createProduct(payload);
            closeSubmit();
            mineMode = false;
            mineBtn.classList.remove('primary');
            curPage = 0; curCat = ''; curKw = '';
            catFilter.value = ''; kwInput.value = '';
            load();
        } catch (e2) {
            setErr(e2.message || '发布失败，请稍后再试');
        } finally {
            publishBtn.disabled = false;
        }
    };

    // 启动
    setupHeader();
    const u = getUser();
    if (u) mineBtn.style.display = '';
    const dEl = document.getElementById('masthead-date');
    if (dEl) dEl.textContent = new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    load();
})();
