import { isStringObject } from 'util/types';
import constants from './constants'; 
import axios from 'axios';
import browser from 'webextension-polyfill';

interface Checked {
    [key: string]: boolean;
}

interface Module {
    id: string;
    title: string; 
    description: string;
    gh_page: string;
    link: string;
    owner: string; 
    repo: string; 
    access: number
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    async fetchModules() {
        // try {
            console.log('Fetching all modules')
            console.log('Server API', constants.SERVER_API)
            const syncData = await browser.storage.sync.get("uid")
            const user = syncData?.uid
            console.log(user)
            const response = await axios.get(`${constants.SERVER_API}/`, {
                params: {user: user}
            })
            if (response.data) {
                return {success: true, response: response.data}
            }
        // } catch (err) {
        //     return {success: false}
        // }
    }, 
    async fetchModule(moduleId: string) {
        const response = await axios.get(`${constants.SERVER_API}/module`, {
            params: {
                id: moduleId
            }
        })
        if (response.data) {
            return {success: true, response: response.data}
        } else {
            return {success: false}
        }
    },
    async fetchCommunities() {
        const response = await axios.get(`${constants.SERVER_API}/communities`)
        if (response.data) {
            return {success: true, response: response.data}
        } else {
            return {success: false}
        }
    },
    async updateKnowledge(checked: Checked, modules: [Module]) {
        return new Promise((resolve, reject) => {
            axios.post(`${constants.SERVER_API}/get_knowledge`, {checked: checked, modules: modules})
            .then(response => {
                if (response.data) {
                    const updatedKnowledge = JSON.stringify(response.data)
                    resolve({success: true, response: updatedKnowledge})
                }
            })
        })
    }
}
