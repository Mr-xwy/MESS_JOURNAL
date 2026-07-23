/* 订单确认页 —— 预览商品快照 + 填写收货信息，提交后跳付款页 */
(function () {
    const root = document.getElementById('checkout-grid');
    const productId = new URLSearchParams(location.search).get('productId');

    function fmtPrice(n) {
        const v = Number(n);
        return '¥' + (isNaN(v) ? '0.00' : v.toFixed(2));
    }

    function render(p) {
        const img = isImageSrc(p.image)
            ? '<img class="product-img" src="' + p.image + '" alt="' + escapeHtml(p.title) + '">'
            : '<div class="product-img product-img--empty">暂无图片</div>';
        const cond = p.itemCondition ? '<span class="product-cond">' + escapeHtml(p.itemCondition) + '</span>' : '';
        const cat = p.category ? '<span class="product-cat">' + escapeHtml(p.category) + '</span>' : '';

        root.innerHTML =
            '<div class="checkout-snapshot">' +
            '<div class="section-heading"><h2>宝贝快照</h2><div class="sub">ORDER ITEM</div></div>' +
            '<div class="checkout-item">' +
            '<div class="product-frame">' + img + '</div>' +
            '<div class="checkout-item-info">' +
            '<h3>' + escapeHtml(p.title) + '</h3>' +
            '<div class="product-meta">' + cat + cond + '</div>' +
            '<div class="checkout-item-price">' + fmtPrice(p.price) + '</div>' +
            '<div class="checkout-item-seller">卖家：' + escapeHtml(p.sellerName || '佚名') + '</div>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="checkout-form-wrap">' +
            '<div class="section-heading"><h2>收货信息</h2><div class="sub">SHIP TO</div></div>' +
            '<form id="checkout-form">' +
            '<div class="field"><label>收货人 *</label><input class="input" name="contactName" required placeholder="收件人姓名"></div>' +
            '<div class="field"><label>联系电话</label><input class="input" name="contactPhone" placeholder="选填"></div>' +
            '<div class="field"><label>收货地址 *</label><textarea class="textarea" name="contactAddress" rows="2" required placeholder="详细收件地址"></textarea></div>' +
            '<div class="field"><label>买家留言</label><textarea class="textarea" name="note" rows="2" placeholder="选填，写给卖家的话"></textarea></div>' +
            '<div class="checkout-total">应付金额：<span class="checkout-total-num">' + fmtPrice(p.price) + '</span></div>' +
            '<div class="error-msg" id="checkout-error"></div>' +
            '<div class="editor-actions">' +
            '<button type="submit" class="btn primary" id="submit-order">提交订单</button>' +
            '<a href="product.html?id=' + p.id + '" class="link-btn">返回宝贝</a>' +
            '</div>' +
            '</form>' +
            '</div>';

        const form = document.getElementById('checkout-form');
        const errEl = document.getElementById('checkout-error');
        const submitBtn = document.getElementById('submit-order');
        // 错误显示：.error-msg 默认 display:none，必须显式切到 block 才看得见
        const setErr = (m) => { if (!errEl) return; errEl.textContent = m || ''; errEl.style.display = m ? 'block' : 'none'; };
        form.onsubmit = async (e) => {
            e.preventDefault();
            setErr('');
            const fd = new FormData(form);
            const payload = {
                productId: p.id,
                contactName: (fd.get('contactName') || '').toString().trim(),
                contactPhone: (fd.get('contactPhone') || '').toString().trim(),
                contactAddress: (fd.get('contactAddress') || '').toString().trim(),
                note: (fd.get('note') || '').toString().trim()
            };
            if (!payload.contactName) { setErr('请填写收货人'); return; }
            if (!payload.contactAddress) { setErr('请填写收货地址'); return; }
            submitBtn.disabled = true;
            try {
                const order = await createOrder(payload);
                location.href = 'payment.html?orderId=' + order.id;
            } catch (ex) {
                setErr(ex.message || '提交订单失败，请稍后再试');
                submitBtn.disabled = false;
            }
        };
    }

    async function init() {
        setupHeader();
        if (!isLoggedIn()) { location.href = 'login.html'; return; }
        if (!productId) { root.innerHTML = '<div class="empty-note">缺少商品ID。</div>'; return; }
        try {
            const p = await getShopProduct(productId);
            if (p.status !== 'AVAILABLE') {
                root.innerHTML = '<div class="empty-note">该商品已' + (p.status === 'SOLD' ? '售出' : '下架') + '，无法下单。</div>';
                return;
            }
            render(p);
        } catch (e) {
            root.innerHTML = '<div class="empty-note">加载失败：' + (e.message || '商品不存在') + '</div>';
        }
    }
    init();
})();
