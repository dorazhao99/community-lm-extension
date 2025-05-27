<h1 align="center">
<br>
<img src="https://i.postimg.cc/Gt36ZsMB/logo.png" width="150">
<br>
    Knoll
</h1>
<p align="center">
<b>Knoll is a browser extension for adding external knowledge to AI chatbots (ChatGPT/Claude). </b>
<br><br> 
        <a href="https://arxiv.org/abs/2505.19335">
            <img src="https://img.shields.io/badge/📝-Paper-0392cf">
        </a>
        <a href="https://knollapp.com">
            <img src="https://img.shields.io/badge/🌐-Website-f18f33">
        </a>
        <a href="https://chromewebstore.google.com/detail/knoll/fmboebkmcojlljnachnegpbikpnbanfc">
            <img src="https://img.shields.io/badge/🧩-Chrome%20Extension-8a58d6">
        </a>
        <a>
            <img src="https://img.shields.io/chrome-web-store/users/fmboebkmcojlljnachnegpbikpnbanfc">
        </a>

<br/><br/>
    The project is open-source and ad-free.
<br/><br/>
</a>
</p>


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
- [Flask Server](https://github.com/dorazhao99/community-lm-embedding)

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
