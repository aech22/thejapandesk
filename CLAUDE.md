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

4ピラーのサイロ: `/craft/` ・ `/learn-japanese/` ・ `/japan-travel/` ・ `/japan-nature/`

記事は `content/articles/*.md`（frontmatter: title / description / date / pillar / slug / keyword / draft）。

**うちサイトに出ているのは 2ピラー**（learn-japanese / japan-travel）。craft は提携未成立で停止中、**japan-nature は 2026-08-07 に新設したが記事が0本のため停止中**（どちらも `pillars.ts` の `paused: true`）。ピラーの出し分けは `ACTIVE_PILLARS` が単一の窓口。

### japan-nature（自然系・2026-08-07 追加）

山・川・渓谷・温泉・紅葉。旅行ピラーから分けたのは、読者の検索意図が「行き方・パス・予算」ではなく「どこが・いつ・どう見えるか」で、Pinterest 側のボードも分けたほうがテーマ権威が立つため。

- **収益の当て先は既存のまま**: GetYourGuide（直接提携）・Klook（Travelpayouts経由）のツアー／アクティビティと、12Go の陸路移動。物販ASPが要らないので **craft と違って提携待ちにならない**
- **有効化の手順**: 記事を1本以上入れる → `src/data/pillars.ts` の japan-nature から `paused: true` を消す → `pinterest-kit/pin_data_en.py` に該当 slug のピン文面を足す（無いとキットがその記事をスキップする）
- 12Go の規約上、**ピンから 12Go へ直リンクしない**（自サイトの記事へ送り、リンクは記事内に置く）

## 記事の状態（2026-08-07 更新）

**`[VERIFY]` マーカーは全22記事で 0 件になった**（334件を処理）。方針は「確認できない数字は書かない」で、公式一次ソースで裏が取れたものだけ数字＋出典リンクを残し、取れないものはレンジ＋時点注記か削除にした。

- **§2.3 整合性ルール**: 触っていない商品を触ったように書かない。一次体験のない記述を「使ってみた」調にしない
- **アフィリリンクのURLはまだ1本も入っていない**。発行後に入れる作業は `PUBLISH_CHECKLIST.md`（記事別・執筆時のメモを移設したもの）に集約してある。**記事本文に申し送りを書かない**
- ⚠️ **HTMLコメントの申し送りを記事に書かない。** `<!-- PRE-PUBLISH CHECKLIST -->` が全22記事にあり、**ページには表示されないがビルド後のHTMLに出力されていた**（料率「Awin (10%)」等が読める状態だった）。2026-08-07 に全て `PUBLISH_CHECKLIST.md` へ移設済み
- ⚠️ **運営側の理屈を読者向け本文に書かない。** 実際に3箇所あった: ①「1件で大きなアフィリエイト報酬になる」（万年筆）②比較表の「Affiliate（報酬率）」列（Migaku比較）③「8%のアフィリエイト予約なら紹介者に約$40」（7日間旅程）。いずれも削除済み

### 🔴 物販ピラー（craft）は一時停止中（2026-08-07〜）

**craft の7記事は `draft: true`、`src/data/pillars.ts` の craft は `paused: true`。** ナビ・トップ・`/craft/` ピラーページ・サイトマップのいずれにも出ない（ビルド22ページ・`/craft/` 参照0件を実測）。

- **理由**: 物販ASP（Awin/Musubi Kiln・ShareASale/Pen Boutique・CJ/Bonsai Boy）の提携が未成立で、リンクの無い買い物ガイドを公開しても収益にならない
- **復活手順**: ①`pillars.ts` の craft の `paused: true` を消す ②craft 7記事の `draft: true` を `false` に戻す ③`japan-souvenirs-worth-buying.md` の工芸3記事への内部リンク（表の "Deep-dive guide" 列・各節末の一行・おすすめ節・末尾リスト＝計12本）を戻す。**この12本は停止時に404になるため外してある**
- ピラーの出し分けは `ACTIVE_PILLARS`（`pillars.ts`）が単一の窓口。ナビ・トップ・ピラーページ生成は必ずこれを使う（`PILLARS` を直接使うと停止中のピラーが出る）
- 語学ピラー（learn-japanese・4記事）は **JapanesePod101 が提携承認済み（25%）なので停止しない**（2026-08-07 判断）

