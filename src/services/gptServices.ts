import axios from 'axios';
import constants from './constants'; 

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    async queryGPT(data:any) {
        const response = await axios.post(`${constants.SERVER_API}/queryGPT`, data)
        if (response.data) {
            return {modules: response.data}
        } else {
            return {modules: []}
        }
    },

    async queryEmbeddings(data:any) {
        const response = await axios.post(`${constants.EMBEDDING_URL}/similarity`, data)
        if (response.data) {
            return {modules: response.data.relevant_modules, knowledge: response.data?.relevant_knowledge}
        } else {
            return {modules: []}
        }
    },
    async queryEmbeddingsChunks(data:any) {
        const response = await axios.post(`${constants.EMBEDDING_URL}/similarity_chunks`, data)
        if (response.data) {
            return {modules: response.data.relevant_modules, knowledge: response.data.relevant_knowledge}
        } else {
            return {modules: []}
        }
    }
}
