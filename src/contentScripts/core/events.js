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
        }, 600);


        window.addEventListener("FavoriteTweet", this.onFavoriteTweet, false);
        window.addEventListener("CreateRetweet", this.onCreateRetweet, false);
        window.addEventListener("CreateTweet", this.onCreateTweet, false);
    }

    onCreateTweet(data) {
        client.logEvent("CreateTweet", data.detail);
    }

    onCreateRetweet(data) {
        client.logEvent("CreateRetweet", data.detail);
    }

    onFavoriteTweet(data) {
        client.logEvent("FavoriteTweet", data.detail);
    }


    onCheckRenderStatus(ids) {
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
        client.logEvent("Alive", {"url": document.URL, "visibility": document.visibilityState});
    }

    userLeaveTab() {
        client.logEvent("UserLeaveTab", {"url": document.URL});
    }

    userReturnToTab() {
        client.logEvent("UserReturnOnTab", {"url": document.URL});
    }

    onUnload() {
        let timeSpentOnPage = TimeMe.getTimeOnCurrentPageInSeconds();
        client.logEvent("PageUnload", {"timeOnPage": timeSpentOnPage})
    }

    onUrlChange(e) {
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
        if (EventsManager.lockScroll) {
            if (EventsManager.keys[e.keyCode])
                e.preventDefault();
        }
    }

}