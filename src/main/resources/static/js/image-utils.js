/* ============================================================
 * image-utils.js — 上传图片自动处理（居中裁剪 + 缩放 + JPEG 压缩）
 *
 * 用法 1（标准结构直接接入）：
 *   ImageUtils.bind({
 *     fileId: 'avatarFile',     // <input type=file>  id
 *     hiddenId: 'avatar',       // <input type=hidden>  id，用于存 dataURL
 *     previewId: 'avatarPreview',// <img> 预览 id
 *     placeholderId: 'avatarPlaceholder', // 站位图 id（可选）
 *     clearId: 'avatarClear',   // 「移除」按钮 id（可选）
 *     pickId: 'avatarPick',     // 「选择图片」按钮 id（可选）
 *     aspect: 1,                // 1=正方形（头像/封面）；4/3=横版（商品/文物）；NaN=不裁剪只缩放
 *     maxSize: 800,             // 边长上限（像素）
 *     quality: 0.85,            // 初始 JPEG 质量
 *     maxBytes: 3_500_000       // 超过此字节数自动降质量再压，最低 0.4
 *   });
 *
 * 用法 2（自己控制流程）：
 *   const { dataUrl, width, height, bytes } =
 *     await ImageUtils.fileToDataUrl(file, { aspect: 1, maxSize: 256, quality: 0.85, maxBytes: 200_000 });
 *
 * 用法 3（交互式裁剪，类似微信头像上传：弹窗选区域）：
 *   const r = await ImageUtils.crop(file, { aspect: 1, maxSize: 256, quality: 0.85, maxBytes: 200_000, round: true });
 *   if (!r) return; // 用户点了取消
 * ============================================================ */
