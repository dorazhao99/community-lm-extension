import fs from 'fs-extra'
import type { Manifest } from 'webextension-polyfill'
import type PkgType from '../package.json'
import { isDev, isFirefox, port, r } from '../scripts/utils'
import constants from "../services/constants"

export async function getManifest() {
  const pkg = (await fs.readJSON(r('package.json'))) as typeof PkgType

  // update this file to update this manifest.json
  // can also be conditional based on your need
  const manifest: Manifest.WebExtensionManifest = {
    manifest_version: 3,
    name: pkg.displayName || pkg.name,
    version: pkg.version,
    description: pkg.description,
    action: {
      default_icon: './assets/logo.png',
      default_popup: './dist/popup/index.html',
    },
    options_ui: {
      page: './dist/options/index.html',
      open_in_tab: true,
    },
    background: isFirefox
      ? {
          scripts: ['dist/background/index.mjs'],
          type: 'module',
        }
      : {
          service_worker: './dist/background/index.mjs',
        },
    icons: {
      16: './assets/logo.png',
      48: './assets/logo.png',
      128: './assets/logo.png',
    },
    permissions: ['storage', 'contextMenus'],
    // host_permissions: ['*://chatgpt.com/*'],
    externally_connectable: {
      // matches: ["*://localhost/*"],
      matches: ["*://*.knollapp.com/*", "*://localhost/*"],
    }, 
    content_scripts: [
      {
        // matches: ['*://chatgpt.com/*', '*://knollapp.com/*', '*://api.knollapp.com/*', "*://localhost/*"],
        // matches: ['*://chat.com/*', '*://chatgpt.com/*', '*://knollapp.com/*', '*://api.knollapp.com/*', '*://embed.knollapp.com/*', '*://claude.ai/*'],
        matches: ['*://chat.com/*', '*://chatgpt.com/*', '*://knollapp.com/*', '*://api.knollapp.com/*', '*://embed.knollapp.com/*', '*://claude.ai/*', "*://localhost/*"],
        js: [
          'dist/contentScripts/index.global.js',
          'dist/contentScripts/config.js',
          'dist/contentScripts/libs/jquery.min.js',
          'dist/contentScripts/libs/client.js',
          'dist/contentScripts/libs/timeme.min.js',
          'dist/contentScripts/libs/utils.js',
          'dist/contentScripts/events.js',
          'dist/contentScripts/logic.js',
          'dist/contentScripts/launcher.js',
        ],
        // css: ['public/main.css'],
        run_at: 'document_start',
      },
    ],
    web_accessible_resources: [
      {
        resources: [
          'dist/contentScripts/style.css',
          'dist/contentScripts/injected.js',
        ],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: isDev
        ? // this is required on dev for Vite script to load
          `script-src \'self\' http://localhost:${port}; object-src \'self\'`
        : 'script-src \'self\'; object-src \'self\'',
    },
  }

  // FIXME: not work in MV3
  if (isDev && false) {
    // for content script, as browsers will cache them for each reload,
    // we use a background script to always inject the latest version
    // see src/background/contentScriptHMR.ts
    delete manifest.content_scripts
    manifest.permissions?.push('webNavigation')
  }

  return manifest
}

// import fs from 'fs-extra'
// import type { Manifest } from 'webextension-polyfill'
// import type PkgType from '../package.json'
// import { isDev, port, r } from '../scripts/utils'

// export async function getManifest() {
//   const pkg = await fs.readJSON(r('package.json')) as typeof PkgType

//   // update this file to update this manifest.json
//   // can also be conditional based on your need
//   const manifest: Manifest.WebExtensionManifest = {
//     manifest_version: 2,
//     name: pkg.displayName || pkg.name,
//     version: pkg.version,
//     description: pkg.description,
//     browser_action: {
//       default_icon: './assets/icon-512.png',
//       default_popup: './dist/popup/index.html',
//     },
//     options_ui: {
//       page: './dist/options/index.html',
//       open_in_tab: true,
//       chrome_style: false,
//     },
//     background: {
//       page: './dist/background/index.html',
//       persistent: false,
//     },
//     icons: {
//       16: './assets/icon-512.png',
//       48: './assets/icon-512.png',
//       128: './assets/icon-512.png',
//     },
//     permissions: [
//       'tabs',
//       'storage',
//       'activeTab',
//       'http://*/',
//       'https://*/',
//     ],
//     content_scripts: [{
//       matches: ['http://*/*', 'https://*/*'],
//       js: ['./dist/contentScripts/index.global.js'],
//     }],
//     web_accessible_resources: [
//       'dist/contentScripts/style.css',
//     ],
//   }

//   if (isDev) {
//     // for content script, as browsers will cache them for each reload,
//     // we use a background script to always inject the latest version
//     // see src/background/contentScriptHMR.ts
//     delete manifest.content_scripts
//     manifest.permissions?.push('webNavigation')

//     // this is required on dev for Vite script to load
//     manifest.content_security_policy = `script-src \'self\' http://localhost:${port}; object-src \'self\'`
//   }

//   return manifest
// }
