import { resolve } from "path";
import { sendMessage } from "webext-bridge";
import { Tabs } from "webextension-polyfill";
import browser from "webextension-polyfill";
import constants from '~/services/constants'; 
import moduleServices from '~/services/moduleServices';
import userServices from '~/services/userServices';
import gptServices from '~/services/gptServices';

interface Cache {
  [key: any]: any;
}

const saveModules = async(request:any) => {
  const knowledge = await moduleServices.updateKnowledge(request.data.checked, request.data.modules)
  if (knowledge && knowledge["response"]) {
    await browser.storage.session.set({"checked": request.data.checked, "modules": request.data.modules})
    const response = JSON.parse(knowledge["response"]) // parse the stringified response
    let knowledgeDict:any = {}

    Object.keys(response).forEach((key) => {
      const subKnowledge = response[key].knowledge.knowledge // will be undefined for markdown files
      knowledgeDict[key] = {
        knowledge: subKnowledge ? subKnowledge.join("\n") : response[key].knowledge,
        link: response[key].link,
        name: response[key].name
      }
    })


    browser.storage.local.set({"knowledge": knowledgeDict}).then(() => {
      return new Promise((resolve, reject) => {
        resolve(null)
      })
    });
  }
}

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import("/@vite/client");
  // load latest content script
  import("./contentScriptHMR");
}

browser.runtime.onInstalled.addListener(({ reason }): void => {
  console.log('Extension installed')
  // Add clipper
  browser.contextMenus.create({
    id: "clipSelectedText",
    title: "Clip Selected Text",
    contexts: ["selection"]
  });

  if (reason === 'install') {
    const today = new Date(); // Get the current date
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(today.getDate() + 7); 
    const oneWeekISO = oneWeekFromNow.toISOString();
    browser.storage.local.set({showSurveyDate: oneWeekISO });

    browser.tabs.update({
      url: `${constants.URL}/download`,
    })
  }
})



browser.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log("Message", message)
  if (message.type === 'sign_in') {
    browser.storage.sync.set({"uid": message.user, "isAnon": message.isAnon})
    sendResponse(null)
  } else if (message.type === 'sign_out') {
    browser.storage.sync.remove(["uid", "isAnon"])
    browser.storage.session.remove(["checked", "modules"])
    sendResponse(null)
  } else if (message.type === 'check_exists') {
    sendResponse({exists: true})
  } else if (message.type === 'check_uid') {
    browser.storage.sync.get("uid")
    .then(result => {
      if (result && result['uid']) {
        sendResponse({"uid": result['uid']})
      } else {
        sendResponse({})
      }
    })
    .catch(error => {
      sendResponse({})
    })
  } else if (message.type === 'save') {
    saveModules(message)
    .then(response => {
      sendResponse({success: true})
    })
    .catch(error => {
      sendResponse({success: false})
    })
  } 
  return true
});

browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.type === 'save_module') {
    saveModules(request)
  } else if (request.type === 'popup_open') {
    // Check if data is stored in cache before calliing API
      return new Promise((resolve, reject) => {
        moduleServices
          .fetchModules(request.data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            console.error(error)
            resolve({success: false, response: {modules: []}});
          });
      });
  } else if (request.type === 'add_module') {
      return new Promise((resolve, reject) => {
        userServices
          .addUserModule(request.data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            console.error(error)
            resolve({});
          });
      });
  }
  else if (request.type === 'sign_in') {
      browser.tabs.create({ url: `${constants.URL}/login` });
      return new Promise((resolve, reject) => {
        resolve(null)
      })
  }
  else if (request.type === 'sign_up') {
    browser.tabs.create({ url: `${constants.URL}/signup` });
    return new Promise((resolve, reject) => {
      resolve(null)
    })
  }
  else if (request.type === 'guest_sign_up') {
    browser.tabs.create({ url: `${constants.URL}/get-started` });
    return new Promise((resolve, reject) => {
      resolve(null)
    })
  }
  else if (request.type === 'add_content') {
    return new Promise((resolve, reject) => {
      moduleServices
      .addContent(request.data)
      .then((response) => {
        resolve(response)
      })
      .catch((error) => {
        console.error(error)
        resolve({})
      })
    })
  }
  else if (request.type === 'sent_message') {
    return new Promise((resolve, reject) => {
      // Update number of messages sent (currently 1 one at time).
      // TODO: Batch updates after every X amount of time
      userServices
        .updateLogs(request.data)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          console.error(error)
          resolve({});
        });
    });
  }
  else if (request.type === 'query_gpt') {
    return new Promise((resolve, reject) => {
      gptServices
        .queryGPT(request.data)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          console.error(error)
          resolve({})
        })
    })
  }
  else if (request.type === 'query_embeddings') {
    return new Promise((resolve, reject) => {
      gptServices
        .queryEmbeddings(request.data)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          console.error(error)
          resolve({})
        })
    })
  }
  else if (request.type === 'query_embeddings_chunks') {
    return new Promise((resolve, reject) => {
      gptServices
        .queryEmbeddingsChunks(request.data)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          console.error(error)
          resolve({})
        })
    })
  }
});

// handle browser menu clicks
browser.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "clipSelectedText") {
    const selectedText = info.selectionText;
    browser.storage.local.set({"clipped": selectedText}).then(() => {
      try {
        browser.runtime.sendMessage({
          type: "clipped",
        })
      } catch(error) {
        console.error(error)
      }
      return new Promise((resolve, reject) => {
        resolve(null)
      })
    });
    browser.action.openPopup();

  }
});