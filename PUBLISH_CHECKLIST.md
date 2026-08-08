# 公開前チェックリスト（記事別）

記事本文の HTML コメントに埋まっていたものを 2026-08-07 にここへ集約した。
**記事側へ戻さないこと**（コメントでもビルド後の HTML に出力され、料率などの内部情報がページソースに残るため）。

---

# 🔴 アフィリリンク発行 まとめ（横断・2026-08-07 実測）

記事別チェックリストに散っている「リンクを入れる」作業を、**発行元ごとに1箇所へ集約**したもの。
ダッシュボードにログインする回数を減らすため、ASP単位でまとめて発行して一気に流し込む。

## 現状（実測値・推測ではない）

公開中15記事を grep した結果:

| 発行元 | 記事内のリンク | 記事内での言及 | 収益になっているか |
|---|---|---|---|
| Klook | **7本**（3種のURL） | 41箇所 | **なっている**（LinkSwitcher が自動変換） |
| GetYourGuide | **30本** ← 2026-08-08 設置 | — | **なっている**（直接提携・`partner_id=J2LM0TP`） |
| JapanesePod101 | **0本** | 51箇所 | なっていない |
| 12Go | **0本** | 0箇所（`TWELVEGO_LINK` も空） | なっていない |

→ **2026-08-08 に GetYourGuide 30本を設置したので、収益導線は Klook 7本＋GetYourGuide 30本になった。** 残る空白は JapanesePod101 と 12Go。
言及数が最も多い JapanesePod101（51箇所・料率25%・提携承認済み）が0本というのが、いちばん大きな取りこぼし。

## 発行の順番（この順にやると手戻りが無い）

### 1. JapanesePod101 — 最優先

- **理由**: 料率25%で全ASP中いちばん高く、提携が既に承認済みで、対象記事4本が公開中。作業は「リンクを取ってきて貼る」だけで、ブロッカーが1つも無い
- **対象記事**: `japanesepod101-review` / `learn-japanese-from-anime` / `migaku-vs-alternatives` / `wanikani-alternatives` / `2-months-in-japan-long-stay`
- **注意**: 語学記事は「比較」の立て付けなので、比較対象（Migaku・WaniKani）にアフィリリンクが無い状態で JapanesePod101 だけリンクが付く。**それ自体は問題ないが、順位や評価をリンクの有無で変えない**（記事本文に運営側の理屈を書かないルールと同じ話）
- [ ] リンクを発行し、5記事へ設置。`rel="sponsored"` を付ける

### 2. GetYourGuide — 直接提携（パートナーID `J2LM0TP`）

- **発行場所**: `partner.getyourguide.com` のダッシュボード
- **対象記事**: `1-month-japan-itinerary` / `2-week-japan-itinerary` / `7-day-japan-itinerary` ＋ **新規 `japan-autumn-foliage-guide`（紅葉の日帰りツアー枠）**
- **LinkSwitcher との関係**: 2026-08-07 の本番実測では `getyourguide.com` は**書き換えられない**（＝直接提携のまま成果が付く）。旧チェックリストにあった「LinkSwitcher を止めるのが先」というブロッカーは、**現時点では該当しない**
- ⚠️ **ただし Travelpayouts の "Unlock more" が解除されて GetYourGuide が使えるようになった瞬間、LinkSwitcher が変換を始める**（＝直接提携の成果が黙って付け替わる）。解除されたらリンクの `href` を本番DOMで再確認し、必要なら LinkSwitcher から除外する
- ⚠️ **integration analyzer スクリプトは入れない**（競合リンクをURLごと送信する機能を含むため。理由は CLAUDE.md）
- [x] **2026-08-08 完了**: 30本を受領し5記事へ設置（内訳は本ファイル末尾の「設置状況」）

### 3. 12Go — 直接提携（アフィリエイトID `16597922`）

- **発行場所**: `https://agent.12go.asia/integration/` の **Links**（サイドバーの「Referral program」は別物＝アフィリエイター勧誘制度なので触らない）
- **リンク形式**: `https://12go.asia/?z=16597922`。**パラメータを推測して手で組み立てず、発行されたものをそのまま使う**
- **Sub_id に記事の slug を入れる**（`a-z A-Z 0-9 -`・255文字）。**後から遡って付けられない**ので最初から入れる
- **設置先**: `src/consts.ts` の `TWELVEGO_LINK`（今は空文字＝出力されない）→ `is-jr-pass-worth-it-2026` ほか陸路移動の記事
- ⚠️ **ピン・YouTube概要欄・メールから 12Go へ直リンクしない。** 規約上それらは White Label への送客のみ。**自サイトの記事へ送り、リンクは記事内に置く**
- ⚠️ リターゲティング・iframe・ブランド入札は禁止。当サイトでは実施しない
- [ ] リンクを発行 → `TWELVEGO_LINK` を設定 → 対象記事へ設置

### 4. Klook — 発行作業は不要

LinkSwitcher が `www.klook.com` を自動変換するため、**素の `https://www.klook.com/...` を書けばそれで収益化されている**。新しい記事でも同じ書き方でよい。

- ⚠️ 変換後の `emrldco.com/re?...` URL を**ブラウザで開かない**（クリックが記録される）。確認は本番DOMで `href` を読むだけにする
- 直接提携（6.5%）への切り替えは当面しない。再着手条件は CLAUDE.md 参照

### 5. 物販ASP（Awin / ShareASale / CJ）— 保留

craft ピラーが停止中（7記事とも `draft: true`）なので、リンクを発行しても置く先が公開されていない。**craft を再開すると決めたときにまとめて発行する**。

---

## japanese-dinnerware-sets（執筆時のDRAFTメモ・2026-08-07 に本文から移設）

