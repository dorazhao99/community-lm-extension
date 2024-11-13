/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";

// CSS for chip
const RequestVariables = {
  promptHeader: 'Here is additional knowledge that be useful for the prompt. Disregard the knowledge if not relevant.\nKnowledge:'
}

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
function passKnowledge(knowledge) {
  const knowledgeEvent = new CustomEvent('setKnowledge',
    {
      detail: {
        knowledge: ['test']
      },
    })
  console.log('Pass Knowledge', knowledge)
  window.dispatchEvent(knowledgeEvent)
}

function createPrompt(result) {
  const allKnowledge:any = []
  Object.keys(result).forEach(mod => {
    allKnowledge.push(result[mod])
  })
  return allKnowledge.join("\n")
}

window.addEventListener("change_prompt", function (evt) {
  browser.storage.local.get().then((result) => {
      console.log("Result", result)
      /*
        TODO: ADD ROUTER TO FIGURE OUT WHICH KNOWLEDGE PICES
      */
      browser.storage.sync.set({"modules": Object.keys(result)}).then(() => {
        return new Promise((resolve, reject) => {
          resolve(null)
        })
      });

     // Update prompt with knowledge 
      const knowledge = createPrompt(result)
      console.log('Knowledge', knowledge)
      console.log(evt)
      const options = JSON.parse(evt.detail.options)
      console.log(options)
      const newBody = JSON.parse(options.body)
      const message = newBody.messages[0].content.parts
      const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}`;
      const newMessage = [combinedKnowledge, ...message]
      console.log(newMessage)
      newBody.messages[0].content.parts = newMessage
      newBody.customFetch = true
      newBody.originalMessage = message
      const modifiedOptions = {
          ...options,
          body: JSON.stringify(newBody),
      }
      const event = new CustomEvent("send_prompt",
          {
              detail: {
                  resource: evt.detail.resource, 
                  modifiedOptions: JSON.stringify(modifiedOptions), 
                  originalPrompt: message[0]
              }
          });

      window.dispatchEvent(event);
  });
}, false);

// window.addEventListener("add_chip", function (evt) {
//   console.log('Message ID', evt.detail)
//   // const messageDict = {
//   //   [evt.detail.id]: evt.detail.modules
//   // }
//   // browser.storage.sync.set(messageDict).then(() => {
//   //   console.log("Value is set", messageDict);
//   //   return new Promise((resolve, reject) => {
//   //     resolve(null)
//   //   })
//   // });
// }, false);
function injectChips(element:any) {
  
  browser.storage.sync.get("modules").then((result) => {
    console.log("Get Chip", result)
    const modules = result.modules 
    console.log("Modules", modules)
    if (modules && modules.length > 0) {
      let labelsWrapper = document.createElement("div");
      labelsWrapper.classList.add("module-container");

      for (let t = 0; t < modules.length; t++) {
        let chipElement = document.createElement("a");
        chipElement.href = "https://github.com/dorazhao99/stanford-hci-ck/tree/main";
        chipElement.className = "chip";
        chipElement.classList.add("value-chip");
        chipElement.textContent = modules[t];     // TO-DO Query Store for the modules mapping to message
        chipElement.target = "_blank";
        labelsWrapper.appendChild(chipElement); 
      }

      const style = document.createElement("style");
      style.textContent = `
        .chip {
          background-color: #7091E6;
          font-size: .75rem;
          line-height: 20px;
          border-radius: 8px;
          padding: 0 1rem;
          height: 20px; 
          display: inline-block;
          margin: 0 0.5rem 0 0;
        }
        .chip:hover {
          background-color: #3D52A0;
        }
      `;
      document.head.appendChild(style);
      element.parentNode!.appendChild(labelsWrapper);
    }
    return new Promise((resolve, reject) => {
      resolve(null)
    })
  })
}

function observeMessages() {
  const mainElement = document.querySelector('main');

  if (mainElement) {
    const config = { childList: true, subtree: true };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check if the node added is a chat message
          console.log('Node', node.nodeType, node.classList)
          if (node.nodeType === 1 && node.classList.contains('markdown')) { 
            console.log("inject chips")
            injectChips(node)
          }
        });
      });
    });

    observer.observe(mainElement, config);
  }
}

document.addEventListener('DOMContentLoaded', observeMessages);


window.addEventListener("msgAvailable", (ev: Event) => {
  const customEvent = ev as CustomEvent;
  let dom = customEvent.detail.DOM;
  let id = customEvent.detail.id
  // console.log('dom', dom)
  if (!dom.hasAttribute("data-has-modules")) {
    dom.setAttribute("data-has-modules", "TRUE");
    let labelsWrapper = document.createElement("div");
    labelsWrapper.classList.add("module-container");
    browser.storage.sync.get(id).then((result) => {
      console.log('browser storage', result)
      if (id in result) {
        console.log('id in result', result[id])
        result[id].forEach(module => {
          console.log('module', module)
          let chipElement = document.createElement("a");
          chipElement.href = "https://github.com/dorazhao99/stanford-hci-ck/tree/main";
          chipElement.className = "chip";
          chipElement.classList.add("value-chip");
          chipElement.textContent = module;     // TO-DO Query Store for the modules mapping to message
          chipElement.target = "_blank";
          labelsWrapper.appendChild(chipElement); 
        })
      }
    })
    

    const style = document.createElement("style");
    style.textContent = `
      .chip {
        background-color: #7091E6;
        font-size: .75rem;
        line-height: 20px;
        border-radius: 8px;
        padding: 0 1rem;
        height: 20px; 
        display: inline-block;
      }
      .chip:hover {
        background-color: #3D52A0;
      }
    `;
    document.head.appendChild(style);
    dom.parentNode!.appendChild(labelsWrapper);
  }
  // const tweetValues = (store.state as any).tweetValues.tweetValues[tweetId];
  // const addChip = (store.state as any).controlViews.showChip;
  // // console.log('Add Chip', addChip)
  // // console.log('looking for id', tweetId)
  // // console.log('tweet values are:', tweetValues, tweetDOM)
  // if (tweetValues && addChip)
  //   domHelpers.addLabelsToTweet(tweetValues, tweetDOM);
});

(() => {
  console.info("[vitesse-webext] Hello world from content script");
  console.info("New Context")
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("request incoming to content script", request);
    passKnowledge(request);
    if (request.type === "open_popup") {
      browser.action.openPopup();
    }
    if (request.type === "get_store_variable") {
      return new Promise((resolve, reject) => {
        resolve(null);
      });
    } else if (request.type === "dispatch_store_action") {
      return new Promise((resolve, reject) => {
        resolve(null);
      });
    } else if (request.type === "access_store_getter") {
      return new Promise((resolve, reject) => {
        resolve(null);
      });
    }
  });
  // communication example: send previous tab title from background page
  // onMessage("tab-prev", ({ data }) => {
  //   console.log(`[vitesse-webext] Navigate from page "${data}"`);
  // });

  // // mount component to context window
  // const container = document.createElement("div");
  // const root = document.createElement("div");
  // const styleEl = document.createElement("link");
  // const shadowDOM =
  //   container.attachShadow?.({ mode: __DEV__ ? "open" : "closed" }) ||
  //   container;
  // styleEl.setAttribute("rel", "stylesheet");
  // styleEl.setAttribute(
  //   "href",
  //   browser.runtime.getURL("dist/contentScripts/style.css")
  // );
  // shadowDOM.appendChild(styleEl);
  // shadowDOM.appendChild(root);
  // document.body.appendChild(container);

  // ReactDOM.render(
  //   <React.StrictMode>
  //     <ContentApp />
  //   </React.StrictMode>,
  //   root
  // );
})();

