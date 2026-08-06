#!/usr/bin/env node
// Travelpayouts Flight Data API から「月別の最安運賃」を取得して src/data/fares/*.json に落とす。
//
// 設計上の約束（崩さないこと）:
//   1. 事実（価格）だけを JSON に置く。講評・解釈は記事側に書く。
//   2. トークンは環境変数からのみ読む。PUBLIC_ 接頭辞は使わない（Astro がクライアントへ出力してしまう）。
//   3. API が返すのは「直近48時間の検索キャッシュ」であって在庫でも確定運賃でもない。
//      そのため取得日時 fetchedAt を必ず埋め、表示側（FareTable.astro）が鮮度で出し分ける。
//   4. 一部の路線が失敗しても全滅させない。既存 JSON を残して次へ進む。
//
// 取得は3段構え（2026-08-06 の Phase 0 実測で /v1/prices/monthly 単独では月数が 5〜11 と足りなかったため）:
//   ① /v1/prices/monthly        … 1リクエストで月別の最安値をまとめて取る（主力）
//   ② /v2/prices/month-matrix   … ①で欠けた月だけ、日別の価格から最安を拾う
//   ③ /v1/prices/calendar       … ②でも埋まらない月の最後の手段
//
// 使い方:
//   TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs --spike   # 取得可否の実測のみ（書き込まない）
//   TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs           # src/data/fares/*.json を更新
//   ... --no-fallback                                               # ①のみで動かす（比較用）

import { writeFile, readFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'fares');

const API_BASE = 'https://api.travelpayouts.com';
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN;

// 路線定義は src/data/fareRoutes.json が単一ソース（表示側の FareTable.astro も同じファイルを読む）。
const ROUTES_CONFIG = JSON.parse(
  await readFile(path.join(ROOT, 'src', 'data', 'fareRoutes.json'), 'utf8')
);

// 表示は全路線 USD に統一する。読者の大半が US で、出発地ごとに通貨が変わると比較表として読めなくなるため。
const CURRENCY = ROUTES_CONFIG.currency;
const ORIGINS = ROUTES_CONFIG.origins;
const DESTINATIONS = ROUTES_CONFIG.destinations;

// 当月から数えて何ヶ月ぶんを埋めにいくか。
const HORIZON_MONTHS = 12;

// Go/No-Go 判定基準（実装計画 §4）。**フォールバック追加後も基準は変えない**
// ＝「取得方法を変えれば元の基準を通せるか」を測るため。
const SPIKE = {
  minRoutesWithData: 6,
  minMonthsPerRoute: 8,
  sanePriceRange: [300, 4000], // USD
};

