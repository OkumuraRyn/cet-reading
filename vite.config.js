/* vite.config.js */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',          // 允许局域网甚至外网访问
    allowedHosts: true,       // 【关键增加】允许所有外部域名访问，这样 NATAPP 域名怎么变也不会被 Block 拦截
    // 如果设置 true 报错，可以将其替换为：allowedHosts: ['.natappfree.cc'], 
    proxy: {
      '/api-ai': {
        target: 'https://api.deepseek.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-ai/, '')
      }
    }
  }
});