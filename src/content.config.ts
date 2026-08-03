import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// content/articles/*.md をブログ記事コレクションとして読む（本文はMarkdownをそのままレンダリング）。
// pillar = サイロ（craft / learn-japanese / japan-travel）。URLは /{pillar}/{slug}/。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().nullish(),
    pillar: z.enum(['craft', 'learn-japanese', 'japan-travel']),
    slug: z.string(),
    keyword: z.string().nullish(),
    draft: z.boolean().default(false),
    noindex: z.boolean().nullish(),
  }),
});

export const collections = { articles };
