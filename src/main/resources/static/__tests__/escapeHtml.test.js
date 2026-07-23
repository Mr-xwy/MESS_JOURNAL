// =============================================================================
// escapeHtml.test.js —— 样例单元测试（对应优化建议 P2-⑬）
//
// 说明：当前 escapeHtml 定义在 common.js（经典脚本、非模块），无法直接 import。
// 这里先用一份等价实现验证「期望行为」，作为测试基线。等 P0-② 完成、工具函数
// 抽成 ES Module（如 js/util.js）后，把本文件改为 `import { escapeHtml } from '../js/util.js'`
// 即为真实单元测试。
// =============================================================================
import { describe, it, expect } from 'vitest';

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

describe('escapeHtml', () => {
  it('转义关键字符', () => {
    expect(escapeHtml('<script>"&\'')).toBe('&lt;script&gt;&quot;&amp;&#39;');
  });
  it('空值返回空串', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
  it('普通文本原样返回', () => {
    expect(escapeHtml('杂研期刊 M.E.S.S')).toBe('杂研期刊 M.E.S.S');
  });
});
