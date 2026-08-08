#!/usr/bin/env node
// 工程表の機械検算。
//
// 「読者がこの通りに動けるか」を人の注意力ではなく機械で担保するためのもの。
// 検出するのは、記事を読んでいるだけでは絶対に気づけない類の破綻:
//   - 時間指定入場に間に合わない行程（積み上げた到着時刻が anchor を過ぎている）
//   - 最終入場・搭乗手続き締切を過ぎて始まるブロック
//   - 移動が「乗車時間だけ」で、徒歩と駅内の時間が抜けている
//   - 遅延の吸収枠（flex）が無い日
//   - 何時間も歩き続けるのに休憩もトイレも無い区間
//   - 出典・確認日の無い事実
//
// 使い方: npm run check:itinerary
// 失敗したまま公開しないこと。

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { computeDay, fmtClock, fmtDuration, parseClock } from '../src/lib/itinerary.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, '..', 'src', 'data', 'itineraries');

// --- しきい値（変えるならここだけ） ---
const MIN_FLEX_PER_DAY = 60;        // 遅延の吸収枠。これを割る日は行程が硬すぎる
const MAX_DAY_LENGTH = 14 * 60;     // 起床から解散まで。これを超える日は現実に回らない
const MAX_END = parseClock('23:00'); // 日をまたぐ工程表は作らない
const MAX_GRIND = 180;              // 休憩・トイレ・食事を挟まずに歩き続けてよい上限
const MIN_STATION_BUFFER = 5;       // 鉄道移動の駅内バッファ（乗換・出口探し）
const FACT_STALE_DAYS = 365;        // 事実の確認日がこれより古いと落とす
const FACT_WARN_DAYS = 180;         // 警告だけ出す

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const daysSince = (iso) => (Date.now() - new Date(iso).getTime()) / 86_400_000;

function checkFact(where, fact) {
  if (!fact.source || !/^https?:\/\//.test(fact.source)) {
    fail(`${where}: fact に一次ソースのURLが無い（事実を出典なしで書かない）`);
  }
  if (!fact.checkedAt || Number.isNaN(new Date(fact.checkedAt).getTime())) {
    fail(`${where}: fact に checkedAt が無い、または日付として不正`);
    return;
  }
  if (!fact.hours && !fact.hoursNote && !fact.fee && !fact.closed) {
    fail(`${where}: fact が空（hours / hoursNote / fee / closed のどれも無い）`);
  }
  const age = daysSince(fact.checkedAt);
  if (age > FACT_STALE_DAYS) {
    fail(`${where}: fact の確認日が ${Math.round(age)} 日前。開館時間を取り直すこと`);
  } else if (age > FACT_WARN_DAYS) {
    warn(`${where}: fact の確認日が ${Math.round(age)} 日前。次の更新で取り直す`);
  }
}