const REQUEST_GAP_MS = 250; // 連続リクエストの間隔（礼儀としてのスロットリング）

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 当月から HORIZON_MONTHS ぶんの "YYYY-MM" 配列。 */
function horizonMonths() {
  const out = [];
  const d = new Date();
  d.setUTCDate(1);
  for (let i = 0; i < HORIZON_MONTHS; i++) {
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

async function apiGet(pathname, params) {
  const url = new URL(pathname, API_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { 'X-Access-Token': TOKEN, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText} (${pathname})`);

  const body = await res.json();
  if (body && body.success === false) {
    throw new Error(`API error (${pathname}): ${JSON.stringify(body.error ?? body)}`);
  }
  return body;
}

/**
 * レスポンスから (月, 価格, 付随情報) を取り出す。
 * data が配列（v2 month-matrix）でもキー付きオブジェクト（v1 monthly / calendar）でも同じように扱う。
 * ＝ エンドポイントごとの形の違いをこの1箇所に閉じ込める。
 */
function extractByMonth(body) {
  const d = body?.data;
  const items = Array.isArray(d)
    ? d
    : d && typeof d === 'object'
      ? Object.entries(d)
          .map(([k, v]) => (v && typeof v === 'object' ? { _key: k, ...v } : null))
          .filter(Boolean)
      : [];

  const best = new Map(); // month -> item
  for (const it of items) {
    const price = Number(it.value ?? it.price);
    if (!Number.isFinite(price) || price <= 0) continue;

    const monthSrc = it.depart_date ?? it._key ?? '';
    const month = String(monthSrc).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) continue;

    const prev = best.get(month);
    if (!prev || price < Number(prev.value ?? prev.price)) best.set(month, it);
  }

  return best;
}

function toMonthRecord(month, item, source) {
  return {
    month,
    price: Math.round(Number(item.value ?? item.price)),
    airline: item.gate ?? null,
    departDate: item.depart_date ?? null,
    returnDate: item.return_date ?? null,
    transfers: Number.isFinite(Number(item.number_of_changes))
      ? Number(item.number_of_changes)
      : null,
    source,
  };
}

/**
 * 1路線ぶんの月別最安値を、①→②→③ の順に埋めながら集める。
 * 各段の寄与を stats に残す（スパイクの報告で「フォールバックが効いたか」を示すため）。
 */
async function collectRoute(origin, destination, useFallback) {
  const months = new Map(); // "YYYY-MM" -> record
  const stats = { monthly: 0, matrix: 0, calendar: 0, errors: [] };
  const horizon = horizonMonths();

  // ① /v1/prices/monthly
  try {
    const body = await apiGet('/v1/prices/monthly', {
      origin, destination, currency: CURRENCY,
    });
    for (const [month, item] of extractByMonth(body)) {
      months.set(month, toMonthRecord(month, item, 'monthly'));
      stats.monthly++;
    }
  } catch (err) {
    stats.errors.push(`monthly: ${err.message}`);
  }
  await sleep(REQUEST_GAP_MS);

  if (!useFallback) return { months, stats };

  // ② /v2/prices/month-matrix（欠けている月だけ）
  for (const m of horizon) {
    if (months.has(m)) continue;
    try {
      const body = await apiGet('/v2/prices/month-matrix', {
        origin, destination, currency: CURRENCY, month: `${m}-01`,
      });
      const found = extractByMonth(body).get(m);
      if (found) {
        months.set(m, toMonthRecord(m, found, 'month-matrix'));
        stats.matrix++;
      }
    } catch (err) {
      stats.errors.push(`matrix ${m}: ${err.message}`);
    }
    await sleep(REQUEST_GAP_MS);
  }

  // ③ /v1/prices/calendar（それでも欠けている月だけ）
  for (const m of horizon) {
    if (months.has(m)) continue;
    try {
      const body = await apiGet('/v1/prices/calendar', {
        origin, destination, currency: CURRENCY,
        depart_date: m, calendar_type: 'departure_date',
      });
      const found = extractByMonth(body).get(m);
      if (found) {
        months.set(m, toMonthRecord(m, found, 'calendar'));
        stats.calendar++;
      }
    } catch (err) {
      stats.errors.push(`calendar ${m}: ${err.message}`);
    }
    await sleep(REQUEST_GAP_MS);
  }

  return { months, stats };
}

function buildFile(origin, destination, monthsMap) {
  return {
    origin,
    destination,
    currency: CURRENCY.toUpperCase(),
    source: 'travelpayouts:monthly+month-matrix+calendar',
    note: 'Cached lowest fares from real searches on Aviasales. Indicative only — not a live quote or guaranteed availability.',
    fetchedAt: new Date().toISOString(),
    months: [...monthsMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
  };
}

async function main() {
  const spikeMode = process.argv.includes('--spike');
  const useFallback = !process.argv.includes('--no-fallback');

  if (!TOKEN) {
    console.error('TRAVELPAYOUTS_TOKEN が未設定です。');
    console.error('  ダッシュボード https://www.travelpayouts.com/programs/100/tools/api で発行し、');
    console.error('  TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs [--spike] の形で渡してください。');
    process.exit(1);
  }

  // スパイクは NRT 行きだけで判定する（Go/No-Go に KIX は不要）。
  const routes = spikeMode
    ? ORIGINS.map((o) => ({ origin: o.iata, destination: 'NRT' }))
    : DESTINATIONS.flatMap((d) => ORIGINS.map((o) => ({ origin: o.iata, destination: d.iata })));

  console.log(
    `取得開始: ${routes.length} 路線 / フォールバック ${useFallback ? 'ON' : 'OFF'} / 対象 ${HORIZON_MONTHS}ヶ月\n`
  );

  const results = [];
  for (const r of routes) {
    const { months, stats } = await collectRoute(r.origin, r.destination, useFallback);
    results.push({ ...r, months, stats });
    const detail = useFallback
      ? `(monthly ${stats.monthly} + matrix ${stats.matrix} + calendar ${stats.calendar})`
      : '';
    console.log(`  ${r.origin}-${r.destination}: ${months.size} months ${detail}`);
  }

  if (spikeMode) return reportSpike(results);
  return writeAll(results);
}

function reportSpike(results) {
  console.log('\n=== Phase 0 再スパイク結果（書き込みなし） ===\n');
  console.log('route      total  monthly  matrix  calendar  min USD  max USD  cheapest');
  console.log('---------- -----  -------  ------  --------  -------  -------  --------');

  let routesPassing = 0;
  const outliers = [];
  const allErrors = [];

  for (const r of results) {
    const list = [...r.months.values()];
    if (r.stats.errors.length) allErrors.push(`${r.origin}-${r.destination}: ${r.stats.errors[0]}`);

    if (list.length === 0) {
      console.log(`${r.origin}-${r.destination}         0        0       0         0        -        -  (no data)`);
      continue;
    }
    const prices = list.map((x) => x.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const cheapest = list.find((x) => x.price === min);
    if (list.length >= SPIKE.minMonthsPerRoute) routesPassing++;
    if (min < SPIKE.sanePriceRange[0] || max > SPIKE.sanePriceRange[1]) {
      outliers.push(`${r.origin}-${r.destination} (${min}–${max})`);
    }
    console.log(
      [
        `${r.origin}-${r.destination}`,
        String(list.length).padStart(5),
        String(r.stats.monthly).padStart(7),
        String(r.stats.matrix).padStart(6),
        String(r.stats.calendar).padStart(8),
        String(min).padStart(7),
        String(max).padStart(7),
        cheapest.month,
      ].join('  ')
    );
  }

  const pass = routesPassing >= SPIKE.minRoutesWithData;
  console.log(`\n判定基準（変更なし）: ${SPIKE.minMonthsPerRoute}ヶ月以上のデータが返る路線が ${SPIKE.minRoutesWithData} 以上`);
  console.log(`実測: ${routesPassing} / ${results.length} 路線`);
  if (outliers.length) console.log(`価格レンジ要調査: ${outliers.join(', ')}`);
  if (allErrors.length) {
    console.log(`\nエラー（各路線の先頭のみ）:`);
    for (const e of allErrors) console.log(`  ${e}`);
  }
  console.log(`\n>>> ${pass ? 'GO — Phase 3・5 へ進んでよい' : 'NO-GO — 縮小案か代替案の判断が必要'}\n`);

  process.exitCode = pass ? 0 : 2;
}

/** 通常モード: 成功した路線だけ書き出す。失敗した路線は既存ファイルをそのまま残す。 */
async function writeAll(results) {
  await mkdir(OUT_DIR, { recursive: true });

  let written = 0;
  let kept = 0;

  for (const r of results) {
    const file = path.join(OUT_DIR, `${r.origin}-${r.destination}.json`);

    if (r.months.size === 0) {
      // 空応答では上書きしない。既存の（古くはあるが正しい）データを守る。
      // 鮮度が切れれば FareTable 側が自動的に価格を隠すので、古いまま出続けることはない。
      if (existsSync(file)) {
        kept++;
        console.warn(`  keep existing: ${path.basename(file)}`);
      }
      continue;
    }

    const data = buildFile(r.origin, r.destination, r.months);
    await writeFile(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    written++;
  }

  console.log(`\n書き出し ${written} 件 / 据え置き ${kept} 件 → ${path.relative(ROOT, OUT_DIR)}`);

  const files = existsSync(OUT_DIR) ? (await readdir(OUT_DIR)).filter((f) => f.endsWith('.json')) : [];
  if (files.length === 0) {
    console.error('有効なデータが1件も無いため失敗として終了します。');
    process.exitCode = 1;
    return;
  }

  const oldest = await oldestFetchedAt(files);
  if (oldest) console.log(`最も古い fetchedAt: ${oldest}`);
}

async function oldestFetchedAt(files) {
  let oldest = null;
  for (const f of files) {
    try {
      const j = JSON.parse(await readFile(path.join(OUT_DIR, f), 'utf8'));
      if (j.fetchedAt && (!oldest || j.fetchedAt < oldest)) oldest = j.fetchedAt;
    } catch {
      // 壊れた JSON は無視（次回の書き込みで直る）。
    }
  }
  return oldest;
}

// 直接実行されたときだけ走らせる（テストから純粋関数だけを import できるようにするため）。
const entrypoint = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
if (import.meta.url === entrypoint) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { extractByMonth, horizonMonths, toMonthRecord };
