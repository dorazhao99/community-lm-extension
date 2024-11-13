console.log('FeedWizard enabled - Sampler Only')
// const RequestVariables = {
//   knowledge: ['CS 547 is from 11:30-12:30 on Fridays'],
//   promptHeader: 'Here is additional knowledge that be useful for the prompt. Disregard the knowledge if not relevant.\nKnowledge:'
// }

const originalFetch = window.fetch

// window.addEventListener(
//   'setKnowledge',
//   (ev) => {
//     RequestVariables.knowledge.push('The course is held in Gates B1')
//   },
//   false,
// );

function editString(inputString, originalMessage) {
  const lines = inputString.split('\n');
  const modifiedLines = [];
    lines.forEach(line => {
      try {
        if (line.startsWith('data: ')) {
            // Extract the JSON part
            const jsonString = line.substring(6).trim(); // Remove 'data: ' and trim spaces
            // Parse the JSON
            const jsonObject = JSON.parse(jsonString);
    
            // Check and modify the parts array if it exists
            if (jsonObject.v && jsonObject.v.message) {
              console.log('JSON Object', jsonObject.v)
              if (jsonObject.v.message.author) {
                const author = jsonObject.v.message.author.role
                console.log('Author', author)
                if (author === 'user' && jsonObject.v.message.content) {
                  console.log('Original Message', originalMessage)
                  if (originalMessage) {
                    jsonObject.v.message.content.parts = [originalMessage];
                  }
                }
              }
            }
            // Convert the modified object back to JSON string
            const modifiedJsonString = JSON.stringify(jsonObject);
            // Reconstruct the line
            modifiedLines.push(`data: ${modifiedJsonString}`);
        } else {
            // If it's not a data line, push it unchanged
            modifiedLines.push(line);
        }
      } catch {
        modifiedLines.push(line);
      }
  });
  
  // Join the modified lines back into a single string
  const modifiedString = modifiedLines.join('\n');
  // Output the modified string
  return modifiedString

}

function getMsgId(inputString) {
  const lines = inputString.split('\n');
  let id = ""
  lines.forEach(line => {
    try {
      if (line.startsWith('data: ')) {
          // Extract the JSON part
          const jsonString = line.substring(6).trim(); // Remove 'data: ' and trim spaces
          // Parse the JSON
          const jsonObject = JSON.parse(jsonString);
  
          // Check and modify the parts array if it exists
          if (jsonObject.v && jsonObject.v.message) {
            console.log('JSON Object', jsonObject.v)
            if (jsonObject.v.message.author) {
              const author = jsonObject.v.message.author.role
              if (author === 'assistant') {
                id = jsonObject.v.message.id
                return id
              }
            }
          }
      } 
    } catch {
      console.log("error")
    }
  })
  return id;
}


function sanitizeResponse(response) {
  console.log('Response', response)
  if (response.mapping) {
    const mapping = response.mapping 
    const newMapping = {...mapping}
    Object.keys(mapping).forEach(item => {
      if (mapping[item].message) {
        const author = item.message.author 
        if (author === 'user') {
          const content = item.message.content.parts 
          const updatedContent = []
          if (content.length > 1) {
            updatedContent.push(content[1]) // UPDATE if there is more than 2 parts
          }
          newMapping[item].message.content.parts = updatedContent
        }
      }
    })
    console.log(newMapping)
    response.mapping = newMapping
  }
  return response
}

