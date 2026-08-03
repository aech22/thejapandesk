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
export const GA_MEASUREMENT_ID = '';   // 例: 'G-XXXXXXX'
export const PINTEREST_VERIFY = '';    // Pinterest ドメイン認証タグ
export const TWITTER_SITE = '';        // 例: '@thejapandesk'
