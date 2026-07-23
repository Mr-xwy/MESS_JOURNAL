// =============================================================================
// eslint.config.js —— ESLint 9 扁平配置（脚手架，对应优化建议 P2-⑬）
// 投产前请确认 devDependencies 里已装 @eslint/js 与 eslint@9。
// =============================================================================
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/main/resources/static/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        window: 'readonly', document: 'readonly', fetch: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly', location: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly', clearInterval: 'readonly',
        requestAnimationFrame: 'readonly', IntersectionObserver: 'readonly', MutationObserver: 'readonly',
        TextDecoder: 'readonly', console: 'readonly', Image: 'readonly', FileReader: 'readonly',
        navigator: 'readonly', matchMedia: 'readonly', EventSource: 'readonly',
        XMLHttpRequest: 'readonly', JSON: 'readonly', Math: 'readonly', Date: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-console': 'off'
    }
  }
];