window.fetch = async (...args) => {
  const [resource, options] = args
  const method = options.method
  console.log(method, resource)
  if (method === 'POST' && (resource.includes('backend-anon/conversation') || resource.includes('backend-api/conversation'))) {
    const newBody = JSON.parse(options.body)
    const customFetch = newBody.customFetch ? true : false 
    console.log('Custom Fetch', customFetch, 'args', args)
    if ('messages' in newBody && !customFetch) {
      console.log(resource, options)
      const event = new CustomEvent("change_prompt", {
          detail: {
              resource: resource,
              options: JSON.stringify(options)
          }
      });

      const promise = new Promise((resolve, reject) => {
        const handler = (evt) => {
          let modifiedOptions = JSON.parse(evt.detail.modifiedOptions)
          if ('signal' in modifiedOptions) {
            delete modifiedOptions['signal']
          }
          console.log('modified options', modifiedOptions)
          resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
        };
        window.addEventListener('send_prompt', handler)
        window.dispatchEvent(event);
      })
      
      const [url, modifiedBody, originalPrompt] = await promise; 
      console.log(resource, modifiedBody)
      const response = await fetch(resource, modifiedBody)
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');


      const modifiedStream = new ReadableStream({
          async pull(controller) {
          // Read from the original stream
          const { value, done } = await reader.read();
          console.log(done, value)
          if (done) {
              // Close the controller if done
              controller.close();
              return;
          }
          console.log('original', originalPrompt)
          const chunk = decoder.decode(value, { stream: true });
          const editedChunk = editString(chunk, originalPrompt)
          const messageId = getMsgId(chunk)
          console.log('Message ID', messageId)
          if (messageId.length > 0) {
            console.log("Found ID")
            const event = new CustomEvent("add_chip", {
              detail: {
                  id: messageId,
                  modules: ["547"]
              }
            });
            window.dispatchEvent(event);
          }
          // Encode the modified text back to a Uint8Array
          const modifiedValue = new TextEncoder().encode(editedChunk);

          // Enqueue the modified chunk
          controller.enqueue(modifiedValue);
          },
          cancel() {
          reader.cancel(); // Clean up the original stream
          }
      });
      console.log('Response fully received');       
      return new Response(modifiedStream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
      });
    }
    else {
      return originalFetch(...args)
    }
  }
  else if (method === 'GET' && (resource.includes('backend-anon/conversation/') || resource.includes('backend-api/conversation/'))) {
    const newBody = JSON.parse(options.body)
    const customFetch = newBody.customFetch ? true : false 
    console.log('Custom Fetch', customFetch)
    if (!newBody.customFetch) {
      newBody.customFetch = true
      const modifiedOptions = {
        ...options,
        body: JSON.stringify(newBody),
      }
      const response = await fetch(resource, modifiedOptions);
      const newResponse = sanitizeResponse(response)
      return new Response(newResponse, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }
  }
  else {
      // Call the original fetch function if no modifications are needed
      return originalFetch(...args)
  }
}


// console.log('FeedWizard enabled - Sampler Only')
// const RequestVariables = {
//   knowledge: ['CS 547 is from 11:30-12:30 on Fridays'],
//   promptHeader: 'Here is additional knowledge that be useful for the prompt. Disregard the knowledge if not relevant.\nKnowledge:'
// }

// const originalFetch = window.fetch

// window.addEventListener(
//   'setKnowledge',
//   (ev) => {
//     RequestVariables.knowledge.push('The course is held in Gates B1')
//   },
//   false,
// );

// function editString(inputString, originalMessage) {
//   const lines = inputString.split('\n');
//   const modifiedLines = [];
//     lines.forEach(line => {
//       try {
//         if (line.startsWith('data: ')) {
//             // Extract the JSON part
//             const jsonString = line.substring(6).trim(); // Remove 'data: ' and trim spaces
//             // Parse the JSON
//             const jsonObject = JSON.parse(jsonString);
    
//             // Check and modify the parts array if it exists
//             if (jsonObject.v && jsonObject.v.message) {
//               console.log('JSON Object', jsonObject.v)
//               if (jsonObject.v.message.author) {
//                 const author = jsonObject.v.message.author.role
//                 console.log('Author', author)
//                 if (author === 'user' && jsonObject.v.message.content) {
//                   console.log('Original Message', originalMessage)
//                   if (originalMessage) {
//                     jsonObject.v.message.content.parts = [originalMessage];
//                   }
//                 }
//               }
//             }
//             // Convert the modified object back to JSON string
//             const modifiedJsonString = JSON.stringify(jsonObject);
//             // Reconstruct the line
//             modifiedLines.push(`data: ${modifiedJsonString}`);
//         } else {
//             // If it's not a data line, push it unchanged
//             modifiedLines.push(line);
//         }
//       } catch {
//         modifiedLines.push(line);
//       }
//   });
  
