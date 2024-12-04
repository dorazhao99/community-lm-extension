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
            console.log('No user')
            return {success: false}
        }
    },
    async saveUserModules(knowledge) {
        const syncData = await browser.storage.sync.get("uid")
        const uid = syncData?.uid
        console.log('UID', uid)
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
            console.log('No user')
            return {success: false}
        }
    }
}
