/* 付款页 —— 展示订单结算信息；付款通道暂未开通，按钮置灰不可点 */
(function () {
    const root = document.getElementById('payment-card');
    const orderId = new URLSearchParams(location.search).get('orderId');

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

    function render(o) {
        const img = isImageSrc(o.productImage)
            ? '<img class="order-thumb" src="' + o.productImage + '" alt="">'
            : '<div class="order-thumb order-thumb--empty">无图</div>';
        const paid = o.status === 'PAID';

        root.innerHTML =
            '<div class="payment-head">' +
            '<div class="payment-order-no">订单号：' + escapeHtml(o.orderNo || '') + '</div>' +
            '<span class="order-status ' + statusClass(o.status) + '">' + statusText(o.status) + '</span>' +
            '</div>' +
            '<div class="payment-item">' +
            '<div class="order-thumb-wrap">' + img + '</div>' +
            '<div class="order-info">' +
            '<h3>' + escapeHtml(o.productTitle || '商品') + '</h3>' +
            '<div class="order-meta">卖家：' + escapeHtml(o.sellerName || '佚名') + '</div>' +
            '</div>' +
            '<div class="order-price">' + fmtPrice(o.price) + '</div>' +
            '</div>' +
            '<div class="payment-rows">' +
            '<div class="rd-row"><span class="rd-k">收货人</span><span class="rd-v">' + escapeHtml(o.contactName || '—') + '</span></div>' +
            '<div class="rd-row"><span class="rd-k">电话</span><span class="rd-v">' + escapeHtml(o.contactPhone || '—') + '</span></div>' +
            '<div class="rd-row"><span class="rd-k">地址</span><span class="rd-v">' + escapeHtml(o.contactAddress || '—') + '</span></div>' +
            (o.note ? '<div class="rd-row"><span class="rd-k">留言</span><span class="rd-v">' + escapeHtml(o.note) + '</span></div>' : '') +
            '<div class="rd-row payment-total-row"><span class="rd-k">应付金额</span><span class="rd-v payment-total">' + fmtPrice(o.price) + '</span></div>' +
            '</div>' +
            '<div class="payment-actions">' +
            (paid
                ? '<div class="payment-done">本订单已付款。</div>'
                : '<button class="btn primary" id="pay-btn" disabled><svg class="icon"><use href="#icon-tag"/></svg> 立即付款</button>' +
                  '<div class="payment-note">支付通道暂未开通，付款按钮暂不可选。</div>') +
            '<a href="orders.html" class="link-btn">查看我的订单</a>' +
            '</div>';

        // 付款按钮已置灰（disabled），此处仅作占位，后续接入支付网关后再启用
        const payBtn = document.getElementById('pay-btn');
        if (payBtn) payBtn.onclick = () => { /* TODO: 接入支付网关 */ };
    }

    async function init() {
        setupHeader();
        if (!isLoggedIn()) { location.href = 'login.html'; return; }
        if (!orderId) { root.innerHTML = '<div class="empty-note">缺少订单ID。</div>'; return; }
        try {
            const o = await getOrder(orderId);
            render(o);
        } catch (e) {
            root.innerHTML = '<div class="empty-note">加载失败：' + (e.message || '订单不存在') + '</div>';
        }
    }
    init();
})();
