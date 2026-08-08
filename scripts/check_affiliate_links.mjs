#!/usr/bin/env node
// アフィリリンクの整合性チェック。`node scripts/check_affiliate_links.mjs`
//
// ★何を検査し、何を検査しないか
//   検査する: トラッキングパラメータの欠落・sub_id と記事slugの不一致・未知のアフィリドメイン
//   検査しない: **リンク先が生きているか**。GetYourGuide と Klook は curl に 403 を返し、
//               12Go は存在しない地点でも 202 を返すため、HTTPステータスでは判定できない
//               （2026-08-08 実測）。生死の確認は下記「手動チェック」の手順で行う。
//
// 手動チェック: 本スクリプトが出す「追跡なしURL」をブラウザで開く。
//   ⚠️ partner_id / z= の付いたURLは絶対に開かない（自分のアフィリエイト口座に誤クリックが記録される）。

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'content/articles';

// ドメイン → 必須パラメータ と、追跡を外すために消すパラメータ
const RULES = {
  'getyourguide.com': { required: ['partner_id'], strip: ['partner_id', 'utm_medium'] },
  '12go.asia':        { required: ['z'],          strip: ['z', 'sub_id'] },
  'klook.com':        { required: [],             strip: [] }, // LinkSwitcherが変換するので素のURLが正
  'japanesepod101.com': { required: [],           strip: [] }, // 提携承認後にルールを足す
};

const hostRule = (host) =>
  Object.entries(RULES).find(([d]) => host === d || host.endsWith('.' + d));

const problems = [];
const clean = new Set();
let total = 0;

// .mdx も見る。旅程記事は工程表コンポーネントを差し込むため .mdx になっており、
// 拡張子で取りこぼすとアフィリリンクが黙って検査対象から外れる。
for (const file of readdirSync(DIR).filter((f) => /\.mdx?$/.test(f))) {
  const text = readFileSync(join(DIR, file), 'utf8');
  const slug = file.replace(/\.mdx?$/, '');

  for (const m of text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
    let url;
    try { url = new URL(m[1]); } catch { continue; }
    const rule = hostRule(url.hostname.replace(/^www\./, ''));
    if (!rule) continue;
    const [domain, { required, strip }] = rule;
    total++;

    for (const p of required) {
      if (!url.searchParams.has(p)) problems.push(`${slug}: ${domain} のリンクに ${p} が無い — ${url}`);
    }
    // sub_id は「どの記事が売ったか」の唯一の手掛かり。後から遡って付けられないので厳密に見る
    if (url.searchParams.has('sub_id') && url.searchParams.get('sub_id') !== slug) {
      problems.push(`${slug}: sub_id が記事slugと違う（${url.searchParams.get('sub_id')}）— ${url}`);
    }
    if (domain === '12go.asia' && !url.searchParams.has('sub_id')) {
      problems.push(`${slug}: 12Go のリンクに sub_id が無い — ${url}`);
    }

    const bare = new URL(url);
    strip.forEach((p) => bare.searchParams.delete(p));
    clean.add(bare.toString());
  }
}

console.log(`アフィリリンク ${total} 本を検査`);
if (problems.length) {
  console.log(`\n[NG] ${problems.length} 件`);
  problems.forEach((p) => console.log('  - ' + p));
} else {
  console.log('[OK] パラメータの欠落・sub_idの不一致なし');
}

if (process.argv.includes('--list')) {
  console.log(`\n--- 追跡なしURL（生死確認用・ブラウザで開いてよい）${clean.size} 件 ---`);
  [...clean].sort().forEach((u) => console.log(u));
}

process.exit(problems.length ? 1 : 0);
