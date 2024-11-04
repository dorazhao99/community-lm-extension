const eventsManager = new EventsManager()
Globals.tab_id = uuidv4()

if (location.href.includes('chatgpt.com')) {
  // We are on Twitter
  chrome.storage.sync.get(['user_id', 'user_handle'], (items) => {
    let user_id = items.user_id
    const user_handle = items.user_handle

    console.log('getting user info from local storge', items)

    if (!user_id) {
      user_id = uuidv4()

      chrome.storage.sync.set({ user_id }, () => {
        run(user_id)
      })
    }
    else { run(user_id, user_handle) }
  })
}
else {
  // We are on the hub server, nothing to do
  console.log('Extension running...')
}

function passUserInfo() {
  const userInfoEvent = new CustomEvent('setUserInfo',
    {
      detail: {
        userId: Globals.user_id,
        handle: Globals.user_handle,
      },
    })

  window.dispatchEvent(userInfoEvent)
}

function run(user_id, user_handle) {
  Globals.user_id = user_id
  if (user_handle)
    Globals.user_handle = user_handle

  eventsManager.run()
  window.addEventListener('UrlChanged', eventsManager.onUrlChange, false)

  ////////////////////////////////////////
  // Inject the script in the page space
  ////////////////////////////////////////
  const s = document.createElement('script')
  s.src = chrome.runtime.getURL('dist/contentScripts/injected.js')
  s.onload = function () {
    passUserInfo()
    this.remove()
  };
  (document.head || document.documentElement).appendChild(s)
}
