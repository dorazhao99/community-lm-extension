import BM25 from "okapibm25";
import constants from "~/services/constants";

function getByteSize(clipping:string) {
    const blob = new Blob([JSON.stringify(clipping)]); // Convert to Blob to get size
    return blob.size; // Return size in bytes
}

function splitTextIntoChunks(text:string, maxLength = 14800) {
    let result = [];
    let start = 0;

    while (start < text.length) {
        let end = start + maxLength;

        // If end exceeds text length, take the rest of the text
        if (end >= text.length) {
            result.push(text.substring(start));
            break;
        }

        // Ensure we do not cut a word in half
        while (end > start && text[end] !== ' ' && text[end] !== '\n') {
            end--; // Move back to the last whitespace or newline
        }

        // If no space was found, just split at maxLength (fallback)
        if (end === start) {
            end = start + maxLength;
        }

        result.push(text.substring(start, end).trim()); // Add trimmed chunk to array
        start = end + 1; // Move to the next part
    }

    return result;
}

function escapeRegExp(string:string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

const stopwords = ['i','me','my','myself','we','our','ours','ourselves','you','your','yours','yourself','yourselves','he','him','his','himself','she','her','hers','herself','it','its','itself','they','them','their','theirs','themselves','what','which','who','whom','this','that','these','those','am','is','are','was','were','be','been','being','have','has','had','having','do','does','did','doing','a','an','the','and','but','if','or','because','as','until','while','of','at','by','for','with','about','against','between','into','through','during','before','after','above','below','to','from','up','down','in','out','on','off','over','under','again','further','then','once','here','there','when','where','why','how','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','can','will','just','don','should','now']

function remove_stopwords(str:string) {
    const res = []
    const words = str.split(' ')
    for(let i=0; i < words.length; i++) {
       const word_clean = words[i].split(".").join("")
       if(!stopwords.includes(word_clean)) {
           res.push(word_clean)
       }
    }
    return res.join(' ')
}  

async function routeDocuments(modules: any, prompt: any) {
    const top_k = 5
    const docs = []
    const moduleNames:Array<string> = []
    for (const [key, value] of Object.entries(modules)) {
        const cleaned = escapeRegExp(remove_stopwords(value.knowledge))
        docs.push(cleaned)
        moduleNames.push(key)
    }
      
    prompt = Array.isArray(prompt) ? prompt.join(' ') : prompt
    const q = escapeRegExp(remove_stopwords(prompt)).split(' ')
    const result = BM25(docs, q, { k1: 1.3, b: 0.9 }) as number[];

    const sortedIndices = result
        .map((value, index) => ({ value, index })) 
        .sort((a, b) => b.value - a.value)        
        .map(item => item.index); 
            
    const selectedModules:any = {}
    sortedIndices.slice(0, top_k).forEach((_, idx) => {
        const modName = moduleNames[idx]
        selectedModules[modName] = modules[modName]
    })

    const promise = new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: 'query_gpt', data: {modules: JSON.stringify(selectedModules), query: prompt} })
        .then(response => {
          const returnedKnowledge:any = {}
          if (response.modules) {
              response.modules.forEach(module => {
                  returnedKnowledge[module] = modules[module]
              })
              resolve(returnedKnowledge)
          } else {
              resolve({})
          }
        })
        .catch(error => {
            console.error(error)
            resolve({})
        })
    })

    const output = await promise;
    return output;
   
}

async function routeDocumentsEmbedding(modules: any, prompt: unknown, prevMessage: string, provider: string, seenKnowledge: unknown) {
    const docs:any = {}
    const moduleNames:Array<string> = []

    // get embedding for prompt
    const body = {
        sentence: prompt
    }

    // SHOULD CACHE THIS AT SOME POINT 
    for (const [key, value] of Object.entries(modules)) {
        docs[key] = value
        moduleNames.push(key)
    }

    let module;

    const promise = new Promise((resolve, reject) => {
        let combinedPrompt = prompt 
        try {
            combinedPrompt = prevMessage + ' ' + prompt
        } catch {
            console.log('Error combining prompt', combinedPrompt, prevMessage)
        }

        browser.runtime.sendMessage({type: 'query_embeddings', data: {modules: JSON.stringify(docs), prompt: combinedPrompt, provider: provider, seenKnowledge: seenKnowledge} })
        .then(response => {
        console.log('Route Document', response)
          if (response.knowledge) {
            const selectedModules: any = {}
            const selectedScores: any = {}
            response.modules.forEach(idx => {
                module = moduleNames[idx]
                selectedModules[module] = modules[module]
                selectedScores[module] = response.scores[idx]
            })
           
            resolve({knowledge: response.knowledge, modules: selectedModules, scores: selectedScores, seenKnowledge: response.seenKnowledge})
          } else {
            resolve({})          
          }
        })
        .catch(error => {
            console.log(error)
            resolve({})
        })
    })

    const output = await promise;
    return output;
   
}

async function routeDocumentsEmbeddingChunks(modules: any, prompt: any) {
    const docs:any = {}
    const moduleNames:Array<string> = []

    for (const [key, value] of Object.entries(modules)) {
        docs[key] = value
        moduleNames.push(key)
    }

    let module;

    const promise = new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: 'query_embeddings_chunks', data: {modules: JSON.stringify(docs), prompt: prompt} })
        .then(response => {
          if (response.knowledge) {
              const selectedModules: any = {}
              const selectedScores: any = {}
              response.modules.forEach(idx => {
                module = moduleNames[idx]
                selectedModules[module] = modules[module]
                selectedScores[module] = response.scores[idx]
              })
              resolve({knowledge: response.knowledge, modules: selectedModules, scores: selectedScores})
          } else {
              resolve({})
          }
        })
        .catch(error => {
            console.error(error)
            resolve({})
        })
    })

    const output = await promise;
    return output;
   
}

function getConversationId() {
    const link = window.location.href
    const parts = link.split('/')
    return parts[parts.length - 1]
}

export {
    routeDocuments,
    routeDocumentsEmbedding,
    splitTextIntoChunks,
    routeDocumentsEmbeddingChunks,
    getConversationId,
    getByteSize
}