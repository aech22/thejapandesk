#!/usr/bin/env node
// scripts/replenish.mjs — キューが少なくなったら実需要からトピックを補充する。
//
// ★需要の取り方（2026-09-06 実測で確定）
//   Google サジェストは前方一致の補完しか返さない。だから「種語＋意図修飾語」で
//   クエリを組み立てる方式は機能しない（10通り試して5通りが0件）。
//   代わりに**短い種語に頭文字を足して展開する**。実測で `japan rail pass` は
//   10語→178語（17.8倍）に伸びる。逆に種語が3語以上あると展開が効かない
//   （`キャンプ 初心者 道具` は 10→13語で止まった）。SEEDS を短く保つこと。
//
// ★このスクリプトが増やさないもの
//   事実。提案できるのは数値を主張しない題材だけで、価格・運賃・料率を含む
//   タイトルやテーマは gate.mjs で弾く。台帳へ数値を足すのは人の仕事。
//   サジェストが取れなければ何も足さずに警告して終わる（需要データに基づかない
//   補充は「需要起点」ではないので、名前と中身を食い違わせない）。

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { check, loadFacts } from './gate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOPICS_PATH = join(ROOT, 'scripts', 'topics.json');
const QUEUE_PATH = join(ROOT, 'scripts', 'queue.json');
const ARTICLES_DIR = join(ROOT, 'content', 'articles');

export const LOW_QUEUE_THRESHOLD = 3;
export const TARGET_QUEUE = 8;
const MODEL = process.env.TJD_MODEL || 'claude-sonnet-5';

// craft は paused（物販ASPの提携未成立）なので対象外。ここに足すとリンクの無い記事が増える。
export const ACTIVE_PILLARS = ['learn-japanese', 'japan-travel', 'japan-nature'];

// 種語は1〜2語に保つ。長くすると頭文字展開が効かなくなる（上のコメント参照）。
export const SEEDS = {
  'learn-japanese': ['learn japanese', 'jlpt', 'japanese grammar', 'kanji'],
  'japan-travel': ['japan rail pass', 'tokyo to kyoto', 'japan esim', 'shinkansen'],
  'japan-nature': ['onsen etiquette', 'mount fuji', 'hiking in japan', 'autumn leaves japan'],
};

// 英語は a〜n。26文字全部だと収穫は増えるがリクエストがほぼ倍になる。
const HEADS = 'abcdefghijklmn'.split('');
const SUGGEST = 'https://suggestqueries.google.com/complete/search';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function suggest(q) {
  const url = `${SUGGEST}?client=firefox&hl=en&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    return (data[1] || []).filter((s) => typeof s === 'string');
  } catch {
    return [];
  }
}

/** 種語を頭文字で展開して需要語を集める。 */
export async function expand(seed, pause = 300) {
  const got = new Set(await suggest(seed));
  await sleep(pause);
  for (const h of HEADS) {
    for (const s of await suggest(`${seed} ${h}`)) got.add(s);
    await sleep(pause);
  }
  return [...got];
}

/** 既存記事のタイトル・description・keyword をまとめた文字列（雑な突き合わせ用）。 */
export function corpus() {
  const parts = [];
  for (const f of readdirSync(ARTICLES_DIR).filter((f) => /\.mdx?$/.test(f))) {
    const raw = readFileSync(join(ARTICLES_DIR, f), 'utf8');
    const fm = raw.startsWith('---') ? raw.split('---')[1] || '' : '';
    for (const key of ['title', 'description', 'keyword', 'slug']) {
      for (const m of fm.matchAll(new RegExp(`^${key}:\\s*(.+)$`, 'gm'))) parts.push(m[1]);
    }
  }
  return parts.join('\n').toLowerCase();
}

/** その需要語がもう扱われていそうか。語をすべて含んでいたら扱い済みとみなす（粗い判定）。 */
export function isCovered(phrase, text) {
  const terms = phrase.trim().split(/\s+/).filter(Boolean);
  return terms.length > 0 && terms.every((t) => text.includes(t.toLowerCase()));
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const VALID_TYPES = new Set(['guide', 'problem', 'comparison', 'essay']);

/**
 * 提案の構造検査。ここが緩むと、数値を含む題材や既存と重なる題材がキューに入り、
 * 生成のたびにゲートで落ち続けて更新が静かに止まる。
 */
export function validate(cand, existingSlugs, demand, facts) {
  for (const key of ['slug', 'pillar', 'keyword', 'title', 'angle', 'sourceQuery', 'type']) {
    if (!cand[key] || typeof cand[key] !== 'string') return `${key} が無い`;
  }
  if (!SLUG_RE.test(cand.slug)) return `slug の形式が不正: ${cand.slug}`;
  if (existingSlugs.has(cand.slug)) return `slug が既存と重複: ${cand.slug}`;
  if (!ACTIVE_PILLARS.includes(cand.pillar)) return `pillar が不正か停止中: ${cand.pillar}`;
  if (!VALID_TYPES.has(cand.type)) return `type が不正: ${cand.type}`;
  if (!demand.includes(cand.sourceQuery)) return `sourceQuery が実需要にない: ${cand.sourceQuery}`;
  // タイトルとテーマの段階で数値を弾く。本文まで書かせてから落とすとAPIの往復が無駄になる。
  const bad = check(`${cand.title} ${cand.angle}`, facts);
  if (bad.length) return `台帳に無い数値を含む: ${bad.join(' ')}`;
  return null;
}

function extractJson(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('JSON が見つかりません');
  return JSON.parse(t.slice(start, end + 1));
}

async function propose(need, gapsByPillar, existingSlugs) {
  const demandBlock = Object.entries(gapsByPillar)
    .map(([p, gaps]) => `${p}:\n` + gaps.slice(0, 40).map((g) => `  - ${g}`).join('\n'))
    .join('\n');

  const system = `You plan articles for The Japan Desk, an English-language site about Japan for readers in the US, UK, Australia and Canada. You return JSON only, no code fence.`;
  const user = `These are real Google search suggestions that our existing articles do not answer.

${demandBlock}

Existing article slugs (do not duplicate their subject):
${[...existingSlugs].join(', ')}

Propose ${need} new article topics.

Rules:
- Output {"topics":[...]} as JSON only.
- Each topic: slug (lowercase letters, digits, hyphens) / pillar (one of: ${ACTIVE_PILLARS.join(', ')}) / keyword / title / angle (one or two sentences, in Japanese, describing what the article must answer) / sourceQuery (copy one line from the demand list above, verbatim) / type (guide | problem | comparison | essay).
- **No prices, fares, fees or percentages anywhere in the title or angle.** We cannot verify figures, so topics that only work with a number in them are not usable. Choose subjects that stay true without figures: etiquette, sequence, how to decide, what to expect, when to go.
- Avoid topics that need the current rules of one named business, or this year's exact schedule.
- Mix the pillars. Do not put every topic in one.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = await res.json();
  return extractJson(body.content.map((c) => c.text || '').join('')).topics || [];
}