DRAFT — Pillar A / 陶磁器 / 記事3
Keyword: authentic Japanese dinnerware sets
Target: 2,500–3,500 words (this draft ≈ 2,850)
Integrity note (§2.3): Reviews are grounded in ware-type facts, published specs, verified customer reviews and Japanese-language kiln/maker sources — NOT fabricated hands-on testing.

---

## 1-month-japan-itinerary

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with live figures (21-day pass ~¥100,000; multi-day tours ~US$500).
[ ] Insert real GetYourGuide affiliate links generated in the GetYourGuide partner dashboard — DIRECT partnership, not via Travelpayouts. BLOCKER, do this first: switch Travelpayouts LinkSwitcher off (or exclude GetYourGuide), otherwise it rewrites the links and the direct attribution is lost; confirm in the live DOM that the href is unchanged. Do not install the GetYourGuide analyzer script. Partner ID and the reasoning behind both calls are in CLAUDE.md. Fill ALL [VERIFY affiliate link] slots, per region.
[ ] Confirm region facts before publish: Shimanami ~70 km & e-bike availability; Kyushu (Beppu/Yufuin) & Hokkaido transit; flight-vs-rail on the big jump. Correct any that are off.
[ ] Keep the 21-day-pass / regional-mix claim consistent with the JR Pass guide's live math.
[ ] Internal links to JR Pass / 7-day / 2-week / eSIM / JapanesePod101 / long-stay present, pointing to final /<pillar>/<slug>/ URLs — CONFIRMED.
[ ] Accommodation "weekly/monthly rate saves most" framed as guidance; no fabricated specific property prices.
[ ] Affiliate disclosure at top — confirmed.
[ ] Primary keyword "1 month Japan itinerary" in title, first 100 words, one H2 — present.
[ ] No fabricated first-hand experiences — framed as guidance from common community routes — confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.

---

## 2-months-in-japan-long-stay

PRE-PUBLISH CHECKLIST
[ ] Replace [VERIFY] items with live figures/ranges: monthly housing (share house / monthly apartment), monthly SIM/data plan, language-school cost. Do NOT fabricate specific prices — use verified ranges or omit.
[ ] Insert real affiliate links: JapanesePod101 (25% program) via the JapanesePod101 review page's link; any data/SIM program links. Confirm tracking.
[ ] Language cross-links to /learn-japanese/ articles (japanesepod101-review, migaku-vs-alternatives, wanikani-alternatives, learn-japanese-from-anime) all present and correct — CONFIRMED.
[ ] Travel cross-links (eSIM, JR Pass, 2-week, 1-month) present and pointing to final /japan-travel/<slug>/ URLs — CONFIRMED.
[ ] Visa framing accurate: this is a 1–2 month tourist/working-holiday/study stay, NOT relocation or work-visa advice. Add a line pointing readers to official immigration sources if needed.
[ ] No fabricated first-hand long-stay experiences — framed as guidance — confirmed.
[ ] Affiliate disclosure at top (incl. language-tool links) — confirmed.
[ ] Primary keyword "2 months in Japan" in title, first 100 words, one H2 — present.
[ ] Word count 2,000–3,000 — confirm after edits.

---

## 2-week-japan-itinerary

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with live figures (14-day pass ~¥80,000; multi-day tour ~US$500).
[ ] Insert real GetYourGuide affiliate links generated in the GetYourGuide partner dashboard — DIRECT partnership, not via Travelpayouts. BLOCKER, do this first: switch Travelpayouts LinkSwitcher off (or exclude GetYourGuide), otherwise it rewrites the links and the direct attribution is lost; confirm in the live DOM that the href is unchanged. Do not install the GetYourGuide analyzer script. Partner ID and the reasoning behind both calls are in CLAUDE.md. Fill ALL [VERIFY affiliate link] slots and confirm deep links & tracking IDs per region.
[ ] Confirm week-two region facts before publish: Shimanami Kaido ~70 km & e-bike availability; Takayama/Shirakawa-go/Kanazawa transit; Hokkaido flight-vs-rail. Correct any that are off.
[ ] Verify the 14-day-pass "breaks even on multi-region" claim against the JR Pass guide's live math — keep the two articles consistent.
[ ] Internal links to JR Pass / 7-day / Klook / eSIM present and pointing to final /japan-travel/<slug>/ URLs — CONFIRMED.
[ ] Data-usage figure (~14 GB/2 weeks) presented as community-reported, not first-hand — confirmed.
[ ] Affiliate disclosure at top — confirmed.
[ ] Primary keyword "2 week Japan itinerary" in title, first 100 words, one H2 — present.
[ ] No fabricated first-hand experiences — framed as guidance from common community routes — confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.

---

## 7-day-japan-itinerary

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with live figures (esp. the ~US$500 multi-day tour example & the 8%≈$40 illustration).
[ ] Insert real GetYourGuide affiliate links generated in the GetYourGuide partner dashboard — DIRECT partnership, not via Travelpayouts. BLOCKER, do this first: switch Travelpayouts LinkSwitcher off (or exclude GetYourGuide), otherwise it rewrites the links and the direct attribution is lost; confirm in the live DOM that the href is unchanged. Do not install the GetYourGuide analyzer script. Partner ID and the reasoning behind both calls are in CLAUDE.md. Fill ALL [VERIFY affiliate link] slots and confirm deep links & tracking IDs.
[ ] Confirm this is tagged as top-of-funnel pillar content; internal links to article-12 (JR Pass) and article-13 (Klook Tokyo) present — CONFIRMED (multiple).
[ ] Verify Shinkansen Tokyo–Kyoto ~2.5h and Kyoto–Osaka ~30–60 min timings against current schedules.
[ ] Confirm teamLab timed-entry / sell-out and Fuji peak-season booking guidance.
[ ] Fix internal links to final published URLs.
[ ] Affiliate disclosure at top present — confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.
[ ] No fabricated first-hand experiences — plan framed as guidance, confirmed.
[ ] Primary keyword "7-day Japan itinerary with tours" in title, first 100 words, one H2 — present.

