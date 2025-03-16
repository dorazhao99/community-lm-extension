/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";
import { routeDocumentsEmbedding, routeDocumentsEmbeddingChunks, getConversationId } from "./utils";
import constants from "~/services/constants";

// global variable for which modules are injected 
interface Cache {
  [key: string]: boolean;
}

var prevURL:string = ""; 
var url: string=""; 
var activatedChips:Array<Object> = []
var relevanceScores:Array<Object> = []
var seenKnowledge:Cache = {}
var prevMessage = ""

// CSS for chip
const RequestVariables = {
  promptHeader: `
    You are a helpful and knowledgeable assistant that provides answers to a user's query.
    \n We provide additional knowledge that might be helpful for answering the query.
    Let's think step by step. 
    1. Check whether the knowledge is relevant to the query. If the knowledge is relevant, incorporate it when answering.
    2. If the knowledge is NOT relevant, disregard the knowledge, do NOT make reference to it, and answer the query. Ignore information that is irrelevant. Do NOT search the web if you have sufficient knowledge.\n
    3. Check whether there are conflicts in the knowledge. Report conflicts in the output if they exist.
    \nKnowledge:<cllm>`,
  promptHeaderChunk: `
    <KNOLL> You are a helpful and knowledgeable assistant that provides answers to a user's query.
    \n We provide additional knowledge that might be helpful for answering the query. Ignore information that is irrelevant.
    Let's think step by step. 
    1. Check whether the knowledge is relevant to the query. If the knowledge is relevant, incorporate it when answering.
    If the knowledge is NOT relevant, disregard the knowledge, do NOT make reference to it, and answer the query. Do NOT search the web if you have sufficient knowledge.\n
    2. Check whether there are conflicts in the knowledge. Report conflicts in the output if they exist.
    \nKnowledge:<cllm>`
}

const ALPHA_SCALE = 1.2 // scales the alpha of the chips

// function createPrompt(result) {
//   const allKnowledge:any = []
//   activatedChips = []
//   Object.keys(result).forEach(mod => {
//     activatedChips.push(result[mod])
//     allKnowledge.push(result[mod].knowledge)
//   })
//   return allKnowledge.join("\n")
// }

function createChips(modules:any, scores:any) {
  activatedChips = []
  relevanceScores = []
  Object.keys(modules).forEach(mod => {
    let chipScore;
    try {
      chipScore = scores[mod] * ALPHA_SCALE
    } catch {
      chipScore = 0.3
    }
    activatedChips.push({id: mod, ...modules[mod]})
    relevanceScores.push(chipScore)
  })
}