## ASP と料率

| ASP | 案件 | 料率 |
|---|---|---|
| Awin | Musubi Kiln（陶磁器） | 10% |
| ShareASale | Pen Boutique（万年筆）／JCK（包丁） | 各10% |
| CJ | Bonsai Boy（盆栽） | 20% |
| — | JapanesePod101（語学） | 25% |
| — | Klook（旅行） | 6.5% |
| — | GetYourGuide（旅行） | [VERIFY] |
| — | **12Go**（旅行・陸路/海路の予約） | [VERIFY]（**2026-08-07 承認済み**・支払下限 300 THB） |

**GetYourGuide は直接提携**（`partner.getyourguide.com`・パートナーID `J2LM0TP`・2026-08-06登録）。以前「自社プログラムを持たないためネットワーク経由が唯一の手段」と記録していたが**誤り**。そもそも **Travelpayouts の My Programs に GetYourGuide は無い**（2026-08-07 ユーザー確認・"Unlock more 20" 側と思われる）ため、旧記載の「Travelpayouts 経由8%」は選択肢として存在しない。実料率はダッシュボードで確認して埋める。
**integration analyzer（`widget.getyourguide.com/dist/pa.umd.production.min.js`）は意図的に未導入**。ページ内の競合リンク（Klook・Viator・Tiqets 等）を URL とリンクテキストごと GetYourGuide へ送信する機能を含むため。リンク発行と成果計上には不要。

### LinkSwitcher が実際に何を書き換えるか（2026-08-07 本番で実測）

本番ページに各ドメインのリンクをDOMへ差し込み、6秒後の `href` を読んで確認した結果:

| リンク先 | 書き換え | 備考 |
|---|---|---|
| `getyourguide.com` | **されない** | 直接提携の妨げにならない |
| `12go.asia` | **されない** | 同上 |
| `klook.com` | **される** | `emrldco.com/re?campaign_id=137&marker=761056&p=4110&trs=559180&u=...` ＋ `rel="noopener nofollow sponsored"` 付与 |

**LinkSwitcher はこのアカウントで利用可能なプログラムのブランドしか変換しない。** 変換対象の判定はクライアント側スクリプトに無く、サーバ（`link-switch/v1/convert`）が返す。

- ⚠️ **これは現時点の測定値**。Travelpayouts の "Unlock more" が解除されて GetYourGuide や 12Go が使えるようになった瞬間、LinkSwitcher は**それらの変換も始める**（＝直接提携の成果が黙って付け替えられる）。**プログラムが解除されたら、直接提携しているブランドを LinkSwitcher から除外すること。**
- 検証方法（再現手順）: 本番ページで `document.body.appendChild` した `<a>` の `href` が数秒後に `emrldco.com/re?` へ変わるかを見る。`/re?` URL は**開かない**（クリックが記録される）。

### Klook は当面 Travelpayouts に集約する（2026-08-07 決定）

**直接提携（6.5%）へは切り替えない。LinkSwitcher もそのまま稼働させる（＝ダッシュボードでの作業は不要）。**

- **理由**: ①現時点でトラフィックがなく成果額が小さい。Travelpayouts の**支払下限 $50 は全ブランド合算**なので、少額のうちは単独ブランドで下限に届かない直接提携より現金化が早い ②リンクの二重管理・トラッキングの分散を避けられる ③LinkSwitcher が既に `www.klook.com` を自動変換しているため、出典リンクを含めて**追加作業ゼロで収益化されている**
- **トレードオフ（承知のうえ）**: 料率は直接 6.5% に対し Travelpayouts は低い（要ダッシュボード確認）。**取りこぼしている差分は「Klook経由の成果額 ×（6.5% − TP料率）÷ TP料率」**で、成果が増えるほど比例して大きくなる
- **再着手条件（どちらか満たしたら直接提携を再評価）**:
  1. **Travelpayouts 上の Klook 成果が単月 $50 を安定して超えた**とき — 合算による現金化メリットが消え、料率差がそのまま純損になる
  2. **旅行ピラー公開後、Klook リンクのクリックが月100件を超えた**とき — 差分が試算できるだけの母数が出る
