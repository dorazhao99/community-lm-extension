import { sendMessage } from "webext-bridge";
import { Tabs } from "webextension-polyfill";
import browser from "webextension-polyfill";
import moduleServices from '~/services/moduleServices';
import userServices from '~/services/userServices';
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
      url: 'http://localhost:3000/download',
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

// listen for messages from web app
browser.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  console.log("Message", message)
  if (message.type === 'sign_in') {
    console.log('Sign in 2', message.user)
    await browser.storage.sync.set({"uid": message.user})
  } else if (message.type === 'sign_out') {
    console.log('Sign out')
    await browser.storage.sync.remove("uid")
  }
  return true
});

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('request in background', request)
  if (request.type === 'save_module') {
    // let queryOptions = {active: true, currentWindow: true};
    const knowledge = await moduleServices.updateKnowledge(request.data.checked, request.data.modules)
    console.log('knowledge', knowledge)
    if (knowledge && knowledge["response"]) {
      console.log('Knowledge', knowledge)
      const response = JSON.parse(knowledge["response"])
      console.log("response", response)
      let knowledgeDict = {}

      Object.keys(response).forEach((key) => {
        console.log(key, response[key].knowledge)
        knowledgeDict[key] = {
          knowledge: response[key].knowledge.knowledge.join("\n"),
          link: response[key].link
        }
      })


      browser.storage.local.set({"knowledge": knowledgeDict}).then(() => {
        console.log("Value is set", knowledgeDict);
        return new Promise((resolve, reject) => {
          resolve(null)
        })
      });
    }
  } else if (request.type === 'popup_open') {
    console.log('Open Popup')
    return new Promise((resolve, reject) => {
      moduleServices
        .fetchModules()
        .then((response) => {
          const modules = response
          moduleServices
            .fetchCommunities()
            .then((response) => {
              console.log('Communities', response)
              const communities = response
              resolve({modules: modules, communities: communities});
            })
          // userServices
          // .fetchUserModules("test")
          // .then((userResponse) => {
          //   console.log('user response', userResponse)
          //   const checked = userResponse.response.checked ? userResponse.response.checked : {}
          //   resolve({modules: modules, checked: checked});
          // })
          // .catch((error) => {
          //   console.error(error)
          //   resolve({modules: modules, checked: {}});
          // })
        })
        .catch((error) => {
          console.error(error)
          resolve({modules: []});
        });
    });
  }
  else if (request.type === 'sign_in') {
      console.log("open sign in")
      browser.tabs.create({ url: "http://localhost:3000/login" });
      return new Promise((resolve, reject) => {
        resolve(null)
      })
  }
});

// return new Promise((resolve, reject) => {
//   moduleServices
//     .fetchModules()
//     .then((response) => {
//       const modules = response
//       userServices
//       .fetchUserModules("test")
//       .then((response) => {
//         const checked = response.checked ? response.checked : {}
//         resolve(modules);
//       })
//     });
// });

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

    // return new Promise((resolve, reject) => {
    //   browser.tabs.query(queryOptions)
    //   .then((tabs) => {
    //         console.log('Knowledge2', knowledge, knowledge.response)
    //         Promise.all([browser.tabs.sendMessage(tabs[0].id!, {
    //           type: "send_knowledge", 
    //           data: {
    //             knowledge: knowledge
    //           }
    //         })])
    //         .then(response => {
    //           resolve(null)
    //         })
    //   })
    // })

    // moduleServices
    //   .updateKnowledge(request.data.checked, request.data.modules)
    //   .then((response) => {
    //     console.log(response)
    //     browser.tabs.query(queryOptions)
    //     .then((tabs) => {
    //           browser.tabs.sendMessage(tabs[0].id, request)
    //           .then(response => {
    //             console.log(response)
    //           })
    //     })
    //   }); 