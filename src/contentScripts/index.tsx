/* eslint-disable no-console */
import React from "react";
import ReactDOM from "react-dom";
import { onMessage } from "webext-bridge";
import browser from "webextension-polyfill";
import { ContentApp } from "./views/ContentApp";

const RequestVariables = {
  knowledge: ['CS 547 is from 11:30-12:30 on Fridays'],
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

