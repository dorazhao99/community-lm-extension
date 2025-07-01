<h1 align="center">
<br>
<br>
    LLM Wizard
</h1>
<p align="center">
<b>LLM Wizard is a template for a browser extension for customizing LLM server calls directly on the interface. </b>
<br/><br/>
    The project is open-source and ad-free.
<br/><br/>
</p>


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
