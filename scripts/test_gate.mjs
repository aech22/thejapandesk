#!/usr/bin/env node
// scripts/test_gate.mjs — gate.mjs の端ケースを固定する。`node scripts/test_gate.mjs`
//
// 「機械的に判定する」と書いた仕組みは、提出前に端ケースを流してから完成と呼ぶ
// （Knowledge/mistakes.md 2026-08-04 の教訓）。ここで流すのは次の3種類。
//   ① 台帳が空（許可集合が空）のとき、素通りしないか
//   ② 表記ゆれ（カンマ・全角・範囲・末尾のカンマ）で同じ値が別物にならないか
//   ③ 価格でないもの（日数・箇所数）を誤って拾わないか

import {
  check,
  extractAmounts,
  normalize,
  allowedTokens,
  staleFacts,
  datedOnlyTokens,
  undatedPeriodViolations,
} from './gate.mjs';

let pass = 0;
let fail = 0;
const eq = (name, got, want) => {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) {
    pass++;
  } else {
    fail++;
    console.log(`NG ${name}\n   got  ${g}\n   want ${w}`);
  }
};

const FACTS = [
  { id: 'kinosaki', numbers: ['¥800', '¥1,500'], verifiedAt: '2026-09-06' },
  { id: 'kurokawa', numbers: ['¥1,500', '¥700'], verifiedAt: '2026-09-06' },
];

// ① 台帳が空でも素通りしない
eq('空台帳では全部が違反', check('It costs ¥800.', []), ['¥800']);
eq('空台帳・空本文は違反ゼロ', check('', []), []);
eq('本文に数値が無ければ違反ゼロ', check('No prices here at all.', FACTS), []);

// ② 表記ゆれ
eq('カンマの有無を同一視', normalize('¥1,500'), '¥1500');
eq('全角％を半角に', normalize('50％'), '50%');
eq('台帳のカンマ付きと本文のカンマ無しが一致', check('The pass is ¥1500.', FACTS), []);
eq('末尾のカンマを値に含めない', extractAmounts('It was ¥12,000, and then.'), ['¥12000']);
eq('範囲は両端を拾う', extractAmounts('around US$10–15/day'), ['$10', '$15']);
eq('小数を保持', extractAmounts('$24.99 a month'), ['$24.99']);
eq('％を拾う', extractAmounts('a 70% discount'), ['70%']);
eq('重複は1回だけ', extractAmounts('¥800 then ¥800 again'), ['¥800']);

// ③ 価格でないものを拾わない
eq('日数は拾わない', extractAmounts('a 14-day pass for 7 days'), []);
eq('箇所数は拾わない', extractAmounts('three baths, six months'), []);
eq('通貨記号の無い数値は拾わない', extractAmounts('Bath 800 yen'), []);

// 実運用の形
eq(
  '台帳にある値だけの本文は合格',
  check('Adults pay ¥800 per bath, or ¥1,500 for the all-day pass.', FACTS),
  [],
);
eq(
  '台帳に無い値だけを返す',
  check('¥800 per bath, but the JR pass is ¥50,000.', FACTS),
  ['¥50000'],
);
eq('許可集合の大きさ', allowedTokens(FACTS).size, 3);

// 鮮度
eq('verifiedAt が無い fact は stale 扱い', staleFacts([{ id: 'x' }], 180).length, 1);
eq(
  '180日を超えたら stale',
  staleFacts([{ id: 'y', verifiedAt: '2026-01-01' }], 180, new Date('2026-09-06')).length,
  1,
);
eq(
  '180日以内なら stale ではない',
  staleFacts([{ id: 'z', verifiedAt: '2026-08-01' }], 180, new Date('2026-09-06')).length,
  0,
);

// ④ 有効期間つきの価格（2026-10-01 の JRパス値上げで踏んだ形を固定する）
//    `¥53,000（2026-09-07 時点）` は改定日の翌朝に誤りになる。時点ではなく期間を書かせる。
const DATED = [
  {
    id: 'pass-old',
    numbers: ['¥50,000', '¥80,000'],
    effectiveUntil: '2026-09-30',
    periodPhrases: ['30 September 2026', '1 October 2026'],
    verifiedAt: '2026-09-07',
  },
  {
    id: 'pass-new',
    numbers: ['¥53,000', '¥84,000'],
    effectiveFrom: '2026-10-01',
    periodPhrases: ['1 October 2026'],
    verifiedAt: '2026-09-07',
  },
  // 期間を持たない別商品が ¥50,000 を共有している。こちらは期間表記を求めない。
  { id: 'east-pass', numbers: ['¥50,000', '¥25,000'], verifiedAt: '2026-09-07' },
];

eq('期間つき専用の値だけを抽出', [...datedOnlyTokens(DATED)].sort(), ['¥53000', '¥80000', '¥84000']);
eq(
  '期間の明示が無ければ違反',
  undatedPeriodViolations('The 14-day pass is ¥84,000.', DATED).map((v) => v.id),
  ['pass-new'],
);
eq(
  '期間を書けば合格',
  undatedPeriodViolations('It is ¥80,000 through 30 September 2026 and ¥84,000 from 1 October 2026.', DATED),
  [],
);
eq(
  '共有された値は期間表記を求めない',
  undatedPeriodViolations('The JR East Pass 10-day is ¥50,000.', DATED),
  [],
);
eq('期間つきの値が本文に無ければ違反ゼロ', undatedPeriodViolations('No prices here.', DATED), []);
eq('台帳が空なら違反ゼロ', undatedPeriodViolations('It is ¥84,000.', []), []);
eq(
  '期間の表記は大文字小文字を無視する',
  undatedPeriodViolations('¥84,000 from 1 october 2026.', DATED),
  [],
);
eq(
  '違反には該当トークンを載せる',
  undatedPeriodViolations('¥80,000 and ¥84,000, no dates.', DATED).map((v) => v.tokens.join(',')),
  ['¥80000', '¥84000'],
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
