const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const createTreeFilter = require('../tree-filter');

function directory(name, children) {
    const entries = Object.entries(children).map(([name, value]) =>
        typeof value === 'object' ? directory(name, value) : {
            name, kind: 'file', async getFile() { return { async text() { return value; } }; }
        });
    return {
        name, kind: 'directory',
        async getFileHandle(name) {
            const entry = entries.find(entry => entry.name === name);
            if (!entry) throw Object.assign(new Error('Missing'), { name: 'NotFoundError' });
            return entry;
        },
        async *values() { yield* entries; }
    };
}

async function list(root, filter = createTreeFilter()) {
    const paths = [];
    async function walk(dir, path = '', inherited = []) {
        const { entries, rules } = await filter.visibleEntries(dir, path, inherited);
        for (const entry of entries) {
            const child = path ? `${path}/${entry.name}` : entry.name;
            paths.push(child);
            if (entry.kind === 'directory') await walk(entry, child, rules);
        }
    }
    await walk(root);
    return paths;
}

test('missing ignore file preserves ordinary files and hides Git metadata', async () => {
    assert.deepEqual(await list(directory('repo', { '.git': { config: '' }, src: { 'main.js': '' }, 'README.md': '' })),
        ['src', 'src/main.js', 'README.md']);
});

test('wildcards, recursive patterns, anchored and directory-only rules', async () => {
    const paths = await list(directory('repo', {
        '.gitignore': '*.log\nnode_modules/\n/root.txt\n**/cache/\n',
        'error.log': '', 'root.txt': '', node_modules: { 'index.js': '' },
        src: { 'root.txt': '', node_modules: { 'x.js': '' }, cache: { x: '' }, 'ok.js': '' },
        cache: { x: '' }, 'node_modules.txt': ''
    }));
    assert.deepEqual(paths, ['src', 'src/ok.js', 'src/root.txt', '.gitignore', 'node_modules.txt']);
});

test('negation, comments, escaped punctuation and spaces follow Git rules', async () => {
    const paths = await list(directory('repo', {
        '.gitignore': '# comment\n*.log\n!keep.log\n\\#secret\n\\!secret\nspace\\ \n',
        'drop.log': '', 'keep.log': '', '#secret': '', '!secret': '', 'space ': '', 'space': ''
    }));
    assert.deepEqual(paths, ['.gitignore', 'keep.log', 'space']);
});

test('nested rules override parents without leaking into sibling folders', async () => {
    const paths = await list(directory('repo', {
        '.gitignore': '*.log\n',
        app: { '.gitignore': '!keep.log\n/local.txt\n', 'keep.log': '', 'drop.log': '', 'local.txt': '', sub: { 'local.txt': '' } },
        other: { 'keep.log': '', 'local.txt': '' }
    }));
    assert.deepEqual(paths, ['app', 'app/sub', 'app/sub/local.txt', 'app/.gitignore', 'app/keep.log', 'other', 'other/local.txt', '.gitignore']);
});

test('ignored directories are never traversed, even for negated children', async () => {
    const root = directory('repo', { '.gitignore': 'build/\n!build/keep.txt', build: { 'keep.txt': '' } });
    assert.deepEqual(await list(root), ['.gitignore']);
});

test('rule cache belongs to each folder selection', async () => {
    const root = directory('repo', { '.gitignore': '*.log', 'a.log': '' });
    let reads = 0;
    const getFileHandle = root.getFileHandle;
    root.getFileHandle = async name => { reads++; return getFileHandle(name); };
    const filter = createTreeFilter();
    await list(root, filter);
    await list(root, filter);
    assert.equal(reads, 1);
    await list(root);
    assert.equal(reads, 2);
});

test('unreadable ignore files report the error', async () => {
    const root = directory('repo', {});
    root.getFileHandle = async () => { throw Object.assign(new Error('Denied'), { name: 'NotAllowedError' }); };
    await assert.rejects(list(root), /Denied/);
});

test('browser bundle, rendered tree and clipboard tree use the same filter', async () => {
    function element() {
        return { children: [], style: {}, classList: { add() {}, remove() {}, toggle() {} },
            appendChild(child) { this.children.push(child); }, addEventListener() {} };
    }
    const elements = new Map();
    const context = vm.createContext({
        document: { documentElement: { setAttribute() {} }, createElement: element,
            getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); } },
        localStorage: { getItem() { return null; } },
        window: { matchMedia() { return { matches: false }; } },
        // Electron also exposes CommonJS globals in the renderer.
        module: { exports: {} }, require
    });
    for (const filename of ['vendor/ignore.js', 'tree-filter.js']) {
        vm.runInContext(fs.readFileSync(require.resolve(`../${filename}`), 'utf8'), context);
    }
    const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
    vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    context.root = directory('repo', { '.gitignore': '*.log\ncache/', 'bad.log': '', cache: { x: '' }, src: { 'main.js': '' }, 'keep.txt': '' });
    context.parent = element();
    await vm.runInContext('buildTree(root, parent, "")', context);
    function labels(node) {
        return [node.textContent, ...node.children.flatMap(labels)].filter(Boolean);
    }
    const rendered = labels(context.parent);
    assert.deepEqual(rendered, ['repo', 'src', 'main.js', '.gitignore', 'keep.txt']);
    const text = await vm.runInContext('generateTextTree(root, "", "repo")', context);
    assert.equal(text, '├── src\n│   └── main.js\n├── .gitignore\n└── keep.txt\n');
    vm.runInContext('excludedPaths.add("repo/src")', context);
    assert.equal(await vm.runInContext('generateTextTree(root, "", "repo")', context), '├── .gitignore\n└── keep.txt\n');
});
