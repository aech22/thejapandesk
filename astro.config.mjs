import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import affiliateRel from './src/plugins/affiliate-rel.mjs';

// 独自ドメイン thejapandesk.net のルートで配信（base無し）。SEO・sitemap・OGP・canonical で使用。
// Cloudflare Pages でビルド（npm run build → dist/ を配信）。

// <lastmod> for the sitemap, read straight from each article's frontmatter (2026-09-06).
// Astro's Content Collections cannot be read from the config file, so the frontmatter is
// parsed here. Without lastmod an updated article is crawled as if it were brand new.
// Both .md and .mdx are picked up (AFFILIATE.md pitfall 16).
const ARTICLES_DIR = new URL('./content/articles/', import.meta.url);
function articleLastmod() {
  const map = new Map();
  if (!fs.existsSync(ARTICLES_DIR)) return map;
  for (const file of fs.readdirSync(ARTICLES_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const raw = fs.readFileSync(new URL(file, ARTICLES_DIR), 'utf-8');
    const fm = raw.split('---')[1] ?? '';
    const pick = (key) => {
      const m = fm.match(new RegExp(`^${key}:\\s*['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm'));
      return m ? m[1] : null;
    };
    // The URL is /{pillar}/{slug}/ and both live in the frontmatter, not in the filename.
    const pillar = (fm.match(/^pillar:\s*['"]?([a-z-]+)/m) ?? [])[1];
    const slug = (fm.match(/^slug:\s*['"]?([a-z0-9-]+)/m) ?? [])[1];
    const date = pick('updated') ?? pick('date');
    if (pillar && slug && date) {
      map.set(`/${pillar}/${slug}/`, new Date(`${date}T00:00:00+09:00`));
    }
  }
  return map;
}
const LASTMOD = articleLastmod();

export default defineConfig({
  site: 'https://thejapandesk.net',
  // mdx は旅程記事のためだけに入れている。工程表（DayPlan）を本文の各日の直後に差し込むには
  // .md の単一スロットでは足りないため。既存の .md 記事はそのまま動く（markdown設定は継承される）。
  integrations: [
    mdx(),
    sitemap({
      // 404 is not an indexable page.
      filter: (page) => !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
      serialize(item) {
        const path = new URL(item.url).pathname;
        if (path === '/') return { ...item, changefreq: 'daily', priority: 1.0 };
        const lastmod = LASTMOD.get(path);
        if (lastmod) {
          return { ...item, changefreq: 'monthly', priority: 0.8, lastmod: lastmod.toISOString() };
        }
        // Pillar hubs gain an entry every time an article is published.
        if (/^\/[a-z-]+\/$/.test(path) && !['/about/', '/privacy/', '/contact/', '/affiliate-disclosure/'].includes(path)) {
          return { ...item, changefreq: 'weekly', priority: 0.6 };
        }
        return { ...item, changefreq: 'yearly', priority: 0.3 };
      },
    }),
  ],
  // アフィリエイトリンクへの rel 付与はここ1箇所で機械的にやる（記事側で書かない）
  markdown: { rehypePlugins: [affiliateRel] },
  vite: {
    plugins: [tailwindcss()],
  },
});
