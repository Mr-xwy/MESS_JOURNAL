/* engraving.js —— 版画工坊：纯前端 Canvas 影像制版（老照片 / 木刻线描） */

const PAPER = '#efe6cf';
const INK = '#2a2018';

let originalImage = null;
let currentMode = 'vintage';

const canvas = document.getElementById('eng-canvas');
const ctx = canvas.getContext('2d');
const off = document.createElement('canvas');
const octx = off.getContext('2d');
const fileInput = document.getElementById('file');
const drop = document.getElementById('drop');
const emptyEl = document.getElementById('eng-empty');

function lim(v) {
    return v < 0 ? 0 : (v > 255 ? 255 : v);
}

function fillMastheadDate() {
    const el = document.getElementById('masthead-date');
    if (!el) return;
    const d = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    el.textContent = days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function loadFile(file) {
    if (!file || !file.type || !file.type.startsWith('image/')) return;
    // 先经 image-utils 自动缩放（最长边 ≤1024px，不裁剪），避免超大图拖垮画布处理
    ImageUtils.fileToDataUrl(file, { aspect: NaN, maxSize: 1024, quality: 0.9, maxBytes: 1_500_000 })
        .then(function (r) {
            const img = new Image();
            img.onload = function () {
                originalImage = img;
                emptyEl.style.display = 'none';
                document.getElementById('download-btn').disabled = false;
                render();
            };
            img.src = r.dataUrl;
        })
        .catch(function (err) {
            if (window.showToast) showToast('图片处理失败：' + err.message, 'error');
            else if (window.alert) window.alert(err.message);
        });
}

function render() {
    if (!originalImage) return;
    if (currentMode === 'vintage') renderVintage();
    else renderWoodcut();
}

/* ---------- 老照片：sepia + 半调网点 + 颗粒 + 暗角 ---------- */
function renderVintage() {
    const img = originalImage;
    const maxW = 900;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    canvas.width = w; canvas.height = h;
    off.width = w; off.height = h;

    const sepia = parseFloat(document.getElementById('sepia').value);
    const contrast = parseFloat(document.getElementById('contrast').value);
    const cell = parseInt(document.getElementById('halftone').value, 10);
    const grain = parseFloat(document.getElementById('grain').value);
    const vignette = parseFloat(document.getElementById('vignette').value);

    octx.drawImage(img, 0, 0, w, h);
    const id = octx.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
        let r = d[i], g = d[i + 1], b = d[i + 2];
        let lum = 0.299 * r + 0.587 * g + 0.114 * b;
        lum = (lum - 128) * contrast + 128;
        r = lim(lum + 42 * sepia);
        g = lim(lum + 14 * sepia);
        b = lim(lum - 32 * sepia);
        const n = (Math.random() - 0.5) * grain * 70;
        d[i] = lim(r + n); d[i + 1] = lim(g + n); d[i + 2] = lim(b + n);
    }
    octx.putImageData(id, 0, 0);

    // 纸底 + 半调网点
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = INK;
    for (let y = 0; y < h; y += cell) {
        for (let x = 0; x < w; x += cell) {
            const cx = Math.min(w - 1, (x + cell / 2) | 0);
            const cy = Math.min(h - 1, (y + cell / 2) | 0);
            const idx = (cy * w + cx) * 4;
            const br = (d[idx] + d[idx + 1] + d[idx + 2]) / 3 / 255;
            const radius = (1 - br) * cell * 0.62;
            if (radius > 0.35) {
                ctx.beginPath();
                ctx.arc(x + cell / 2, y + cell / 2, radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 暗角
    if (vignette > 0) {
        const grad = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.78);
        grad.addColorStop(0, 'rgba(40,30,20,0)');
        grad.addColorStop(1, 'rgba(40,30,20,' + (vignette * 0.6).toFixed(3) + ')');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }
}

/* ---------- 木刻线描：Sobel 边缘 + 阈值 ---------- */
function renderWoodcut() {
    const img = originalImage;
    const maxW = 900;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    canvas.width = w; canvas.height = h;
    off.width = w; off.height = h;

    const thresh = parseInt(document.getElementById('wthresh').value, 10);
    const line = parseFloat(document.getElementById('wline').value);
    const invert = document.getElementById('winvert').checked;

    octx.drawImage(img, 0, 0, w, h);
    const id = octx.getImageData(0, 0, w, h);
    const d = id.data;
    const gray = new Float32Array(w * h);
    for (let i = 0, p = 0; i < d.length; i += 4, p++) {
        gray[p] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    }

    const bg = invert ? INK : PAPER;
    const fg = invert ? PAPER : INK;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = fg;

    const at = (x, y) => gray[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
    const r = Math.max(1, Math.round(line));
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const gx = -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1)
                + at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
            const gy = -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1)
                + at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
            const mag = Math.sqrt(gx * gx + gy * gy);
            if (mag > thresh) {
                ctx.fillRect(x, y, r, r);
            }
        }
    }
}

/* ---------- 交互 ---------- */
document.getElementById('upload-btn').onclick = () => fileInput.click();
drop.onclick = (e) => { if (e.target === drop || e.target === emptyEl) fileInput.click(); };
fileInput.onchange = (e) => loadFile(e.target.files[0]);

['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, (e) => {
    e.preventDefault(); drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, (e) => {
    e.preventDefault(); drop.classList.remove('drag');
}));
drop.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});

document.querySelectorAll('.eng-mode').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.eng-mode').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        document.getElementById('vintage-sliders').style.display = currentMode === 'vintage' ? '' : 'none';
        document.getElementById('woodcut-sliders').style.display = currentMode === 'woodcut' ? '' : 'none';
        render();
    };
});

['sepia', 'contrast', 'halftone', 'grain', 'vignette', 'wthresh', 'wline', 'winvert'].forEach(id => {
    document.getElementById(id).addEventListener('input', render);
});

document.getElementById('reset-btn').onclick = () => {
    document.getElementById('sepia').value = 0.85;
    document.getElementById('contrast').value = 1.25;
    document.getElementById('halftone').value = 6;
    document.getElementById('grain').value = 0.35;
    document.getElementById('vignette').value = 0.5;
    document.getElementById('wthresh').value = 95;
    document.getElementById('wline').value = 1.2;
    document.getElementById('winvert').checked = false;
    render();
};

document.getElementById('download-btn').onclick = () => {
    if (!originalImage) return;
    canvas.toBlob((b) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = 'mess-engraving.png';
        a.click();
        URL.revokeObjectURL(a.href);
    });
};

/* ---------- 初始化 ---------- */
setupHeader();
fillMastheadDate();
