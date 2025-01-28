/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";
import { routeDocuments } from "./router";


// global variable for which modules are injected 
interface Cache {
  [key: string]: boolean;
}

var prevURL:string = ""; 
var url: string=""; 
var activatedChips:Array<Object> = []
var seenChips:Cache = {}

// CSS for chip
const RequestVariables = {
  promptHeader: `
    You are a helpful and knowledgeable assistant that provides answers to a user's query.
    \n We provide additional knowledge that might be helpful for answering the query.
    Let's think step by step. 
    1. Check whether the knowledge is relevant to the query. If the knowledge is relevant, incorporate it when answering.
    If the knowledge is NOT relevant, disregard the knowledge, do NOT make reference to it, and answer the query.\n
    2. Check whether there are conflicts in the knowledge. Report conflicts in the output if they exist.
    \nKnowledge:<cllm>`
}

// Firefox `browser.tabs.executeScript()` requires scripts return a primitive value
// function passKnowledge(knowledge) {
//   const knowledgeEvent = new CustomEvent('setKnowledge',
//     {
//       detail: {
//         knowledge: ['test']
//       },
//     })
//   console.log('Pass Knowledge', knowledge)
//   window.dispatchEvent(knowledgeEvent)
// }

function createPrompt(result) {
  const allKnowledge:any = []
  activatedChips = []
  Object.keys(result).forEach(mod => {
    activatedChips.push(result[mod])
    if (!(mod in seenChips)) {
      allKnowledge.push(result[mod].knowledge)
      seenChips[mod] = true
    }
  })
  return allKnowledge.join("\n")
}


window.addEventListener("change_prompt", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
    console.log("Result", result)
    url = window.location.href
    if (url !== prevURL || url.includes("chatgpt.com") || url.includes("claude.ai")) {
      seenChips = {}
      prevURL = url
    }

    if ("knowledge" in result) {
      browser.storage.sync.set({"modules": Object.keys(result["knowledge"])}).then(() => {
        return new Promise((resolve, reject) => {
          resolve(null)
        })
      });
    }

    // Update prompt with knowledge 
    const options = JSON.parse(evt.detail.options)
    const newBody = JSON.parse(options.body)
    const origin = evt.detail.origin
    console.log('New Body', newBody)

    const message = origin === 'openai' ? newBody.messages[0].content.parts : newBody.prompt
    const messageId = origin === 'openai' ? newBody.messages[0].id : newBody.parent_message_uuid
    const conversationId = origin === 'openai' ? newBody?.parent_message_id : ""

    // TODO GET MESSAGE ID AND CONVO ID
    const originalPrompt = origin === 'openai' ? message[0] : message

    routeDocuments(result["knowledge"], message)
    .then((relevantDocs:any) => {
      const moduleNames = Object.keys(relevantDocs)

      console.log('Relevant Docs', relevantDocs)
      let newMessage = origin === 'openai' ? [...message] : message

      if (Object.keys(relevantDocs).length === 0) {
        activatedChips = []
      } else {
        const knowledge = createPrompt(relevantDocs)
        const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
        if (origin === 'openai') {
          newMessage = [combinedKnowledge, ...message]
          newBody.messages[0].content.parts = newMessage
          newBody.customFetch = true
        } else if (origin === 'claude') {
          newMessage = `<KNOLL> ${combinedKnowledge} ${message}`
          newBody.prompt = newMessage
        }
      }

      const modifiedOptions = {
          ...options,
          body: JSON.stringify(newBody),
      }
      console.log('newbody in index', newBody)
      const event = new CustomEvent("send_prompt",
          {
              detail: {
                  resource: evt.detail.resource, 
                  modifiedOptions: JSON.stringify(modifiedOptions), 
                  originalPrompt: originalPrompt
              }
          });

      const messageData = {
        modules: moduleNames,
        messageId: messageId,
        conversationId: conversationId,
        provider: origin
      }

      window.dispatchEvent(event);
      browser.runtime.sendMessage({
        type: "sent_message",
        data: messageData
      })
    })
    .catch((error) => {
      console.log(error)
      // Proceed as if no knowledge was added 
      if (origin === 'openai') {
        newBody.messages[0].content.parts = [message]
        newBody.customFetch = true
      } else {
        newBody.prompt = `<KNOLL> ${message}`
      }
      // newBody.originalMessage = message
      const modifiedOptions = {
          ...options,
          body: JSON.stringify(newBody),
      }
      const event = new CustomEvent("send_prompt",
          {
              detail: {
                  resource: evt.detail.resource, 
                  modifiedOptions: JSON.stringify(modifiedOptions), 
                  originalPrompt: originalPrompt
              }
          });

      window.dispatchEvent(event);
      browser.runtime.sendMessage({
        type: "sent_message",
      })
    })
  });
}, false);

