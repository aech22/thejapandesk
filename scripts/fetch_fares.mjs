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
// 使い方:
//   TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs --spike   # Phase 0: 取得可否の実測のみ（書き込まない）
//   TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs           # 通常: src/data/fares/*.json を更新

import { writeFile, readFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

// Phase 0 の Go/No-Go 判定基準（実装計画 §4）。
const SPIKE = {
  minRoutesWithData: 6,   // NRT 行き9路線のうち、データが返る路線数の下限
  minMonthsPerRoute: 8,   // 1路線あたり価格が返る月数の下限
  sanePriceRange: [300, 4000], // USD。これを外れる値は要調査として報告する
};

const REQUEST_GAP_MS = 250; // 連続リクエストの間隔（礼儀としてのスロットリング）

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Travelpayouts /v1/prices/monthly を1路線ぶん叩く。 */
async function fetchMonthly(origin, destination) {
  const url = new URL('/v1/prices/monthly', API_BASE);
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('currency', CURRENCY);

  const res = await fetch(url, {
    headers: { 'X-Access-Token': TOKEN, Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${origin}-${destination}`);
  }

  const body = await res.json();
  if (body && body.success === false) {
    throw new Error(`API error for ${origin}-${destination}: ${JSON.stringify(body.error ?? body)}`);
  }
  return body;
}

/**
 * API レスポンスを当サイト用のスキーマへ正規化する。
 * 表示側はこの正規化スキーマだけに依存させる（API のフィールド名変更を1箇所に閉じ込めるため）。
 */
function normalize(origin, destination, body) {
  const raw = body?.data ?? {};
  const months = Object.entries(raw)
    .map(([key, v]) => {
      if (!v || typeof v !== 'object') return null;
      const price = Number(v.value ?? v.price);
      if (!Number.isFinite(price) || price <= 0) return null;
      // キーは "2026-09-01" 形式で返ることがあるため YYYY-MM に丸める。
      const month = String(key).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(month)) return null;
      return {
        month,
        price: Math.round(price),
        airline: v.gate ?? null,
        departDate: v.depart_date ?? null,
        returnDate: v.return_date ?? null,
        transfers: Number.isFinite(Number(v.number_of_changes)) ? Number(v.number_of_changes) : null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    origin,
    destination,
    currency: CURRENCY.toUpperCase(),
    source: 'travelpayouts:/v1/prices/monthly',
    note: 'Cached lowest fares from real searches on Aviasales. Indicative only — not a live quote or guaranteed availability.',
    fetchedAt: new Date().toISOString(),
    months,
  };
}

function routeList() {
  const routes = [];
  for (const d of DESTINATIONS) {
    for (const o of ORIGINS) routes.push({ origin: o.iata, destination: d.iata });
  }
  return routes;
}

async function main() {
  const spikeMode = process.argv.includes('--spike');

  if (!TOKEN) {
    console.error('TRAVELPAYOUTS_TOKEN が未設定です。');
    console.error('  ダッシュボード https://www.travelpayouts.com/programs/100/tools/api で発行し、');
    console.error('  TRAVELPAYOUTS_TOKEN=xxxx node scripts/fetch_fares.mjs [--spike] の形で渡してください。');
    process.exit(1);
  }

  // スパイクは NRT 行きだけで判定する（Go/No-Go に KIX は不要）。
  const routes = spikeMode
    ? ORIGINS.map((o) => ({ origin: o.iata, destination: 'NRT' }))
    : routeList();

  const results = [];
  for (const r of routes) {
    try {
      const body = await fetchMonthly(r.origin, r.destination);
      const data = normalize(r.origin, r.destination, body);
      results.push({ ...r, ok: true, data });
      console.log(`  ${r.origin}-${r.destination}: ${data.months.length} months`);
    } catch (err) {
      results.push({ ...r, ok: false, error: String(err.message ?? err) });
      console.warn(`  ${r.origin}-${r.destination}: FAILED — ${err.message ?? err}`);
    }
    await sleep(REQUEST_GAP_MS);
  }

  if (spikeMode) return reportSpike(results);
  return writeAll(results);
}

/** Phase 0: 取得できたデータの量と妥当性を報告し、Go/No-Go を機械的に判定する。 */
function reportSpike(results) {
  console.log('\n=== Phase 0 スパイク結果（書き込みなし） ===\n');
  console.log('route      months  min USD  max USD  cheapest month');
  console.log('---------- ------  -------  -------  --------------');

  let routesWithData = 0;
  const outliers = [];

  for (const r of results) {
    if (!r.ok) {
      console.log(`${r.origin}-${r.destination}     ERROR   ${r.error}`);
      continue;
    }
    const m = r.data.months;
    if (m.length === 0) {
      console.log(`${r.origin}-${r.destination}          0        -        -  (no data)`);
      continue;
    }
    const prices = m.map((x) => x.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const cheapest = m.find((x) => x.price === min);
    if (m.length >= SPIKE.minMonthsPerRoute) routesWithData++;
    if (min < SPIKE.sanePriceRange[0] || max > SPIKE.sanePriceRange[1]) {
      outliers.push(`${r.origin}-${r.destination} (${min}–${max})`);
    }
    console.log(
      `${r.origin}-${r.destination}     ${String(m.length).padStart(6)}  ${String(min).padStart(7)}  ${String(max).padStart(7)}  ${cheapest.month}`
    );
  }

  const pass = routesWithData >= SPIKE.minRoutesWithData;
  console.log(`\n判定基準: ${SPIKE.minMonthsPerRoute}ヶ月以上のデータが返る路線が ${SPIKE.minRoutesWithData} 以上`);
  console.log(`実測: ${routesWithData} / ${results.length} 路線`);
  if (outliers.length) {
    console.log(`価格レンジ要調査: ${outliers.join(', ')}`);
  }
  console.log(`\n>>> ${pass ? 'GO — Phase 1 以降へ進んでよい' : 'NO-GO — ツアー価格軸の代替案へ切り替える'}\n`);

  process.exitCode = pass ? 0 : 2;
}

/** 通常モード: 成功した路線だけ書き出す。失敗した路線は既存ファイルをそのまま残す。 */
async function writeAll(results) {
  await mkdir(OUT_DIR, { recursive: true });

  let written = 0;
  let kept = 0;

  for (const r of results) {
    const file = path.join(OUT_DIR, `${r.origin}-${r.destination}.json`);

    if (!r.ok || r.data.months.length === 0) {
      // 失敗・空応答では上書きしない。既存の（古くはあるが正しい）データを守る。
      // 鮮度が切れれば FareTable 側が自動的に価格を隠すので、古いまま出続けることはない。
      if (existsSync(file)) {
        kept++;
        console.warn(`  keep existing: ${path.basename(file)}`);
      }
      continue;
    }

    await writeFile(file, JSON.stringify(r.data, null, 2) + '\n', 'utf8');
    written++;
  }

  console.log(`\n書き出し ${written} 件 / 据え置き ${kept} 件 → ${path.relative(ROOT, OUT_DIR)}`);

  const files = existsSync(OUT_DIR) ? (await readdir(OUT_DIR)).filter((f) => f.endsWith('.json')) : [];
  if (files.length === 0) {
    console.error('有効なデータが1件も無いため失敗として終了します。');
    process.exitCode = 1;
    return;
  }

  // 鮮度サマリ（ワークフローのログで一目で分かるように）。
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
