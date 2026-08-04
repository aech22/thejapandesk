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

## SNS 発信

**Pinterest（本命）＞ Reddit（価値提供・直リンク禁止）＞ YouTube/Shorts＞ Instagram（補助）。X は捨て。** ハンドルは `@thejapandesk` で統一予定。

⚠️ **Pinterest 運用は `SITE_LIVE=true` まで開始しない。** noindex かつ `[VERIFY]` 未確定のページにピンで送客すると、①誤情報を配る ②新規ドメインに対する Pinterest のスパムフィルタを無駄撃ちする。国内5サイト用の `pinterest-kit` はこのサイトを**意図的に対象外**にしてある（日本語前提のため流用不可）。

## 判断の経緯

picknavi へのドメイン統合は**却下**し、新規ドメイン＋インフラ流用にした（Obsidian `Knowledge/判断ログ.md` 2026-08-03）。理由は言語・地域・トピック・ASP がすべて別で、ドメイン評価が転移しないため。

## ローンチに残る手順（README.md にも記載）

1. [ ] 各記事の `[VERIFY]` を潰す（ASP承認後）
2. [ ] `consts.ts` の `SITE_LIVE = true` ＋ `PINTEREST_VERIFY` 設定（`GA_MEASUREMENT_ID` は `G-G84FY7N72R` で設定済み）
3. [ ] `robots.txt` を許可に差し替え（Disallow 削除・Sitemap 行を有効化）
4. [ ] About / Contact に運営者名・メールアドレス
5. [ ] OGP画像（1200×630）
6. [ ] Drive の `japan-affiliate_投稿キット` にある `social_kit.csv` の `[VERIFY-domain]` を `thejapandesk.net` に一括置換
