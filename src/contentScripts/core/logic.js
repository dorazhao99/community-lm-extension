// import browser from "webextension-polyfill";

let firstScroll = true;
let prevScrollHeight;
let scrollCount = 0;

const RequestVariables = {
    knowledge: ['CS 547 is from 11:30-12:30 on Fridays'],
    promptHeader: 'Here is additional knowledge that be useful for the prompt. Disregard the knowledge if not relevant.\nKnowledge:'
  }

  
// window.addEventListener("change_prompt", function (evt) {
//     browser.storage.sync.get(["knowledge"]).then((result) => {
//         console.log("Value is " + result.key);
//         console.log(evt)
//         const options = JSON.parse(evt.detail.options)
//         console.log(options)
//         const newBody = JSON.parse(options.body)
//         const message = newBody.messages[0].content.parts
//         const combinedKnowledge = `${RequestVariables.promptHeader} ${RequestVariables.knowledge.join('\n')}`;
//         const newMessage = [combinedKnowledge, ...message]
//         console.log(newMessage)
//         newBody.messages[0].content.parts = newMessage
//         newBody.customFetch = true
//         newBody.originalMessage = message
//         const modifiedOptions = {
//             ...options,
//             body: JSON.stringify(newBody),
//         }
//         const event = new CustomEvent("send_prompt",
//             {
//                 detail: {
//                     resource: evt.detail.resource, 
//                     modifiedOptions: JSON.stringify(modifiedOptions), 
//                     originalPrompt: message[0]
//                 }
//             });

//         window.dispatchEvent(event);
//     });
// }, false);
