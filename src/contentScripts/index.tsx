/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";

// CSS for chip
const RequestVariables = {
  promptHeader: 'Here is additional knowledge. First, check whether the knowledge is useful to answer the query. If the knowledge is NOT usefule, disregard the knowledge and do NOT make reference to it when answering the prompt.\nKnowledge:<cllm>'
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
    allKnowledge.push(result[mod].knowledge)
  })
  return allKnowledge.join("\n")
}

window.addEventListener("change_prompt", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
      console.log("Result", result)
      /*
        TODO: ADD ROUTER TO FIGURE OUT WHICH KNOWLEDGE PICES
      */
      browser.storage.sync.set({"modules": Object.keys(result["knowledge"])}).then(() => {
        return new Promise((resolve, reject) => {
          resolve(null)
        })
      });

     // Update prompt with knowledge 
      const knowledge = createPrompt(result["knowledge"])
      console.log('Knowledge', knowledge)
      console.log(evt)
      const options = JSON.parse(evt.detail.options)
      console.log(options)
      const newBody = JSON.parse(options.body)
      const message = newBody.messages[0].content.parts
      const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
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
  browser.storage.sync.get(["modules", "uid"]).then((result) => {
    console.log("Get Chip", result)
    if (result.uid) {
      const modules = result.modules 
      console.log("Modules", modules)
      if (modules && modules.length > 0) {
        let labelsWrapper = document.createElement("div");
        labelsWrapper.classList.add("module-container");

        browser.storage.local.get("knowledge").then((result) => {
          let knowledge:any = {}
          if (result.knowledge) {
            knowledge = result.knowledge
          }
          for (let t = 0; t < modules.length; t++) {
            const moduleName:string = modules[t]
            console.log('chip knowledge', knowledge)
            let chipElement = document.createElement("a");
            chipElement.href = knowledge[moduleName] ? knowledge[moduleName].link : "";
            chipElement.className = "chip";
            chipElement.classList.add("value-chip");
            chipElement.textContent = knowledge[moduleName].name;     // TO-DO Query Store for the modules mapping to message
            chipElement.target = "_blank";
            labelsWrapper.appendChild(chipElement); 
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
            margin: 0 0.5rem 0 0;
          }
          .chip:hover {
            background-color: #3D52A0;
          }
        `;
        document.head.appendChild(style);
        element.parentNode!.appendChild(labelsWrapper);
      }
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
      // console.log('All Mutations', mutations)
      mutations.forEach((mutation) => {
        let addedChip = false
        mutation.addedNodes.forEach((node) => {
          console.log('Node', node)
          console.log('Mutation', mutation)
          // Check if the node added is a chat message
          if (node.nodeType === 1) {
            const attributes = node.attributes ? node.attributes : undefined
            if (attributes) {
              const namedValue = attributes.getNamedItem("data-message-author-role");
              if (namedValue) {
                console.log('Named Value', namedValue)
                if (namedValue.value === "assistant") {
                  console.log('Mutation', mutation)
                  console.log("inject chips", attributes)
                  addedChip = true
                  injectChips(node)
                }
              }
            } 
            if (node.classList && node.classList.contains('markdown') && !addedChip) {
              console.log('Mutation', mutation)
              console.log("inject chips", node.classList)
              addedChip = true
              injectChips(node)
            }
            if (node.classList.contains('composer-parent') && node.childNodes.length > 0 && !addedChip) {
              const childNode = node.childNodes[0]
              console.log('Child Node', childNode)
              // TODO: Add chip in here
              // injectChips(childNode)
            }
          }
        });
      });
    });

    observer.observe(mainElement, config);
  }
}

document.addEventListener('DOMContentLoaded', observeMessages);

(() => {
  console.info("[vitesse-webext] Hello world from content script");
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

