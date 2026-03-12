document.addEventListener("DOMContentLoaded", async () => {
  // 1. ダブルクォーテーション内のカンマを無視して正しく列を分割する関数
  function parseCSVRow(str) {
    let result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '"') {
        inQuotes = !inQuotes;
      } else if (str[i] === "," && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += str[i];
      }
    }
    result.push(cur.trim());
    return result;
  }

  async function getRenewalData() {
    try {
      const response = await fetch(chrome.runtime.getURL("lgweb.csv"));
      const text = await response.text();
      const rows = text.split(/\r?\n/).slice(1);
      const dataMap = {};

      rows.forEach((row) => {
        if (!row.trim()) return; // 空行をスキップ

        const columns = parseCSVRow(row);

        if (columns.length >= 2) {
          let urlStr = columns[1].replace(/^"/, "").replace(/"$/, "");
          let dateStr = columns[2].replace(/^"/, "").replace(/"$/, "");

          try {
            if (!urlStr.startsWith("http")) urlStr = "http://" + urlStr;
            const domain = new URL(urlStr).hostname;
            dataMap[domain] = dateStr;
          } catch (e) {
            if (urlStr) dataMap[urlStr] = dateStr;
          }
        }
      });
      return dataMap;
    } catch (e) {
      console.error("CSV読み込みエラー:", e);
      return {};
    }
  }

  // Load CSV data first
  const renewalData = await getRenewalData();

  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;

    let currentDomain = "";
    if (currentTab.url) {
      const currentUrl = new URL(currentTab.url);
      currentDomain = currentUrl.hostname;
      document.getElementById("url").value = currentTab.url;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        func: () => {
          const html = document.documentElement.outerHTML;
          const stringsToCheck = [
            { reg: /smart-lgov/, ans: "SmartCMS" },
            { reg: /src="\/ssi\//, ans: "NetCrew" },
            { reg: /\/shared\/site/, ans: "CMS-8341" },
            { reg: /\/shared\/style\//, ans: "CMS-8341" },
            { reg: /\/shared\/rn\//, ans: "CMS-8341" },
            { reg: /\/_template_\//, ans: "TsuNaGo" },
            { reg: /WCVTEXT/, ans: "CMSKIT" },
            { reg: /背景色－黒/, ans: "CMSKIT" },
            { reg: /\/_assets\/css/, ans: "CMSKIT" },
            { reg: /scs_jyogai_start/, ans: "4Uweb\/CMS" },
            { reg: /class="jsmessage"/, ans: "4Uweb\/CMS" },
            { reg: /SS\.config/, ans: "SHIRASAGI" },
            { reg: /\/_common\/assets\//, ans: "Joruri CMS 2020 Release4以上" },
            { reg: /\/_common\/packs\//, ans: "Joruri CMS 2020 Release3以下" },
            { reg: /\/_layouts\/00000406\//, ans: "Joruri CMS ver.3以下" },
            { reg: /\/_common\/themes\//, ans: "Joruri CMS ver.3以下" },
            { reg: /\/_themes\//, ans: "Joruri or ZOMEKI" },
            { reg: /▼▼フリーHTML▼▼/, ans: "UD Face" },
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
            { reg: /src="\/core\//, ans: "WebコアEnterprise（WebコアCMS）" },
            {
              reg: /\/shared_new\/shared\//,
              ans: "WebコアEnterprise（WebコアCMS）",
            },
            {
              reg: /src="\/materials\//,
              ans: "WebコアEnterprise（WebコアCMS）",
            },
            { reg: /\/mt-/, ans: "MovableType" },
            { reg: /form\.movabletype\.net/, ans: "MovableType" },
            { reg: /\/Local\//, ans: "WMS（ウェブマネージメントシステム）" },
            { reg: /\/content\/000/, ans: "CMS ALAYA" },
            { reg: /\/common\/000/, ans: "CMS ALAYA" },
            { reg: /skin\/common\//, ans: "優CMS" },
            { reg: /\/share\/style\//, ans: "e-CLEAR" },
            { reg: /\/file\/css\//, ans: "BayBerry" },
            {
              reg: /content="Drupal/,
              ans: "Drupal（下層ページを見るとWordPressの場合があります）",
            },
            { reg: /src="https:\/\/img\.japandx\.co\.jp\//, ans: "Web CMS" },
            { reg: /\/rss\/RssFeed\.jsp/, ans: "株式会社アイアムの独自CMS" },
            { reg: /\/detail\.jsp\?id=/, ans: "株式会社アイアムの独自CMS" },
            { reg: /\/user\/common\//, ans: "JSM（ジャプロサイトメーカー）" },
            {
              reg: /\/user\/gyosei\/common/,
              ans: "JSM（ジャプロサイトメーカー）",
            },
            { reg: /src="\/themes\//, ans: "Concrete CMS" },
            { reg: /css\/\d+_/, ans: "みなさいと" },
            { reg: /\/\?category=/, ans: "不明CMS1" },
            { reg: /kanaboweb/, ans: "不明CMS2" },
            { reg: /\/hotnews\/category\//, ans: "HOTNEWSシステム" },
            { reg: /\/page000/, ans: "不明CMS4" },
            { reg: /\/files\/100/, ans: "不明CMS4" },
            { reg: /\/index\.cfm\//, ans: "不明CMS5" },
            { reg: /\.aspx\?servno=\d{1,5}/, ans: "不明CMS6" },
            { reg: /href="\/theme\//, ans: "不明CMS8" },
            { reg: /src="\/assets\/js\/bundle\.js/, ans: "不明CMS10" },
            { reg: /\/_nuxt\/entry\./, ans: "不明CMS11" },

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
            { reg: /\/life\/list\.php\?/, ans: "不明CMS24" },
            {
              reg: /JavascriptをONにすることをお勧めします。/,
              ans: "不明CMS25",
            },

            {
              reg: /href="styles\.[a-z0-9]+\.css"/,
              ans: "スマートシティプラットフォーム（都市OS)",
            },
            { reg: /^[a-z]-header/, ans: "PowerCMS" },
            { reg: /^[a-z]-footer/, ans: "PowerCMS" },
            { reg: /assets\/css\//, ans: "PowerCMS" },
            { reg: /content="与謝野町"/, ans: "PowerCMS" },
            { reg: /class="header-utilit/, ans: "株式会社トラパンツの独自CMS" },
            {
              reg: /<form[^>]*action=["']https:\/\/.*?\.jp\/front\/search/,
              ans: "株式会社トラパンツの独自CMS",
            },
            { reg: /検索条件をいれる/, ans: "回答を表示" },
          ];

          // WillCommunity
          // WEB-NA
          // assetnow
          // NetCommons
          // SITE PUBLIS

          let foundCms = { name: "該当するCMSはありません", matchedText: "" };
          for (const item of stringsToCheck) {
            const match = html.match(item.reg); // matchメソッドを使用
            if (match) {
              foundCms.name = item.ans;
              foundCms.matchedText = match[0]; // 一致した文字列を格納
              break;
            }
          }
          return foundCms; // オブジェクトとして返す
        },
      },
      (injectionResults) => {
        if (!injectionResults || !injectionResults[0]) return;
        const resultObj = injectionResults[0].result;

        // 1. CSVにドメインが存在するかを厳密にチェック
        const hasDomainData = currentDomain in renewalData;
        const matchedDate = renewalData[currentDomain];

        let dateDisplay = "";
        let dateClass = "renewal-date";

        if (!hasDomainData) {
          // A. CSVにドメイン自体が登録されていない場合
          dateDisplay = "自治体公式サイトではありません";
        } else if (!matchedDate || matchedDate === "") {
          // B. ドメインはあるが、日付の項目が空の場合
          dateDisplay = "リニューアル日: 不明";
        } else {
          // C. 日付データがある場合
          dateDisplay = `リニューアル日: ${matchedDate}`;

          const now = new Date();
          const renewalDateObj = new Date(matchedDate);

          // 未来の日付（リニューアル予定）の判定
          if (renewalDateObj > now) {
            dateDisplay += "（リニューアル予定）";
            dateClass += " future-date";
          }
        }

        // HTMLの組み立て
        let htmlContent = `<span class="cms-name">CMS: ${resultObj.name}</span>`;

        if (resultObj.matchedText) {
          // 特殊文字をエスケープして表示
          const escapedText = resultObj.matchedText
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          htmlContent += `<span class="matched-code">(一致: ${escapedText})</span>`;
        }

        htmlContent += `<span class="${dateClass}">${dateDisplay}</span>`;

        document.getElementById("result").innerHTML = htmlContent;
      },
    );
  });
});
