import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// 独自ドメイン thejapandesk.net のルートで配信（base無し）。SEO・sitemap・OGP・canonical で使用。
// Cloudflare Pages でビルド（npm run build → dist/ を配信）。
export default defineConfig({
  site: 'https://thejapandesk.net',
  integrations: [sitemap({ changefreq: 'weekly', priority: 0.7 })],
  vite: {
    plugins: [tailwindcss()],
  },
});
