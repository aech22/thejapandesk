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

/**
 * 有効期間を持つ fact が「その fact にしか出てこない数値」を持つとき、その数値の集合を返す。
 *
 * 期間を持たない fact と共有している値は含めない。JRパスの ¥50,000（7日間・現行）は
 * JR東日本パス10日間の ¥50,000 でもあるので、数値だけでは区別できない。
 * 共有された値の扱いは periodViolations が subjectPhrases で判定する。
 */
export function datedOnlyTokens(facts) {
  const dated = new Set();
  const undated = new Set();
  for (const f of facts || []) {
    const target = f.effectiveFrom || f.effectiveUntil ? dated : undated;
    for (const n of f.numbers || []) target.add(normalize(n));
  }
  for (const n of undated) dated.delete(n);
  return dated;
}

/**
 * 改定日を持つ価格を、期間の明示なしに書いていないか検査する。
 *
 * `¥53,000（2026-09-07 時点）` は 10月1日の朝に誤りになる。時点ではなく期間を書かせる。
 * `¥50,000 through 30 September 2026, ¥53,000 from 1 October 2026` なら改定日をまたいでも
 * 文が正しいままなので、静的サイトを再ビルドする必要もない。
 *
 * 返すのは {id, tokens, expected} の配列。空配列なら合格。
 */
const mentions = (lowerText, phrases) =>
  (phrases || []).some((p) => lowerText.includes(String(p).toLowerCase()));

/** 本文中の通貨額・率を、出現位置つきで返す。共有された値の帰属判定に位置が要る。 */
function amountsWithPos(text) {
  const out = [];
  for (const m of String(text || '').matchAll(AMOUNT)) {
    out.push({ token: normalize(m[1] + m[2].replace(/,+$/, '')), pos: m.index });
    if (m[3]) out.push({ token: normalize(m[1] + m[3].replace(/,+$/, '')), pos: m.index });
  }
  for (const m of String(text || '').matchAll(PERCENT)) {
    out.push({ token: normalize(m[1].replace(/,+$/, '') + '%'), pos: m.index });
  }
  return out;
}

/** 語句の全出現位置を返す（重なりは数えない）。 */
function positionsOf(lowerText, phrase) {
  const needle = String(phrase).toLowerCase();
  const out = [];
  for (let i = lowerText.indexOf(needle); i !== -1; i = lowerText.indexOf(needle, i + needle.length)) {
    out.push(i);
  }
  return out;
}

export function periodViolations(text, facts) {
  const datedOnly = datedOnlyTokens(facts);
  const dated = (facts || []).filter((f) => f.effectiveFrom || f.effectiveUntil);
  if (!dated.length) return [];
  const all = facts || [];

  // 判定は記事全体ではなく段落ごとに行う。記事のどこかに一度だけ日付があれば通る作りだと、
  // 「the ¥50,000 pass」と裸で書いた別の段落が改定日を過ぎた朝にそのまま誤りになる
  // （既存記事 is-jr-pass-worth-it-2026 に実際に2箇所あった）。
  // Markdown の表は内部に空行が無いので、この分割でひとかたまりとして扱われる。
  const blocks = String(text || '').split(/\n\s*\n/);
  const found = new Map();
  for (const block of blocks) {
    const lower = block.toLowerCase();
    const amounts = amountsWithPos(block);
    if (!amounts.length) continue;

    for (const f of dated) {
      const owned = new Set((f.numbers || []).map(normalize));
      const hits = amounts.filter((a) => owned.has(a.token));
      if (!hits.length) continue;
      if (mentions(lower, f.periodPhrases)) continue;

      // 共有された値（¥50,000 は全国パス7日間でもJR東日本パス10日間でもある）は、
      // 「その金額にいちばん近い商品名」で帰属を決める。段落に商品名があるかどうかだけで
      // 判定すると、`Hokuriku Arch Pass (¥35,000, 7 days) ... the nationwide pass` のように
      // 比較対象として全国パスに触れただけの文が落ちる（実際に既存記事で踏んだ）。
      // 同距離なら改定ありの側を採る（安全側に倒す）。名前がどこにも無ければ、
      // どの商品の値か読者にも分からないので期間表記を要求する。
      const bad = hits
        .filter((a) => {
          if (datedOnly.has(a.token)) return true;
          const owners = all.filter((o) => (o.numbers || []).map(normalize).includes(a.token));
          let best = null;
          for (const o of owners) {
            const isDated = !!(o.effectiveFrom || o.effectiveUntil);
            for (const p of o.subjectPhrases || []) {
              for (const pos of positionsOf(lower, p)) {
                const d = Math.abs(pos - a.pos);
                if (!best || d < best.d || (d === best.d && isDated)) best = { d, isDated };
              }
            }
          }
          return best ? best.isDated : true;
        })
        .map((a) => a.token);
      if (!bad.length) continue;

      const prev = found.get(f.id) || { id: f.id, tokens: [], expected: f.periodPhrases || [] };
      prev.tokens = [...new Set([...prev.tokens, ...bad])];
      found.set(f.id, prev);
    }
  }
  return [...found.values()];
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
    const text = readFileSync(f, 'utf8');
    const bad = check(text, facts);
    const undated = periodViolations(text, facts);
    if (bad.length || undated.length) {
      ng++;
      const lines = [`NG ${f}`];
      if (bad.length) lines.push(`   台帳に無い値: ${bad.join(' ')}`);
      for (const u of undated) {
        lines.push(`   期間の明示が無い: ${u.tokens.join(' ')}（${u.id}・例「${u.expected[0]}」）`);
      }
      console.log(lines.join('\n'));
    } else {
      console.log(`OK ${f}`);
    }
  }
  console.log(`\n${files.length}件中 ${ng}件が要修正`);
}
