// =============================================================================
// vite.config.js —— 杂研前端构建（脚手架）
// 对应优化建议 P1-②：用内容哈希替代手写 ?v=N，消除缓存破坏不一致。
//
// ⚠️ 投产前请复核：
//   1. root 指向静态资源目录；outDir 输出到 dist，你需要把 dist/ 内容
//      在构建后拷回 src/main/resources/static/（或用 frontend-maven-plugin /
//      Gradle Node 插件串起 npm run build → 拷贝）。
//   2. input 里只列了 index.html，请补齐其余页面（editor/article/shop/
//      museum/letters/puzzle/engraving/inbox/login/register/profile…）。
//   3. 启用后，index.html 里的 <script src="js/xxx?v=N"> 要改为 Vite 的
//      模块引入（<script type="module" src="/src/main.js"> 等），否则两套
//      机制会冲突。这是一次有计划的迁移，不是热插拔。
// =============================================================================
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/main/resources/static',
  base: '/',
  build: {
    outDir: '../../../dist/frontend',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: 'src/main/resources/static/index.html'
        // editor: 'src/main/resources/static/editor.html',
        // article: 'src/main/resources/static/article.html',
        // ...补齐其余页面
      }
    }
  }
});
