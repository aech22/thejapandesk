// ピラー（サイロ）。ナビ・フッター・ピラーハブページ・パンくずで使う。
export interface Pillar {
  slug: 'craft' | 'learn-japanese' | 'japan-travel' | 'japan-nature';
  label: string;
  short: string;
  description: string;
  /**
   * true の間はナビ・トップ・ピラーページを一切生成しない（＝サイト上に存在しない扱い）。
   * ピラーの定義自体は消さずに残す。復活は false に戻して、該当記事の frontmatter の
   * draft: true を外すだけ。
   */
  paused?: boolean;
}

export const PILLARS: Pillar[] = [
  {
    slug: 'craft',
    label: 'Japanese Craft & Goods',
    short: 'Craft',
    description:
      'Knives, ceramics, fountain pens, bonsai and more — chosen by tradition and use, not just star ratings.',
    // 2026-08-07 一時停止。物販ASP（Awin/Musubi Kiln・ShareASale/Pen Boutique・CJ/Bonsai Boy）の
    // 提携が未成立で、リンクの無い買い物ガイドを公開しても収益にならないため。
    // 提携が取れたら false に戻し、craft の7記事の draft: true を外す。
    paused: true,
  },
  {
    slug: 'learn-japanese',
    label: 'Learn Japanese',
    short: 'Learn',
    description:
      'Honest, native-checked comparisons of the apps and courses for learning Japanese.',
  },
  {
    slug: 'japan-travel',
    label: 'Japan Travel',
    short: 'Travel',
    description:
      'Practical, up-to-date planning — passes, tours and itineraries — using current local information.',
  },
  {
    slug: 'japan-nature',
    label: 'Japan Nature & Outdoors',
    short: 'Nature',
    description:
      'Mountains, rivers, gorges and hot springs — where to go, when they actually look like the photos, and how to get there.',
    // 2026-08-07 追加。**記事がまだ0本なので停止中。**
    // 空のピラーページとナビ項目を公開中のサイトに出すと薄いページを1枚増やすだけになるため、
    // craft と同じ paused の仕組みで定義だけ置いてある。
    // 記事を1本でも入れたら paused を消す（ナビ・トップ・/japan-nature/ が同時に出る）。
    paused: true,
  },
];

export const pillarBySlug = (slug: string) => PILLARS.find((p) => p.slug === slug);

/** サイトに出すピラー。ナビ・トップ・ピラーページの生成は必ずこちらを使う。 */
export const ACTIVE_PILLARS = PILLARS.filter((p) => !p.paused);