//   // Join the modified lines back into a single string
//   const modifiedString = modifiedLines.join('\n');
//   // Output the modified string
//   return modifiedString

// }


// function sanitizeResponse(response) {
//   console.log('Response', response)
//   if (response.mapping) {
//     const mapping = response.mapping 
//     const newMapping = {...mapping}
//     Object.keys(mapping).forEach(item => {
//       if (mapping[item].message) {
//         const author = item.message.author 
//         if (author === 'user') {
//           const content = item.message.content.parts 
//           const updatedContent = []
//           if (content.length > 1) {
//             updatedContent.push(content[1]) // UPDATE if there is more than 2 parts
//           }
//           newMapping[item].message.content.parts = updatedContent
//         }
//       }
//     })
//     console.log(newMapping)
//     response.mapping = newMapping
//   }
//   return response
// }
// // Override the fetch function
// window.fetch = async (...args) => {
//   const [resource, options] = args
//   const method = options.method
//   console.log(method, resource, RequestVariables)
//   if (method === 'POST' && (resource.includes('backend-anon/conversation') || resource.includes('backend-api/conversation'))) {
//     const newBody = JSON.parse(options.body)
//     const customFetch = newBody.customFetch ? true : false 
//     console.log('Custom Fetch', customFetch)
//     if ('messages' in newBody && !newBody.customFetch) {
//       const message = newBody.messages[0].content.parts
//       const combinedKnowledge = `${RequestVariables.knowledge.promptHeader} ${RequestVariables.knowledge.join('\n')}`;
//       const newMessage = [combinedKnowledge, ...message]
//       console.log(newMessage)
//       newBody.messages[0].content.parts = newMessage
//       newBody.customFetch = true
//       const modifiedOptions = {
//         ...options,
//         body: JSON.stringify(newBody),
//       }
//       console.log('Issue new fetch request', resource, modifiedOptions)
//       const response = await fetch(resource, modifiedOptions);
//       const reader = response.body.getReader();
//       const decoder = new TextDecoder('utf-8');


//       const modifiedStream = new ReadableStream({
//         async pull(controller) {
//           // Read from the original stream
//           const { value, done } = await reader.read();
//           console.log(done, value)
//           if (done) {
//             // Close the controller if done
//             controller.close();
//             return;
//           }
  
//           const chunk = decoder.decode(value, { stream: true });
//           const editedChunk = editString(chunk, message[0])
          
//           // Encode the modified text back to a Uint8Array
//           const modifiedValue = new TextEncoder().encode(editedChunk);
  
//           // Enqueue the modified chunk
//           controller.enqueue(modifiedValue);
//         },
//         cancel() {
//           reader.cancel(); // Clean up the original stream
//         }
//       });
//       console.log('Response fully received');       
//       return new Response(modifiedStream, {
//         headers: response.headers,
//         status: response.status,
//         statusText: response.statusText,
//       });
//     }
//     else {
//       return originalFetch(...args)
//     }
//   }
//   else if (method === 'GET' && (resource.includes('backend-anon/conversation/') || resource.includes('backend-api/conversation/'))) {
//     const newBody = JSON.parse(options.body)
//     const customFetch = newBody.customFetch ? true : false 
//     console.log('Custom Fetch', customFetch)
//     if (!newBody.customFetch) {
//       newBody.customFetch = true
//       const modifiedOptions = {
//         ...options,
//         body: JSON.stringify(newBody),
//       }
//       const response = await fetch(resource, modifiedOptions);
//       const newResponse = sanitizeResponse(response)
//       return new Response(newResponse, {
//         headers: response.headers,
//         status: response.status,
//         statusText: response.statusText,
//       });
//     }
//   }
//   // Call the original fetch function if no modifications are needed
//   return originalFetch(...args)
// }




