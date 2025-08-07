/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";
import { routeDocumentsEmbedding, routeDocumentsEmbeddingChunks, getConversationId } from "./utils";
import constants from "~/services/constants";

var prevURL:string = ""; 
var url: string=""; 
var prevMessage = "" // Keep track of previous messages in case you want to include it when generating the new prompt
var originalPrompt = ""
var activatedChips:Array<Object> = []

// CSS for chip
const RequestVariables = {
  promptHeader: ``,
  promptHeaderChunk: ``
}

window.addEventListener("change_prompt_chunk", function (evt) {
    /*
      This event is emitted when the user is on the free version of ChatGPT -- note here you have
      much smaller context windows you can inject into the message
    */
    url = window.location.href

    // Keep track of what the previous URL is in case you only want to inject the prompt once
    if (url !== prevURL) {
        prevMessage = ''
    }
    prevURL = url 
    
    const options = JSON.parse(evt.detail.options)
    const newBody = JSON.parse(options.body)
    const origin = evt.detail.origin
    console.log('Options', options)
    const message = newBody.messages[0].content.parts
    const messageId = newBody.messages[0].id
    const conversationId = newBody?.parent_message_id
    originalPrompt = message[0]

    let newMessage = [...message]
    /*
      TODO: Change to your prompt or query an API that will provide you with the prompt you need
      See utils.tsx for example of how to query an API
    */
    const newPrompt = "Respond to the message as if you are a pirate"
    newMessage = [newPrompt, ...message]
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
      messageId: messageId,
      conversationId: conversationId,
      provider: origin
    }

    window.dispatchEvent(event);
    browser.runtime.sendMessage({
        type: "sent_message",
        data: messageData
    })
}, false);

window.addEventListener("change_prompt", function (evt) {
    /*
      This event is emitted when the user is on the paid version of ChatGPT / Claude -- note here you have
      a larger context windows you can inject into the message
    */
    url = window.location.href
    const gptPattern = /^https:\/\/chatgpt\.com\/c\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    const claudePattern = /^https:\/\/claude\.ai\/chat\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

    // Optional: If we are not currently in a chat window, we are starting something new
    if (!gptPattern.test(url) && evt.detail.origin === 'openai') {
      prevMessage = ''
    } else if (!claudePattern.test(url) && evt.detail.origin === 'claude')  {
      prevMessage = ''
    }
    else if (url !== prevURL) {
      // coming out of a chat window into a new chat
      if (gptPattern.test(prevURL) || claudePattern.test(prevURL)) {
        prevMessage = ''
      }
    }

    prevURL = url

    // Update prompt with injected information
    const options = JSON.parse(evt.detail.options)
    const newBody = JSON.parse(options.body)
    const origin = evt.detail.origin

    const message = origin === 'openai' ? newBody.messages[0].content.parts : newBody.prompt
    const messageId = origin === 'openai' ? newBody.messages[0].id : newBody.parent_message_uuid
    const conversationId = origin === 'openai' ? newBody?.parent_message_id : getConversationId()
    originalPrompt = origin === 'openai' ? message[0] : message
    
    let newMessage = origin === 'openai' ? [...message] : message
    prevMessage = origin === 'openai' ? newMessage.join(' ') : newMessage
    /*
      TODO: Change to your prompt or query an API that will provide you with the prompt you need
      See utils.tsx for example of how to query an API
    */
    const newPrompt = "Respond to the message as if you are a pirate" 
    if (origin === 'openai') {
      newMessage = [newPrompt, ...message]
      newBody.messages[0].content.parts = newMessage
      newBody.customFetch = true
    } else if (origin === 'claude') {
      newMessage = `<cllm> ${newPrompt} </cllm> ${message}`
      newBody.prompt = newMessage
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
      messageId: messageId,
      conversationId: conversationId,
      provider: origin
    }

    window.dispatchEvent(event);
    browser.runtime.sendMessage({
      type: "sent_message",
      data: messageData
    })
}, false);

async function addSurvey() {
  const localData = await browser.storage.local.get()
  let showCondition = false
  if (showCondition) {
      // add HTML for survey
      const box = document.createElement("div");
      box.innerText = "This is an inline survey.";
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
  }
}

function injectChips(element:any) {
  let labelsWrapper = document.createElement("div");
  labelsWrapper.classList.add("module-container");
  activatedChips = ['Test']
  activatedChips.forEach((chip, idx) => {
        const name = 'Chip Name'
        let chipWrapper = document.createElement("div")
        let chipElement = document.createElement("a");
        chipElement.classList.add("value-chip");
        chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
        chipElement.target = "_blank";
        chipWrapper.appendChild(chipElement)
        chipWrapper.className = "chip";
        chipWrapper.style.backgroundColor = `rgba(112, 145, 230, 1)`; 
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
      // addSurvey() // Uncomment if you want to add an inline survey each time you open a new page
    }
    const mainElement = document.querySelector('main');
    if (mainElement) {
      const config = { childList: true, subtree: true };
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            // Check if the node added is a chat message
            if (node.nodeType === 1) {
              const attributes = node.attributes ? node.attributes : undefined
              if (attributes) {
                const namedValue = attributes.getNamedItem("data-message-author-role");
                if (namedValue) {
                  if (namedValue.value === "assistant") {
                    injectChips(node) // Uncomment if you want to add interface chips at the bottom of each message
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
      // addSurvey() // Uncomment if you want to add an inline survey each time you open a new page
    }
    function appendDivToNewX(targetDiv) {
      let labelsWrapper = document.createElement("div");
      labelsWrapper.classList.add("module-container");
      let activatedChips = ['Test']
      activatedChips.forEach((chip, idx) => {
        const name = 'Chip Name'
        let chipWrapper = document.createElement("div")
        let chipElement = document.createElement("a");
        chipElement.classList.add("value-chip");
        chipElement.textContent = name;     // TO-DO Query Store for the modules mapping to message
        chipElement.target = "_blank";
        chipWrapper.appendChild(chipElement)
        chipWrapper.className = "chip";
        chipWrapper.style.backgroundColor = `rgba(112, 145, 230, 1)`; 
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
                      // appendDivToNewX(node) // Uncomment if you want to add interface chips to Claude
                    }
                  });
                }
            }
        }
    };
    
    // Set up the observer
    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, {
        childList: true, 
        subtree: true 
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
})();