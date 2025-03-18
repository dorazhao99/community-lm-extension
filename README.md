# Knoll

[Landing Page](https://knollapp.com) | [Extension](https://chromewebstore.google.com/detail/knoll/fmboebkmcojlljnachnegpbikpnbanfc?hl=en-US&utm_source=ext_sidebar)

Knoll is a browser extension for adding external knowledge to AI chatbots (ChatGPT/Claude). 

The project is open-source and ad-free.

<a href="https://chromewebstore.google.com/detail/knoll/fmboebkmcojlljnachnegpbikpnbanfc?hl=en-US&utm_source=ext_sidebar">
    <img src="https://developer.chrome.com/static/docs/webstore/branding/image/mPGKYBIR2uCP0ApchDXE.png">
</a>

## Features
Knoll has a rich set of features supporting for both adding the information you want and then integrating it into your model's context when relevant. 
- ✂️ Clip any text on the Internet to store
- 🔗 Share the text you store with friends
- 📄 Use any Google Doc or Markdown file you have as a knowledge
- 🌐 Import existing knowledge repositories that other users have shared
- 🖥️ Directly integrated into the default chat interface

Knoll is directly integrated with the following AI services. 
- ChatGPT
- Claude

## Contribution
You want to make Knoll even better? There are lots of ways you can contribute even if you cannot code yourself:

* **Share this project.** The simplest way of contributing is by sharing this project with your friends and family. 
* **Report Issues.** If you see some parts of the app not working as expected, if you want to give any kind of feedback or if you just have a question you can submit an issue on the [issue page](https://github.com/dorazhao99/community-lm-extension/issues) of this project or using our [bug report form](https://docs.google.com/forms/d/e/1FAIpQLSfjB7zY4lH6jPOok0rsIu4Qbg2lVXMeJatyM3cReUQlUWV3bQ/viewform).
* **Write Code.** And then there is the standard way of contributing to an open-source project. Please feel free to submit proposals directly in the form of a PR or Issue.


## Usage

### Folders

- `src` - main source.
  - `contentScript` - scripts and components to be injected as `content_script`
  - `background` - scripts for background.
  - `styles` - styles shared in popup and options page
  - `manifest.ts` - manifest for the extension.
- `extension` - extension package root.
  - `assets` - static assets.
  - `dist` - built files, also serve stub entry for Vite on development.
- `scripts` - development and bundling helper scripts.

### Servers 
To run the extension, you will need to have our two servers running as well:
- [Node.js Server](https://github.com/dorazhao99/community-lm-server)
- [Flask Server](

### Development

```bash
pnpm run dev
```
Then **load extension in browser with the `extension/` folder**.



### Build

To build the extension, run

```bash
pnpm run build
```

And then pack files under `extension`, you can upload `extension.crx` or `extension.xpi` to appropriate extension store.

## Credits

This repo was made based on https://github.com/antfu/vitesse-webext and https://github.com/StanfordHCI/FeedMonitor
