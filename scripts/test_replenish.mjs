#!/usr/bin/env node
// scripts/test_replenish.mjs — 補充の構造検査を固定する。`node scripts/test_replenish.mjs`
//
// この検査が守っているのは「数値を主張する題材をキューに入れない」こと。
// 台帳（facts.json）は 2026-09-06 時点で2件しかないので、価格や料率を前提にした
// 題材が入ると、生成するたびにゲートで落ち続けて更新が静かに止まる。
//
// 端ケースは3種類を流す（Knowledge/mistakes.md 2026-08-04 の教訓）。
//   ① 必須項目が欠けた入力  ② 既存と重複する入力  ③ 数値を含む入力

import { validate, isCovered, ACTIVE_PILLARS } from './replenish.mjs';

let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) { pass++; } else { fail++; console.log(`NG ${name}\n   got  ${g}\n   want ${w}`); }
};
const ok = (name, got) => { if (got === null) { pass++; } else { fail++; console.log(`NG ${name}: ${got}`); } };
const ng = (name, got, fragment) => {
  if (typeof got === 'string' && got.includes(fragment)) { pass++; }
  else { fail++; console.log(`NG ${name}\n   got ${got}\n   want 「${fragment}」を含む理由`); }
};

const EXISTING = new Set(['japan-onsen-etiquette']);
const DEMAND = ['onsen etiquette tattoo', 'mount fuji climbing season', 'jlpt n5 study plan'];
const FACTS = [{ id: 'k', numbers: ['¥800'] }];

const base = (over = {}) => ({
  slug: 'onsen-tattoo-rules',
  pillar: 'japan-nature',
  keyword: 'onsen tattoo',
  title: 'Bathing With Tattoos in Japan',
  angle: 'タトゥーがある読者が入れる風呂の探し方に答える。',
  sourceQuery: 'onsen etiquette tattoo',
  type: 'problem',
  ...over,
});

// 正常系
ok('妥当な提案は通る', validate(base(), EXISTING, DEMAND, FACTS));
eq('停止中のcraftは対象外', ACTIVE_PILLARS.includes('craft'), false);

// ① 必須項目
ng('slugが無い', validate(base({ slug: '' }), EXISTING, DEMAND, FACTS), 'slug が無い');
ng('typeが無い', validate(base({ type: '' }), EXISTING, DEMAND, FACTS), 'type が無い');
ng('slugの形式が不正', validate(base({ slug: 'Onsen_Rules' }), EXISTING, DEMAND, FACTS), 'slug の形式');
ng('typeが不正', validate(base({ type: 'listicle' }), EXISTING, DEMAND, FACTS), 'type が不正');
ng('pillarが停止中', validate(base({ pillar: 'craft' }), EXISTING, DEMAND, FACTS), 'pillar が不正か停止中');
ng('pillarが未知', validate(base({ pillar: 'food' }), EXISTING, DEMAND, FACTS), 'pillar が不正か停止中');

// ② 重複と、需要データとの紐付け
ng('既存slugと重複', validate(base({ slug: 'japan-onsen-etiquette' }), EXISTING, DEMAND, FACTS), '重複');
ng('sourceQueryが実需要に無い',
   validate(base({ sourceQuery: 'made up query' }), EXISTING, DEMAND, FACTS), '実需要にない');

// ③ 数値（ここが本題）
ng('タイトルに価格があると落ちる',
   validate(base({ title: 'Onsen for $30 a night' }), EXISTING, DEMAND, FACTS), '台帳に無い数値');
ng('テーマに円建ての価格があると落ちる',
   validate(base({ angle: '入浴料が¥1,200かかることを説明する。' }), EXISTING, DEMAND, FACTS), '台帳に無い数値');
ng('テーマに率があると落ちる',
   validate(base({ angle: '70%の人が知らない作法を書く。' }), EXISTING, DEMAND, FACTS), '台帳に無い数値');
ok('台帳にある値なら通る',
   validate(base({ angle: '入浴料は¥800である点に触れる。' }), EXISTING, DEMAND, FACTS));

// 既出判定
eq('全語を含めば扱い済み', isCovered('onsen etiquette', 'japan onsen etiquette guide'), true);
eq('一語でも欠ければ未着手', isCovered('onsen tattoo', 'japan onsen etiquette guide'), false);
eq('空文字は未着手扱い', isCovered('', 'anything'), false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
