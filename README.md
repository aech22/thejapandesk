# The Japan Desk

英語圏（US/UK/AU/CA）向けアフィリエイトサイト。日本の道具（craft）・語学（learn-japanese）・旅行（japan-travel）の3ピラー。Astro 5 + Tailwind 4 の静的サイト。picknavi/gagetnavi と同系統のクローン構成。

## 開発

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ を生成（Cloudflare Pages の出力ディレクトリ）
npm run preview  # ビルド結果をローカル確認
```

## 構成

- `content/articles/*.md` — 記事（frontmatter: title/description/date/pillar/slug/keyword/draft）。本文はMarkdown。
- `src/pages/[...slug].astro` — キャッチオール。`/craft/` などのピラーハブと `/craft/<slug>/` の記事を両方生成。
- `src/data/pillars.ts` — 3ピラー定義。
- `src/consts.ts` — サイト名・**SITE_LIVE（公開ゲート）**・GA/Pinterest/Twitter。
- `public/CNAME` — thejapandesk.net。

## ★ローンチ前チェック（公開ゲート）

現在 `src/consts.ts` の `SITE_LIVE = false`。この間は**全ページ noindex**＋`public/robots.txt` が全クロール拒否＝[VERIFY]下書きが検索に載らない。公開手順：

1. 各記事の `[VERIFY]` を実データ（価格・SKU・アフィリンク）で置換（ASP承認後）。
2. `src/consts.ts`：`SITE_LIVE = true`、`GA_MEASUREMENT_ID`・`PINTEREST_VERIFY`・`TWITTER_SITE` を設定。
3. `public/robots.txt` を「Allow: /」＋Sitemap行に差し替え。
4. About/Contact/Privacy の `[VERIFY]`（運営者名・メール）を反映。
5. `public/ogp.png`（1200x630のOGP画像）を用意。

## デプロイ（Cloudflare Pages）

GitHubリポジトリに push → Cloudflare Pages で接続：
- Build command: `npm run build`
- Output directory: `dist`
- Custom domain: `thejapandesk.net`（ネームサーバーがCloudflareに向いていれば数クリック）