---

## arita-vs-mino-vs-hasami

PRE-PUBLISH CHECKLIST
- [ ] Insert Musubi Kiln affiliate link(s) via Awin (10%) at all [VERIFY] affiliate markers
- [ ] Replace every [VERIFY] price/band with a confirmed current figure or delete the claim
- [ ] Confirm specific kiln names (Keizan, Kaizan, Rinkuro) still stocked on musubikiln.com; swap if retired
- [ ] Verify microwave/dishwasher safety claims against actual product pages before publishing
- [ ] Set internal link "#" for the main Japanese ceramics pillar article to the live URL
- [ ] Add product images with alt text; confirm image usage rights
- [ ] Confirm affiliate disclosure is visible above the fold
- [ ] SEO: title tag + meta description targeting "arita vs mino vs hasami ware"; H2/H3 order intact
- [ ] Fact-check the 400-year / 17th-century / Izumiyama / Amakusa stone claims against cited sources
- [ ] Word count within 2,500–3,500 target
- [ ] Remove any accidental AI-cliché phrasing on final read-through

---

## best-esim-for-japan

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price/data figure with the live number from the provider page (eSIM GB & price, pocket Wi-Fi ¥/day, roaming $/day).
[ ] Name only eSIM/pocket-Wi-Fi programs you are actually affiliated with; insert real affiliate links in all [VERIFY affiliate link] slots. NOTE: eSIM commissions are low — this article's job is traffic + cross-sell to JR Pass / Klook / itinerary. Keep eSIM links modest, keep the cross-links.
[ ] eSIM link destinations must be the WEB version, never the app one. Airalo pays on desktop web and mobile web but pays NOTHING on in-app purchases, and the Travelpayouts default destination for Airalo/GigSky/Yesim is the app. Check every generated link before pasting.
[ ] Order the eSIM recommendations by what is genuinely best for a Japan traveller, not by commission. The disclosure at the top of this article promises "a decision guide, not a sales pitch"; ranking by payout would contradict it. For reference only — Yesim 18%/90-day cookie, Airalo 12%/30-day (best-known brand), GigSky 20%/30-day, Saily 15%/30-day, Klook eSIM 20% direct.
[ ] Self-purchase earns nothing (Airalo terms). To confirm a link is tracking, watch for the click in the Travelpayouts stats — do not test-buy.
[ ] Verify the Mobile Suica claims: (a) does tapping the gate truly work with data off? (b) current iPhone vs Android/region support. Correct if wrong.
[ ] Confirm the traveller data-usage figures (~14 GB / 2 weeks) are presented as community-reported, not first-hand — no fabricated personal testing. Confirmed as reported, not tested.
[x] Suica guide internal link resolved to /japan-travel/suica-pasmo-icoca-guide/.
[ ] Add 3–5 real sources; remove the placeholder sources line. Do NOT publish with placeholder sources.
[ ] Affiliate disclosure present at top — confirmed.
[ ] Primary keyword "best eSIM for Japan" in title, meta description, first 100 words — present.
[ ] Word count 2,000–3,000 — confirm after edits.

---

## best-japanese-bonsai-starter-kits

PRE-PUBLISH CHECKLIST
- [ ] Insert Bonsai Boy affiliate link(s) via CJ (20%) at every [VERIFY] affiliate marker
- [ ] Confirm the ~$30 bundle math (young tree + pot + basic tools) against live Bonsai Boy pricing; update band if off
- [ ] Verify each species is actually stocked as a LIVE-tree starter (ficus, juniper, jade); note if any are seed-only
- [ ] Confirm tool-set "under ~$50" claim against current listings
- [ ] Double-check indoor/outdoor guidance per species against retailer care notes
- [ ] Replace all [VERIFY] prices/bands with confirmed figures or remove the claim
- [ ] Set internal link to the main bonsai care pillar article (currently unlinked)
- [ ] Add product images with alt text; confirm usage rights
- [ ] Confirm affiliate disclosure is visible above the fold
- [ ] SEO: title/meta targeting "best japanese bonsai starter kits"; H2/H3 order intact
- [ ] Word count within 2,500–3,500 target
- [ ] Final read-through for AI-cliché phrasing

---

## best-japanese-chef-knives-beginners

PRE-PUBLISH CHECKLIST — do not publish until every box is cleared:
[ ] [VERIFY] pass 1: confirm every price band + exact street price against live catalogs (Hocho-Knife, JapanChefKnife, Amazon) — remove/replace any that have shifted bands
[ ] [VERIFY] pass 2: confirm exact SKUs/model numbers still current (Tojiro DP F-808/F-809 etc., MAC MTH-80, Shun Classic DM0706, Global G-2, Miyabi Kaizen II, Sakai Takayuki 33-layer, Tojiro Shirogami) — model codes change
[ ] [VERIFY] Shun left-handed availability claim
[ ] [VERIFY] current HRC figures against manufacturer spec sheets (do not overstate)
[ ] Insert affiliate links: Hocho-Knife, JapanChefKnife (10%), Amazon fallback — tag each with correct tracking ID; disclose per FTC
[ ] Add structured data: Article + Product/ItemList schema (name, brand, offers with verified price/currency, aggregateRating only if sourced)
[ ] Internal links live: gyuto-vs-santoku (article-03) x2 — confirm final published URL/slug
[ ] Add hero image + per-knife images with proper licensing/alt text
[ ] Confirm affiliate disclosure sits above the fold (it does) and matches program TOS
[ ] Final read for AI-cliché scrub and factual accuracy on steel types

