import axios from 'axios';
import constants from './constants'; 

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    // Use this if you want to make any calls

    async queryAPI(data:any) {
        const response = await axios.post(`${constants.SERVER_API}/queryGPT`, data)
        if (response.data) {
            return {modules: response.data}
        } else {
            return {modules: []}
        }
    },
}
