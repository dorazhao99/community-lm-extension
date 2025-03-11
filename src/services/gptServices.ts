import axios from 'axios';
import constants from './constants'; 

// // poll for responses from worker
// function checkTaskStatus(taskId, taskType) {
//     const statusUrl = `${constants.EMBEDDING_URL}/task_status/${taskId}/${taskType}`;
    
//     // Set up polling interval
//     const pollInterval = setInterval(() => {
//       axios.get(statusUrl)
//         .then(statusData => {
//           if (statusData.status === 'SUCCESS') {
//             // Task completed successfully
//             clearInterval(pollInterval);
            
//             // Process the results
//             const results = statusData.result;
//             // Do something with the relevant_modules and relevant_knowledge
//             processResults(results);
//           } 
//           else if (statusData.status === 'FAILURE') {
//             // Task failed
//             clearInterval(pollInterval);
//             console.error('Task failed:', statusData.message);
//             // Handle the error in your UI
//           }
//           // Otherwise, it's still pending or in progress, continue polling
//         })
//         .catch(error => {
//           clearInterval(pollInterval);
//           console.error('Error checking task status:', error);
//         });
//     }, 500); // Check every second
// }

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
    },

    async queryEmbeddings(data:any) {
        try {
            const response = await axios.post(`${constants.EMBEDDING_URL}/similarity`, data);
            if (response.data) {
                const taskId = response.data.task_id;
                const statusUrl = `${constants.EMBEDDING_URL}/task_status/${taskId}/similarity`;
    
                return new Promise((resolve, reject) => {
                    const pollInterval = setInterval(async () => {
                        try {
                            const statusData = await axios.get(statusUrl);
                            console.log('Status Data', statusData.data);
    
                            if (statusData.data.status === 'SUCCESS') {
                                // Task completed successfully
                                clearInterval(pollInterval);
                                const results = statusData.data.result;
                                console.log('Results', results);
                                resolve({
                                    modules: results.relevant_modules,
                                    knowledge: results.relevant_knowledge,
                                    scores: results.scores
                                });
                            } else if (statusData.data.status === 'FAILURE') {
                                // Task failed
                                clearInterval(pollInterval);
                                console.error('Task failed:', statusData.data.message);
                                resolve({
                                    modules: [],
                                    knowledge: [],
                                    scores: []
                                })
                            }
                        } catch (error) {
                            clearInterval(pollInterval);
                            console.error('Error checking task status:', error);
                            resolve({
                                modules: [],
                                knowledge: [],
                                scores: []
                            })
                        }
                    }, 500);
                });
            } else {
                return { modules: [], knowledge: '' };
            }
        } catch (error) {
            console.error('Error querying embeddings:', error);
            return { modules: [], knowledge: '' };
        }

    },
    async queryEmbeddingsChunks(data:any) {
        try {
            const response = await axios.post(`${constants.EMBEDDING_URL}/similarity_chunks`, data);
            if (response.data) {
                const taskId = response.data.task_id;
                const statusUrl = `${constants.EMBEDDING_URL}/task_status/${taskId}/similarity_chunks`;
    
                return new Promise((resolve, reject) => {
                    const pollInterval = setInterval(async () => {
                        try {
                            const statusData = await axios.get(statusUrl);
                            console.log('Status Data', statusData.data);
    
                            if (statusData.data.status === 'SUCCESS') {
                                // Task completed successfully
                                clearInterval(pollInterval);
                                const results = statusData.data.result;
                                console.log('Results', results);
                                resolve({
                                    modules: results.relevant_modules,
                                    knowledge: results.relevant_knowledge,
                                    scores: results.scores
                                });
                            } else if (statusData.data.status === 'FAILURE') {
                                // Task failed
                                clearInterval(pollInterval);
                                console.error('Task failed:', statusData.data.message);
                                resolve({
                                    modules: [],
                                    knowledge: [],
                                    scores: []
                                })
                            }
                        } catch (error) {
                            clearInterval(pollInterval);
                            console.error('Error checking task status:', error);
                            resolve({
                                modules: [],
                                knowledge: [],
                                scores: []
                            })
                        }
                    }, 500);
                });
            } else {
                return { modules: [], knowledge: '' };
            }
        } catch (error) {
            console.error('Error querying embeddings:', error);
            return { modules: [], knowledge: '' };
        }
    }
}
