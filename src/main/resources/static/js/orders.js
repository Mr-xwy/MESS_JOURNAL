/* 我的订单 —— 我买的 / 我卖的 双 Tab */
(function () {
    const listEl = document.getElementById('order-list');
    const tabs = document.querySelectorAll('.inbox-tab');
    let curTab = 'bought';

    function fmtPrice(n) {
        const v = Number(n);
        return '¥' + (isNaN(v) ? '0.00' : v.toFixed(2));
    }
    function statusText(s) {
        return s === 'PENDING' ? '待付款' : s === 'PAID' ? '已付款' : '已取消';
    }
    function statusClass(s) {
        return s === 'PENDING' ? 'order-status--pending'
            : s === 'PAID' ? 'order-status--paid' : 'order-status--cancelled';
    }

    function cardHtml(o, role) {
        const counterparty = role === 'bought'
            ? '卖家：' + escapeHtml(o.sellerName || '佚名')
            : '买家：' + escapeHtml(o.buyerName || '佚名');
        const img = isImageSrc(o.productImage)
            ? '<img class="order-thumb" src="' + o.productImage + '" alt="">'
            : '<div class="order-thumb order-thumb--empty">无图</div>';
        return '<article class="order-card" data-id="' + o.id + '">' +
            '<div class="order-thumb-wrap">' + img + '</div>' +
            '<div class="order-info">' +
            '<h3>' + escapeHtml(o.productTitle || '商品') + '</h3>' +
            '<div class="order-meta">' + counterparty + ' · ' + fmtTime(o.createdAt) + '</div>' +
            '</div>' +
            '<div class="order-right">' +
            '<div class="order-price">' + fmtPrice(o.price) + '</div>' +
            '<span class="order-status ' + statusClass(o.status) + '">' + statusText(o.status) + '</span>' +
            (o.status === 'PENDING' ? '<a class="link-btn order-view" href="payment.html?orderId=' + o.id + '">去付款</a>' : '<a class="link-btn order-view" href="payment.html?orderId=' + o.id + '">查看</a>') +
            '</div>' +
            '</article>';
    }

    async function render(tab) {
        try {
            const data = tab === 'bought' ? await getMyOrders() : await getSoldOrders();
            if (!data || data.length === 0) {
                listEl.innerHTML = '<div class="empty-note">' + (tab === 'bought' ? '你还没有购买任何闲置。' : '还没有人购买你发布的闲置。') + '</div>';
                return;
            }
            listEl.innerHTML = data.map(o => cardHtml(o, tab)).join('');
        } catch (e) {
            listEl.innerHTML = '<div class="empty-note">加载失败：' + (e.message || '请稍后再试') + '</div>';
        }
    }

    tabs.forEach(t => {
        t.onclick = () => {
            tabs.forEach(x => x.classList.remove('active'));
            t.classList.add('active');
            curTab = t.dataset.tab;
            render(curTab);
        };
    });

    async function init() {
        setupHeader();
        if (!isLoggedIn()) { location.href = 'login.html'; return; }
        render(curTab);
    }
    init();
})();
