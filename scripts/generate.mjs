#!/usr/bin/env node
// scripts/generate.mjs — queue.json の先頭1件を記事にする。`node scripts/generate.mjs`
//
// ★このサイトで自動生成を成立させている条件（外すと方針が崩れる）
//   TJD は 22 記事の [VERIFY] 334 件を人手で潰して「確認できない数字は書かない」を達成した。
//   日次生成でこれを人手で維持するのは無理なので、代わりに2つの仕掛けで担保する。
//     1. 台帳（src/data/facts.json）に載っている値だけをプロンプトに渡し、それ以外を禁じる。
//        2026-09-07 に「数値を一切書かせない」から変更した。旅行記事は金額が無いと
//        読者が予算を立てられないため（ユーザー判断）。改定日を持つ値は期間表記とセットでしか書けない。
//     2. gate.mjs が生成物を機械的に検査し、台帳外の通貨額・率と、期間の明示が無い改定価格を破棄する。
//
// ★LLM に書かせないもの
//   - 台帳に無い価格・運賃・料金（上記）
//   - アフィリエイトリンクのURL（rel の付与は src/plugins/affiliate-rel.mjs が担う。
//     LLM に URL を書かせると、存在しないリンクとトラッキング欠落の両方が出る）
//   - サイト内リンク（存在しない slug を書くため。関連記事は RelatedArticles.astro が機械的に置く）
//
// 環境変数: ANTHROPIC_API_KEY（必須）/ TJD_MODEL（任意・既定は下記）

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { check, loadFacts, periodViolations } from './gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOPICS_PATH = join(ROOT, 'scripts', 'topics.json');
const QUEUE_PATH = join(ROOT, 'scripts', 'queue.json');
const ARTICLES_DIR = join(ROOT, 'content', 'articles');

// 記事は長めの英文エッセイなので、構造化JSONだけを書かせるコドナビ（Haiku）より上のティアを使う。
const MODEL = process.env.TJD_MODEL || 'claude-sonnet-5';
const MAX_FAILURES = 3;

const SYSTEM = `You write for The Japan Desk, an English-language site about Japan for readers in the US, UK, Australia and Canada.

You are writing the full body of one article in Markdown. Return JSON only.

HARD RULES — breaking any of these means the article is discarded:
1. The ONLY money figures and percentages you may write are the ones listed in VERIFIED FIGURES below, copied exactly as written there. Every other figure is forbidden: no invented yen prices, no dollar figures, no "around $30", no "about 20%", no arithmetic on the listed figures, and no currency conversion. If money matters to a point you cannot support from the list, describe the trade-off in words ("the express costs roughly double the bus") without naming a number.
1b. Any figure marked "PERIOD REQUIRED" must be written with both sides of the change in the same paragraph, using one of the listed date phrases, like "¥50,000 through 30 September 2026, rising to ¥53,000 from 1 October 2026". Never present such a figure as simply the current price, and never write it with only an "as of" date. A price that carries its own validity window stays true after the change takes effect; one with an "as of" note does not.
1c. Name the product next to its price, every time. Two different passes can cost the same amount, so "the ¥50,000 pass" is ambiguous; write "the JR East Pass at ¥50,000" or "the nationwide pass at ¥50,000 through 30 September 2026".
2. Do NOT claim first-hand experience. You have not visited, bathed, hiked, ridden, or bought anything. Never write "I went", "when I visited", "I tried". Write about what a reader will encounter, not about what you did.
3. Do NOT write any URL, link, or affiliate link. Do not link to other articles on this site. Links are added mechanically after generation.
4. Do NOT invent named facts you cannot be sure of: specific opening hours, specific station platform numbers, named staff, or the current rules of a specific named business. Speak at the level that stays true.

STRUCTURE — this order, always:
- Open with the conclusion. The first two or three sentences must give the answer: what the reader should do, or which option suits whom. No throat-clearing, no "Japan is a country of contrasts", no rhetorical questions.
- Then the reasoning: the comparison or the sequence of steps.
- Then the concrete situations that make it real ("if you are arriving late and your bag is still with you...").
- Then the caveats and what to check locally.

VOICE:
- Plain, specific, unhurried. Short paragraphs. Full sentences.
- Use the searcher's own words for the central term; do not paraphrase it away.
- H2 headings phrased the way a reader would ask the question. No numbered "01 / 02" headings. No emoji.
- Do not use "not just X — it's Y" constructions, and do not stack three-item lists for rhythm.
- British/American spelling: use American.

OUTPUT JSON ONLY, no code fence:
{"title":"...","description":"...","body":"# Title\\n\\n..."}
- title: under 65 characters, contains the search term.
- description: one or two sentences, 120-160 characters, specific to this article.
- body: Markdown starting with a single "# " heading, then the article. 900-1400 words.`;

