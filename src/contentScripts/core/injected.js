
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
            } catch {
            console.log('Cannot parse')
            prevLines.push(jsonString)
            }
        }
    } else {
        // If it's not a data line, push it unchanged
        modifiedLines.push(line);
        prevLines = []
    }
    } catch(error) {
    console.log(error)
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

function processResponse(chunks) {
    let toProcess = chunks.join('')
    try {
        let response = JSON.parse(toProcess.trim())
        console.log('Response', response)
        let updatedChunk = {...response}
        if (response.mapping) {
        let updatedMapping = response.mapping 
        Object.keys(updatedMapping).forEach(id => {
            let item = updatedMapping[id]
            // console.log('Item', item)
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
        console.log('Input chunk', error)
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

(function () {

    /** Intercept XHR Requests **/
    const XHR = XMLHttpRequest.prototype;
    const open = XHR.open;
    const send = XHR.send;
    const setRequestHeader = XHR.setRequestHeader;

    XMLHttpRequest.prototype.open = function (method, url, async, user, password) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {}; 
        return open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        this._requestHeaders[header] = value; // Capture headers
        return setRequestHeader.apply(this, arguments);
    };


    
    XMLHttpRequest.prototype.send = async function (body) {
        console.log(this._url)
        if (this._method === "POST" && this._url.includes('chat/completion')) {
            try {
                let newBody = JSON.parse(body);
                const customFetch = newBody.prompt.trim().startsWith("<KNOLL>")
                if ('prompt' in newBody && !customFetch) {
                    const event = new CustomEvent("change_prompt_xhr", {
                        detail: {
                            origin: 'deepseek', 
                            body: JSON.stringify(newBody)
                        }
                    });
                    const promise = new Promise((resolve, reject) => {
                        const handler = (evt) => {
                            let modifiedOptions = JSON.parse(evt.detail.modifiedOptions)
                            if ('signal' in modifiedOptions) {
                                delete modifiedOptions['signal']
                            }
                            console.log('modified options', modifiedOptions)
                            resolve([modifiedOptions, evt.detail.originalPrompt])
                        };
                        window.addEventListener('send_prompt_xhr', handler)
                        window.dispatchEvent(event);
                    })
                    
                    const [modifiedBody, originalPrompt] = await promise; 
                    console.log("Modified Body:", modifiedBody);
                    arguments[0] = JSON.stringify(modifiedBody); // Replace the original body
                    return send.apply(this, arguments);
                } 
            } catch (e) {
                return send.apply(this, arguments);
            }
        } else if (this._method === "GET" && this._url.includes('chat/history_messages')) {
            this.addEventListener("readystatechange", function() {
                console.log(this.readyState)
                if (this.readyState === 3 || this.readyState === 4) { // Streaming responses arrive in readyState 3
                    try {
                        // Convert response into a string stream
                        let textStream;
                        try {
                            textStream = JSON.parse(this.responseText);
                        } catch {
                            textStream = this.responseText
                        }
                        console.log('TextStream', textStream)
                        textStream.data.biz_data.chat_messages.forEach(message => {
                            if (message.role === 'USER') {
                                if (message.content.startsWith('<KNOLL>')) {
                                    const searchTerm = "</cllm>";
                                    const index = message.content.indexOf(searchTerm);  // Find the first occurrence of </cllm>
                                    if (index !== -1) {
                                        const result = message.content.substring(index + searchTerm.length);
                                        message.content = result
                                        console.log(textStream)
                                    }
                                }
                            }
                        })
    
                        // Redefine responseText (responseText is read-only, so we override using defineProperty)
                        Object.defineProperty(this, 'responseText', {
                            get: function() {
                                return textStream;
                            },
                            configurable: true
                        });
    
                    } catch (e) {
                        console.error("Error modifying response:", e);
                    }
                }
            }, false);
    
            return send.apply(this, arguments);
        } else {
            return send.apply(this, arguments);
        }
    };

    /** Intercept Fetch Requests **/
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
        const [resource, options] = args
        const method = options?.method
        console.log('FETCH', method, resource)
        if (method === 'POST' && (resource.includes('backend-anon/conversation') || resource.includes('backend-api/conversation'))) {
            const newBody = JSON.parse(options.body)
            const customFetch = newBody.customFetch ? true : false 
            console.log('Custom Fetch', customFetch, 'args', args)
            if ('messages' in newBody && !customFetch) {
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
                        console.log('modified options', modifiedOptions)
                        resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
                    };
                    window.addEventListener('send_prompt', handler)
                    window.dispatchEvent(event);
                })
                
                const [url, modifiedBody, originalPrompt] = await promise; 
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
                    console.log('original', originalPrompt)
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
            console.log('Custom Fetch', options, resource)
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
            console.log('Response fully received'); 
            const modifiedChunks = processResponse(chunks)
            let outputs = chunks
            if (modifiedChunks.edited) {
                outputs = chunkString(modifiedChunks.chunk, chunks.length)
            }
            console.log('Outputs', outputs)
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
            const customFetch = newBody.prompt.trim().startsWith("<KNOLL>")
            console.log('Custom Fetch', customFetch, 'args', args)
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
                console.log('modified options', modifiedOptions)
                resolve([evt.detail.resource, modifiedOptions, evt.detail.originalPrompt])
                };
                window.addEventListener('send_prompt', handler)
                window.dispatchEvent(event);
            })
            
            const [url, modifiedBody, originalPrompt] = await promise; 
            console.log('modified body', modifiedBody)
            return originalFetch(resource, modifiedBody)
            }
            else {
            return originalFetch(...args)
            }
        }
        else if (method === 'GET' && (resource.includes('rendering_mode=messages')) && (resource.includes('chat_conversations'))) {
            console.log('Edit get')
            const headers = options.headers 
            const customFetch = headers.customFetch ? true : false
            console.log('Edit get', customFetch)
            if (!customFetch) {
                let modifiedOptions = {...options}
                console.log(modifiedOptions)
                modifiedOptions.headers.customFetch = true 
                const response = await fetch(resource, modifiedOptions)
                console.log('Custm response', response)

                let chunks = []
                let done = false;
                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');

                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        console.log('Claude', chunk)
                        chunks.push(chunk);
                    }
                    done = streamDone;
                }
                
                const joinedChunks = chunks.join(" ");
                let outputs = JSON.parse(joinedChunks)
                console.log(outputs)
                outputs.chat_messages.forEach(message => {
                    if (message.sender === 'human') {
                    message.content.forEach(content => {
                        if (content.text.startsWith('<KNOLL>')) {
                        const searchTerm = "</cllm>";
                        const index = content.text.indexOf(searchTerm);  // Find the first occurrence of </cllm>
                        if (index !== -1) {
                            const result = content.text.substring(index + searchTerm.length);
                            content.text = result
                            console.log(outputs)
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
})();


