import axios from 'axios';
import constants from './constants'; 

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    async queryGPT(data:any) {
        const response = await axios.post(`${constants.SERVER_API}/queryGPT`, data)
        console.log('GPT Response', response)
        if (response.data) {
            return {modules: response.data}
        } else {
            return {modules: []}
        }
    }
}
