console.log('FeedWizard enabled - injected code')
const originalXhrOpen = XMLHttpRequest.prototype.open
console.log('Xhr')

// const SUBSCRIBED = ['HomeTimeline', 'HomeLatestTimeline']
// let httpRequestIdCounter = 0
// const event_handlers = {}

// const passUserInfoToStore = true

// const RequestVariables = {
//   cursors_fetched: [],
//   batch_counter: 0,
//   qid: {
//     HomeTimeline: 'k3YiLNE_MAy5J-NANLERdg',
//     HomeLatestTimeline: 'U0cdisy7QFIoTfu3-Okw0A',
//   },
//   reqBodyPopulated: false,
//   reqBody: {
//     variables: {
//       count: 20,
//       includePromotedContent: true,
//       latestControlAvailable: true,
//       withCommunity: true,
//       seenTweetIds: [],
//     },
//     features: {
//       responsive_web_graphql_exclude_directive_enabled: true,
//       verified_phone_label_enabled: false,
//       creator_subscriptions_tweet_preview_api_enabled: true,
//       responsive_web_graphql_timeline_navigation_enabled: true,
//       responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
//       communities_web_enable_tweet_community_results_fetch: true,
//       c9s_tweet_anatomy_moderator_badge_enabled: true,
//       tweetypie_unmention_optimization_enabled: true,
//       responsive_web_edit_tweet_api_enabled: true,
//       graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
//       view_counts_everywhere_api_enabled: true,
//       longform_notetweets_consumption_enabled: true,
//       responsive_web_twitter_article_tweet_consumption_enabled: true,
//       tweet_awards_web_tipping_enabled: false,
//       freedom_of_speech_not_reach_fetch_enabled: true,
//       standardized_nudges_misinfo: true,
//       tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
//       rweb_video_timestamps_enabled: true,
//       longform_notetweets_rich_text_read_enabled: true,
//       longform_notetweets_inline_media_enabled: true,
//       responsive_web_enhance_cards_enabled: false,
//     },
//     queryId: '',
//   },
// }

// const MAX_TOTAL_BATCH_FETCH = 2
// const setBatchesCountevent = new CustomEvent('setAllBatchesCount', {
//   detail: {
//     count: MAX_TOTAL_BATCH_FETCH,
//   },
// })
// window.dispatchEvent(setBatchesCountevent)

// function pickRandomWaitTime() {
//   const MAX_WAIT_BEFORE_REQUEST = 1300
//   const MIN_WAIT_BEFORE_REQUEST = 500

//   Math.floor(
//     Math.random() * (MAX_WAIT_BEFORE_REQUEST - MIN_WAIT_BEFORE_REQUEST + 1),
//   ) + MIN_WAIT_BEFORE_REQUEST
// }

// function extractQID(scriptContent, timelineVariable) {
//   const pattern = new RegExp(
//     `queryId:"([^"]+)",\s*operationName:"${timelineVariable}"`,
//   )
//   const match = scriptContent.match(pattern)

//   if (match) {
//     const queryId = match[1]
//     return queryId
//   }
//   else {
//     console.log('Query ID for HomeTimeline not found.')
//     return null
//   }
// }

// (function fetchQueryIds() {
//   const scriptSrcPattern = 'https://chatgpt.com/backend-anon/conversation'
//   console.log(scriptSrcPattern)
//   // = /^https:\/\/abs.twimg.com\/responsive-web\/client-web\/main\..+\.js$/

//   // const matchingScript = Array.from(document.getElementsByTagName('script')).find(script => {
//   //     const src = script.getAttribute('src');
//   //     return src && src.match(scriptSrcPattern);
//   // });
//   let matchingScriptSrc = null
//   const linksTags = document.querySelectorAll('link')
//   console.log(document)
//   for (const el of linksTags) {
//     console.log('linkTags', el)
//     if (el.href.match(scriptSrcPattern)) {
//       matchingScriptSrc = el.href
//       console.log('Matching', matchingScriptSrc)
//       break
//     }
//   }

//   if (matchingScriptSrc) {
//     fetch(matchingScriptSrc)
//       .then(response => response.text())
//       .then((scriptContent) => {
//         console.log(scriptContent)
//         // for (const timeLineName of ['HomeTimeline']) {
//         //   const qid = extractQID(scriptContent, timeLineName)
//         //   if (qid)
//         //     RequestVariables.qid[timeLineName] = qid
//         // }
//       })
//       .catch((error) => {
//         console.log('error', error)
//       })
//   }
//   else {
//     console.log('No script found with matching src.')
//   }
// })()

// function extractReqBody(jsonifiedParams) {
//   const receivedParams = jsonifiedParams
//   receivedParams.seenTweetIds = []
//   receivedParams.queryId = ''

//   if ('requestContext' in receivedParams.variables)
//     delete receivedParams.variables.requestContext