- 切り替えるときは、**LinkSwitcher から Klook を除外するのが先**（除外しないと直接リンクまで Travelpayouts に変換され、直接分が食われる）

剣道 Tozando・Migaku・日本デニムは料率が ASP ログイン必須で**未確定＝人間ステップ**。

**ニッチ選定の前提**: 報酬 $30/件の足切りが厳しく、Tier1 は7ニッチ（陶磁器/包丁/盆栽/万年筆/剣道/語学/旅行）に落ち着いた。$30 は高単価物販×専門店10-20%・高額旅行予約8%・語学SaaS生涯プランからのみ出る（低単価サブスク・eSIM・コーヒー器具は未達）。

## 12Go のトラフィック規約（2026-08-07・[公式](https://blog.12go.asia/allowed-types-of-traffic-12go-terms-and-rules/)）

直接提携なので**このサイトの集客のやり方がそのまま規約の対象**になる。当サイトの各チャネルへの当てはめ:

| チャネル | 12Go の扱い | The Japan Desk での運用 |
|---|---|---|
| 記事へのオーガニック検索流入 | **Allowed**（SEO traffic to affiliate website） | 本命。これがメインの導線 |
| Pinterest・YouTube・Instagram・メール | **Allowed to White Label**（White Label への送客のみ） | **ピンや概要欄に 12Go リンクを直接貼らない。必ず自サイトの記事へ送り、リンクは記事内に置く** |
| Reddit | 明示なし（social 扱い＋メッセンジャーへの無差別送信は禁止） | 従来どおり**直リンク禁止**。価値提供のみ |
| リスティング広告（PPC） | 非ブランドKWのみ可・**ブランド入札は禁止** | **広告は運用しない。**やるなら別途 §禁止KW を Negative に入れる |
| リターゲティング／リマーケティング | **禁止** | 実施しない |
| iframe・ポップアップ／アンダー・ツールバー・doorway | **禁止** | 実施しない。**公式ウィジェットは script 方式**（`//cdn0.trainbusferry.com/tools/form/en/?id=16597922`）で iframe ではないため使用可。禁止対象は「iframe でトラフィックを作る手法」であってベンダー提供コードではない |
| キャッシュバック・モチベーテッド・アダルト | **禁止** | 該当なし |
| クーポン／割引サイト・プロモコード | Allowed | 該当なし（当サイトはクーポンを扱わない） |

- **ブランド名の使い方**: 広告見出しで 12Go を名乗る・12Go に成りすます行為は**アカウント停止事由**。記事本文で「12Go で予約できる」と事実として書くのは通常の紹介であり別物
- **迷ったら貼る前に affiliate@12go.asia に確認する**（規約末尾に「不明なら問い合わせを」と明記されている。処罰より公正な運用が目的、とのこと）

### リンクとウィジェットの実装メモ（2026-08-07 管理画面で確認）

- **アフィリエイトID `16597922`**。紹介リンクの形式は `https://12go.asia/?z=16597922`（`z` がマーカー）。単純リンク・ルート別ディープリンクは **Integration → Links** で発行する
- ⚠️ サイドバーの **「Referral program」は別物**（他のアフィリエイターを勧誘する制度）。旅行予約の紹介リンクではない
- **Sub_id tracker に記事の slug を入れる**（`a-z A-Z 0-9 -`・255文字まで）。どの記事が売ったかが `/stats/` で分かる。**後から遡って付けられない**ので最初から入れる
- **`<div id="powered">Powered by <a ...>12Go system</a></div>` は必須**（管理画面に "mandatory" と明記）。消さない
- ウィジェットを置くなら **Prefilled data で Origin/Destination を日本の都市に事前設定する**。デフォルトは Bangkok → Chiang Mai
- デフォルトは 250×320 の固定幅。**100% に伸ばさないとスマホで崩れる**
- **第三者スクリプトなので `CookieConsent.astro` のローダー経由で読み込む**（GA・Travelpayouts と同じ扱い。同意前に読み込ませない）

