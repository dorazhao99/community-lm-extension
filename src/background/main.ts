import { sendMessage } from "webext-bridge";
import { Tabs } from "webextension-polyfill";
import browser from "webextension-polyfill";

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client");
  // load latest content script
  import("./contentScriptHMR");
}

browser.runtime.onInstalled.addListener(({ reason }): void => {
  console.log('Extension installed')
  if (reason === 'install') {
    browser.tabs.update({
      url: 'https://chatgpt.com',
    })
  }
})

let previousTabId = 0;

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async ({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId;
    return;
  }

  let tab: Tabs.Tab;

  try {
    tab = await browser.tabs.get(previousTabId);
    previousTabId = tabId;
  } catch {
    return;
  }

  // eslint-disable-next-line no-console
  console.log("previous tab", tab);
  sendMessage(
    "tab-prev",
    { title: tab.title },
    { context: "content-script", tabId }
  );
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('request in background', request)
  if (request.type === 'save_module') {
    let queryOptions = {active: true, currentWindow: true};
    browser.tabs.query(queryOptions)
    .then((tabs) => {
      console.log(tabs)
        browser.tabs.sendMessage(tabs[0].id, request)
        .then(response => {
          console.log(response)
        })
    })
    .catch((err) => {
        console.log(err);
    });
  }
});

// onMessage("get-current-tab", async () => {
//   try {
//     const tab = await browser.tabs.get(previousTabId);
//     return {
//       title: tab?.id,
//     };
//   } catch {
//     return {
//       title: undefined,
//     };
//   }
// });
