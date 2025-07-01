import constants from "~/services/constants";

async function dummyFunction(prompt: str) {
    /*
        Example function that makes a call to the background that will then send a message
        to the server call in (services/)
    */
    const promise = new Promise((resolve, reject) => {
        browser.runtime.sendMessage({type: 'dummy_function', data: {prompt: prompt} })
        .then(response => {
          resolve(response)
        })
        .catch(error => {
            console.error(error)
            resolve({})
        })
    })

    const output = await promise;
    return output;
   
}

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

function getConversationId() {
    const link = window.location.href
    const parts = link.split('/')
    return parts[parts.length - 1]
}

export {
    dummyFunction,
    splitTextIntoChunks,
    getConversationId,
    getByteSize
}