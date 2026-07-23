/* 商品详情 —— 展示宝贝档案，处理「立即购买」 */
(function () {
    const root = document.getElementById('product-detail');
    const id = new URLSearchParams(location.search).get('id');
    let current = null;

    function fmtPrice(n) {
        const v = Number(n);
        return '¥' + (isNaN(v) ? '0.00' : v.toFixed(2));
    }

    function condCat(p) {
        const parts = [];
        if (p.category) parts.push('<span class="product-cat">' + escapeHtml(p.category) + '</span>');
        if (p.itemCondition) parts.push('<span class="product-cond">' + escapeHtml(p.itemCondition) + '</span>');
        return parts.join('');
    }

    function render(p) {
        const img = isImageSrc(p.image)
            ? '<img class="product-img" src="' + p.image + '" alt="' + escapeHtml(p.title) + '">'
            : '<div class="product-img product-img--empty">暂无图片</div>';

        const isSeller = (() => {
            const u = getUser();
            return u && p.sellerId && u.id === p.sellerId;
        })();

        let actionHtml;
        if (p.status === 'SOLD') {
            actionHtml = '<button class="btn" disabled>已售出</button>';
        } else if (p.status === 'REMOVED') {
            actionHtml = '<button class="btn" disabled>已下架</button>';
        } else if (isSeller) {
            actionHtml = '<div class="product-own-note">这是你发布的商品，无法购买自己的闲置。</div>';
        } else {
            actionHtml = '<button class="btn primary" id="buy-btn"><svg class="icon"><use href="#icon-tag"/></svg> 立即购买</button>';
        }

        root.innerHTML =
            '<div class="product-detail-plate">' +
            '<div class="product-frame product-frame--big">' + img + '</div>' +
            '</div>' +
            '<div class="product-detail-panel">' +
            '<h2>' + escapeHtml(p.title) + '</h2>' +
            '<div class="product-detail-meta">' + condCat(p) + '</div>' +
            '<div class="product-detail-price">' + fmtPrice(p.price) + '</div>' +
            '<div class="rd-row"><span class="rd-k">卖家</span><span class="rd-v">' + escapeHtml(p.sellerName || '佚名') + '</span></div>' +
            (p.description ? '<div class="product-detail-desc"><div class="relic-desc-label">宝贝描述</div><p>' + escapeHtml(p.description).replace(/\n/g, '<br>') + '</p></div>' : '') +
            '<div class="product-buy-row">' + actionHtml + '</div>' +
            '</div>';

        const buyBtn = document.getElementById('buy-btn');
        if (buyBtn) {
            buyBtn.onclick = () => {
                if (!isLoggedIn()) { location.href = 'login.html'; return; }
                location.href = 'checkout.html?productId=' + p.id;
            };
        }
    }

    async function init() {
        setupHeader();
        if (!id) { root.innerHTML = '<div class="empty-note">缺少商品ID。</div>'; return; }
        try {
            current = await getShopProduct(id);
            render(current);
        } catch (e) {
            root.innerHTML = '<div class="empty-note">加载失败：' + (e.message || '商品不存在') + '</div>';
        }
    }
    init();
})();