function checkDay(planId, rawDay) {
  const d = computeDay(rawDay);
  const at = (b) => `${planId} day ${d.day} "${b.title}"`;
  const dayId = `${planId} day ${d.day}`;

  // computeDay が出す破綻（anchor に間に合わない・締切超過・形式不正）はそのまま失敗にする
  d.issues.forEach(fail);

  if (!d.fallback) fail(`${dayId}: 雨天・体力切れの代替（fallback）が無い`);
  if (typeof d.walkKm !== 'number' || d.walkKm <= 0) fail(`${dayId}: walkKm が無い`);
  if (!d.base) fail(`${dayId}: base が無い`);

  if (d.totals.flex < MIN_FLEX_PER_DAY) {
    fail(
      `${dayId}: 吸収枠が ${fmtDuration(d.totals.flex)} しかない（最低 ${MIN_FLEX_PER_DAY} 分）。` +
        `1つ遅れたら全部倒れる行程になっている`
    );
  }
  if (d.totals.day > MAX_DAY_LENGTH) {
    fail(`${dayId}: 1日 ${fmtDuration(d.totals.day)}。${fmtDuration(MAX_DAY_LENGTH)} を超えている`);
  }
  if (d.endMin > MAX_END) {
    fail(`${dayId}: 終了が ${d.endLabel}。夜が遅すぎる（翌日の開始に響く）`);
  }
  if (!d.blocks.some((b) => b.kind === 'pit')) {
    fail(`${dayId}: トイレ・コンビニのブロックが1つも無い`);
  }
  if (!d.blocks.some((b) => b.kind === 'meal')) {
    fail(`${dayId}: 食事のブロックが1つも無い`);
  }

  for (const b of d.blocks) {
    if (b.kind === 'move') {
      const p = b.breakdown;
      if (!p) {
        fail(`${at(b)}: move に breakdown が無い（乗車時間だけの移動は現実には成立しない）`);
        continue;
      }
      const sum = (Number(p.walk) || 0) + (Number(p.ride) || 0) + (Number(p.station) || 0);
      if (sum !== Number(b.min)) {
        fail(`${at(b)}: breakdown の合計 ${sum} 分が min ${b.min} 分と一致しない`);
      }
      if (b.mode === 'rail' && (Number(p.station) || 0) < MIN_STATION_BUFFER) {
        fail(
          `${at(b)}: 鉄道移動なのに駅内バッファが ${p.station ?? 0} 分。` +
            `乗換・出口探し・改札の時間を最低 ${MIN_STATION_BUFFER} 分は見込むこと`
        );
      }
      if (b.mode === 'rail' && (Number(p.walk) || 0) === 0) {
        warn(`${at(b)}: 鉄道移動なのに徒歩0分。駅まで／駅からの徒歩は本当に無いか`);
      }
    }
    if (b.fact) checkFact(at(b), b.fact);
    if (b.booking === 'required' && !b.tip) {
      warn(`${at(b)}: 要予約なのに、いつ・何を予約すべきかの補足が無い`);
    }
  }

  // 休憩なしで歩き続ける区間。spot と move の徒歩ぶんを積み、
  // rest / meal / pit が入ったらリセットする。
  let grind = 0;
  let grindFrom = d.blocks[0]?.start ?? d.start;
  for (const b of d.blocks) {
    if (b.kind === 'rest' || b.kind === 'meal' || b.kind === 'pit' || b.kind === 'flex') {
      grind = 0;
      grindFrom = b.end;
      continue;
    }
    if (b.kind === 'spot') grind += Number(b.min) || 0;
    if (b.kind === 'move') grind += Number(b.breakdown?.walk) || 0;
    if (grind > MAX_GRIND) {
      fail(
        `${dayId}: ${grindFrom} から ${b.end} まで休憩なしで立ちっぱなしが ${fmtDuration(grind)}。` +
          `${fmtDuration(MAX_GRIND)} を超えたら rest か pit を挟むこと`
      );
      grind = 0;
      grindFrom = b.end;
    }
  }

  return d;
}

// --- 実行 ---
const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error('src/data/itineraries に JSON が1つも無い');
  process.exit(1);
}

const summaries = [];
for (const file of files) {
  const plan = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
  if (!plan.id) fail(`${file}: id が無い`);
  if (!plan.startAssumption) fail(`${file}: startAssumption（開始時刻の前提）が無い`);
  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    fail(`${file}: days が空`);
    continue;
  }
  for (const rawDay of plan.days) {
    const d = checkDay(plan.id, rawDay);
    summaries.push(
      `  day ${String(d.day).padStart(2)}  ${d.start}–${d.endLabel}` +
        `  (${fmtDuration(d.totals.day).padStart(6)})` +
        `  on foot ${fmtDuration(d.totals.onFoot).padStart(6)}` +
        `  slack ${fmtDuration(d.totals.flex).padStart(6)}` +
        `  ${d.base}`
    );
  }
}

console.log(`\n工程表 ${files.length} 件を検算した\n`);
console.log(summaries.join('\n'));

if (warnings.length) {
  console.log(`\n⚠️  警告 ${warnings.length} 件`);
  warnings.forEach((w) => console.log(`  - ${w}`));
}

if (errors.length) {
  console.error(`\n❌ 失敗 ${errors.length} 件`);
  errors.forEach((e) => console.error(`  - ${e}`));
  console.error('\nこの状態で公開しないこと。\n');
  process.exit(1);
}

console.log('\n✅ すべての日が成立している（時間指定入場・締切・吸収枠・休憩・出典）\n');