(function () {
    'use strict';

    /** 把 File 读取为 Image */
    function readImage(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !file.type || file.type.indexOf('image/') !== 0) {
                reject(new Error('请选择图片文件')); return;
            }
            if (file.size > 25 * 1024 * 1024) {
                reject(new Error('图片文件超过 25MB，请先在系统里压缩')); return;
            }
            const reader = new FileReader();
            reader.onerror = function () { reject(new Error('读取文件失败')); };
            reader.onload = function () {
                const img = new Image();
                img.onerror = function () { reject(new Error('图片解析失败')); };
                img.onload = function () { resolve(img); };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /** 估算 base64 dataURL 的字节数（去掉前缀部分，base64 4字符≈3字节） */
    function estimateBytes(dataUrl) {
        const i = dataUrl.indexOf(',');
        if (i < 0) return dataUrl.length;
        const b64 = dataUrl.length - i - 1;
        return Math.floor(b64 * 3 / 4);
    }

    /** 居中裁剪 + 缩放 + JPEG 压缩；如超过 maxBytes 自动降质量再压（最低 0.4） */
    function cropAndCompress(img, opts) {
        const aspect = opts.aspect;
        const maxSize = opts.maxSize || 800;
        const quality = opts.quality || 0.85;
        const maxBytes = opts.maxBytes || 3_500_000;

        let sx, sy, sw, sh;
        if (!aspect || isNaN(aspect)) {
            // 不裁剪，按最长边等比缩到 maxSize
            sx = 0; sy = 0; sw = img.width; sh = img.height;
            const scale = Math.min(1, maxSize / Math.max(sw, sh));
            const dw = Math.max(1, Math.round(sw * scale));
            const dh = Math.max(1, Math.round(sh * scale));
            return drawAndCompress(img, sx, sy, sw, sh, dw, dh, quality, maxBytes);
        }

        // 居中按比例裁剪：算出取景框（按目标 aspect 居中取最大区域）
        const srcRatio = img.width / img.height;
        const targetRatio = aspect;
        if (srcRatio > targetRatio) {
            // 源更宽 → 按高度取，宽度裁掉两侧
            sh = img.height;
            sw = img.height * targetRatio;
            sx = (img.width - sw) / 2;
            sy = 0;
        } else {
            // 源更高 → 按宽度取，高度裁掉上下
            sw = img.width;
            sh = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sh) / 2;
        }
        // 输出尺寸：取景框内缩到 maxSize
        const scale = Math.min(1, maxSize / Math.max(sw, sh));
        const dw = Math.max(1, Math.round(sw * scale));
        const dh = Math.max(1, Math.round(sh * scale));
        return drawAndCompress(img, sx, sy, sw, sh, dw, dh, quality, maxBytes);
    }

    function drawAndCompress(img, sx, sy, sw, sh, dw, dh, quality, maxBytes) {
        const canvas = document.createElement('canvas');
        canvas.width = dw;
        canvas.height = dh;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 白底防 PNG 透明区域变黑（JPEG 不支持透明）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, dw, dh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let bytes = estimateBytes(dataUrl);
        let q = quality;
        while (bytes > maxBytes && q > 0.4) {
            q = Math.max(0.4, q - 0.1);
            dataUrl = canvas.toDataURL('image/jpeg', q);
            bytes = estimateBytes(dataUrl);
        }
        return { dataUrl: dataUrl, width: dw, height: dh, bytes: bytes, quality: q };
    }

    /** 入口：File -> { dataUrl, width, height, bytes, quality } */
    function fileToDataUrl(file, opts) {
        opts = Object.assign({ aspect: 1, maxSize: 800, quality: 0.85, maxBytes: 3_500_000 }, opts || {});
        return readImage(file).then(function (img) { return cropAndCompress(img, opts); });
    }

    /**
     * 标准表单结构接入：选择 → 裁剪 → 写隐藏域 → 预览 → 提示
     * 字段：fileId（必填） / hiddenId（必填） / previewId（必填） / placeholderId/clearId/pickId（可选）
     */
    function bind(cfg) {
        const $ = function (id) { return document.getElementById(id); };
        const file = $(cfg.fileId);
        if (!file) return;
        const hidden = $(cfg.hiddenId);
        const preview = $(cfg.previewId);
        const placeholder = cfg.placeholderId ? $(cfg.placeholderId) : null;
        const clearBtn = cfg.clearId ? $(cfg.clearId) : null;
        const pickBtn = cfg.pickId ? $(cfg.pickId) : null;
        const onChange = cfg.onChange;

        if (pickBtn) pickBtn.onclick = function () { file.click(); };

        file.addEventListener('change', async function (e) {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            try {
                const r = await fileToDataUrl(f, cfg);
                if (hidden) hidden.value = r.dataUrl;
                if (preview) { preview.src = r.dataUrl; preview.hidden = false; }
                if (placeholder) placeholder.hidden = true;
                if (clearBtn) clearBtn.hidden = false;
                if (typeof onChange === 'function') onChange(r);
                if (window.showToast) {
                    const kb = (r.bytes / 1024).toFixed(0);
                    window.showToast('图片已处理：' + r.width + '×' + r.height + '，约 ' + kb + ' KB', 'success');
                }
            } catch (err) {
                if (window.showToast) window.showToast('图片处理失败：' + err.message, 'error');
                else if (window.alert) window.alert(err.message);
            } finally {
                file.value = '';
            }
        });

        if (clearBtn) {
            clearBtn.onclick = function () {
                if (hidden) hidden.value = '';
                if (preview) { preview.src = ''; preview.hidden = true; }
                if (placeholder) placeholder.hidden = false;
                clearBtn.hidden = true;
            };
        }
    }

    /** 注入一次裁剪器样式（随站点主题变量走，带兜底色） */
    let cropStyleInjected = false;
    function ensureCropStyle() {
        if (cropStyleInjected) return;
        const css = [
            '.iu-crop-overlay{position:fixed;inset:0;background:rgba(20,18,14,.72);display:flex;align-items:center;justify-content:center;z-index:9999;}',
            '.iu-crop-dialog{background:var(--surface,#fbf8f3);color:var(--ink,#222);border-radius:16px;padding:18px;width:min(92vw,360px);box-shadow:0 20px 60px rgba(0,0,0,.45);font-family:inherit;}',
            '.iu-crop-title{font-weight:700;font-size:16px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;}',
            '.iu-crop-title small{font-size:12px;opacity:.6;font-weight:400;}',
            '.iu-crop-stage{position:relative;overflow:hidden;background:#111;border-radius:10px;touch-action:none;user-select:none;cursor:grab;margin:0 auto;}',
            '.iu-crop-stage.grabbing{cursor:grabbing;}',
            '.iu-crop-img{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform;pointer-events:none;max-width:none;}',
            '.iu-crop-frame{position:absolute;border:1px solid rgba(255,255,255,.9);box-shadow:0 0 0 9999px rgba(0,0,0,.55);box-sizing:border-box;pointer-events:none;}',
            '.iu-crop-frame.round{border-radius:50%;}',
            '.iu-crop-zoom{display:flex;align-items:center;gap:10px;margin:14px 2px;}',
            '.iu-crop-zoom input[type=range]{flex:1;accent-color:var(--accent,#7a5cff);}',
            '.iu-crop-zoom button,.iu-crop-actions button{font:inherit;cursor:pointer;border:1px solid rgba(0,0,0,.15);background:#fff;border-radius:8px;}',
            '.iu-crop-zoom button{width:34px;height:34px;font-size:18px;line-height:1;}',
            '.iu-crop-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:4px;}',
            '.iu-crop-actions button{padding:9px 18px;border-radius:10px;}',
            '.iu-crop-actions .iu-crop-ok{background:var(--accent,#7a5cff);color:#fff;border-color:transparent;}'
        ].join('\n');
        const st = document.createElement('style');
        st.id = 'iu-crop-style';
        st.textContent = css;
        document.head.appendChild(st);
        cropStyleInjected = true;
    }

    /** 交互式裁剪入口（类似微信头像上传）：返回 Promise<{dataUrl,width,height,bytes,quality}> 或 null（取消） */
    function crop(file, opts) {
        opts = Object.assign(
            { aspect: 1, maxSize: 800, quality: 0.85, maxBytes: 3_500_000, round: false },
            opts || {}
        );
        if (opts.aspect === 1) opts.round = (opts.round !== false);
        return readImage(file).then(function (img) {
            return openCropModal(img, opts);
        });
    }

    /** 打开裁剪弹窗。确认返回结果对象；取消/ESC 返回 null。 */
    function openCropModal(img, opts) {
        return new Promise(function (resolve) {
            ensureCropStyle();
            const overlay = document.createElement('div');
            overlay.className = 'iu-crop-overlay';
            const dialog = document.createElement('div');
            dialog.className = 'iu-crop-dialog';

            const title = document.createElement('div');
            title.className = 'iu-crop-title';
            const t1 = document.createElement('span');
            t1.textContent = '调整图片';
            const t2 = document.createElement('small');
            t2.textContent = (opts.aspect === 1) ? '拖动 / 缩放选择头像区域' : '拖动 / 缩放选择保留区域';
            title.appendChild(t1);
            title.appendChild(t2);

            const STAGE = 300;
            const stage = document.createElement('div');
            stage.className = 'iu-crop-stage';
            stage.style.width = STAGE + 'px';
            stage.style.height = STAGE + 'px';

            const frame = document.createElement('div');
            frame.className = 'iu-crop-frame' + (opts.round ? ' round' : '');
            const frameW = 260;
            const frameH = (opts.aspect >= 1)
                ? Math.round(frameW / opts.aspect)
                : Math.round(frameW * opts.aspect);
            frame.style.width = frameW + 'px';
            frame.style.height = frameH + 'px';
            const fx = (STAGE - frameW) / 2;
            const fy = (STAGE - frameH) / 2;
            frame.style.left = fx + 'px';
            frame.style.top = fy + 'px';

            const im = document.createElement('img');
            im.className = 'iu-crop-img';
            im.src = img.src;

            const zoom = document.createElement('div');
            zoom.className = 'iu-crop-zoom';
            const minus = document.createElement('button');
            minus.type = 'button';
            minus.textContent = '-';
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = '0';
            const plus = document.createElement('button');
            plus.type = 'button';
            plus.textContent = '+';
            zoom.appendChild(minus);
            zoom.appendChild(slider);
            zoom.appendChild(plus);

            const actions = document.createElement('div');
            actions.className = 'iu-crop-actions';
            const cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.textContent = '取消';
            const ok = document.createElement('button');
            ok.type = 'button';
            ok.className = 'iu-crop-ok';
            ok.textContent = '选择';
            actions.appendChild(cancel);
            actions.appendChild(ok);

            stage.appendChild(im);
            stage.appendChild(frame);
            dialog.appendChild(title);
            dialog.appendChild(stage);
            dialog.appendChild(zoom);
            dialog.appendChild(actions);
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // ---- 变换状态 ----
            let scale = 1, tx = 0, ty = 0;
            const minScale = Math.max(frameW / img.width, frameH / img.height);

            function render() {
                im.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
            }
            function clampPos() {
                const dispW = img.width * scale, dispH = img.height * scale;
                const minTx = fx + frameW - dispW, maxTx = fx;
                const minTy = fy + frameH - dispH, maxTy = fy;
                if (tx < minTx) tx = minTx;
                if (tx > maxTx) tx = maxTx;
                if (ty < minTy) ty = minTy;
                if (ty > maxTy) ty = maxTy;
            }
            function syncSlider() {
                slider.value = String(Math.round((scale / minScale - 1) / 3 * 100));
            }
            function zoomBy(f) {
                scale = Math.max(minScale, Math.min(minScale * 4, scale * f));
                clampPos();
                render();
                syncSlider();
            }
            function resetView() {
                scale = minScale;
                const dispW = img.width * scale, dispH = img.height * scale;
                tx = fx + (frameW - dispW) / 2;
                ty = fy + (frameH - dispH) / 2;
                render();
            }
            resetView();

            // ---- 指针：单指拖拽 / 双指捏合 ----
            const pointers = new Map();
            let dragStart = null, pinchStart = null;
            function rectMid() {
                const r = stage.getBoundingClientRect();
                const pts = Array.from(pointers.values());
                const sx = pts.reduce(function (a, p) { return a + p.x; }, 0) / pts.length;
                const sy = pts.reduce(function (a, p) { return a + p.y; }, 0) / pts.length;
                return {
                    mx: sx - r.left,
                    my: sy - r.top,
                    dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
                };
            }
            stage.addEventListener('pointerdown', function (e) {
                stage.setPointerCapture(e.pointerId);
                pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (pointers.size === 1) {
                    dragStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
                    stage.classList.add('grabbing');
                } else if (pointers.size === 2) {
                    pinchStart = { p: rectMid(), scale: scale, tx: tx, ty: ty };
                }
            });
            stage.addEventListener('pointermove', function (e) {
                if (!pointers.has(e.pointerId)) return;
                pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
                if (pointers.size === 1 && dragStart) {
                    tx = dragStart.tx + (e.clientX - dragStart.x);
                    ty = dragStart.ty + (e.clientY - dragStart.y);
                    clampPos();
                    render();
                } else if (pointers.size === 2 && pinchStart) {
                    const p = rectMid();
                    let ns = pinchStart.scale * (p.dist / pinchStart.p.dist);
                    ns = Math.max(minScale, Math.min(minScale * 4, ns));
                    scale = ns;
                    tx = pinchStart.tx + (p.mx - pinchStart.p.mx);
                    ty = pinchStart.ty + (p.my - pinchStart.p.my);
                    clampPos();
                    render();
                    syncSlider();
                }
            });
            function endPointer(e) {
                pointers.delete(e.pointerId);
                if (pointers.size < 2) pinchStart = null;
                if (pointers.size === 0) {
                    dragStart = null;
                    stage.classList.remove('grabbing');
                } else if (pointers.size === 1) {
                    const r = pointers.values().next().value;
                    dragStart = { x: r.x, y: r.y, tx: tx, ty: ty };
                }
            }
            stage.addEventListener('pointerup', endPointer);
            stage.addEventListener('pointercancel', endPointer);
            stage.addEventListener('wheel', function (e) {
                e.preventDefault();
                zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
            }, { passive: false });

            minus.onclick = function () { zoomBy(1 / 1.15); };
            plus.onclick = function () { zoomBy(1.15); };
            slider.addEventListener('input', function () {
                scale = minScale * (1 + 3 * (slider.value / 100));
                clampPos();
                render();
            });

            // ---- 确认 / 取消 ----
            function onKey(e) { if (e.key === 'Escape') doCancel(); }
            function cleanup() {
                document.removeEventListener('keydown', onKey);
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            }
            function doCancel() { cleanup(); resolve(null); }
            function doConfirm() {
                const sx = (fx - tx) / scale;
                const sy = (fy - ty) / scale;
                const sw = frameW / scale;
                const sh = frameH / scale;
                let outW, outH;
                if (opts.aspect >= 1) {
                    outW = opts.maxSize;
                    outH = Math.round(opts.maxSize / opts.aspect);
                } else {
                    outH = opts.maxSize;
                    outW = Math.round(opts.maxSize * opts.aspect);
                }
                const canvas = document.createElement('canvas');
                canvas.width = outW;
                canvas.height = outH;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, outW, outH);
                const csx = Math.max(0, sx), csy = Math.max(0, sy);
                const csw = Math.min(sw, img.width - csx), csh = Math.min(sh, img.height - csy);
                ctx.drawImage(img, csx, csy, csw, csh, 0, 0, outW, outH);
                let dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
                let bytes = estimateBytes(dataUrl);
                let q = opts.quality;
                while (bytes > opts.maxBytes && q > 0.4) {
                    q = Math.max(0.4, q - 0.1);
                    dataUrl = canvas.toDataURL('image/jpeg', q);
                    bytes = estimateBytes(dataUrl);
                }
                cleanup();
                resolve({ dataUrl: dataUrl, width: outW, height: outH, bytes: bytes, quality: q });
            }
            cancel.onclick = doCancel;
            ok.onclick = doConfirm;
            document.addEventListener('keydown', onKey);
        });
    }

    window.ImageUtils = { fileToDataUrl: fileToDataUrl, crop: crop, bind: bind, cropAndCompress: cropAndCompress };
})();
