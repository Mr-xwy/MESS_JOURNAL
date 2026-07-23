/* =========================================================================
 * config.js —— 杂研前端全局配置（品牌 / 常量集中，避免硬编码散落）
 * 必须在 api.js / common.js 之前加载（index.html 已按此顺序引入）。
 * 这是 P0-②「全局脚本污染」与 P2-⑦「品牌字符串散落」的渐进式修复起点：
 *   - 所有代码同时仍挂在全局（向后兼容，不破坏现有页面）；
 *   - 同时统一收口到 window.MESS，便于日后平滑迁移到 ES Module。
 * ========================================================================= */

window.MESS = window.MESS || {};

window.MESS.BRAND = {
    en:   'M.E.S.S Journal',
    zh:   '杂研期刊',
    full: 'Method, Experiment, Survey, Summary',
    vol:  'VOL. I · NO. I'
};

// 若其它页面需要统一的 UI 文案，可在此集中维护
window.MESS.COPY = {
    hotTitle: 'The Leading Stories',
    archiveLabel: '个人文库 · PERSONAL ARCHIVE'
};
