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

        // 新しいパース関数を使って列を正確に分割
        const columns = parseCSVRow(row);

        if (columns.length >= 9) {
          // 5列目(インデックス4)と9列目(インデックス8)を取得し、引用符を除去
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

  const renewalData = await getRenewalData();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    const currentUrl = new URL(currentTab.url);
    const currentDomain = currentUrl.hostname;

    document.getElementById("url").value = currentTab.url;

    chrome.scripting.executeScript(
      {
        target: { tabId: currentTab.id },
        func: () => {
          const html = document.documentElement.outerHTML;
          const stringsToCheck = [
            // SmartCMS
            { str: "smart-lgov", ans: "SmartCMS" },

            // NetCrew
            { str: 'src="/ssi/', ans: "NetCrew" },

            // CMS-8341
            { str: 'src="/shared/', ans: "CMS-8341" },

            // TsuNaGo
            { str: "/_template_/", ans: "TsuNaGo" },

            // CMSKIT
            { str: "WCVTEXT", ans: "CMSKIT" },
            { str: "背景色－黒", ans: "CMSKIT" },
            { str: "/_assets/css/", ans: "CMSKIT" },
            // { str: 'href="css/', ans: 'CMSKIT（違うかもしれません）' },

            // 4Uweb/CMS
            { str: "scs_jyogai_start", ans: "4Uweb/CMS" },
            { str: 'class="jsmessage"', ans: "4Uweb/CMS" },

            // SHIRASAGI
            { str: "SS.config", ans: "SHIRASAGI" },

            // Joruri CMS 2020 Release5以上
            { str: "/_common/assets/", ans: "Joruri CMS 2020 Release5以上" },

            // Joruri CMS 2020 Release4以下
            { str: "/_common/packs/", ans: "Joruri CMS 2020 Release4以下" },

            // Joruri CMS ver.3
            { str: "/_layouts/00000406/", ans: "Joruri CMS ver.3以下" },
            { str: "/_common/themes/", ans: "Joruri CMS ver.3以下" },

            // Joruri or ZOMEKI
            { str: "/_themes/", ans: "Joruri or ZOMEKI" },

            // UD Face
            { str: "▼▼フリーHTML▼▼", ans: "UD Face" },
            { str: "0-0-0-0-0-0.html", ans: "UD Face" },

            // WIKIPLUS(infiniCloud株式会社)
            { str: 'href="wikiplus/', ans: "WIKIPLUS(infiniCloud株式会社)" },
            { str: 'src="wikiplus/', ans: "WIKIPLUS(infiniCloud株式会社)" },

            // WordPress
            { str: "/wp-content/", ans: "WordPress" },
            { str: "/wp-includes/", ans: "WordPress" },
            { str: "/wp-admin/", ans: "WordPress" },
            { str: "/wp/", ans: "WordPress" },

            // i-CityPortal
            { str: "/www/assets/", ans: "i-CityPortal" },
            { str: 'href="/www/index.html', ans: "i-CityPortal" },
            { str: 'href="/www/contents/', ans: "i-CityPortal" },

            // i-SITE PORTAL
            { str: "/css/Browser_C/", ans: "i-SITE PORTAL" },

            // WebコアCMS(WebコアEnterprise) or Drupal
            { str: 'src="/core/', ans: "WebコアCMS（WebコアEnterprise）" },
            {
              str: "/shared_new/shared/",
              ans: "WebコアCMS（WebコアEnterprise）",
            },
            { str: 'src="/materials/', ans: "WebコアCMS（WebコアEnterprise）" },

            // MovableType
            { str: "/mt-", ans: "MovableType" },
            { str: "form.movabletype.net", ans: "MovableType" },
            // { str: '/_Incapsula_Resource', ans: 'MovableType' },

            // WMS（ウェブマネージメントシステム）
            { str: "/Local/", ans: "WMS（ウェブマネージメントシステム）" },

            // ALAYA
            { str: "/content/000", ans: "ALAYA" },
            { str: "/common/000", ans: "ALAYA" },

            // 優CMS
            { str: "skin/common/", ans: "優CMS" },

            // e-CLEAR
            { str: "/share/style/", ans: "e-CLEAR" },

            // BayBerry
            { str: "/file/css/", ans: "BayBerry" },

            // Drupal
            {
              str: 'content="Drupal',
              ans: "Drupal（下層ページを見るとWordPressの場合があります）",
            },

            // Web CMS
            { str: 'src="https://img.japandx.co.jp/', ans: "Web CMS" },

            { str: "/rss/RssFeed.jsp", ans: "株式会社アイアムの独自CMS" },
            { str: "/detail.jsp?id=", ans: "株式会社アイアムの独自CMS" },

            { str: "/user/common/", ans: "JSM（ジャプロサイトメーカー）" },
            {
              str: "/user/gyosei/common",
              ans: "JSM（ジャプロサイトメーカー）",
            },

            // Concrete CMS
            { str: 'src="/themes/', ans: "Concrete CMS" },

            // 不明パターン
            { str: "/?category=", ans: "不明CMS1" },

            { str: "kanaboweb", ans: "不明CMS2" },

            { str: "/hotnews/category/", ans: "不明CMS3" },

            { str: "/page000", ans: "不明CMS4" },
            { str: "/files/100", ans: "不明CMS4" },

            { str: "/index.cfm/", ans: "不明CMS5" },

            { str: 'href="/theme/', ans: "不明CMS8" },

            { str: 'src="/assets/js/bundle.js', ans: "不明CMS10" },

            { str: "/_nuxt/entry.", ans: "不明CMS11" },

            { str: 'class="opening"', ans: "不明CMS14" },

            { str: '/list00101.html"', ans: "不明CMS15" },

            { str: "/banner_click.php?", ans: "不明CMS16" },

            { str: "-img/", ans: "不明CMS17" },

            { str: "/post_", ans: "不明CMS19" },

            { str: "/detail.php?id=", ans: "不明CMS20" },

            { str: "/index.php?id=", ans: "不明CMS21" },

            { str: "/documents/m_cms/", ans: "不明CMS22" },

            { str: "/dynamic/common/", ans: "不明CMS23" },

            { str: "/life/list.php?", ans: "不明CMS24" },

            {
              str: "サイトの閲覧には問題ありませんが、より快適にご利用いただくためにJavascriptをONにすることをお勧めします。",
              ans: "不明CMS25",
            },

            // PowerCMS
            // { str: '/common/img/', ans: 'PowerCMS（違うかもしれません）' },
            {
              str: 'content="/assets/"',
              ans: "PowerCMSかもしれません（PowerCMSを完全に見分ける方法は不明です）",
            },
            {
              str: "/assets/front/",
              ans: "PowerCMSかもしれません（PowerCMSを完全に見分ける方法は不明です）",
            },
            {
              str: 'href="/assets/css/',
              ans: "PowerCMSかもしれません（PowerCMSを完全に見分ける方法は不明です）",
            },

            // スマートシティプラットフォーム（都市OS)
            {
              str: "/_Incapsula_Resource",
              ans: "スマートシティプラットフォーム（都市OS)（トップページの場合は違う場合があります）",
            },

            // WillCommunity
            // WEB-NA
            // assetnow
            // WebRelease
            // NetCommons
            // SITE PUBLIS
            { str: "検索条件をいれる", ans: "回答を表示" },
          ];

          let cmsName = "該当するCMSはありません";
          for (const item of stringsToCheck) {
            if (html.includes(item.str)) {
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
        const dateDisplay =
          matchedDate && matchedDate !== "" ? matchedDate : "不明";

        document.getElementById("result").innerHTML =
          `CMS: ${resultText}<br><span>リニューアル日: ${dateDisplay}</span>`;
      },
    );
  });
});