async function main({ dryRun = false, force = false } = {}) {
  const topicsDoc = JSON.parse(readFileSync(TOPICS_PATH, 'utf8'));
  const queue = JSON.parse(readFileSync(QUEUE_PATH, 'utf8'));
  const remaining = queue.pending.filter((p) => !p.blocked).length;

  if (!force && remaining > LOW_QUEUE_THRESHOLD) {
    console.log(`キューは${remaining}件あるので補充しません（しきい値${LOW_QUEUE_THRESHOLD}件）`);
    return 0;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('::warning::ANTHROPIC_API_KEY が未設定のため補充をスキップしました');
    return 0;
  }
  console.log(`キューが${remaining}件です（目標${TARGET_QUEUE}件）。需要を取りに行きます`);

  const text = corpus();
  const gapsByPillar = {};
  let demandAll = [];
  for (const pillar of ACTIVE_PILLARS) {
    const found = new Set();
    for (const seed of SEEDS[pillar] || []) for (const s of await expand(seed)) found.add(s);
    const gaps = [...found].filter((s) => !isCovered(s, text));
    gapsByPillar[pillar] = gaps;
    demandAll = demandAll.concat(gaps);
    console.log(`  ${pillar}: 需要${found.size}語 / うち未着手${gaps.length}語`);
  }
  if (demandAll.length === 0) {
    console.log('::warning::サジェストが1件も取れませんでした。何も足さずに終わります');
    return 0;
  }

  const existingSlugs = new Set([
    ...topicsDoc.topics.map((t) => t.slug),
    ...readdirSync(ARTICLES_DIR).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')),
  ]);
  const facts = loadFacts().facts || [];
  const need = Math.max(1, TARGET_QUEUE - remaining);

  let proposed = [];
  try {
    proposed = await propose(need, gapsByPillar, existingSlugs);
  } catch (e) {
    console.log(`::warning::提案を取得できませんでした（${e.message}）。補充を見送ります`);
    return 0;
  }

  const accepted = [];
  for (const cand of proposed) {
    const reason = validate(cand, existingSlugs, demandAll, facts);
    if (reason) {
      console.log(`[REJECT] ${cand.slug || '?'}: ${reason}`);
      continue;
    }
    existingSlugs.add(cand.slug);
    accepted.push({
      slug: cand.slug,
      pillar: cand.pillar,
      keyword: cand.keyword,
      title: cand.title,
      angle: cand.angle,
      sourceQuery: cand.sourceQuery,
      type: cand.type,
    });
  }
  if (!accepted.length) {
    console.log('::warning::検査を通ったトピックが0件でした。補充を見送ります');
    return 0;
  }
  if (dryRun) {
    console.log(`[DRY RUN] 検査を通った提案 ${accepted.length}件。ファイルは書いていません`);
    for (const t of accepted) console.log(`  (追加されるはず) ${t.slug} [${t.type}/${t.pillar}] ← 「${t.sourceQuery}」`);
    return 0;
  }

  topicsDoc.topics.push(...accepted);
  writeFileSync(TOPICS_PATH, JSON.stringify(topicsDoc, null, 2) + '\n');
  for (const t of accepted) {
    queue.pending.push({ slug: t.slug, failures: 0, blocked: false, lastViolations: [] });
  }
  writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2) + '\n');
  console.log(`補充しました: ${accepted.length}件`);
  for (const t of accepted) console.log(`  + ${t.slug} [${t.type}/${t.pillar}] ← 「${t.sourceQuery}」`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  main({ dryRun, force }).then((c) => process.exit(c)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
