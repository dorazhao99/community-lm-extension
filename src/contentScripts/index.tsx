/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";
import { routeDocuments, routeDocumentsEmbedding } from "./router";


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

window.addEventListener("change_prompt_xhr", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
    console.log("Result", result)
    url = window.location.href
    if (url !== prevURL || url.includes("deepseek.com")) {
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
    const newBody = JSON.parse(evt.detail.body)
    console.log('New Body', newBody, evt.detail.body)

    const message = newBody.prompt
    const messageId = origin === newBody?.parent_message_uuid
    const conversationId = origin === newBody?.chat_session_id
    const originalPrompt = message

    routeDocumentsEmbedding(result["knowledge"], message)
    .then((relevantDocs:any) => {
      const moduleNames = Object.keys(relevantDocs)

      console.log('Relevant Docs', relevantDocs)
      let newMessage = message

      if (Object.keys(relevantDocs).length === 0) {
        activatedChips = []
      } 
      
      const knowledge = createPrompt(relevantDocs)
      const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
      newMessage = `<KNOLL> ${combinedKnowledge} ${message}`
      newBody.prompt = newMessage

      console.log('newbody in index', newBody)
      const event = new CustomEvent("send_prompt_xhr",
          {
              detail: {
                  modifiedOptions: JSON.stringify(newBody), 
                  originalPrompt: originalPrompt
              }
          });

      const messageData = {
        modules: moduleNames,
        messageId: messageId,
        conversationId: conversationId,
        provider: evt.detail.origin
      }

      window.dispatchEvent(event);
      browser.runtime.sendMessage({
        type: "sent_message",
        data: messageData
      })
    })
    .catch((error) => {
      console.log(error)
      newBody.prompt = `<KNOLL> ${message}`
      const event = new CustomEvent("send_prompt_xhr",
        {
            detail: {
                modifiedOptions: JSON.stringify(newBody), 
                originalPrompt: originalPrompt
            }
        });

      window.dispatchEvent(event);

      const messageData = {
        modules: [],
        messageId: messageId,
        conversationId: conversationId,
        provider: origin
      }

      browser.runtime.sendMessage({
        type: "sent_message",
        data: messageData
      })
    })
  });
}, false);


window.addEventListener("change_prompt", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
    console.log("Result", result)
    url = window.location.href
    if (url !== prevURL || url.includes("chatgpt.com") || url.includes("claude.ai") || url.includes("deepseek.com")) {
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
    console.log('New Body', newBody,)

    const message = origin === 'openai' ? newBody.messages[0].content.parts : newBody.prompt
    const messageId = origin === 'openai' ? newBody.messages[0].id : newBody.parent_message_uuid
    const conversationId = origin === 'openai' ? newBody?.parent_message_id : ""

    // TODO GET MESSAGE ID AND CONVO ID
    const originalPrompt = origin === 'openai' ? message[0] : message

    routeDocumentsEmbedding(result["knowledge"], message)
    .then((relevantDocs:any) => {
      const moduleNames = Object.keys(relevantDocs)

      console.log('Relevant Docs', relevantDocs)
      let newMessage = origin === 'openai' ? [...message] : message

      let knowledge; 
      let combinedKnowledge = ''; 

      if (Object.keys(relevantDocs).length === 0) {
        activatedChips = []
      } else {
        knowledge = createPrompt(relevantDocs)
        combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
      }
      
      if (origin === 'openai') {
        console.log('Message', message)
        
        
        newMessage = [combinedKnowledge, ...message]
        // make sure newMessage is not an array
        if (Array.isArray(newMessage[1])) {
          newMessage[1] = newMessage[1].join(' ')
        }
        newBody.messages[0].content.parts = newMessage
        newBody.customFetch = true
      } else if (origin === 'claude') {
        newMessage = `<KNOLL> ${combinedKnowledge} ${message}`
        newBody.prompt = newMessage
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
        if(typeof message === 'string') {
          newBody.messages[0].content.parts = [message]
        } else {
          newBody.messages[0].content.parts = message
        }
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

      const messageData = {
        modules: [],
        messageId: messageId,
        conversationId: conversationId,
        provider: origin
      }

      browser.runtime.sendMessage({
        type: "sent_message",
        data: messageData
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
      color: white; 
    }
    .chip:hover {
      background-color: #3D52A0;
      color: white; 
    }
  `;
  document.head.appendChild(style);
  element.parentNode!.appendChild(labelsWrapper);
}

function appendDivToNewX(targetDiv) {
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
      color: white; 
    }
    .chip:hover {
      background-color: #3D52A0;
      color: white; 
    }
  `;
  document.head.appendChild(style);
  targetDiv.appendChild(labelsWrapper);
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
              }
            }
          });
        });
      });
      observer.observe(mainElement, config);
    }
  }
  else if (location.includes('deepseek.com')) {
    console.log('Deepseek')
        
    // Observer callback function to monitor mutations
    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            let addedChip = false
            if (mutation.type === 'childList') {
                console.log(mutation)
                // Check added nodes for the class 'X'
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeType === 1 && node.className.includes('ds-markdown') && !addedChip) {
                    addedChip = true
                    injectChips(node)
                  }
                });

                // if (mutation.target.className === 'ds-flex' && !addedChip) {
                //   console.log(mutation)
                //   mutation.addedNodes.forEach(node => {
                //     if (node.nodeType === Node.ELEMENT_NODE) {
                //       appendDivToNewX(node)
                //     }
                //   });
                // }
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
  else if (window.location.href.includes('claude.ai')) {
    console.log('Claude inject')
     
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

