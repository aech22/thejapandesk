# CLAUDE.md — The Japan Desk

**⚠️ 作業前に共通正本を必ず読むこと:**
`/Users/hiroshi/Documents/Obsidian Vault/Projects/アフィリエイト/AFFILIATE.md`

技術スタック・デプロイ手順・共通の禁止事項は共通正本にある。このファイルには**The Japan Desk 固有の情報だけ**を書く。

> **他5サイトと決定的に違う点**: このサイトだけ**英語圏（US/UK/AU/CA）向け・海外ASP**。日本語施策（Shifty 導線・日本語 Pinterest 運用）の対象外。日本語のコピーを流用しない。

---

## 🔴 このサイトの最重要ルール — 公開ゲート

**`src/consts.ts` の `SITE_LIVE` が `false` の間は、全ページ noindex ＋ robots.txt で全クロール拒否。** 2026-08-05 時点で `false`（＝ドメインは稼働しているが検索には載っていない下書き状態）。

`SITE_LIVE = true` にしてよいのは、下記のローンチ手順を**すべて**終えてからだけ。**記事の `[VERIFY]` が残ったまま公開しない**（価格・SKU・アフィリンクが未確定のまま検索に載ると、誤情報を出したうえに ASP 規約にも触れうる）。

## サイト固有情報

| 項目 | 内容 |
|---|---|
| ブランド | The Japan Desk |
| ドメイン | **thejapandesk.net（取得済み・稼働中）** — 当初 .com を検討したが IONOS の .com が Sedo パーキングだったため .net に変更 |
| GitHub | `aech22/thejapandesk`（public）・`gh-pages` ブランチ配信 |
| DNS | Cloudflare（NS: nick/vita.ns.cloudflare.com）。apex A=185.199.108-111.153、www CNAME→aech22.github.io、**DNS only（グレー雲）** |
| ホスティング | GitHub Pages。`.github/workflows/deploy.yml` が push で Astro ビルド→gh-pages |
| 収益モデル | 海外ASP（Awin / ShareASale / CJ / JapanesePod101 / Klook / Travelpayouts） |
| 運営者 | TODGE（About・フッターに明記済み） |

## 構成

3ピラーのサイロ: `/craft/` ・ `/learn-japanese/` ・ `/japan-travel/`

記事は `content/articles/*.md`（frontmatter: title / description / date / pillar / slug / keyword / draft）。

## 記事の状態（要注意）

- **全記事が `[VERIFY]` 規律つきドラフト**。価格・SKU・アフィリンクは未確定でマーカー化してある
- `[VERIFY]` マーカーは **ASP の提携承認が取れてから実データで埋める**。承認前に推測で埋めない
- **§2.3 整合性ルール**: 触っていない商品を触ったように書かない。一次体験のない記述を「使ってみた」調にしない

## ASP と料率

| ASP | 案件 | 料率 |
|---|---|---|
| Awin | Musubi Kiln（陶磁器） | 10% |
| ShareASale | Pen Boutique（万年筆）／JCK（包丁） | 各10% |
| CJ | Bonsai Boy（盆栽） | 20% |
| — | JapanesePod101（語学） | 25% |
| — | Klook（旅行） | 6.5% |
| Travelpayouts | GetYourGuide | 8% |

剣道 Tozando・Migaku・日本デニムは料率が ASP ログイン必須で**未確定＝人間ステップ**。

**ニッチ選定の前提**: 報酬 $30/件の足切りが厳しく、Tier1 は7ニッチ（陶磁器/包丁/盆栽/万年筆/剣道/語学/旅行）に落ち着いた。$30 は高単価物販×専門店10-20%・高額旅行予約8%・語学SaaS生涯プランからのみ出る（低単価サブスク・eSIM・コーヒー器具は未達）。

## 運賃データ（Travelpayouts Flight Data API）

旅行ピラー向けに、航空券の月別最安値をビルド前に取得して静的HTMLへ焼き込む仕組み。**収益源ではなく集客・内部送客の入口**という位置づけ（フライトの報酬はチケット価格の1.1〜1.6%＝$30足切りに単体では届かない。刈り取りは GetYourGuide / Klook / JR Pass への内部リンクで行う）。

| | 場所 |
|---|---|
| 取得スクリプト | `scripts/fetch_fares.mjs`（`npm run fetch:fares` / `npm run fetch:fares:spike`） |
| 路線定義（単一ソース） | `src/data/fareRoutes.json` — 取得側と表示側の両方が読む |
| 出力データ | `src/data/fares/{ORIGIN}-{DEST}.json` |
| 表示 | `src/components/FareTable.astro` — 記事の frontmatter `fareWidget:` で差し込む |
| 定期更新 | `.github/workflows/refresh-fares.yml`（週次・木05:00 JST） |

