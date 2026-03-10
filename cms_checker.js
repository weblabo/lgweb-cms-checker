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

        if (columns.length >= 9) {
          let urlStr = columns[4].replace(/^"/, "").replace(/"$/, "");
          let dateStr = columns[8].replace(/^"/, "").replace(/"$/, "");

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
            { reg: /src="\/shared\//, ans: "CMS-8341" },
            { reg: /\/_template_\//, ans: "TsuNaGo" },
            { reg: /WCVTEXT/, ans: "CMSKIT" },
            { reg: /背景色－黒/, ans: "CMSKIT" },
            { reg: /\/_assets\/css\//, ans: "CMSKIT" },
            { reg: /scs_jyogai_start/, ans: "4Uweb/CMS" },
            { reg: /class="jsmessage"/, ans: "4Uweb/CMS" },
            { reg: /SS\.config/, ans: "SHIRASAGI" },
            { reg: /\/_common\/assets\//, ans: "Joruri CMS 2020 Release5以上" },
            { reg: /\/_common\/packs\//, ans: "Joruri CMS 2020 Release4以下" },
            { reg: /\/_layouts\/00000406\//, ans: "Joruri CMS ver.3以下" },
            { reg: /\/_common\/themes\//, ans: "Joruri CMS ver.3以下" },
            { reg: /\/_themes\//, ans: "Joruri or ZOMEKI" },
            { reg: /▼▼フリーHTML▼▼/, ans: "UD Face" },
            { reg: /0-0-0-0-0-0\.html/, ans: "UD Face" },
            { reg: /href="wikiplus\//, ans: "WIKIPLUS(infiniCloud株式会社)" },
            { reg: /src="wikiplus\//, ans: "WIKIPLUS(infiniCloud株式会社)" },
            { reg: /\/wp-content\//, ans: "WordPress" },
            { reg: /\/wp-includes\//, ans: "WordPress" },
            { reg: /\/wp-admin\//, ans: "WordPress" },
            { reg: /\/wp\//, ans: "WordPress" },
            { reg: /\/www\/assets\//, ans: "i-CityPortal" },
            { reg: /href="\/www\/index\.html/, ans: "i-CityPortal" },
            { reg: /href="\/www\/contents\//, ans: "i-CityPortal" },
            { reg: /\/css\/Browser_C\//, ans: "i-SITE PORTAL" },
            { reg: /src="\/core\//, ans: "WebコアCMS（WebコアEnterprise）" },
            { reg: /\/shared_new\/shared\//, ans: "WebコアCMS（WebコアEnterprise）" },
            { reg: /src="\/materials\//, ans: "WebコアCMS（WebコアEnterprise）" },
            { reg: /\/mt-/, ans: "MovableType" },
            { reg: /form\.movabletype\.net/, ans: "MovableType" },
            { reg: /\/Local\//, ans: "WMS（ウェブマネージメントシステム）" },
            { reg: /\/content\/000/, ans: "ALAYA" },
            { reg: /\/common\/000/, ans: "ALAYA" },
            { reg: /skin\/common\//, ans: "優CMS" },
            { reg: /\/share\/style\//, ans: "e-CLEAR" },
            { reg: /\/file\/css\//, ans: "BayBerry" },
            { reg: /content="Drupal/, ans: "Drupal（下層ページを見るとWordPressの場合があります）" },
            { reg: /src="https:\/\/img\.japandx\.co\.jp\//, ans: "Web CMS" },
            { reg: /\/rss\/RssFeed\.jsp/, ans: "株式会社アイアムの独自CMS" },
            { reg: /\/detail\.jsp\?id=/, ans: "株式会社アイアムの独自CMS" },
            { reg: /\/user\/common\//, ans: "JSM（ジャプロサイトメーカー）" },
            { reg: /\/user\/gyosei\/common/, ans: "JSM（ジャプロサイトメーカー）" },
            { reg: /src="\/themes\//, ans: "Concrete CMS" },
            { reg: /\/\?category=/, ans: "不明CMS1" },
            { reg: /kanaboweb/, ans: "不明CMS2" },
            { reg: /\/hotnews\/category\//, ans: "不明CMS3" },
            { reg: /\/page000/, ans: "不明CMS4" },
            { reg: /\/files\/100/, ans: "不明CMS4" },
            { reg: /\/index\.cfm\//, ans: "不明CMS5" },
            { reg: /href="\/theme\//, ans: "不明CMS8" },
            { reg: /src="\/assets\/js\/bundle\.js/, ans: "不明CMS10" },
            { reg: /\/_nuxt\/entry\./, ans: "不明CMS11" },
            { reg: /class="opening"/, ans: "不明CMS14" },
            { reg: /\/list00101\.html"/, ans: "不明CMS15" },
            { reg: /\/banner_click\.php\?/, ans: "不明CMS16" },
            { reg: /-img\//, ans: "不明CMS17" },
            { reg: /\/post_/, ans: "不明CMS19" },
            { reg: /\/detail\.php\?id=/, ans: "不明CMS20" },
            { reg: /\/index\.php\?id=/, ans: "不明CMS21" },
            { reg: /\/documents\/m_cms\//, ans: "不明CMS22" },
            { reg: /\/dynamic\/common\//, ans: "不明CMS23" },
            { reg: /\/life\/list\.php\?/, ans: "不明CMS24" },
            { reg: /JavascriptをONにすることをお勧めします。/, ans: "不明CMS25" },
            { reg: /content="\/assets\/"/, ans: "PowerCMSかもしれません" },
            { reg: /\/assets\/front\//, ans: "PowerCMSかもしれません" },
            { reg: /href="\/assets\/css\//, ans: "PowerCMSかもしれません" },
            { reg: /\/_Incapsula_Resource/, ans: "スマートシティプラットフォーム（都市OS)" },
            { reg: /検索条件をいれる/, ans: "回答を表示" },
          ];

          let cmsName = "該当するCMSはありません";
          for (const item of stringsToCheck) {
            if (item.reg.test(html)) {
              cmsName = item.ans;
              break;
            }
          }
          return cmsName;
        },
      },
      (injectionResults) => {
        if (!injectionResults || !injectionResults[0]) return;
        const resultText = injectionResults[0].result;

        const matchedDate = renewalData[currentDomain];
        const dateDisplay = (matchedDate && matchedDate !== "") ? matchedDate : "不明";

        document.getElementById("result").innerHTML =
          `CMS: ${resultText}<br><span>リニューアル日: ${dateDisplay}</span>`;
      }
    );
  });
});