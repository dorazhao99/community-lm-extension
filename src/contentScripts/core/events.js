class EventsManager {
    // eventsQueue = [];


    static tweetIdRegex = "\\/status\\/([0-9]+)";

    // static allRenderedTweetsIds = new Set();

    static previousRenderGroup = new Set()

    static statusTimer = null;

    static enableDebug = false;

    static renderedMsgsHistory = new Set();

    static visualisedMsgs= new Set();

    static scrolled = true;

    static keys = {37: 1, 38: 1, 39: 1, 40: 1, 33: 1, 34: 1, 32: 1, 35: 1, 36: 1};

    static lockScroll = false;


    run() {
        console.log("Events manager started.");
        $(window).on('resize scroll', this.onScroll).bind(this);
        $(window).on('beforeunload', this.onUnload).bind(this);

        TimeMe.initialize({idleTimeoutInSeconds: 60});
        TimeMe.callWhenUserLeaves(this.userLeaveTab);
        TimeMe.callWhenUserReturns(this.userReturnToTab);

        window.addEventListener("UrlChanged", this.onUrlChange, false);

        let wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
        window.addEventListener(wheelEvent, this.onMouseWheel, {passive: false});
        window.addEventListener('touchmove', this.onMouseWheel, {passive: false});

        window.addEventListener('keydown', this.onKeyDown, false);

        EventsManager.statusTimer = window.setInterval(function () {

            // let tweets = $("article");
            // // console.log(tweets) //tweets.children[1].children[0]
            // // If there are tweets (useful for the first time when tweets are not rendered)
            // if (tweets && tweets.length > 0) {
            //     let msgDOMReferences = {}
            //     let renderedMsgs = new Set()
            //     for (let t = 0; t < tweets.length; t++) {
            //         console.log(tweets[t], tweets[t].innerText)
            //         const children = tweets[t].children[1].children[0]
            //         let divs = $("div[data-message-author-role*=assistant]", children)
            //         // console.log("children", divs)

            //         if (divs && divs.length > 0) {
            //             // console.log('Divs 0 Events', divs);
            //             if (divs[0].textContent.length > 0 && divs[0].textContent.toLowerCase() !== '&zerowidthspace;') {
            //                 const msg_id = divs[0].dataset.messageId
            //                 if (!renderedMsgs.has(msg_id)) {
            //                     // console.log('Message ID', msg_id)
            //                     renderedMsgs.add(msg_id)
            //                     msgDOMReferences[msg_id] = divs[0]
            //                 }
            //             }
            //         }
            //         if (renderedMsgs.size > 0 ) {
            //             this.onCheckRenderStatus(renderedMsgs);
            //             EventsManager.previousRenderGroup = renderedMsgs;
            //             for (const [msgId, domElement] of Object.entries(msgDOMReferences)) {
            //                 // console.log('message Id', msgId, domElement)
            //                 this.onMsgAvailable(msgId, domElement);
            //             }
            //         }
            //     }
            // }
            //     // for (let t = 0; t < tweets.length; t++) {
            //     //     console.log(tweets[t], tweets[t].innerText)
            //     //     const children = tweets[t].children[1].children[0]
            //     //     console.log("children", children)
            //     //     let divs = $("div[class*=agent]", children);
            //     //     console.log("Search agent", $("div[data-message-author-role*=assistant]", children))
            //     //     if (divs && divs.length > 0) {
            //     //         const msg_id = tweets[t].dataset.testid
            //     //         renderedMsgs.add(msg_id)
            //     //         msgDOMReferences[msg_id] = divs[0]
            //     //         console.log('Check', msgDOMReferences, divs)
            //     //     }
            //     // }
            //     // if (renderedMsgs.size > 0 && !eqSet(EventsManager.previousRenderGroup, renderedMsgs)) {
            //     //     this.onCheckRenderStatus(renderedMsgs);
            //     //     EventsManager.previousRenderGroup = renderedMsgs;
            //     //     for (const [msgId, domElement] of Object.entries(msgDOMReferences)) {
            //     //         console.log('message Id', msgId, domElement)
            //     //         this.onMsgAvailable(msgId, domElement);
            //     //     }
            //     // }
            //     EventsManager.scrolled = false;
        }, 600);


        window.addEventListener("FavoriteTweet", this.onFavoriteTweet, false);
        window.addEventListener("CreateRetweet", this.onCreateRetweet, false);
        window.addEventListener("CreateTweet", this.onCreateTweet, false);
    }

    onCreateTweet(data) {
        console.log("onCreateTweet", data.detail);
        client.logEvent("CreateTweet", data.detail);
    }

    onCreateRetweet(data) {
        console.log("CreateRetweet", data.detail);
        client.logEvent("CreateRetweet", data.detail);
    }

    onFavoriteTweet(data) {
        console.log("FavoriteTweet", data.detail);
        client.logEvent("FavoriteTweet", data.detail);
    }


    onCheckRenderStatus(ids) {
        console.log("Rendered messages:", ids);
        let newMsgs = []
        for (let i of ids)
            if (!EventsManager.renderedMsgsHistory.has(i)) {
                newMsgs.push(i);
                EventsManager.renderedMsgsHistory.add(i);
            }
        if (newMsgs.length > 0)
            client.logEvent("RenderedTweets", {ids: newMsgs});
    }

    onScroll(e) {
        // console.log("Scroll", e);
        EventsManager.scrolled = true;
        const event = new CustomEvent("FeedScroll");
        window.dispatchEvent(event);
    }

    onTabStateCheck() {
        console.log("Tab state: " + document.visibilityState)
        client.logEvent("Alive", {"url": document.URL, "visibility": document.visibilityState});
    }

    userLeaveTab() {
        client.logEvent("UserLeaveTab", {"url": document.URL});
        console.log("Leave ")
    }

    userReturnToTab() {
        client.logEvent("UserReturnOnTab", {"url": document.URL});
        console.log("Return")
    }

    onUnload() {
        console.log("Unload")
        let timeSpentOnPage = TimeMe.getTimeOnCurrentPageInSeconds();
        client.logEvent("PageUnload", {"timeOnPage": timeSpentOnPage})
    }

    onUrlChange(e) {
        console.log("Page loaded " + document.URL)
        client.logEvent("UrlChange", {"url": document.URL})
    }

    //NOT USED
    stop() {
        clearInterval(EventsManager.statusTimer);
        TimeMe.stopTimer();
    }


    onMouseWheel(e) {
        if (EventsManager.lockScroll)
            e.preventDefault();
    }

    onKeyDown(e) {
        console.log(e.keyCode)
        if (EventsManager.lockScroll) {
            if (EventsManager.keys[e.keyCode])
                e.preventDefault();
        }
    }

}