document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
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

            // CMSKIT
            { str: 'WCVTEXT', ans: 'CMSKIT' },
            { str: '背景色－黒', ans: 'CMSKIT' },
            { str: '/_assets/css/', ans: 'CMSKIT' },
            { str: 'href="css/', ans: 'CMSKIT（違うかもしれません）' },

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

            // WebコアCMS(WebコアEnterprise)
            { str: 'src="/core/', ans: 'WebコアCMS(WebコアEnterprise)' },
            { str: '/shared_new/shared/', ans: 'WebコアCMS(WebコアEnterprise)' },
            { str: '/shared_new/shared/', ans: 'WebコアCMS(WebコアEnterprise)' },

            // WillCommunity
            // WEB-NA
            // assetnow
            // WebRelease

            { str: '検索条件', ans: '回答' },
          ];

        for (const item of stringsToCheck) {
          if (typeof item.str === 'string' && html.includes(item.str)) {
            return item.ans;
          } else if (item.str instanceof RegExp && item.str.test(html)) { // RegExpとtest()を使用
            return item.ans;
          }
        }
          return "該当するCMSはありません。";
        },
      },
      (injectionResults) => {
        if (chrome.runtime.lastError) {
          document.getElementById("result").textContent =
            "エラー: " + chrome.runtime.lastError.message;
          return;
        }

        if (
          injectionResults &&
          injectionResults[0] &&
          injectionResults[0].result
        ) {
          document.getElementById("result").textContent =
            injectionResults[0].result;
        } else {
          document.getElementById("result").textContent =
            "結果を取得できませんでした。";
        }
      }
    );
  });
});