//   RequestVariables.reqBody = receivedParams

//   RequestVariables.reqBodyPopulated = true
// }

// function constructFetchBatchReqBody(queryId, cursorVal) {
//   const reqBody = RequestVariables.reqBody
//   reqBody.queryId = queryId

//   if (cursorVal)
//     reqBody.variables.cursor = cursorVal

//   return JSON.stringify(reqBody)
// }

// function makeUnorganicCall(endpoint, headers, cursorVal) {
//   const newReq = new XMLHttpRequest()
//   newReq.unorganicCall = true
//   console.log('Unorganic calls')
//   newReq.open('POST', constructFetchBatchURL(RequestVariables.qid[endpoint]))

//   for (const header in headers)
//     newReq.setRequestHeader(header, headers[header])

//   newReq.send(
//     constructFetchBatchReqBody(RequestVariables.qid[endpoint], cursorVal),
//   )
//   console.log('new req', newReq)

//   if (cursorVal)
//     RequestVariables.cursors_fetched.push(cursorVal)
// }

// function constructFetchBatchURL(queryId) {
//   const url = window.location.href
//   console.log('URL', url)
//   // if (url.includes("twitter.com")) {
//   //   return `https://twitter.com/i/api/graphql/${queryId}/HomeTimeline`;
//   // }

//   // if (url.includes("x.com")) {
//   //   return `https://x.com/i/api/graphql/${queryId}/HomeTimeline`;
//   // }

//   return null
// }

// function getQueryParams(url) {
//   const queryParams = {}
//   const queryString = url.split('?')[1]
//   if (queryString) {
//     const params = queryString.split('&')
//     params.forEach((param) => {
//       const [key, value] = param.split('=')
//       queryParams[decodeURIComponent(key)] = decodeURIComponent(value)
//     })
//   }
//   return queryParams
// }

// window.addEventListener(
//   'setUserInfo',
//   (ev) => {
//     RequestVariables.user_id = ev.detail.userId
//     RequestVariables.user_handle = ev.detail.handle
//   },
//   false,
// );

// ((xhr) => {
//   console.log('XHR', xhr)
//   const XHR = XMLHttpRequest.prototype
//   const open = XHR.open
//   const send = XHR.send
//   const setRequestHeader = XHR.setRequestHeader

//   XHR.setRequestHeader = function (header, value) {
//     this._requestHeaders[header] = value
//     return setRequestHeader.apply(this, arguments)
//   }

//   XHR.open = function (method, url) {
//     this._url = url
//     this._id = 2
//     // this._id = httpRequestIdCounter++
//     this._startTime = new Date().toISOString()
//     this._requestHeaders = {}

//     return open.apply(this, arguments)
//   }
// })(XMLHttpRequest)

// (function (xhr) {
//   const XHR = XMLHttpRequest.prototype
//   const open = XHR.open
//   const send = XHR.send
//   const setRequestHeader = XHR.setRequestHeader

//   XHR.setRequestHeader = function (header, value) {
//     this._requestHeaders[header] = value
//     return setRequestHeader.apply(this, arguments)
//   }

//   XHR.open = function (method, url) {
//     this._url = url
//     this._id = httpRequestIdCounter++
//     this._startTime = new Date().toISOString()
//     this._requestHeaders = {}

//     return open.apply(this, arguments)
//   }

//   XHR.send = function (postData) {
//     const actionName = new URL(this._url).pathname.split('/').at(-1)

//     /*
//     the first time /settings.json response is returned, notify the store of user info.
//     if user_handle has just been fetched from the response and did not exist in local storage before,
//     the user needs to be registered on the server and signup flag is true
//     */
//     if (
//       passUserInfoToStore
//       && location.href.includes('/home')
//       && actionName.includes('settings.json')
//     ) {
//       this.onreadystatechange = function () {
//         if (this.readyState === XMLHttpRequest.DONE) {
//           const response = JSON.parse(this.responseText)

//           const userIdEvent = new CustomEvent('setUser', {
//             detail: {
//               userId: RequestVariables.user_id,
//               handle: response.screen_name,
//               signup: !RequestVariables.user_handle,
//             },
//           })
//           window.dispatchEvent(userIdEvent)
//           passUserInfoToStore = false
//         }
//       }
//     }

//     // If we subscribed for this call
//     if (SUBSCRIBED.includes(actionName)) {
//       const callback = this.onreadystatechange

//       this.onreadystatechange = function () {
//         if (!this.unorganicCall) {
//           RequestVariables.cursors_fetched = []
//           RequestVariables.batch_counter = 0
//         }

//         if (this.readyState === XMLHttpRequest.DONE) {
//           event_handlers[this._id] = {
//             callback,
//             source: this,
//             arguments,
//           }

