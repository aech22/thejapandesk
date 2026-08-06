// サイト共通の定数。ここだけ触れば名義・計測・公開可否が切り替わる。

export const SITE_TITLE = 'The Japan Desk';
export const SITE_TAGLINE = 'Authentic Japan, explained from the inside.';
export const SITE_DESCRIPTION =
  'Honest buying guides and how-tos for Japanese craft goods, learning the language, and travelling Japan — written from Japan, using first-hand and Japanese-language sources.';
export const SITE_URL = 'https://thejapandesk.net';

// ★公開ゲート。false の間は全ページ noindex ＋ robots.txt 全拒否。
// 2026-08-07 に true へ。全22記事の [VERIFY] を 0 にし、物販ピラー(craft)を停止したうえで公開した。
// false に戻すと robots.txt との整合が崩れるので、戻すときは public/robots.txt も一緒に戻すこと。
export const SITE_LIVE = true;

// 計測・検証（取得後にここへ。空文字なら出力されない）
export const GA_MEASUREMENT_ID = 'G-G84FY7N72R';   // GA4測定ID（Cookie同意後に発火）
// Pinterest ドメイン認証タグ。The Japan Desk 用アカウント（英語圏・日本語5サイトとは別アカウント）で発行。
// 認証済みドメインは1アカウントにしか紐付かないため、日本語側アカウントのタグをここに入れないこと。
export const PINTEREST_VERIFY = 'b7f723ea6938dde168ee771ce775b253';
export const TWITTER_SITE = '';        // 例: '@thejapandesk'

// Travelpayouts スクリプト（サイト認証＋リンク収益化）。marker 559180。
// Cookie を書くため CookieConsent.astro のローダー経由で同意後に読み込む。空文字なら出力されない。
export const TRAVELPAYOUTS_SCRIPT = 'https://emrldco.com/NTU5MTgw.js?t=559180';

// 12Go は直接提携（2026-08-07 承認・アジアの長距離バス／鉄道／フェリーの予約）。アフィリエイトID 16597922。
// リンクは管理画面 https://agent.12go.asia/integration/ の Links で発行したものを**そのまま**入れる
// （形式は https://12go.asia/?z=16597922。パラメータ名を推測して手で組み立てない）。
// 空文字の間は 12Go リンクを一切出力しない。Sub_id には記事の slug を入れる（後から遡って付けられない）。
export const TWELVEGO_LINK = '';

// GetYourGuide は直接提携（パートナーID J2LM0TP・2026-08-06登録）。リンクはダッシュボードで発行する。
// integration analyzer（widget.getyourguide.com/dist/pa.umd.production.min.js）は 2026-08-07 に
// 「入れない」と判断済み。理由: ページ内の競合リンク（Klook・Viator・Tiqets 等）を URL と
// リンクテキストごと collector.getyourguide.com へ送る機能を含み、計測部分と分離できないため。
// リンク発行と成果計上には不要。**再導入しないこと。**