---

## best-japanese-fountain-pens

PRE-PUBLISH CHECKLIST — do not publish until every box is cleared:
[ ] [VERIFY] pass 1: confirm every price band + exact street price against live catalog (Pen Boutique / ShareASale program) — the King of Pen, Izumo, and Nakaya bands especially, as they drive high-value commissions
[ ] [VERIFY] pass 2: confirm exact current models + nib options — Pilot Custom 74 & 823, Sailor 1911/Pro Gear & King of Pen, Platinum 3776 Century & Izumo, current Nakaya lines (Portable/Piccolo/Neo-Standard) and finishes/lead times
[ ] [VERIFY] Nakaya nib origin phrasing (Platinum-based) against a current primary/retailer source before publishing
[ ] [VERIFY] confirm 14K/18K/21K nib metal claims per model against maker spec sheets
[ ] Insert affiliate links: Pen Boutique via ShareASale (10% / 90-day cookie) — correct deep links + tracking; note $30-payout math favors high-ticket (King of Pen ~$1,200+, Nakaya, Izumo); FTC disclosure present
[ ] Add structured data: Article + ItemList/Product schema (verified price/currency; no unsourced aggregate ratings)
[ ] Internal links: add links to any companion pen/stationery articles once published; confirm slugs
[ ] Add hero + per-pen images (nib close-ups; urushi finish shots) with licensing + alt text
[ ] Confirm disclosure above the fold and matches ShareASale/merchant TOS
[ ] Final AI-cliché scrub + nib-character/spec accuracy pass

---

## best-klook-tours-tokyo

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with the live per-person figure from each Klook listing (esp. teamLab ~¥3,800–4,600).
[ ] Insert real Klook affiliate links (6.5%) in ALL [VERIFY affiliate link] slots; confirm each deep-links to the correct activity.
[ ] Confirm teamLab Borderless (Azabudai Hills) vs Planets (Toyosu) locations & that both are timed-entry / sell out.
[ ] Confirm Shibuya Sky sunset-slot booking behavior.
[ ] This is a "money" page — verify affiliate disclosure is present at top (confirmed) and links are nofollow/sponsored per program terms.
[ ] Fix internal links (article-12, article-14) to final published URLs.
[ ] No fabricated first-hand tour experiences — copy stays on "based on listings & verified reviews," confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.
[ ] Primary keyword "best Klook tours in Tokyo" in title, first 100 words, one H2 — present.

---

## cheapest-time-to-fly-to-japan

PRE-PUBLISH CHECKLIST
[ ] Replace the 2 [VERIFY affiliate link] slots with real deeplinks (marker 559180). Decide the programme first: Kiwi.com is already partnered (3%, 30-day cookie); Aviasales / WayAway are NOT joined yet and pay only ~1.1–1.3% of fare, though they are metasearch and suit "flexible dates" better. Either way treat flights as a funnel entry point, not a revenue line — the money in this article is the onward links to the JR Pass, eSIM and itinerary guides.
[ ] Fill the 3 [VERIFY source link] slots with the real Cabinet Office / JMA / JNTO URLs.
[ ] [VERIFY] Golden Week bridge days for the current travel year (how Apr 29 and May 3–5 fall against the weekend).
[ ] [VERIFY] Chinese New Year date for the current travel year (affects the Jan–Feb value window).
[ ] Confirm the fare table renders with real data — it is hidden automatically until src/data/fares/ is populated, and hidden again if that data is >14 days old.
[ ] Reconsider the 9-column table on mobile once real data lands; if most routes return data, consider splitting into North America / UK+Australia groups.
[ ] No fabricated first-hand experience — this is a timing/booking guide, and all seasonal claims are calendar and climate facts, not personal trip reports. Confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.
[ ] Primary keyword "cheapest time to fly to Japan" in title, meta description, first 100 words — present.

---

## edo-kiriko-whiskey-glasses

