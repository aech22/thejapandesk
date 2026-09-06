#!/usr/bin/env node
// scripts/gate.mjs — 生成本文に「台帳にない通貨額・率」が混ざっていないか検査する。
//
// ★なぜ通貨額と率だけを見るのか
//   「three baths」「six months」まで照合対象にすると偽陽性で全記事が落ちる。
//   ASP規約と読者への実害が出るのは価格と率なので、そこに絞る。
//   コドナビ（school-affiliate-blog/scripts/gate.py）と同じ思想だが、
//   TJD は通貨記号が数値の**前**に来る（¥50,000 / $30）ので抽出の形が違う。
//
// ★このゲートが守るもの
//   TJD は「確認できない数字は書かない」で 22 記事の [VERIFY] 334 件を人手でゼロにした。
//   日次の自動生成を入れると、その方針を人手で維持できなくなる。台帳照合に置き換える。
//
// ★このゲートが守らないもの
//   既に公開済みの人が書いた記事。ゲートは**これから生成するもの**にかける。
//   既存記事を通すと台帳が未検証の値で埋まり、許可集合が汚染される。
//
// 使い方:
//   import { check, extractAmounts } from './gate.mjs'
//   node scripts/gate.mjs <file...>   # CLI で既存記事を検査（何が引っかかるかの下見用）

import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FACTS_PATH = join(ROOT, 'src', 'data', 'facts.json');

// 通貨記号つきの金額と、パーセント。範囲表記（$10–15）は両端を別々のトークンとして拾う。
// 末尾のカンマ（文中の「¥12,000, and」）を数値に含めないよう、数字で終わる形に限定する。
const AMOUNT = /([¥$£€])\s?(\d[\d,]*(?:\.\d+)?)(?:\s?[–—-]\s?(\d[\d,]*(?:\.\d+)?))?/g;
const PERCENT = /(\d[\d,]*(?:\.\d+)?)\s?[%％]/g;

/** 表記ゆれを吸収する。カンマ・空白を外し、全角％を半角にする。 */
export function normalize(token) {
  return String(token).trim().replace(/,/g, '').replace(/％/g, '%').replace(/\s/g, '');
}

/** 本文から通貨額・率を抽出して正規化して返す（出現順・重複なし）。 */
export function extractAmounts(text) {
  const out = [];
  const push = (t) => {
    const n = normalize(t);
    if (n && !out.includes(n)) out.push(n);
  };
  for (const m of String(text || '').matchAll(AMOUNT)) {
    push(m[1] + m[2].replace(/,+$/, ''));
    if (m[3]) push(m[1] + m[3].replace(/,+$/, '')); // 範囲の右端も同じ通貨として扱う
  }
  for (const m of String(text || '').matchAll(PERCENT)) push(m[1].replace(/,+$/, '') + '%');
  return out;
}

/**
 * 本文に出してよい値の集合。出どころは facts[] だけ。
 *
 * _unverified は読まない。既存記事が主張しているというだけの値を許可に混ぜると、
 * 「裏が取れている」と「本文に書いてある」の区別が消えてゲートが無意味になる。
 */
export function allowedTokens(facts) {
  const allowed = new Set();
  for (const f of facts || []) for (const n of f.numbers || []) allowed.add(normalize(n));
  return allowed;
}

/** 台帳に無い通貨額・率の一覧を返す。空配列なら合格。 */
export function check(text, facts) {
  const allowed = allowedTokens(facts);
  return extractAmounts(text).filter((t) => !allowed.has(t));
}

/** verifiedAt が古い fact を返す。既定 180 日（旅行系の価格は年度単位で改定される）。 */
export function staleFacts(facts, staleDays = 180, today = new Date()) {
  const limit = staleDays * 86400000;
  return (facts || []).filter((f) => {
    const d = Date.parse(f.verifiedAt || '');
    return Number.isNaN(d) || today.getTime() - d > limit;
  });
}

export function loadFacts(path = FACTS_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

// ── CLI ──────────────────────────────────────────────────────────────
// ⚠️ endsWith('gate.mjs') で判定してはいけない。test_gate.mjs も末尾が一致するので、
//    テストから import しただけで CLI が走り process.exit(0) でテストが打ち切られる（実際に踏んだ）。
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const files = process.argv.slice(2);
  const ledger = loadFacts();
  const facts = ledger.facts || [];
  if (!files.length) {
    console.log(`台帳: fact ${facts.length}件 / 許可トークン ${allowedTokens(facts).size}種`);
    const stale = staleFacts(facts, ledger._staleDays ?? 180);
    if (stale.length) console.log(`⚠️ 再検証が必要: ${stale.map((f) => f.id).join(', ')}`);
    process.exit(0);
  }
  let ng = 0;
  for (const f of files) {
    const bad = check(readFileSync(f, 'utf8'), facts);
    if (bad.length) {
      ng++;
      console.log(`NG ${f}\n   台帳に無い値: ${bad.join(' ')}`);
    } else {
      console.log(`OK ${f}`);
    }
  }
  console.log(`\n${files.length}件中 ${ng}件が台帳外の値を含む`);
}
