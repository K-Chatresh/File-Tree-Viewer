(function (root, factory) {
    if (typeof window !== 'undefined') {
        root.createTreeFilter = factory(root.GitIgnore);
    } else {
        module.exports = factory(require('ignore'));
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (ignore) {
    // One filter per selected folder. Paths are relative to that folder,
    // independently of the root-name-prefixed paths used for manual exclusions.
    return function createTreeFilter() {
        const contexts = new WeakMap();

        async function visibleEntries(directory, relativePath = '', inherited = []) {
            let rules = contexts.get(directory);
            if (!rules) {
                rules = inherited;
                try {
                    const file = await directory.getFileHandle('.gitignore');
                    const text = await (await file.getFile()).text();
                    rules = [...inherited, { base: relativePath, matcher: ignore().add(text) }];
                } catch (error) {
                    // A missing .gitignore is normal; unreadable rules must not
                    // silently produce a tree containing ignored content.
                    if (error.name !== 'NotFoundError') throw error;
                }
                contexts.set(directory, rules);
            }

            const entries = [];
            for await (const entry of directory.values()) {
                if (entry.name === '.git') continue;
                const path = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                const candidate = path + (entry.kind === 'directory' ? '/' : '');
                let ignored = false;
                for (const { base, matcher } of rules) {
                    const localPath = base ? candidate.slice(base.length + 1) : candidate;
                    const result = matcher.test(localPath);
                    if (result.ignored) ignored = true;
                    else if (result.unignored) ignored = false;
                }
                if (!ignored) entries.push(entry);
            }
            entries.sort((a, b) => (b.kind === 'directory') - (a.kind === 'directory') || a.name.localeCompare(b.name));
            return { entries, rules };
        }

        return { visibleEntries };
    };
});