//           console.log(
//             `Just set callback for ${this._id}:`,
//             this._requestHeaders,
//           )

//           const response = this.responseText
//           console.log('Intial resposne dat', response)

//           if (response.length > 0) {
//             let jsonifiedParams = {}
//             if (postData) { jsonifiedParams = JSON.parse(postData) }
//             else {
//               const queryParams = getQueryParams(this._url)

//               for (const [key, value] of Object.entries(queryParams))
//                 jsonifiedParams[key] = JSON.parse(value)
//             }

//             if (!RequestVariables.reqBodyPopulated)
//               extractReqBody(jsonifiedParams)

//             const jsonifiedResp = JSON.parse(response)

//             if (actionName === 'HomeTimeline') {
//               if (
//                 !RequestVariables.cursors_fetched.includes(
//                   jsonifiedParams.variables.cursor,
//                 )
//                 || this.unorganicCall
//               ) {
//                 const event = new CustomEvent('batchReceived', {
//                   detail: {
//                     batchCounter: RequestVariables.batch_counter,
//                     batchCountTarget: MAX_TOTAL_BATCH_FETCH,
//                     id: this._id,
//                     url: this._url,
//                     startTime: this._startTime,
//                     type: actionName,
//                     response: jsonifiedResp,
//                   },
//                 })

//                 window.dispatchEvent(event)
//                 RequestVariables.batch_counter += 1

//                 console.log(
//                   `Request Headers for ID ${this._id}:`,
//                   this._requestHeaders,
//                 )
//                 console.log(
//                   `Waiting for the green light for connection #${this._id}`,
//                 )
//               }
//             }

//             if (
//               RequestVariables.cursors_fetched.length + 1
//               < MAX_TOTAL_BATCH_FETCH
//             ) {
//               // make a call to fetch the next batch or initiate a call (if on the "following" feed) to fetch the "for you" batches

//               let cursorVal = null

//               if (actionName === 'HomeTimeline') {
//                 const cursorBottom
//                   = jsonifiedResp.data.home.home_timeline_urt.instructions
//                     .filter(el => el.type === 'TimelineAddEntries')[0]
//                     .entries.filter(el =>
//                       el.entryId.includes('cursor-bottom'),
//                     )[0]
//                 cursorVal = cursorBottom.content.value
//                 setTimeout(() => {
//                   makeUnorganicCall(
//                     actionName,
//                     this._requestHeaders,
//                     cursorVal,
//                   )
//                 }, pickRandomWaitTime())
//               }
//               else {
//                 makeUnorganicCall(
//                   'HomeTimeline',
//                   this._requestHeaders,
//                   cursorVal,
//                 )
//               }
//             }
//           }
//         }
//       }
//     }

//     return send.apply(this, arguments)
//   }
// })(XMLHttpRequest)

// window.addEventListener(
//   'CustomFeedReady',
//   (evt) => {
//     console.log(`Green light for connection #${evt.detail.id}`)

//     RequestVariables.cursors_fetched = []
//     RequestVariables.response_events = []

//     console.log(`Storing this response for connection #${evt.detail.response}`)
//     const event_handler = event_handlers[evt.detail.id]

//     Object.defineProperty(event_handler.source, 'responseText', {
//       writable: true,
//     })

//     Object.defineProperty(event_handler.source, 'response', {
//       writable: true,
//     })

//     event_handler.source.responseText = evt.detail.response
//     event_handler.source.response = evt.detail.response

//     // event_handler["source"].postData = evt.detail.response;

//     console.log('CustomFeedReady: ', event_handler.source)

//     console.log()
//     event_handler.callback.apply(
//       event_handler.source,
//       event_handler.arguments,
//     )
//   },
//   false,
// );

/*****************************
 * Change URL event
 *****************************/

// https://stackoverflow.com/questions/6390341/how-to-detect-if-url-has-changed-after-hash-in-javascript
// (() => {
//   const oldPushState = history.pushState
//   history.pushState = function pushState() {
//     const ret = oldPushState.apply(this, arguments)
//     window.dispatchEvent(new Event('pushstate'))
//     window.dispatchEvent(new Event('locationchange'))
//     return ret
//   }

//   const oldReplaceState = history.replaceState
//   history.replaceState = function replaceState() {
//     const ret = oldReplaceState.apply(this, arguments)
//     window.dispatchEvent(new Event('replacestate'))
//     window.dispatchEvent(new Event('locationchange'))
//     return ret
//   }

//   window.addEventListener('popstate', () => {
//     window.dispatchEvent(new Event('locationchange'))
//   })
// })()

// window.addEventListener('locationchange', () => {
//   const event = new CustomEvent('UrlChanged', {
//     detail: {
//       url: location.href,
//     },
//   })
//   window.dispatchEvent(event)
// })

// // Log the first load
// window.dispatchEvent(new Event('locationchange'))
