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
            const syncData = await browser.storage.sync.get("uid")
            const user = syncData?.uid
            const response = await axios.get(`${constants.SERVER_API}/userModule_v2`, {
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

    // get knowledge from github
    async updateKnowledge(checked: Checked, modules: [Module]) {
        const syncData = await browser.storage.sync.get("uid")
        const user = syncData?.uid
        
        return new Promise((resolve, reject) => {
            axios.post(`${constants.SERVER_API}/get_knowledge`, {user: user, checked: checked, modules: modules})
            .then(response => {
                if (response.data) {
                    const updatedKnowledge = JSON.stringify(response.data)
                    resolve({success: true, response: updatedKnowledge})
                }
            })
        })
    },
    async addContent(data: Object) {
        return new Promise((resolve, reject) => {
            axios.post(`${constants.SERVER_API}/addKnowledge`, data)
            .then(response => {
                if (response.data) {
                    resolve({success: true, link: response.data.link})
                }
            })
            .catch(error => {
                const response = error?.response
                resolve({success: false, error: response.data.error})
            })
        })
    }
}