window.addEventListener("change_prompt_chunk", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
    url = window.location.href
    console.log(url, prevURL)
    if (url !== prevURL) {
      const gptPattern = /^https:\/\/chatgpt\.com\/c\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      const claudePattern = /^https:\/\/claude\.ai\/chat\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      
      // New chat window --> reset
      if (gptPattern.test(prevURL) || claudePattern.test(prevURL)) {
        seenKnowledge = {}
        prevMessage = ''
      }
    }

    if ("knowledge" in result) {
      browser.storage.sync.set({"modules": Object.keys(result["knowledge"])}).then(() => {
        return new Promise((resolve, reject) => {
          resolve(null)
        })
      });
    }

    const options = JSON.parse(evt.detail.options)
    const newBody = JSON.parse(options.body)
    const origin = evt.detail.origin

    const message = newBody.messages[0].content.parts
    const messageId = newBody.messages[0].id
    const conversationId = newBody?.parent_message_id
    const originalPrompt = message[0]

    routeDocumentsEmbeddingChunks(result["knowledge"], message, prevMessage, seenKnowledge)
    .then((response:any) => {
      const moduleNames = response.modules
      let newMessage = [...message]
      prevMessage = newMessage.join(' ')

      if (moduleNames.length === 0) {
        activatedChips = []
        relevanceScores = []
      } 

      let knowledge = '';
      if (response.knowledge) {
        knowledge = response.knowledge
        seenKnowledge = response.seenKnowledge
        console.log('seenKnowledge chunk', seenKnowledge)
        createChips(response.modules, response.scores)
      }

      const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
      newMessage = [combinedKnowledge, ...message]
      newBody.messages[0].content.parts = newMessage
      newBody.customFetch = true

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

      const messageData = {
        message: message,
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
      console.error(error)
      newBody.messages[0].content.parts = [message.toString()]
      newBody.customFetch = true
      
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

window.addEventListener("change_prompt", function (evt) {
  browser.storage.local.get("knowledge").then((result) => {
    url = window.location.href
    if (url !== prevURL) {
      const gptPattern = /^https:\/\/chatgpt\.com\/c\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
      const claudePattern = /^https:\/\/claude\.ai\/chat\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

      // New window --> reset seen knowledge and previous message
      if (gptPattern.test(prevURL) || claudePattern.test(prevURL)) {
        seenKnowledge = {}
        prevMessage = ''
      }
    }

    prevURL = url

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

    const message = origin === 'openai' ? newBody.messages[0].content.parts : newBody.prompt
    const messageId = origin === 'openai' ? newBody.messages[0].id : newBody.parent_message_uuid
    const conversationId = origin === 'openai' ? newBody?.parent_message_id : getConversationId()
    const originalPrompt = origin === 'openai' ? message[0] : message

    console.log('seenKnowledge', seenKnowledge)
    routeDocumentsEmbedding(result["knowledge"], message, prevMessage, origin, seenKnowledge)
    .then((response:any) => {
        console.log('route', response)
        let moduleNames = [];
        let scores = []; 
        let newMessage = origin === 'openai' ? [...message] : message
        prevMessage = origin === 'openai' ? newMessage.join(' ') : newMessage
        console.log('Previous Message', prevMessage)
        
        if (response.modules) {
          let knowledge = '';
          if (Object.keys(response.modules).length === 0) {
            activatedChips = []
            relevanceScores = []
          } 
          
          if (response.knowledge) {
            moduleNames = response.modules
            knowledge = response.knowledge
            scores = response.scores
            seenKnowledge = response.seenKnowledge
            console.log('seenKnowledge 2', seenKnowledge)
            createChips(response.modules, scores)
          } 

          const combinedKnowledge = `${RequestVariables.promptHeader} ${knowledge}</cllm>`;
          if (origin === 'openai') {
            newMessage = [combinedKnowledge, ...message]
            newBody.messages[0].content.parts = newMessage
            newBody.customFetch = true
          } else if (origin === 'claude') {
            newMessage = `<KNOLL> ${combinedKnowledge} ${message}`
            newBody.prompt = newMessage
          }
        } else {
          if (origin === 'openai') {
            newBody.customFetch = true
          } else if (origin === 'claude') {
            newMessage = `<KNOLL> ${message}`
            newBody.prompt = newMessage
          }
        }

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
            }
        );

        const messageData = {
          message: message,
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
      console.log('Origin', evt.detail.origin)
      if (evt.detail.origin === 'openai') {
        newBody.messages[0].content.parts = [message.toString()]
        newBody.customFetch = true
      } else {
        newBody.prompt = `<KNOLL> ${message}`
      }

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
          })
      ;

      window.dispatchEvent(event);
      browser.runtime.sendMessage({
        type: "sent_message",
      })
    })
  });
}, false);

async function addSurvey() {
  const localData = await browser.storage.local.get()
  const currentDate = new Date()
  const showSurveyDate = localData.showSurveyDate ? new Date(localData.showSurveyDate) : new Date()
  const seenSurvey = localData.seenSurvey ? localData.seenSurvey : 0
  const syncData = await browser.storage.sync.get("uid")
  const uid = syncData?.uid 
  if (currentDate >= showSurveyDate && seenSurvey <= 5 && uid) {
      // add HTML for survey
      const box = document.createElement("div");
      box.innerText = "Thank you for using Knoll! The Stanford HCI team is running an evaluation of your experience using the system through a <10 minute survey and optional interview. You will receive a $10 gift card for completing the survey.";
      box.style.position = "fixed";
      box.style.top = "10px";
      box.style.left = "50%";
      box.style.transform = "translateX(-50%)";
      box.style.backgroundColor = "white";
      box.style.color = "black";
      box.style.padding = "10px 20px";
      box.style.fontSize = "16px";
      box.style.fontWeight = "bold";
      box.style.border = "1px solid black";
      box.style.borderRadius = "5px";
      box.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.2)";
      box.style.zIndex = "9999";
      box.style.display = "flex";
      box.style.flexDirection="column";
      box.style.alignItems = "center";
      box.style.gap = "10px";
  
      let button = document.createElement("a");
      button.href = `${constants.URL}/survey-signup/${uid}`
      button.className = "button";
      button.textContent = "Sign Up";
      button.target = "_blank";
      button.style.backgroundColor = "#7091E6";
      button.style.padding = "0.5rem 1rem";
      button.style.borderRadius="12px";
      button.style.color="white"
      box.appendChild(button); 
  
      const closeButton = document.createElement("button");
      closeButton.innerText = "✖";
      closeButton.style.background = "white";
      closeButton.style.color = "white";
      closeButton.style.border = "none";
      closeButton.style.padding = "12px";
      closeButton.style.cursor = "pointer";
      closeButton.style.fontSize = "14px";
      closeButton.style.borderRadius = "50%";
      closeButton.style.position = "absolute";
      closeButton.style.top = "5px";
      closeButton.style.right = "5px";
  
      // Add click event to remove the box
      closeButton.onclick = () => {
          box.remove();
      };
      box.appendChild(closeButton);
      document.body.appendChild(box);
      browser.storage.local.set({"seenSurvey": seenSurvey + 1})
  }
}

