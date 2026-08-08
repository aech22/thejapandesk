// アフィリエイトリンクに rel="sponsored" を自動で付ける rehype プラグイン。
//
// 手で `rel` を書く方式にしないのは、記事が増えるほど付け忘れが必ず出るため
// （実際 2026-08-08 時点で、既存の Klook リンク7本すべてに rel が付いていなかった）。
// ドメインで機械的に判定するので、新しい記事で素のMarkdownリンクを書けばそれで足りる。
//
// ★プログラムを増やしたらこのリストに1行足す。ここが唯一の窓口。
const AFFILIATE_HOSTS = [
  'getyourguide.com',
  'klook.com',
  '12go.asia',
  'japanesepod101.com',
  'emrldco.com',      // Travelpayouts の変換先。手で書くことはないが念のため
];

const hostOf = (href) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const isAffiliate = (href) => {
  const h = hostOf(href);
  return h && AFFILIATE_HOSTS.some((a) => h === a || h.endsWith('.' + a));
};

/** rel の値を壊さずに追加する（既に書いてあるものは尊重する）。 */
const addRel = (node, ...values) => {
  const cur = node.properties.rel;
  const set = new Set(
    Array.isArray(cur) ? cur : typeof cur === 'string' ? cur.split(/\s+/) : []
  );
  values.forEach((v) => set.add(v));
  node.properties.rel = [...set].filter(Boolean);
};

export default function affiliateRel() {
  return (tree) => {
    const walk = (node) => {
      if (node.type === 'element' && node.tagName === 'a' && node.properties?.href) {
        if (isAffiliate(String(node.properties.href))) {
          // sponsored = 対価が発生するリンク。nofollow も併記して評価を渡さない
          addRel(node, 'sponsored', 'nofollow', 'noopener');
        }
      }
      (node.children || []).forEach(walk);
    };
    walk(tree);
  };
}
