import { resolve } from "path";
import { sendMessage } from "webext-bridge";
import { Tabs } from "webextension-polyfill";
import browser from "webextension-polyfill";
import constants from '~/services/constants'; 
import apiServices from "~/services/apiServices";

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client");
  // load latest content script
  import("./contentScriptHMR");
}


browser.runtime.onInstalled.addListener(({ reason }): void => {
  console.log('Extension installed')
  // do anything when installed
})



browser.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  // send messages externally 
  return true
});

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(request.type)
    if (request.type === 'dummy_function') {
    return new Promise((resolve, reject) => {
      /* call the functions you defined in apiServices
        Example:
      */
      //  return new Promise((resolve, reject) => {
      //   apiServices
      //     .queryAPI(request.data)
      //     .then((response) => {
      //       resolve(response)
      //     })
      //     .catch((error) => {
      //       console.error(error)
      //       resolve({})
      //     })
      // })

    })
  }
  // message handler for receiving messages
  
});

// handle browser menu clicks
browser.contextMenus.onClicked.addListener(function(info, tab) {
  // if you want to use context menus
});