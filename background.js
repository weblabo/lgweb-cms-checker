// ポップアップからの接続を待ち受け
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    // ポップアップが閉じられて接続が切れたときに実行される
    port.onDisconnect.addListener(() => {
      chrome.action.setIcon({
        path: {
          16: "icons/icon16.png",
          32: "icons/icon32.png",
          48: "icons/icon48.png",
          128: "icons/icon128.png",
        },
      });
    });
  }
});