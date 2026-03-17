// CMS判定ロジックを関数化し、他ファイルからも利用可能に
function detectCMS(html) {
  const stringsToCheck = [
    { reg: /smart-lgov/, ans: "SmartCMS" },
    { reg: /var cms_api_domain=/, ans: "SmartCMS" },
    { reg: /src="\/ssi\//, ans: "NetCrew" },
    { reg: /\/shared\/site/, ans: "CMS-8341" },
    { reg: /\/shared\/style\//, ans: "CMS-8341" },
    { reg: /\/shared\/rn\//, ans: "CMS-8341" },
    { reg: /\/shared\/renew\//, ans: "CMS-8341" },
    { reg: /\/shared\/css\//, ans: "CMS-8341" },
    { reg: /\/_template_\//, ans: "TsuNaGo" },
    { reg: /WCVTEXT/, ans: "CMSKIT" },
    { reg: /背景色－黒/, ans: "CMSKIT" },
    { reg: /\/_assets\/css/, ans: "CMSKIT" },
    { reg: /scs_jyogai_start/, ans: "4Uweb\/CMS" },
    { reg: /class="jsmessage"/, ans: "4Uweb\/CMS" },
    { reg: /SS\.config/, ans: "SHIRASAGI" },
    {
      reg: /\/_common\/assets\//,
      ans: "Joruri CMS 2020 Release4以上",
    },
    {
      reg: /\/_common\/packs\//,
      ans: "Joruri CMS 2020 Release3以下",
    },
    { reg: /\/_layouts\/00000406\//, ans: "Joruri CMS ver.3以下" },
    { reg: /\/_common\/themes\//, ans: "Joruri CMS ver.3以下" },
    { reg: /\/_themes\//, ans: "Joruri or ZOMEKI" },
    { reg: /▼▼フリーHTML▼▼/, ans: "UD Face" },
    { reg: /▼▼フリーHTMLスペース▼▼/, ans: "UD Face" },
    { reg: /(\d{1,2}-){9}\d{1,2}\.html/, ans: "UD Face" },
    { reg: /href="wikiplus\//, ans: "WIKIPLUS" },
    { reg: /src="wikiplus\//, ans: "WIKIPLUS" },
    { reg: /\/wp-content\//, ans: "WordPress" },
    { reg: /\/wp-includes\//, ans: "WordPress" },
    { reg: /\/wp-admin\//, ans: "WordPress" },
    { reg: /\/www\/assets\//, ans: "i-CityPortal" },
    { reg: /href="\/www\/index\.html/, ans: "i-CityPortal" },
    { reg: /href="\/www\/contents\//, ans: "i-CityPortal" },
    { reg: /\/css\/Browser_C\//, ans: "i-SITE PORTAL" },
    { reg: /content="Drupal/, ans: "Drupal" },
    { reg: /src=["']\/core\/misc\/drupal/, ans: "Drupal" },
    {
      reg: /\/\d{3}\/\d{3}\/index\.html/,
      ans: "WebコアEnterprise（WebコアCMS）",
    },
    {
      reg: /\/[a-zA-Z0-9_-]+\/\d{14}\.html/,
      ans: "WebコアEnterprise（WebコアCMS）",
    },
    {
      reg: /src="\/core\/js\//,
      ans: "WebコアEnterprise（WebコアCMS）",
    },
    {
      reg: /\/shared_new\/shared\//,
      ans: "WebコアEnterprise（WebコアCMS）",
    },
    { reg: /\/mt-/, ans: "MovableType" },
    { reg: /form\.movabletype\.net/, ans: "MovableType" },
    { reg: /\/Local\//, ans: "WMS（ウェブマネージメントシステム）" },
    { reg: /\/content\/000/, ans: "CMS ALAYA" },
    { reg: /\/common\/000/, ans: "CMS ALAYA" },
    { reg: /skin\/common\//, ans: "優CMS" },
    { reg: /\/share\/style\//, ans: "e-CLEAR" },
    { reg: /\.css\?version=\d+["']/, ans: "NetCommons" },
    { reg: /src=["']\/file\/\d+/, ans: "NetCommons" },
    { reg: /\/file\/css\//, ans: "BayBerry" },
    { reg: /src="https:\/\/img\.japandx\.co\.jp\//, ans: "Web CMS" },
    { reg: /\/cms-sypher\//, ans: "CMS-Sypher" },
    { reg: /\/rss\/RssFeed\.jsp/, ans: "株式会社アイアムの独自CMS" },
    { reg: /\/detail\.jsp\?id=/, ans: "株式会社アイアムの独自CMS" },
    { reg: /\/user\/common\//, ans: "JSM（ジャプロサイトメーカー）" },
    {
      reg: /\/user\/gyosei\/common/,
      ans: "JSM（ジャプロサイトメーカー）",
    },
    { reg: /\/hotnews\/category\//, ans: "HOTNEWSシステム" },
    { reg: /src="\/themes\//, ans: "Concrete CMS" },
    { reg: /css\/\d+_/, ans: "みなさいと" },
    {
      reg: /href="styles\.[a-z0-9]+\.css"/,
      ans: "スマートシティプラットフォーム（都市OS)",
    },
    {
      reg: /class="header-utilit/,
      ans: "株式会社トラパンツの独自CMS",
    },
    {
      reg: /<form[^>]*action=["']https:\/\/.*?\.jp\/front\/search/,
      ans: "株式会社トラパンツの独自CMS",
    },
    {
      reg: /src=["']\/images\/advertisement\//,
      ans: "NaClの独自CMS",
    },
    { reg: /\/\?category=/, ans: "株式会社ipnetの独自CMS" },
    { reg: /kanaboweb/, ans: "不明CMS2" },
    { reg: /\/page\d{6}\.html/, ans: "不明CMS4" },
    { reg: /\/files\/100/, ans: "不明CMS4" },
    { reg: /\/index\.cfm\//, ans: "不明CMS5" },
    { reg: /\.aspx\?servno=\d{1,5}/, ans: "不明CMS6" },
    { reg: /href="\/theme\//, ans: "不明CMS8" },
    { reg: /src="\/assets\/js\/bundle\.js/, ans: "不明CMS10" },
    { reg: /\/_nuxt\/entry\./, ans: "不明CMS11" },
    { reg: /\/category\/\d{6}/, ans: "不明CMS12" },
    { reg: /\/category\d{8}\.html/, ans: "不明CMS13" },
    { reg: /\/list00\d{3}\.html"/, ans: "不明CMS14" },
    { reg: /class="opening"/, ans: "不明CMS14" },
    { reg: /\/dynamic\/common\//, ans: "不明CMS14" },
    { reg: /\/banner_click\.php\?/, ans: "不明CMS16" },
    { reg: /-img\//, ans: "WebRelease" },
    { reg: /\/post_/, ans: "不明CMS19" },
    { reg: /\/detail\.php\?id=/, ans: "不明CMS20" },
    { reg: /\/index\.php\?id=/, ans: "不明CMS21" },
    { reg: /\/documents\/m_cms\//, ans: "不明CMS22" },
    { reg: /\/List.aspx?/, ans: "不明CMS23" },
    { reg: /\/list\.php\?ca/, ans: "不明CMS24" },
    { reg: /\/list\.php\?hdn/, ans: "不明CMS24" },
    {
      reg: /JavascriptをONにすることをお勧めします。/,
      ans: "不明CMS25",
    },
    {
      reg: /src=["']\/img\/upload\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
      ans: "不明CMS26",
    },
    { reg: /\d{4}-\d{4}-\d{4}-\d{2}\.html/, ans: "不明CMS27" },
    { reg: /href=["']\/_nuxt\/[a-zA-Z0-9_-]+\.js/, ans: "不明CMS28" },
    { reg: /\.cgi\?CATEGORY_ID=\d+/, ans: "不明CMS29" },
    {
      reg: /\/(?!(?:script|category|gcf)\/)[a-zA-Z]+\/\d{4}\/?"/,
      ans: "不明CMS34",
    },
    { reg: /\/_\d+\/_\d+\.html/, ans: "不明CMS30" },
    { reg: /(?<!")\/\d{3,}\/\d{3,}\/\d{3,}/, ans: "不明CMS31" },
    { reg: /\.\/(?:[a-zA-Z0-9_-]+\/)?\d+\.html/, ans: "不明CMS32" },
    { reg: /href=["']\/[a-zA-Z0-9_-]+\/\?cat=\d+/, ans: "不明CMS33" },
    { reg: /href=["']\/\d+_\d+_\d+\.html/, ans: "不明CMS35" },
    { reg: /\.html\?category_id=\d+/, ans: "不明CMS36" },
    { reg: /\/css\/DsFront\//, ans: "不明CMS37" },
    //PowerCMSは最後尾に記載
    { reg: /^[a-z]-header/, ans: "PowerCMS" },
    { reg: /^[a-z]-footer/, ans: "PowerCMS" },
    { reg: /assets\/css\//, ans: "PowerCMS" },
    { reg: /content="与謝野町"/, ans: "PowerCMS" },
  ];

  // WillCommunity
  // WEB-NA
  // assetnow
  // SITE PUBLIS

  let foundCms = { name: "該当するCMSはありません", matchedText: "" };
  for (const item of stringsToCheck) {
    const match = html.match(item.reg);
    if (match) {
      foundCms.name = item.ans;
      foundCms.matchedText = match[0];
      break;
    }
  }
  return foundCms;
}

// 既存のIIFE呼び出しも維持（従来の動作保証のため）
if (typeof document !== 'undefined') {
  detectCMS(document.documentElement.outerHTML);
}
