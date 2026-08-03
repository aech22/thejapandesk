// 3ピラー（サイロ）。ナビ・フッター・ピラーハブページ・パンくずで使う。
export interface Pillar {
  slug: 'craft' | 'learn-japanese' | 'japan-travel';
  label: string;
  short: string;
  description: string;
}

export const PILLARS: Pillar[] = [
  {
    slug: 'craft',
    label: 'Japanese Craft & Goods',
    short: 'Craft',
    description:
      'Knives, ceramics, fountain pens, bonsai and more — chosen by tradition and use, not just star ratings.',
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
];

export const pillarBySlug = (slug: string) => PILLARS.find((p) => p.slug === slug);
