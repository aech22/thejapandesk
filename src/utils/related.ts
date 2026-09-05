// Related-article selection (added 2026-09-06).
//
// Every article used to end without a single link to another article, so the site had no
// mechanical way of telling search engines which pages belong to the same topic. This picks
// a few articles for the end of each post.
//
// The links are decided from frontmatter join keys only — never written by an LLM, which
// would invent slugs that do not exist.
//
// Scoring: articles that share a meaningful word with this one's target keyword come first,
// then articles in the same pillar. If nothing scores, the newest articles fill the slots —
// an article must never be a dead end.
import type { CollectionEntry } from 'astro:content';

type Article = CollectionEntry<'articles'>;

const SCORE_SHARED_KEYWORD_WORD = 3;
const SCORE_SAME_PILLAR = 2;

// "japan" and "japanese" sit in almost every keyword on this site, so they carry no signal.
// Numbers and generic comparison words are dropped for the same reason.
const STOPWORDS = new Set([
  'japan', 'japanese', 'the', 'a', 'an', 'in', 'to', 'of', 'for', 'and', 'or', 'is', 'it',
  'best', 'top', 'worth', 'how', 'what', 'vs', 'guide', 'review', 'reviews', 'buying',
  'your', 'you', 'with', 'from', 'on', 'at', 'by', 'be', 'are', 'this', 'that',
]);

function words(entry: Article): Set<string> {
  const raw = `${entry.data.keyword ?? ''} ${entry.data.title}`.toLowerCase();
  return new Set(
    raw
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w)),
  );
}

export function relatedArticles(all: Article[], current: Article, limit = 4): Article[] {
  const curWords = words(current);

  return all
    .filter((a) => a.id !== current.id && !a.data.draft)
    .map((a) => {
      let score = 0;
      for (const w of words(a)) if (curWords.has(w)) score += SCORE_SHARED_KEYWORD_WORD;
      if (a.data.pillar === current.data.pillar) score += SCORE_SAME_PILLAR;
      return { a, score };
    })
    .sort((x, y) => y.score - x.score || +y.a.data.date - +x.a.data.date)
    .slice(0, limit)
    .map((x) => x.a);
}
