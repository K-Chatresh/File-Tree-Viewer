# File Tree Viewer

Open `index.html` in a browser that supports `showDirectoryPicker` (such as Chrome or Edge) and select a local folder, including a cloned GitHub repository. The app does not currently load remote GitHub URLs.

The displayed tree and copied text automatically omit files and folders matched by `.gitignore`, including nested `.gitignore` files, wildcard patterns and `!` exceptions. Rules apply relative to the folder containing each `.gitignore`; ignored directories are skipped entirely. The `.git` metadata directory is also hidden. Manual exclusions still work for visible items.

Ignore rules are refreshed when selecting a folder again. The viewer applies ignore rules even to matching files already tracked by Git. It does not read global Git excludes or `.git/info/exclude`.

## Development

```sh
npm install
npm test
npm start
```

The browser-compatible `ignore` dependency is bundled in `vendor/ignore.js`, so opening the HTML needs no CDN or build step. After updating the dependency, regenerate the bundle:

```sh
npm run build:ignore
```