⚠️ **LinkSwitcher との関係は上記「LinkSwitcher が実際に何を書き換えるか」を参照**（2026-08-07 実測で `12go.asia` は**現時点では書き換えられない**。ただし Travelpayouts 側で 12Go が使えるようになった瞬間に変換が始まるため、その時点で除外が必要）。

⚠️ **Travelpayouts は 2026-08-07 時点で20プログラムが利用不可**（審査落ちではなく**トラフィック不足**。「3ヶ月連続で安定した月間流入が出てから再申請」・8月8日以降に再提出可）。`SITE_LIVE=false` で noindex の間は**その3ヶ月のカウントが始まらない**。旅行ピラーの収益は当面 **GetYourGuide（直接）＋ 12Go（直接）** で組む。

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

**ボードは4つ**: `Japanese Craft & Goods` / `Learning Japanese` / `Japan Travel` / `Japan Nature & Outdoors`（pillar と1対1）。**うち今すぐ作るのは `Learning Japanese` と `Japan Travel` の2つだけ**。craft と nature はピンが1枚も無いので、記事ができてから作る（空ボードはテーマ権威に寄与しない）。

**投稿頻度は週5本（≒1日1本）から**。新規アカウント＋新規ドメインは Pinterest のスパムフィルタが厳しいため。反応を見て1日3本まで上げる。

⚠️ **既存の手書き投稿文と重複している**。Drive の `japan-affiliate_投稿キット/thejapandesk_pins_2026-08-04` に Google ドキュメント2本（第1バッチ14Pin＋第2バッチ24Pin＝計38本）があり、**旅行ピラーの10記事だけ**を1記事3〜7切り口でカバーしている。文面の質はそちらが上だが、**参照している PNG 画像は Drive にもローカルにも存在しない**（＝文面のみ）。

→ **旅行ピラーは「既存Docsの文面＋新キットの画像」、工芸7記事・語学4記事は新キットをそのまま**、が推奨の使い分け。**同一記事URLへ両者をまとめて投稿しないこと**（同一リンクへの一斉投下はスパム判定＋自分のピン同士のカニバリズム。複数ピンは1本ごとに1週間空ける）。

⚠️ **投稿の開始は `SITE_LIVE=true` になってから。** noindex かつ `[VERIFY]` 未確定のページに送客すると、①誤情報を配る ②新規ドメインに対するスパムフィルタを成果の出ないタイミングで無駄撃ちする。キットは先に用意してあるので、公開したらすぐ投稿できる。

日本語5サイト用の `gen_social_kit.py` / `gen_pins.py` はこのサイトを**意図的に対象外**にしてある（日本語前提・文字単位の折り返しなので英語に流用すると単語が割れる）。

## 判断の経緯

picknavi へのドメイン統合は**却下**し、新規ドメイン＋インフラ流用にした（Obsidian `Knowledge/判断ログ.md` 2026-08-03）。理由は言語・地域・トピック・ASP がすべて別で、ドメイン評価が転移しないため。

## ローンチに残る手順（README.md にも記載）

1. [ ] 各記事の `[VERIFY]` を潰す（ASP承認後）
   - [ ] 12Go: Travelpayouts の LinkSwitcher を停止／`12go.asia` 除外 → `/integration/` でリンク発行 → `consts.ts` の `TWELVEGO_LINK` → 旅行記事へ設置
2. [ ] `consts.ts` の `SITE_LIVE = true` ＋ `PINTEREST_VERIFY` 設定（`GA_MEASUREMENT_ID` は `G-G84FY7N72R` で設定済み）
3. [ ] `robots.txt` を許可に差し替え（Disallow 削除・Sitemap 行を有効化）
4. [ ] About / Contact に運営者名・メールアドレス
5. [ ] OGP画像（1200×630）
6. [ ] Drive の `japan-affiliate_投稿キット` にある `social_kit.csv` の `[VERIFY-domain]` を `thejapandesk.net` に一括置換