function injectChips(element:any) {
  let labelsWrapper = document.createElement("div");
  labelsWrapper.classList.add("module-container");

  activatedChips.forEach((chip) => {
    const name = chip.name ? chip.name: "Unnamed Module"
    let chipElement = document.createElement("a");
    chipElement.href = chip.link ? chip.link : "";
    chipElement.className = "chip";
    chipElement.classList.add("value-chip");
    chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
    chipElement.target = "_blank";
    labelsWrapper.appendChild(chipElement); 
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

  // browser.storage.sync.get(["modules", "uid"]).then((result) => {
  //   console.log("Get Chip", result)
  //   if (result.uid) {
  //     const modules = result.modules 
  //     console.log("Modules", modules)
  //     if (modules && modules.length > 0) {
  //       let labelsWrapper = document.createElement("div");
  //       labelsWrapper.classList.add("module-container");

  //       // Render chips based off of activatedChip arary 
  //       activatedChips.forEach((chip) => {
  //         console.log('Chip', chip)
  //       })

  //       browser.storage.local.get("knowledge").then((result) => {
  //         let knowledge:any = {}
  //         if (result.knowledge) {
  //           knowledge = result.knowledge
  //         }
  //         for (let t = 0; t < modules.length; t++) {
  //           const moduleName:string = modules[t]
  //           console.log('chip knowledge', knowledge)
  //           let chipElement = document.createElement("a");
  //           chipElement.href = knowledge[moduleName] ? knowledge[moduleName].link : "";
  //           chipElement.className = "chip";
  //           chipElement.classList.add("value-chip");
  //           chipElement.textContent = knowledge[moduleName].name;     // TO-DO Query Store for the modules mapping to message
  //           chipElement.target = "_blank";
  //           labelsWrapper.appendChild(chipElement); 
  //         }
  //       })

        
  //       const style = document.createElement("style");
  //       style.textContent = `
  //         .chip {
  //           background-color: #7091E6;
  //           font-size: .75rem;
  //           line-height: 20px;
  //           border-radius: 8px;
  //           padding: 0 1rem;
  //           height: 20px; 
  //           display: inline-block;
  //           margin: 0 0.5rem 0 0;
  //         }
  //         .chip:hover {
  //           background-color: #3D52A0;
  //         }
  //       `;
  //       document.head.appendChild(style);
  //       element.parentNode!.appendChild(labelsWrapper);
  //     }
  //   }
  //   return new Promise((resolve, reject) => {
  //     resolve(null)
  //   })
  // })
}

function observeMessages() {
  activatedChips = [] // Reset chips when loading new page. 
  const location = window.location.href
  console.log(location)
  if (location.includes('chatgpt.com')) {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const config = { childList: true, subtree: true };
  
      const observer = new MutationObserver((mutations) => {
        // console.log('All Mutations', mutations)
        mutations.forEach((mutation) => {
          let addedChip = false
          mutation.addedNodes.forEach((node) => {
            // console.log('Node', node)
            // console.log('Mutation', mutation)
            // Check if the node added is a chat message
            if (node.nodeType === 1) {
              const attributes = node.attributes ? node.attributes : undefined
              if (attributes) {
                const namedValue = attributes.getNamedItem("data-message-author-role");
                if (namedValue) {
                  // console.log('Named Value', namedValue)
                  if (namedValue.value === "assistant" && !addedChip) {
                    // console.log('Mutation', mutation)
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
  else if (window.location.href.includes('claude.ai')) {
    console.log('Claude inject')
    function appendDivToNewX(targetDiv) {
      // injectChips(targetDiv)
      // const newDiv = document.createElement('div');
      // newDiv.textContent = 'Appended div'; // Customize the content of the new div
      // targetDiv.appendChild(newDiv);

      let labelsWrapper = document.createElement("div");
      labelsWrapper.classList.add("module-container");

      activatedChips.forEach((chip) => {
        console.log('Inject chip', chip)
        const name = chip.name ? chip.name: "Unnamed Module"
        let chipElement = document.createElement("a");
        chipElement.href = chip.link ? chip.link : "";
        chipElement.className = "chip";
        chipElement.classList.add("value-chip");
        chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
        chipElement.target = "_blank";
        labelsWrapper.appendChild(chipElement); 
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
      targetDiv.appendChild(labelsWrapper);
    }
  
    // Observer callback function to monitor mutations
    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            let addedChip = false
            if (mutation.type === 'childList') {
                console.log(mutation)
                // Check added nodes for the class 'X'
                if (mutation.target.className.includes('font-claude-message') && !addedChip) {
                  console.log(mutation)
                  mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      appendDivToNewX(node)
                      // console.log('Inject')
                      // addedChip = true
                      // injectChips(node)
                    }
                  });
                }
            }
        }
    };
    
    // Set up the observer
    const observer = new MutationObserver(observerCallback);
    
    // Start observing the document body for child node additions
    observer.observe(document.body, {
        childList: true, // Monitor direct children being added/removed
        subtree: true    // Monitor changes within all descendants
    });
  }
}

document.addEventListener('DOMContentLoaded', observeMessages);
(() => {
  console.info("[vitesse-webext] Hello world from content script");
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("request incoming to content script", request);
    // passKnowledge(request);
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

