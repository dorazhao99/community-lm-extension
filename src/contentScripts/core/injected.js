console.log('LLM Wizard enabled')

const originalFetch = window.fetch
let prevLines = []


function editString(inputString, originalMessage, remove) {
  const lines = inputString.split('\n');
  const modifiedLines = [];
  lines.forEach(line => {
    try {
      if (prevLines.length > 0) {
        line = prevLines.join(' ') + line
      }
      if (line.startsWith('data: ')) {
          // Extract the JSON part
          let jsonString = line.substring(6).trim(); // Remove 'data: ' and trim spaces
          if (jsonString === '[DONE]') {
            prevLines = []
            modifiedLines.push('data: [DONE]');
          } else {
            // Parse the JSON
            try {
              const jsonObject = JSON.parse(jsonString);
              prevLines = [] // JSON is complete and parsed successfully
              // Check and modify the parts array if it exists
              if (jsonObject.v && jsonObject.v.message) {
                if (jsonObject.v.message.author) {
                  const author = jsonObject.v.message.author.role
                  if (author === 'user' && jsonObject.v.message.content) {
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
            } catch {
              console.error('Cannot parse')
              prevLines.push(jsonString)
            }
          }
      } else {
          // If it's not a data line, push it unchanged
          modifiedLines.push(line);
          prevLines = []
      }
    } catch(error) {
      console.error(error)
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
            if (jsonObject.v.message.author) {
              const author = jsonObject.v.message.author.role
              if (author === 'assistant') {
                id = jsonObject.v.message.id
                return id
              }
            }
          }
      } 
    } catch(error) {
      console.error(error)
    }
  })
  return id;
}

function processResponse(chunks) {
  let toProcess = chunks.join('')
  try {
    let response = JSON.parse(toProcess.trim())
    let updatedChunk = {...response}
    if (response.mapping) {
      let updatedMapping = response.mapping 
      Object.keys(updatedMapping).forEach(id => {
        let item = updatedMapping[id]
        if (item.message && item.message.author) {
          const author = item.message.author.role
          if (author === 'user') {
            let parts = item.message.content.parts
            const numParts = parts.length 
            parts = [parts[numParts - 1]]
            item.message.content.parts = parts
          }
        } 
        updatedMapping[id] = item
      })
      updatedChunk.mapping = updatedMapping
    } 
    return {edited: true, chunk: JSON.stringify(updatedChunk)}
  } catch(error) {
    return {edited: false, chunk: toProcess}
  }
}

function chunkString(str, N) {
  const len = str.length;
  const chunkSize = Math.floor(len / N); // Base size of each chunk
  const remainder = len % N; // Extra characters to distribute

  const chunks = [];
  let start = 0;

  for (let i = 0; i < N; i++) {
      // Calculate the end of the current chunk
      const end = start + chunkSize + (i < remainder ? 1 : 0);
      chunks.push(str.slice(start, end));
      start = end; // Update the start for the next chunk
  }

  return chunks;
}


window.fetch = async (...args) => {
  // Intercept post requests when a prompt is submitted by the user
  const [resource, options] = args
  const method = options?.method
  if (method === 'POST' && (resource.includes('backend-anon/conversation') || resource.includes('backend-api/conversation') || resource.includes('backend-api/f/conversation'))) {
    const newBody = JSON.parse(options.body)
    const customFetch = newBody.customFetch ? true : false // synthetic fetch request or not
    const extraInfo = newBody.extraInfo ? true : false
    console.log('Intercept', newBody)
    if ('messages' in newBody && !customFetch && !extraInfo) {
        if (newBody.model === 'auto') {
            const event = new CustomEvent("change_prompt_chunk", {
                detail: {
                    origin: 'openai', 
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
                    resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
                };
                window.addEventListener('send_prompt', handler)
                window.dispatchEvent(event);
            })
            
            const [url, modifiedBody, originalPrompt] = await promise; 
    
            // if the user is not on pro then we have to chunk
            const response = await fetch(resource, modifiedBody)
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
    
            const modifiedStream = new ReadableStream({
                async pull(controller) {
                // Read from the original stream
                const { value, done } = await reader.read();
                if (done) {
                    // Close the controller if done
                    controller.close();
                    return;
                }
                const chunk = decoder.decode(value, { stream: true });
                const editedChunk = editString(chunk, originalPrompt)
                // Encode the modified text back to a Uint8Array
                const modifiedValue = new TextEncoder().encode(editedChunk);
                controller.enqueue(modifiedValue);
                },
                cancel() {
                reader.cancel(); // Clean up the original stream
                }
            });
            return new Response(modifiedStream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
            });
        } else {
            const event = new CustomEvent("change_prompt", {
                detail: {
                    origin: 'openai', 
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
                    resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
                };
                window.addEventListener('send_prompt', handler)
                window.dispatchEvent(event);
            })
            
            const [url, modifiedBody, originalPrompt] = await promise; 
    
            // if the user is not on pro then we have to chunk
            const response = await fetch(resource, modifiedBody)
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
    
            const modifiedStream = new ReadableStream({
                async pull(controller) {
                // Read from the original stream
                const { value, done } = await reader.read();
                if (done) {
                    // Close the controller if done
                    controller.close();
                    return;
                }
                const chunk = decoder.decode(value, { stream: true });
                const editedChunk = editString(chunk, originalPrompt)
                // Encode the modified text back to a Uint8Array
                const modifiedValue = new TextEncoder().encode(editedChunk);
                controller.enqueue(modifiedValue);
                },
                cancel() {
                reader.cancel(); // Clean up the original stream
                }
            });
            return new Response(modifiedStream, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
            });
        }
    }
    else {
      return originalFetch(...args)
    }
  }

  // Interject when reading from conversations to remove inserted content from message
  else if (method === 'GET' && (resource.includes('backend-anon/conversation/') || resource.includes('backend-api/conversation/'))) {
    const headers = options.headers 
    const customFetch = headers.customFetch ? true : false
    if (!customFetch) {
      let modifiedOptions = {...options}
      modifiedOptions.headers.customFetch = true 
      const response = await fetch(resource, modifiedOptions)

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let chunks = []
      let done = false;

      while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) {
              const chunk = decoder.decode(value, { stream: true });
              chunks.push(chunk);
          }
          done = streamDone;
      }
      const modifiedChunks = processResponse(chunks)
      let outputs = chunks
      if (modifiedChunks.edited) {
        outputs = chunkString(modifiedChunks.chunk, chunks.length)
      }
      const modifiedStream = new ReadableStream({
        start(controller) {
          for (const output of outputs) {
            const modifiedValue = new TextEncoder().encode(output);
            controller.enqueue(modifiedValue);
          }
          controller.close();
        },
      });
      return new Response(modifiedStream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
      });
    } else {
      return originalFetch(...args)
    }
  }
  // handlers for Claude
  else if (method ==='POST' && (resource.includes('chat_conversation')) && (resource.includes('completion'))) {
    const newBody = JSON.parse(options.body)
    const customFetch = newBody.prompt.trim().startsWith("<LLMWizard>")
    if ('prompt' in newBody && !customFetch) {
      const event = new CustomEvent("change_prompt", {
          detail: {
              origin: 'claude', 
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
          resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
        };
        window.addEventListener('send_prompt', handler)
        window.dispatchEvent(event);
      })
      
      const [url, modifiedBody, originalPrompt] = await promise; 
      return originalFetch(resource, modifiedBody)
    }
    else {
      return originalFetch(...args)
    }
  }
  else if (method === 'GET' && (resource.includes('rendering_mode=messages')) && (resource.includes('chat_conversations'))) {
    const headers = options.headers 
    const customFetch = headers.customFetch ? true : false
    if (!customFetch) {
      let modifiedOptions = {...options}
      modifiedOptions.headers.customFetch = true 
      const response = await fetch(resource, modifiedOptions)

      let chunks = []
      let done = false;
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) {
              const chunk = decoder.decode(value, { stream: true });
              chunks.push(chunk);
          }
          done = streamDone;
      }
      
      const joinedChunks = chunks.join(" ");
      let outputs = JSON.parse(joinedChunks)
      outputs.chat_messages.forEach(message => {
        if (message.sender === 'human') {
          message.content.forEach(content => {
            if (content.text.startsWith('<cllm>')) {
              const searchTerm = "</cllm>";
              const index = content.text.indexOf(searchTerm);  // Find the first occurrence of </cllm>
              if (index !== -1) {
                  const result = content.text.substring(index + searchTerm.length);
                  content.text = result
              }
            }
          })
        }
      })

      const returnChunks = [JSON.stringify(outputs)]
      const modifiedStream = new ReadableStream({
        start(controller) {
          for (const c of returnChunks) {
            const modifiedValue = new TextEncoder().encode(c);
            controller.enqueue(modifiedValue);
          }
          controller.close();
        },
      });
      return new Response(modifiedStream, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
      });
    } else {
      return originalFetch(...args)
    }

  }
  else {
      return originalFetch(...args)
  }
  
}