PRE-PUBLISH CHECKLIST
- [ ] Insert Musubi Kiln-type affiliate link(s) via Awin (10%) at every [VERIFY] affiliate marker
- [ ] Confirm which patterns (nanako, yarai, kiku, cased-color) are actually in stock at the linked retailer; swap examples if unavailable
- [ ] Replace all [VERIFY] prices/bands with confirmed current figures or delete the claim
- [ ] Verify authenticity guidance (Edo Kiriko cooperative, Koto/Sumida wards, named workshops) against current sources
- [ ] Confirm care claims (hand-wash, thermal-shock caution) against actual product pages
- [ ] Verify pattern symbolism (yarai=protection, kiku=longevity, nanako=fish roe) against cited sources
- [ ] Set internal link to the main Japanese ceramics/tableware pillar article (currently unlinked)
- [ ] Add product images with alt text; confirm usage rights
- [ ] Confirm affiliate disclosure is visible above the fold
- [ ] SEO: title/meta targeting "edo kiriko japanese whiskey glasses"; H2/H3 order intact
- [ ] Word count within 2,500–3,500 target
- [ ] Final read-through for AI-cliché phrasing (elevate / look no further / when it comes to / in today's world / nestled)

---

## gyuto-vs-santoku

PRE-PUBLISH CHECKLIST — do not publish until every box is cleared:
[ ] [VERIFY] pass 1: confirm every price band + exact street price against live catalogs (Hocho-Knife, JapanChefKnife, Amazon) — rebalance bands if shifted
[ ] [VERIFY] pass 2: confirm exact SKUs/model numbers current — Tojiro DP gyuto (F-808) & santoku (F-884), MAC MTH-80 & MAC santoku model code (SK-65/HB-70 vary by market), Shun Classic Chef (DM0706) & Santoku (DM0702), Global G-2 & G-48
[ ] [VERIFY] Shun left-handed availability + Westernized edge-angle figure against Shun spec
[ ] [VERIFY] MAC santoku exact model/length before naming it definitively
[ ] Insert affiliate links: Hocho-Knife, JapanChefKnife (10%), Amazon fallback — correct tracking IDs; FTC disclosure present
[ ] Add structured data: Article + ItemList/Product schema (verified price/currency; no unsourced ratings)
[ ] Internal links live: best-japanese-chef-knives-beginners (article-02) x3 — confirm final published slug/URL
[ ] Add hero + per-shape comparison images (gyuto vs santoku profile diagram) with alt text + licensing
[ ] Confirm disclosure above the fold and matches program TOS
[ ] Final AI-cliché scrub + geometry/spec accuracy pass

---

## is-jr-pass-worth-it-2026

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with the live figure from the official JR / reseller page (esp. Oct 1 2026 hike: 7-day ¥50,000 → ¥53,000).
[ ] Insert the real JR Pass affiliate links in all 4 [VERIFY affiliate link] slots. Programme decided 2026-08-06: Klook direct (6.5%) first choice, 12Go via Travelpayouts (4–5.5%, 30-day cookie) as the fallback / regional-pass depth. FlexOffers was referenced here in error — it is not one of this site's ASPs.
[ ] Confirm Nozomi/Mizuho supplement wording against current pass terms.
[ ] Confirm JR East consolidated pass details & March 14 2026 launch; confirm Kansai WIDE (~¥12,000) and Hokuriku Arch (~¥35,000) live prices.
[ ] Fix internal links (article-13, article-14) to final published URLs.
[ ] Affiliate disclosure present at top — confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.
[ ] No fabricated first-hand tour experiences — this is a booking/math guide, confirmed.
[ ] Add primary keyword "is the JR Pass worth it in 2026" to title, meta description, first 100 words — present.

---

## japan-packing-list

PRE-PUBLISH CHECKLIST
[ ] Insert real Amazon Associates US links in ALL [VERIFY affiliate link] slots (power bank, adapter, cables, packing cubes, coin purse, packable duffel, luggage scale). NOTE: Amazon US requires 3 qualifying sales within 180 days of approval — this article is a prime driver; make sure links are live before launch.
[ ] Verify: Japan Type A / 100V; camera 10–50% cheaper claim; Sony language-lock claim; med import legality note. Correct if off.
[ ] Confirm this is framed as "bring less" — no fabricated product testing/first-hand reviews. Confirmed as guidance.
[ ] Cross-links to eSIM / Suica / 7-day / 2-week / 1-month / long-stay present, final /japan-travel/<slug>/ URLs — CONFIRMED.
[ ] Affiliate disclosure at top (incl. Amazon) — confirmed.
[ ] Primary keyword "Japan packing list" in title, first 100 words, one H2 — present.
[ ] Word count 1,800–2,600 — confirm after edits.

---

## japan-souvenirs-worth-buying

PRE-PUBLISH CHECKLIST
[ ] Replace every [VERIFY] price with realistic live ranges once the deep-dive guides set the numbers.
[ ] Insert affiliate links where products are recommended (currently category-level; product-level links live in the deep-dive guides).
[ ] Fix internal links to the three tool-pillar articles (knives / ceramics / pens) to final published URLs — these are the core "bridge" links; MUST resolve.
[ ] Fix internal link to article-14 (7-day itinerary) to final URL.
[ ] Confirm knife carry-on/checked-luggage rule wording against current airline/airport guidance.
[ ] Confirm kiln-town attributions (Arita/Mino/Bizen/Mashiko; Sakai/Seki) are accurate before publish.
[ ] Affiliate disclosure at top present — confirmed.
[ ] Word count 2,500–3,500 — confirm after edits.
[ ] No fabricated first-hand purchases described as reviews — copy stays on buyer's-guide framing, confirmed.
[ ] Primary keyword "Japan souvenirs worth buying" (+ knives, ceramics, pens) in title, first 100 words, one H2 — present.

---

## japanese-dinnerware-sets

PRE-PUBLISH CHECKLIST (do not publish with these open):
1. [VERIFY] Replace every price band and [VERIFY] marker with confirmed catalogue data (price, SKU, set contents, care/microwave/dishwasher per piece).
2. [VERIFY] Insert the real affiliate link(s) (Musubi Kiln via Awin) once the ASP account is approved — human step §0.25.
3. Fix intentional-sounding but confirm-worthy claims: microwave-safety on metallic-trim porcelain; dishwasher advice per Kutani line.
4. Add Product/Review structured data (JSON-LD) per §5 of site architecture.
5. Add 2–3 internal links: → 包丁 pillar, → Edo Kiriko glasses (陶磁器サブ), ← from 旅行 "Japan souvenirs" bridge article.
6. Confirm word count in 2,500–3,500 band after [VERIFY] expansions (currently ≈2,850).
7. Typo "Hasima" in pick #1 is an intentional conversational aside — keep or cut per voice preference.

---

## japanesepod101-review

PRE-PUBLISH CHECKLIST
[ ] Replace [VERIFY: JapanesePod101 affiliate link] with real affiliate URL
[ ] Confirm JapanesePod101 commission is 25% and note cookie duration on money page (not in body — commission belongs on the /money reference, kept out of reader-facing copy)
[ ] Verify all four tier prices (Free/Basic/Premium/Premium PLUS) on live pricing page; confirm the "long-term prepay = low end of range" caveat still holds
[ ] Verify Renshuu free tier still free; verify WaniKani $9/mo & $299 lifetime
[ ] Add internal link to article-09 (WaniKani alternatives) once URL exists
[ ] Add internal link to article-10 (learn from anime) if relevant
[ ] Confirm affiliate disclosure is above the fold (it is)
[ ] Spellcheck Japanese: 何してるの / 何をしていますか / です・ます / がんばってください
[ ] Word count target 2,500–3,500 — confirm
[ ] Re-read for AI clichés ("in today's fast-paced world", "unlock", "delve", "game-changer") — remove any that crept in

---

## learn-japanese-from-anime

PRE-PUBLISH CHECKLIST
[ ] This is a top-of-funnel article — confirm internal links to article-08 (JapanesePod101), article-09 (WaniKani alternatives), article-11 (Migaku vs alternatives) are all present and resolve
[ ] Affiliate links only where readers are sent to Migaku / JapanesePod101 — mark [VERIFY] until confirmed; anime/Netflix itself gets no affiliate link
[ ] Verify Anki iOS ~$25 one-time; Migaku ~$9-11/mo
[ ] Confirm affiliate disclosure above the fold (it is)
[ ] Spellcheck Japanese: おれ様/てめえ/殺してやる/でござる/わし/じゃ/わたくし/ですわ/わ/かしら/ぞ/ぜ/です・ます/がんばって
[ ] Sanity-check the native-speaker "role language (役割語)" section for accuracy before publish
[ ] Word count 2,500–3,500 — confirm
[ ] Scan for AI clichés ("firehose" used once intentionally; check no "delve/unlock/in today's world")

---

## migaku-vs-alternatives

PRE-PUBLISH CHECKLIST
[ ] Migaku affiliate commission rate is UNCONFIRMED — do NOT state a rate; keep [VERIFY] on the money/reference page until confirmed with Migaku's program
[ ] Insert Migaku affiliate link (mark [VERIFY] until live); JapanesePod101 affiliate link where readers are sent there (25% program)
[ ] Verify prices: Migaku ~$9-11/mo & $399 lifetime; Anki iOS ~$25; LingQ subscription; Language Reactor free+paid; Renshuu free+premium; JapanesePod101 tiers
[ ] Confirm affiliate status of LingQ / Language Reactor / Renshuu before promoting any — all marked [VERIFY]
[ ] Add real internal links to article-08, article-09, article-10
[ ] Confirm affiliate disclosure above the fold (it is)
[ ] Spellcheck Japanese: 生きる / 学生 / がんばってください
[ ] Confirm Yomitan is the current maintained successor to Yomichan
[ ] Word count 2,500–3,500 — confirm
[ ] Scan for AI clichés and remove

---

## suica-pasmo-icoca-guide

PRE-PUBLISH CHECKLIST
[ ] Verify EVERY [VERIFY]: credit-card-won't-tap-gates claim; nationwide interoperability; Welcome Suica no-deposit/28-day expiry; regular card ~¥500 deposit; Haneda "left of stairs" location; ¥2,000 start; machine top-up methods; refund fee; iPhone vs Android Mobile Suica support; tap-works-offline; the full "where it works" list; arcade/crane payment.
[ ] Confirm Mobile Suica Android support status for common non-JP phones (this changes — check current).
[ ] No affiliate product for IC cards — keep it honest as top-of-funnel; cross-links to eSIM & JR Pass present — CONFIRMED.
[ ] Fix internal links to final /japan-travel/<slug>/ URLs — CONFIRMED.
[ ] Primary keyword "Suica card Japan" in title, first 100 words, one H2 — present.
[ ] Word count 1,800–2,600 — confirm after edits.
[ ] No fabricated first-hand claims — framed as guidance + attributed traveler tips — confirmed.

---

## wanikani-alternatives

PRE-PUBLISH CHECKLIST
[ ] WaniKani has NO public affiliate program — do NOT insert a WK affiliate link; keep it as the neutral reference point (money page routes clicks to JapanesePod101 / Migaku instead)
[ ] Insert affiliate links only for Migaku and JapanesePod101 where the article sends readers onward — mark [VERIFY] until confirmed
[ ] Verify prices: Anki iOS one-time ~$25; Renshuu free + premium; Bunpro $5/mo & $150 lifetime; Migaku ~$9-11/mo & $399 lifetime; WaniKani $9/mo & $299 lifetime
[ ] Add real internal links to article-08 (JapanesePod101) and article-11 (Migaku vs alternatives)
[ ] Confirm affiliate disclosure above the fold (it is)
[ ] Spellcheck Japanese: 生きる / 生徒 / 芝生 / がんばってください
[ ] Confirm Anki is free on desktop/Android/web and paid only on iOS
[ ] Word count 2,500–3,500 — confirm
[ ] Scan for AI clichés and remove

---

## japan-autumn-foliage-guide（自然ピラー1本目・2026-08-07 公開）

**この記事の事実はすべて気象庁「生物季節観測累年表」から自分で計算した値**であって、気象庁がその形で公表している数字ではない。出典PDFは記事末尾に貼ってある。

- 元データ: かえでの紅葉 `https://www.data.jma.go.jp/sakura/pdf/015.pdf` ／ かえでの落葉 `https://www.data.jma.go.jp/sakura/pdf/016.pdf`（どちらも1953-2025）
- 計算: 2016-2025 の10年平均・同期間の最早/最遅・落葉日との差（窓）・1991-2020平均との差。翌年1月にずれ込む記録はその秋に繰り入れて集計している
- 検算済み: 気象庁が公表している2025年の観測日（札幌11/6・東京11/23・京都12/10・鹿児島12/2）とパーサ出力が一致。落葉側も5地点一致

**毎年やること（更新が止まると記事が古くなる種類の記事）**

- [ ] 翌年の観測が出そろったら（例年2月ごろ）PDFを取り直して10年平均を再計算し、表と `updated` を更新する。**平均の窓は「直近10年」で固定**（年を足すだけで窓を広げない）
- [ ] 再計算したら `pinterest-kit/pin_data_en.py` の `japan-autumn-foliage-guide` の数字も同時に直す。**記事の表とピンの数字が食い違うのが最悪**（ピンは2〜3年生き続ける）

**リンク**

- [ ] GetYourGuide の紅葉シーズンの日帰りツアーを §7 に設置（上の「アフィリリンク発行 まとめ」の2番）
- Klook は素のURLで設置済み（`c28-tokyo/1002-day-trips/`）＝LinkSwitcher が自動変換する

**書き方の確認（済）**

- [x] §2.3 整合性: 現地を歩いた体を装っていない。標高の節では「この統計では答えられない」と明示し、換算係数を創作していない
- [x] 断定を避けた: 特定日の予測をしていない。最早〜最遅の幅を併記している
- [x] 運営側の理屈（料率・報酬）を本文に書いていない
- [x] `[VERIFY]` 0件（ビルド後の dist でも0件）
- [x] 内部リンク5本（JRパス・IC・航空券・パッキング・Klookツアー）＋被リンク3本（航空券・2週間・パッキング）。ビルド後のリンク切れ0件

---

# リンク化に必要な作業の洗い出し（2026-08-07）

「ブランド名は書いてあるがリンクになっていない」を解消するために要る作業を、**外部ログインが要るかどうか**で分けた。

## 0. 先に直すべき不具合 — 語学3記事の内部リンク13本が壊れている（外部ログイン不要）

`[JapanesePod101 review]` のように **URL部分 `(...)` が無い Markdown** が13箇所あり、ページ上では**ただの角カッコ付きテキストとして表示されている**（ビルド後HTMLで確認済み）。

| ファイル | 行 | 壊れているリンク |
|---|---|---|
| learn-japanese-from-anime.md | 89, 151 | JapanesePod101 review ×2 |
| learn-japanese-from-anime.md | 89, 152 | best WaniKani alternatives ×2 |
| learn-japanese-from-anime.md | 107, 153 | Migaku vs. other all-in-one tools ×2 |
| migaku-vs-alternatives.md | 133, 163 | JapanesePod101 review ×2 |
| migaku-vs-alternatives.md | 133, 163 | best WaniKani alternatives ×2 |
| migaku-vs-alternatives.md | 164 | how to learn Japanese from anime |
| wanikani-alternatives.md | 170 | JapanesePod101 review |
| wanikani-alternatives.md | 170 | Migaku vs. other all-in-one tools |

**なぜ最優先か**: 語学ピラーは「各記事 → `japanesepod101-review` → アフィリリンク」というハブ＆スポーク構造で、**アフィリリンクを置くのはレビュー記事1本だけでよい**。その導線が5本とも切れているので、リンクを発行して貼っても読者がそこへ辿り着けない。**リンク発行より先にこれを直す。**

- [ ] 13本を `/learn-japanese/<slug>/` 形式の内部リンクに直す（`japanesepod101-review` / `wanikani-alternatives` / `migaku-vs-alternatives` / `learn-japanese-from-anime`）
- [ ] 直したらビルド後の dist でリンク切れ0件を確認

## 1. 人間ステップ（ダッシュボードにログインが要る・私にはできない）

| # | 作業 | 場所 | 得るもの |
|---|---|---|---|
| H1 | **JapanesePod101 の提携状態を確認**。CLAUDE.md は「承認済み（25%）」、Obsidian の ASP一覧（2026-08-04）は「これから登録する3番目」と**記述が食い違っている**。まず口座があるか確認する | 自社アフィリ（直販登録・支払$50/PayPal） | アフィリリンク1本 |
| H2 | GetYourGuide のリンク発行 | `partner.getyourguide.com`（パートナーID `J2LM0TP`） | ツアーのディープリンク数本 |
| H3 | 12Go のリンク発行。**Sub_id に記事の slug を入れる**（後から遡れない） | `agent.12go.asia/integration/` の **Links** | `https://12go.asia/?z=16597922` 形式 |
| H4 | Travelpayouts の再申請（8/8以降・ロック解除はトラフィック3ヶ月が条件） | Travelpayouts | 20プログラムの解放 |

**H1 が最優先**。料率25%で最も高く、対象記事が公開中で、他にブロッカーが無い。

## 2. リンクを受け取ってから私がやる作業

- [ ] JapanesePod101: `japanesepod101-review` の CTA（§で「worth it」と結論する箇所・比較表の下・末尾）へ設置。`rel="sponsored"`。**他5記事には貼らない**（ハブへ集約する設計を崩さない）
- [ ] GetYourGuide: `1-month` / `2-week` / `7-day` / `japan-autumn-foliage-guide` の該当節へ設置
- [ ] 12Go: `src/consts.ts` の `TWELVEGO_LINK` を設定 → `is-jr-pass-worth-it-2026` ほか陸路の記事へ設置
- [ ] 開示文の整合（アフィリリンクが入る記事に開示があるか。`suica-pasmo-icoca-guide` は現状リンク0本＝開示不要のまま）
- [ ] ビルド → リンク切れ0件・`[VERIFY]`0件 → デプロイ
- [ ] **本番DOMで `href` を確認**。GetYourGuide と 12Go が LinkSwitcher に書き換えられていないこと（2026-08-07 時点では書き換えられない実測あり）。**`emrldco.com/re?` のURLは開かない**

## 3. 作業しないもの（と理由）

- **Klook**: 素のURLで既に収益化されている。発行作業そのものが無い
- **Awin / ShareASale / CJ（陶磁器・万年筆・包丁・盆栽）**: craft ピラーが `draft: true` で停止中。置く先が公開されていないので、ピラー再開を決めてからまとめて発行する
- **Amazon Associates**: 承認後180日以内に適格販売3件という条件があるので、流入が出る前に申請しない

---

## japanese-culture-experiences-worth-booking（2026-08-08 公開・GetYourGuide 21本）

**この記事は受け取ったアフィリリンクを起点に書いたもの**なので、商品ページの内容に依存する記述をしていない。価格・所要時間・含まれるもの・集合場所を**一切書いていない**（すべて「予約ページで確認して」と書いている）。理由は、商品ページを開くと自分のアフィリリンクに誤クリックが記録されるため、内容を実測できないから。

- [x] 商品ページを開かずに書いた（誤クリック防止）。したがって**確認できない事実は書かない**方針を全面適用している
- [x] §2.3 整合性: 体験したように書いていない。「リスティングの読み方」という立て付けにしてある
- [x] 料率・報酬の話を本文に書いていない。冒頭で「報酬額で順位を付けていない」と明示
- [ ] **商品が終売したら記事の該当行を消す**。GetYourGuide のリンク切れは404ではなくリダイレクトになることがあるので、四半期に一度 `curl -I` でステータスを見る（**ブラウザで開かない**）
- [ ] Klook の同種商品と重複していないか（`best-klook-tours-tokyo` と競合させない）

## GetYourGuide リンクの設置状況（2026-08-08・30本すべて設置済み）

| 記事 | 本数 |
|---|---|
| japanese-culture-experiences-worth-booking（新規） | 21 |
| japan-autumn-foliage-guide | 5 |
| 7-day-japan-itinerary | 1（成田送迎） |
| 2-week-japan-itinerary | 2（丹後・伊根／KIX送迎） |
| 1-month-japan-itinerary | 1（KIX送迎） |

- ビルド後の dist で **30本すべてに `partner_id=J2LM0TP` と `rel="sponsored nofollow noopener"` が付いていることを確認済み**
- `rel` は記事側で書かず、`src/plugins/affiliate-rel.mjs`（rehypeプラグイン）がドメイン判定で自動付与する。**プログラムを増やしたら `AFFILIATE_HOSTS` に1行足す**
- ⚠️ **GetYourGuide の商品URLをブラウザで開かない。** `partner_id` 付きなので誤クリックが記録される。生存確認は `curl -I` で

---

## 12Go のリンク（2026-08-08・暫定3本を設置済み／deep link 待ち）

### 分かったこと（管理画面 Integration → Links の実物で確認）

**12Go のどのURLでも、末尾に `?z=16597922`（既にクエリがあれば `&z=16597922`）を付ければアフィリリンクになる。**
公式の例: `https://12go.asia/en/travel/bangkok/phuket?date=2026-08-15&z=16597922`

→ **Deep links のフォームを1件ずつ埋める必要はない。** 12Goで路線ページを開いてURLをコピーし、
`&z=16597922&sub_id=<記事のslug>` を足すだけでよい。フォームを使う場合は
**「Deeplink」欄をコピーする（HTML code 欄は使わない）**。relはこちらの rehype プラグインが付けるので、
先方のHTMLを貼ると二重管理になる。

- ルートURLの形: `https://12go.asia/en/travel/{出発}/{到着}`
- `sub_id` は `a-z A-Z 0-9 -` のみ・255文字。**後から遡れない**ので必ず記事slugを入れる

### 現在の設置（トップページ宛の暫定リンク）

| 記事 | sub_id | 状態 |
|---|---|---|
| is-jr-pass-worth-it-2026 | 同左 | トップページ宛。**路線URLに差し替えたい** |
| 2-week-japan-itinerary | 同左 | 同上 |
| 1-month-japan-itinerary | 同左 | 同上 |

### 欲しい deep link（路線の候補）

**⚠️ 12Goが日本のどの路線を実際に売っているかは未確認**（サイトがJS描画で読めず、アフィリリンクは
誤クリックになるので開いていない）。**検索して結果が出ない組み合わせは捨ててよい。** 出たものだけ使う。

| 記事（sub_id） | Origin → Destination | 記事のどこで効くか |
|---|---|---|
| is-jr-pass-worth-it-2026 | Tokyo → Osaka | 「パスが覆わない区間」＝夜行バス。パス比較の直後 |
| " | Tokyo → Kyoto | 同上 |
| " | Osaka → Hiroshima | 同上 |
| 2-week-japan-itinerary | Takayama → Shirakawa-go | 記事が「バスで行く・席が限られる」と名指ししている区間 |
| " | Kanazawa → Shirakawa-go | 同上（逆方向から入る人向け） |
| " | Osaka → Takayama | 週2のアルプス入り |
| 1-month-japan-itinerary | Osaka → Beppu | 九州（別府・湯布院）へのフェリー。記事が別府に触れている |
| " | Fukuoka → Beppu | 同上（陸路） |
| japan-autumn-foliage-guide | Tokyo → Nikko | 紅葉。日光は記事の標高の節で扱っている |
| " | Tokyo → Kawaguchiko | 富士・忠霊塔の構図 |
| " | Nagoya → Takayama | 中部の紅葉 |

**自然ピラーの残り5本（上高地・立山黒部・温泉・渓谷・富士）の deep link は、記事を書くときに一緒に取る。**
`sub_id` は記事slugで、slugが確定していないうちに取ると後から直せないため。

- [ ] 上記の路線を検索し、出たものだけURLをコピー → `&z=16597922&sub_id=<slug>` を付けて渡す
- [ ] 受け取ったら暫定のトップページ宛リンクを路線リンクに差し替える
