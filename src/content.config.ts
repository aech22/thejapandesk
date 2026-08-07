import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// content/articles/*.md をブログ記事コレクションとして読む（本文はMarkdownをそのままレンダリング）。
// pillar = サイロ（craft / learn-japanese / japan-travel / japan-nature）。URLは /{pillar}/{slug}/。
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().nullish(),
    pillar: z.enum(['craft', 'learn-japanese', 'japan-travel', 'japan-nature']),
    slug: z.string(),
    keyword: z.string().nullish(),
    draft: z.boolean().default(false),
    noindex: z.boolean().nullish(),
    // 運賃テーブルの差し込み。本文は .md でコンポーネントを書けないため、
    // frontmatter で宣言して ArticleLayout が本文末に描画する（事実は記事本文に書かない）。
    fareWidget: z
      .object({
        dest: z.string(),
        origins: z.array(z.string()).optional(),
        heading: z.string().nullish(),
      })
      .optional(),
  }),
});

export const collections = { articles };
