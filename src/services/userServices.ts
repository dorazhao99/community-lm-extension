import { isStringObject } from 'util/types';
import constants from './constants'; 
import axios from 'axios';

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
    async fetchUserModules() {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const response = await axios.get(`${constants.SERVER_API}/getUser`, {
                params: {
                    id: uid
                }
            })
            if (response.data) {
                return {success: true, response: response.data}
            } else {
                return {success: false}
            }
        } else {
            console.error('No user')
            return {success: false}
        }
    },
    async saveUserModules(knowledge) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const body = {
                uid: uid, 
                checked: knowledge
            }
            const response = await axios.post(`${constants.SERVER_API}/updateChecked`, body)
            if (response.data) {
                return {success: true, response: response.data}
            } else {
                return {success: false}
            }
        } else {
            console.error('No user')
            return {success: false}
        }
    },
    async addUserModule(data: Object) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const response = await axios.post(`${constants.SERVER_API}/addModule`, data)
            if (response.data) {
                return {success: true, response: response.data}
            } else {
                return {success: false}
            }
        } else {
            console.error('No user')
            return {success: false}
        }
    },
    async createGist(data: Object) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const postData = {...data, uid: uid}
            const response = await axios.post(`${constants.SERVER_API}/createGist`, postData)
            if (response.data) {
                return {success: true, data: response.data}
            } else {
                console.log(response)
                return {success: false, data: response}
            }
        } else {
            console.error('Could not make gist')
            return {success: false}
        }
    }, 
    async logAction(data: any) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const actionData = {
                ...data,
                uid: uid
            }
            axios.post(`${constants.SERVER_API}/logAction`, actionData)
            .then(response => {
                return {success: true, data: response.data}
            })
            .catch(error => {
                console.error(error)
                return {success: false}
            })
        } else {
            console.error('No user')
            return {success: false}
        }
    }, 
    async updateLogs(data: any) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        if (uid) {
            const messageData = {
                uid: uid, 
                messageId: data?.messageId, 
                conversationId: data?.conversationId, 
                modules: data.modules ? data.modules : [],
                provider: data?.provider,
                message: data?.message
            }

            axios.post(`${constants.SERVER_API}/storeMessage`, messageData)

            const body = {
                uid: uid
            }
            const response = await axios.post(`${constants.SERVER_API}/updateCount`, body)
            if (response.data) {
                return {success: true, response: response.data}
            } else {
                return {success: false}
            }
        } else {
            console.error('No user')
            return {success: false}
        }
    }
}