/**
 * 台帳を、そのままプロンプトへ差し込める形に整える。
 *
 * 数値を書かせないのではなく「台帳にある値だけを書かせる」に変えたのが 2026-09-07 の変更。
 * 旅行記事は金額が無いと予算を立てられないという理由（ユーザー判断）。
 * 有効期間を持つ値には PERIOD REQUIRED を付け、期間表記とセットでしか書けないようにする。
 */
export function verifiedFiguresBlock(facts) {
  const rows = (facts || []).map((f) => {
    const dated = f.effectiveFrom || f.effectiveUntil;
    const head = dated ? `- PERIOD REQUIRED — ${f.claim}` : `- ${f.claim}`;
    const phrases = dated ? `\n  Date phrases you may use: ${(f.periodPhrases || []).join(' / ')}` : '';
    return `${head}\n  Figures: ${(f.numbers || []).join(' ')}${phrases}`;
  });
  if (!rows.length) return 'VERIFIED FIGURES: none. Do not write any money figure or percentage at all.';
  return ['VERIFIED FIGURES — the complete list of figures you may write:', ...rows].join('\n');
}

function frontmatter(topic, prose, existingDate, today) {
  const esc = (s) => String(s).replace(/"/g, '\\"');
  return [
    '---',
    `title: "${esc(prose.title)}"`,
    `description: "${esc(prose.description)}"`,
    `date: '${existingDate || today}'`,
    `updated: '${today}'`,
    `pillar: ${topic.pillar}`,
    `slug: ${topic.slug}`,
    `keyword: "${esc(topic.keyword)}"`,
    'draft: false',
    '---',
    '',
  ].join('\n');
}

/** 既存記事の date を引き継ぐ（公開日を遡らせない・URLの評価を安定させる）。 */
function existingDateOf(path) {
  if (!existsSync(path)) return null;
  const m = readFileSync(path, 'utf8').match(/^date:\s*'?([\d-]+)'?/m);
  return m ? m[1] : null;
}

function extractJson(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON が見つかりません');
  return JSON.parse(t.slice(start, end + 1));
}

async function callModel(topic, facts) {
  const user = [
    `Pillar: ${topic.pillar}`,
    `Search term the reader is using: ${topic.keyword}`,
    `Working title: ${topic.title}`,
    `What this article must answer: ${topic.angle}`,
    `Article type: ${topic.type}`,
    '',
    verifiedFiguresBlock(facts),
    '',
    'Write the article now. JSON only.',
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  return extractJson(body.content.map((c) => c.text || '').join(''));
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('::warning::ANTHROPIC_API_KEY が未設定のため生成をスキップしました');
    return 0;
  }
  const topicsDoc = JSON.parse(readFileSync(TOPICS_PATH, 'utf8'));
  const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
  const bySlug = new Map(topicsDoc.topics.map((t) => [t.slug, t]));
  const facts = loadFacts().facts || [];

  const head = queue.pending.find((p) => !p.blocked);
  if (!head) {
    console.log('::warning::生成できるトピックがありません（キューが空か全て blocked）');
    return 0;
  }
  const topic = bySlug.get(head.slug);
  if (!topic) {
    console.log(`::warning::topics.json に ${head.slug} がありません。キューから外します`);
    queue.pending = queue.pending.filter((p) => p.slug !== head.slug);
    writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
    return 0;
  }

  console.log(`生成: ${topic.slug} [${topic.type}/${topic.pillar}] ← 「${topic.sourceQuery}」`);
  const prose = await callModel(topic, facts);

  const text = `${prose.title}\n${prose.description}\n${prose.body}`;
  const violations = [
    ...check(text, facts).map((t) => `台帳外:${t}`),
    ...periodViolations(text, facts).map((v) => `期間なし:${v.tokens.join(',')}(${v.id})`),
  ];
  if (violations.length) {
    head.failures = (head.failures || 0) + 1;
    head.lastViolations = violations;
    console.log(`[GATE] 破棄: ${violations.join(' ')}`);
    if (head.failures >= MAX_FAILURES) {
      head.blocked = true;
      queue.pending = queue.pending.filter((p) => p.slug !== head.slug).concat(head);
      console.log(`::warning::${head.slug} は${MAX_FAILURES}回連続で落ちたので blocked にしました`);
    }
    writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
    return 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  const path = join(ARTICLES_DIR, `${topic.slug}.md`);
  const body = String(prose.body).trim();
  writeFileSync(path, frontmatter(topic, prose, existingDateOf(path), today) + body + '\n');

  queue.pending = queue.pending.filter((p) => p.slug !== head.slug);
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`書き出し: content/articles/${topic.slug}.md（残りキュー ${queue.pending.length}件）`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((c) => process.exit(c)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

export { frontmatter, extractJson, existingDateOf };