function injectChips(element:any) {
  let labelsWrapper = document.createElement("div");
  labelsWrapper.classList.add("module-container");
  console.log('Relevance', relevanceScores)
  activatedChips.forEach((chip, idx) => {
      const name = chip.name ? chip.name: "Unnamed Module"
      let chipWrapper = document.createElement("div")
      let chipElement = document.createElement("a");
      chipElement.href = chip.link ? chip.link : "";
      chipElement.classList.add("value-chip");
      chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
      chipElement.target = "_blank";
      chipWrapper.appendChild(chipElement)
  
      if (chip.id !== 'personal') {
        const closeButton = document.createElement("button");
        closeButton.innerText = "✖";
        closeButton.style.color = "white";
        closeButton.style.border = "none";
        closeButton.style.padding = "0 8px";
        closeButton.style.cursor = "pointer";
        closeButton.style.fontSize = "8px";
        closeButton.style.borderRadius = "50%";
        closeButton.onclick = () => {
          console.log('Removed chip', chip)
          browser.runtime.sendMessage({
            type: "remove_chip",
            data: {module: chip, score: relevanceScores[idx]}
          })
          .then(response => {
            if (response.success) {
              chipWrapper.remove();
            }
          })
        };
        chipWrapper.appendChild(closeButton);
      }
      chipWrapper.className = "chip";
      chipWrapper.style.backgroundColor = `rgba(112, 145, 230, ${relevanceScores[idx]})`; 
      labelsWrapper.appendChild(chipWrapper); 
  })

  const style = document.createElement("style");
  style.textContent = `
    .chip {
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

function observeMessages() {
  activatedChips = [] // Reset chips when loading new page. 
  const location = window.location.href

  if (location.includes('chatgpt.com') || location.includes('chat.com')) {
    if (window.location.pathname === '/') {
      addSurvey()
    }
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const config = { childList: true, subtree: true };
      // let addedChip = false
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            // Check if the node added is a chat message
            if (node.nodeType === 1) {
              const attributes = node.attributes ? node.attributes : undefined
              // if (node.classList && node.classList.contains('markdown') && !addedChip) {
              //   addedChip = true
              //   console.log('Chip 2', node)
              //   injectChips(node)
              // } 
              if (attributes) {
                const namedValue = attributes.getNamedItem("data-message-author-role");
                if (namedValue) {
                  if (namedValue.value === "assistant") {
                    injectChips(node)
                  }
                }
              } 
            }
          });
        });
      });
      observer.observe(mainElement, config);
    }
  }
  else if (location.includes('claude.ai')) {
    if (window.location.pathname === '/' || window.location.pathname === '/new') {
      addSurvey()
    }
    function appendDivToNewX(targetDiv) {
      let labelsWrapper = document.createElement("div");
      labelsWrapper.classList.add("module-container");

      activatedChips.forEach((chip, idx) => {
        const name = chip.name ? chip.name: "Unnamed Module"
        let chipWrapper = document.createElement("div")
        let chipElement = document.createElement("a");
        chipElement.href = chip.link ? chip.link : "";
        chipElement.classList.add("value-chip");
        chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
        chipElement.target = "_blank";
        chipWrapper.appendChild(chipElement)
    
        if (chip.id !== 'personal') {
          const closeButton = document.createElement("button");
          closeButton.innerText = "✖";
          closeButton.style.color = "white";
          closeButton.style.border = "none";
          closeButton.style.padding = "0 8px";
          closeButton.style.cursor = "pointer";
          closeButton.style.fontSize = "8px";
          closeButton.style.borderRadius = "50%";
          closeButton.onclick = () => {
            console.log('Removed chip', chip)
            browser.runtime.sendMessage({
              type: "remove_chip",
              data: {module: chip, score: relevanceScores[idx]}
            })
            .then(response => {
              if (response.success) {
                chipWrapper.remove();
              }
            })
          };
          chipWrapper.appendChild(closeButton);
        }
        chipWrapper.className = "chip";
        chipWrapper.style.backgroundColor = `rgba(112, 145, 230, ${relevanceScores[idx]})`; 
        labelsWrapper.appendChild(chipWrapper); 
      })

      const style = document.createElement("style");
      style.textContent = `
        .chip {
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
                // Check added nodes for the class 'X'
                if (mutation.target.className.includes('font-claude-message') && !addedChip) {
                  mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      appendDivToNewX(node)
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