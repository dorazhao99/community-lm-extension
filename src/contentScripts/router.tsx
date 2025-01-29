import BM25 from "okapibm25";


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
    console.log('Route', modules, prompt)
    const top_k = 5
    const docs = []
    const moduleNames:Array<string> = []
    for (const [key, value] of Object.entries(modules)) {
        const cleaned = escapeRegExp(remove_stopwords(value.knowledge))
        console.log(cleaned)
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
            
    console.log(sortedIndices, result)
    const selectedModules:any = {}
    sortedIndices.slice(0, top_k).forEach((_, idx) => {
        const modName = moduleNames[idx]
        selectedModules[modName] = modules[modName]
    })

    const promise = new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: 'query_gpt', data: {modules: JSON.stringify(selectedModules), query: prompt} })
        .then(response => {
          console.log('query_gpt response', response)
          const returnedKnowledge:any = {}
          if (response.modules) {
              response.modules.forEach(module => {
                  returnedKnowledge[module] = modules[module]
              })
              console.log('returned knowledge', returnedKnowledge)
              resolve(returnedKnowledge)
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

async function routeDocumentsEmbedding(modules: any, prompt: any) {
    const docs:any = {}
    const moduleNames:Array<string> = []
    // SHOULD CACHE THIS AT SOME POINT 
    for (const [key, value] of Object.entries(modules)) {
        docs[key] = value
        moduleNames.push(key)
    }

    const promise = new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: 'query_embeddings', data: {modules: JSON.stringify(docs), prompt: prompt} })
        .then(response => {
          console.log('query_embeddings response', response)
          const returnedKnowledge:any = {}
          if (response?.modules) {
              response.modules.forEach(idx => {
                    const module:string = moduleNames[idx]
                    returnedKnowledge[module] = modules[module]
              })
              console.log('returned knowledge', returnedKnowledge)
              resolve(returnedKnowledge)
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

export {
    routeDocuments,
    routeDocumentsEmbedding
}