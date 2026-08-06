// サイト共通の定数。ここだけ触れば名義・計測・公開可否が切り替わる。

export const SITE_TITLE = 'The Japan Desk';
export const SITE_TAGLINE = 'Authentic Japan, explained from the inside.';
export const SITE_DESCRIPTION =
  'Honest buying guides and how-tos for Japanese craft goods, learning the language, and travelling Japan — written from Japan, using first-hand and Japanese-language sources.';
export const SITE_URL = 'https://thejapandesk.net';

// ★公開ゲート：ローンチ準備が整うまで false。false の間は全ページ noindex（[VERIFY] 下書きが検索に載らない）。
// ASP承認 → 記事の[VERIFY]潰し → 動作確認 が済んだら true にして再デプロイ。
export const SITE_LIVE = false;

// 計測・検証（取得後にここへ。空文字なら出力されない）
export const GA_MEASUREMENT_ID = 'G-G84FY7N72R';   // GA4測定ID（Cookie同意後に発火）
export const PINTEREST_VERIFY = '';    // Pinterest ドメイン認証タグ
export const TWITTER_SITE = '';        // 例: '@thejapandesk'

// Travelpayouts スクリプト（サイト認証＋リンク収益化）。marker 559180。
// Cookie を書くため CookieConsent.astro のローダー経由で同意後に読み込む。空文字なら出力されない。
export const TRAVELPAYOUTS_SCRIPT = 'https://emrldco.com/NTU5MTgw.js?t=559180';

// 12Go は直接提携（2026-08-07 承認・アジアの長距離バス／鉄道／フェリーの予約）。
// リンクは管理画面 https://agent.12go.asia/integration/ で発行したものを**そのまま**入れる
// （パラメータ名を推測して手で組み立てない）。空文字の間は 12Go リンクを一切出力しない。
// ★貼る前に Travelpayouts の LinkSwitcher を止めるか 12go.asia を除外すること（GetYourGuide と同じ罠）。
export const TWELVEGO_LINK = '';

// GetYourGuide は直接提携（パートナーID J2LM0TP・2026-08-06登録）。リンクはダッシュボードで発行する。
// integration analyzer（widget.getyourguide.com/dist/pa.umd.production.min.js）は 2026-08-07 に
// 「入れない」と判断済み。理由: ページ内の競合リンク（Klook・Viator・Tiqets 等）を URL と
// リンクテキストごと collector.getyourguide.com へ送る機能を含み、計測部分と分離できないため。
// リンク発行と成果計上には不要。**再導入しないこと。**
