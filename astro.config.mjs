import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import affiliateRel from './src/plugins/affiliate-rel.mjs';

// 独自ドメイン thejapandesk.net のルートで配信（base無し）。SEO・sitemap・OGP・canonical で使用。
// Cloudflare Pages でビルド（npm run build → dist/ を配信）。
export default defineConfig({
  site: 'https://thejapandesk.net',
  // mdx は旅程記事のためだけに入れている。工程表（DayPlan）を本文の各日の直後に差し込むには
  // .md の単一スロットでは足りないため。既存の .md 記事はそのまま動く（markdown設定は継承される）。
  integrations: [mdx(), sitemap({ changefreq: 'weekly', priority: 0.7 })],
  // アフィリエイトリンクへの rel 付与はここ1箇所で機械的にやる（記事側で書かない）
  markdown: { rehypePlugins: [affiliateRel] },
  vite: {
    plugins: [tailwindcss()],
  },
});
