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
            { str: 'smart-lgov', ans: 'SmartCMS' },

            // NetCrew
            { str: 'src="/ssi/', ans: 'NetCrew' },

            // Joruri CMS ver.3
            { str: '/_layouts/00000406/', ans: 'Joruri CMS ver.3以下' },
            { str: '/_common/themes/', ans: 'Joruri CMS ver.3以下' },

            // Joruri CMS 2017 or 2020
            { str: '/_common/packs/', ans: 'Joruri CMS 2017 or 2020' },

            // Joruri or ZOMEKI
            { str: '/_themes/', ans: 'Joruri or ZOMEKI' },

            // CMS-8341
            { str: 'src="/shared/', ans: 'CMS-8341' },

            // SHIRASAGI
            { str: 'SS.config', ans: 'SHIRASAGI' },

            // WordPress
            { str: '/wp-content/', ans: 'WordPress' },
            { str: '/wp-includes/', ans: 'WordPress' },

            // UD Face
            { str: '▼▼フリーHTML▼▼', ans: 'UD Face' },

            // 4Uweb/CMS
            { str: 'scs_jyogai_start', ans: '4Uweb/CMS' },

            // TsuNaGo
            { str: '/_template_/', ans: 'TsuNaGo' },

            // 優CMS
            { str: 'skin/common/', ans: '優CMS' },

            // i-SITE PORTAL
            { str: '/css/Browser_C/', ans: 'i-SITE PORTAL' },

            // i-CityPortal
            { str: '/www/assets/', ans: 'i-CityPortal' },

            // e-CLEAR
            { str: '/share/style/', ans: 'e-CLEAR' },

            // WMS（ウェブマネージメントシステム）
            { str: '/Local/', ans: 'WMS（ウェブマネージメントシステム）' },

            // WebコアCMS(WebコアEnterprise)
            { str: 'src="/core/', ans: 'WebコアCMS(WebコアEnterprise)' },
            { str: '/shared_new/shared/', ans: 'WebコアCMS(WebコアEnterprise)' },

            // CMSKIT
            { str: 'WCVTEXT', ans: 'CMSKIT' },
            { str: '背景色－黒', ans: 'CMSKIT' },
            { str: '/_assets/css/', ans: 'CMSKIT' },
            // { str: 'href="css/', ans: 'CMSKIT（違うかもしれません）' },

            // PowerCMS
            { str: '/common/img/', ans: 'PowerCMS（違うかもしれません）' },
            { str: 'content="/assets/"', ans: 'PowerCMS（違うかもしれません）'},
            //  { str: '/assets/css/', ans: 'PowerCMS（違うかもしれません）' },

            // ALAYA
            { str: '/content/000', ans: 'ALAYA' },
            { str: '/common/000', ans: 'ALAYA' },

            // PowerCMS or ALAYA
            { str: '/common/css', ans: 'PowerCMS or ALAYA（それ以外の可能性もあります）' },

            // BayBerry
            { str: '/file/css/', ans: 'BayBerry' },

            // MovableType
            { str: '/mt-', ans: 'MovableType' },

            // WillCommunity
            // WEB-NA
            // assetnow
            // WebRelease
            { str: '検索条件', ans: '回答' },
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
