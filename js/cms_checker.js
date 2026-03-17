document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. アイコンの動的変更（実行中状態にする） ---
  chrome.action.setIcon({
    path: {
      16: "icons/icon16_active.png",
      32: "icons/icon32_active.png",
      48: "icons/icon48_active.png",
      128: "icons/icon128_active.png",
    },
  });

  // 【変更点】unloadイベントの代わりに、バックグラウンドと接続する
  // この接続が切れたこと（＝ポップアップが閉じたこと）をbackground.jsが検知してアイコンを戻します
  chrome.runtime.connect({ name: "popup" });

  // --- 2. CSV解析・判定のロジック ---
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
      const response = await fetch(chrome.runtime.getURL("data/lgweb.csv"));
      const text = await response.text();
      const rows = text.split(/\r?\n/).slice(1);
      const dataMap = {};

      rows.forEach((row) => {
        if (!row.trim()) return;

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

  const renewalData = await getRenewalData();

  // --- 3. 判定ロジックの呼び出しと表示処理 ---
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (!currentTab) return;

    if (currentTab.url) {
      const currentUrl = new URL(currentTab.url);
      const currentDomain = currentUrl.hostname;
      document.getElementById("url").value = currentTab.url;

      // ページのHTMLを取得して直接CMS判定
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTab.id },
          func: () => document.documentElement.outerHTML,
        },
        (results) => {
          if (!results || !results[0]) return;
          const html = results[0].result;
          // js/cms_detector.jsのdetectCMS関数を利用
          // 動的importで関数を取得
          import(chrome.runtime.getURL('js/cms_detector.js')).then(module => {
            const resultObj = module.detectCMS(html);

            const hasDomainData = currentDomain in renewalData;
            const matchedDate = renewalData[currentDomain];

            let dateDisplay = "";
            let dateClass = "renewal-date";

            if (!hasDomainData) {
              dateDisplay = "自治体公式サイトではありません";
            } else if (!matchedDate || matchedDate === "") {
              dateDisplay = "リニューアル日: 不明";
            } else {
              dateDisplay = `リニューアル日: ${matchedDate}`;
              const now = new Date();
              const renewalDateObj = new Date(matchedDate);
              if (renewalDateObj > now) {
                dateDisplay += "（リニューアル予定）";
                dateClass += " future-date";
              }
            }


            // --- CMSごとにアイコンを動的変更 ---
            const cmsIconMap = {
              "WordPress": "icons/icon16_wp.png",
              "SmartCMS": "icons/icon16_smartcms.png",
              // 必要に応じて他CMSも追加
            };
            const iconPath = cmsIconMap[resultObj.name] || "icons/icon16_active.png";
            chrome.action.setIcon({
              path: {
                16: iconPath,
                32: iconPath.replace('16', '32'),
                48: iconPath.replace('16', '48'),
                128: iconPath.replace('16', '128'),
              },
            });

            let htmlContent = `<div><img src=\"${iconPath}\" alt=\"${resultObj.name}アイコン\" width=16 height=16 style=\"vertical-align:middle;margin-right:6px;\"><span class=\"cms-name\">CMS: ${resultObj.name}</span></div>`;
            htmlContent += `<div><span class=\"${dateClass}\">${dateDisplay}</span></div>`;

            // 一致内容（Shiftキーで表示）のHTML
            if (resultObj.matchedText) {
              const escapedText = resultObj.matchedText
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
              htmlContent += `<div id=\"secret-match\" class=\"matched-code\" style=\"display: none;\">(一致内容: ${escapedText})</div>`;
            }

            document.getElementById("result").innerHTML = htmlContent;

            // Shiftキーイベント
            window.addEventListener("keydown", (e) => {
              if (e.key === "Shift") {
                const secretEl = document.getElementById("secret-match");
                if (secretEl) {
                  secretEl.style.display = "block";
                }
              }
            });
          });
        }
      );
    }
  });
});
