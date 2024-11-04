const { copyFileSync } = require('node:fs')

// Copy a single file

// Alternatively, you can copy an entire directory
// Make sure the destination directory exists beforehand
copyFolderSync('src/contentScripts/core', 'extension/dist/contentScripts')

// Function to recursively copy a folder
function copyFolderSync(source, target) {
  const fs = require('node:fs')
  const path = require('node:path')

  if (!fs.existsSync(target))
    fs.mkdirSync(target)

  const files = fs.readdirSync(source)

  for (const file of files) {
    const current = fs.lstatSync(path.join(source, file))
    if (current.isDirectory())
      copyFolderSync(path.join(source, file), path.join(target, file))
    else
      fs.copyFileSync(path.join(source, file), path.join(target, file))
  }
}
