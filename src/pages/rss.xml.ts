import { getCollection } from 'astro:content';
import { ACTIVE_PILLARS } from '../data/pillars';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL, SITE_LIVE } from '../consts';

// RSS フィード。英語圏では feed リーダー・ニュースアグリゲーター・Pinterest の
// 自動ピン取り込みが購読経路になるため、静的サイトでも配信する。
// SITE_LIVE=false の間は空のフィードを返す（下書きを外部へ流さない）。

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
   .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function GET() {
  const active = new Set(ACTIVE_PILLARS.map((p) => p.slug));
  const items = SITE_LIVE
    ? (await getCollection('articles'))
        // 停止中ピラー・下書き・noindex の記事はフィードにも出さない（サイト上の扱いと揃える）
        .filter((a) => !a.data.draft && !a.data.noindex && active.has(a.data.pillar))
        .sort((a, b) => +(b.data.updated ?? b.data.date) - +(a.data.updated ?? a.data.date))
    : [];

  const body = items
    .map((a) => {
      const url = `${SITE_URL}/${a.data.pillar}/${a.data.slug}/`;
      const pub = (a.data.updated ?? a.data.date).toUTCString();
      return `    <item>
      <title>${esc(a.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${esc(a.data.description)}</description>
      <pubDate>${pub}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${esc(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