- **トークンは `TRAVELPAYOUTS_TOKEN`**（環境変数／GitHub Secrets）。**`PUBLIC_` 接頭辞を使わない**（Astro がクライアントバンドルへ出力してしまう。リポジトリは public）
- **ブラウザから API を叩かない。** ビルド時取得のみ。理由は①トークン露出②Cookie同意ゲートの管轄に入り非同意ユーザーに表が出ない③JS依存だとインデックスされない
- **鮮度ガード**: データが **14日**より古いと `FareTable` が価格を伏せて「refreshing」表示に切り替える。更新が止まった静的サイトが古い運賃を配り続けるのを防ぐ最後の砦。**この閾値を緩めない**
- **API が返すのは直近48時間の検索キャッシュ**であり在庫でも確定運賃でもない。記事本文で「この値段で買える」と書かない（表の免責文が常時出る）
- 記事本文は `.md` でコンポーネントを直接書けないため、**frontmatter 駆動**（`fareWidget: { dest, origins }`）で `ArticleLayout` が本文末に描画する。MDX は導入しない

⚠️ **`refresh-fares.yml` が自分でビルド・デプロイまで行う理由**: `GITHUB_TOKEN` による push は他のワークフローを起動しない（GitHub の再帰防止仕様）ため、main へコミットしても `deploy.yml` は動かない。PAT を増やさない判断で、publish 手順を両方のワークフローに持たせている。**片方を変えたらもう片方も直すこと。**

⚠️ **bot が `src/data/fares/` を main にコミットする**ので、ローカルから push する前に `git pull --rebase` すること（共通正本ハマりどころ #10 と同じ状態）。

## SNS 発信

**Pinterest（本命）＞ Reddit（価値提供・直リンク禁止）＞ YouTube/Shorts＞ Instagram（補助）。X は捨て。** ハンドルは `@thejapandesk` で統一予定。

### Pinterest（このサイト専用アカウント・2026-08-05 時点）

**アカウントは新規作成済み。国内5サイトとは別アカウント・別 Drive フォルダで運用する。混ぜない。**

| | 場所 |
|---|---|
| 生成スクリプト | `/Users/hiroshi/Documents/Claude Code/pinterest-kit/gen_en_kit.py`（設定は `sites_en.py`） |
| ローカル出力 | `pinterest-kit/out_en/thejapandesk/`（日本語側の `out/` とは分離） |
| Drive | マイドライブ／**`thejapandesk_Pinterest投稿キット`**（日本語側とは別フォルダ） |

**ボードは3つ**: `Japanese Craft & Goods` / `Learning Japanese` / `Japan Travel`（pillar と1対1）。

**投稿頻度は週5本（≒1日1本）から**。新規アカウント＋新規ドメインは Pinterest のスパムフィルタが厳しいため。反応を見て1日3本まで上げる。

⚠️ **既存の手書き投稿文と重複している**。Drive の `japan-affiliate_投稿キット/thejapandesk_pins_2026-08-04` に Google ドキュメント2本（第1バッチ14Pin＋第2バッチ24Pin＝計38本）があり、**旅行ピラーの10記事だけ**を1記事3〜7切り口でカバーしている。文面の質はそちらが上だが、**参照している PNG 画像は Drive にもローカルにも存在しない**（＝文面のみ）。

→ **旅行ピラーは「既存Docsの文面＋新キットの画像」、工芸7記事・語学4記事は新キットをそのまま**、が推奨の使い分け。**同一記事URLへ両者をまとめて投稿しないこと**（同一リンクへの一斉投下はスパム判定＋自分のピン同士のカニバリズム。複数ピンは1本ごとに1週間空ける）。

⚠️ **投稿の開始は `SITE_LIVE=true` になってから。** noindex かつ `[VERIFY]` 未確定のページに送客すると、①誤情報を配る ②新規ドメインに対するスパムフィルタを成果の出ないタイミングで無駄撃ちする。キットは先に用意してあるので、公開したらすぐ投稿できる。

日本語5サイト用の `gen_social_kit.py` / `gen_pins.py` はこのサイトを**意図的に対象外**にしてある（日本語前提・文字単位の折り返しなので英語に流用すると単語が割れる）。

## 判断の経緯

picknavi へのドメイン統合は**却下**し、新規ドメイン＋インフラ流用にした（Obsidian `Knowledge/判断ログ.md` 2026-08-03）。理由は言語・地域・トピック・ASP がすべて別で、ドメイン評価が転移しないため。

## ローンチに残る手順（README.md にも記載）

1. [ ] 各記事の `[VERIFY]` を潰す（ASP承認後）
2. [ ] `consts.ts` の `SITE_LIVE = true` ＋ `PINTEREST_VERIFY` 設定（`GA_MEASUREMENT_ID` は `G-G84FY7N72R` で設定済み）
3. [ ] `robots.txt` を許可に差し替え（Disallow 削除・Sitemap 行を有効化）
4. [ ] About / Contact に運営者名・メールアドレス
5. [ ] OGP画像（1200×630）
6. [ ] Drive の `japan-affiliate_投稿キット` にある `social_kit.csv` の `[VERIFY-domain]` を `thejapandesk.net` に一括置換
