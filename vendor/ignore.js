var GitIgnore = (() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };

  // node_modules/ignore/index.js
  var require_index = __commonJS({
    "node_modules/ignore/index.js"(exports, module) {
      function makeArray(subject) {
        return Array.isArray(subject) ? subject : [subject];
      }
      var UNDEFINED = void 0;
      var EMPTY = "";
      var SPACE = " ";
      var ESCAPE = "\\";
      var REGEX_LITERAL_SPECIAL = /[.*+?()[\]{}^$|\\/]/;
      var BOM = "\uFEFF";
      var REGEX_INVALID_TRAILING_BACKSLASH = /(?:[^\\]|^)\\$/;
      var REGEX_ANCHORED_GLOBSTAR = /^\/\*{2,}$/;
      var REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION = /^\\!/;
      var REGEX_REPLACE_LEADING_EXCAPED_HASH = /^\\#/;
      var REGEX_SPLITALL_CRLF = /\r?\n/g;
      var DOUBLE_SLASH = "//";
      var SLASH_CODE = 47;
      var DOT_CODE = 46;
      var SLASH = "/";
      var TMP_KEY_IGNORE = "node-ignore";
      if (typeof Symbol !== "undefined") {
        TMP_KEY_IGNORE = /* @__PURE__ */ Symbol.for("node-ignore");
      }
      var KEY_IGNORE = TMP_KEY_IGNORE;
      var define = (object, key, value) => {
        Object.defineProperty(object, key, { value });
        return value;
      };
      var RETURN_FALSE = () => false;
      var POSIX_CLASSES = {
        alnum: "0-9A-Za-z",
        alpha: "A-Za-z",
        blank: " \\t",
        cntrl: "\\x00-\\x1f\\x7f",
        digit: "0-9",
        graph: "!-.0-~",
        lower: "a-z",
        print: " -.0-~",
        punct: "!-.:-@\\[-`{-~",
        // git's `sane-ctype.h` classifies \v and \f as control, not space,
        //   unlike C's `isspace`
        space: " \\t\\n\\r",
        upper: "A-Z",
        xdigit: "0-9A-Fa-f"
      };
      var CLASS_MEMBERS_TO_ESCAPE = "\\]^-[";
      var escapeMember = (char) => CLASS_MEMBERS_TO_ESCAPE.indexOf(char) < 0 ? char : ESCAPE + char;
      var NON_SLASH = "(?!\\/)";
      var classSource = (negated, body) => {
        if (negated) {
          return `[^\\/${body}]`;
        }
        const source = `[${body}]`;
        return new RegExp(source).test("/") ? NON_SLASH + source : source;
      };
      var scanBracket = (pattern, start) => {
        const { length } = pattern;
        let index = start + 1;
        let negated = EMPTY;
        const lead = pattern[index];
        if (lead === "!" || lead === "^") {
          negated = "^";
          index++;
        }
        let body = EMPTY;
        let prev = EMPTY;
        for (; ; ) {
          const char = pattern[index];
          if (char === UNDEFINED) {
            return null;
          }
          if (char === ESCAPE) {
            const escaped = pattern[index + 1];
            if (escaped === UNDEFINED) {
              return null;
            }
            body += escapeMember(escaped);
            prev = escaped;
            index++;
          } else if (char === "-" && prev && index + 1 < length && pattern[index + 1] !== "]") {
            index++;
            let to = pattern[index];
            if (to === ESCAPE) {
              to = pattern[index += 1];
            }
            if (prev <= to) {
              body += `-${escapeMember(to)}`;
            }
            prev = EMPTY;
          } else if (char === "[" && pattern[index + 1] === ":") {
            const nameStart = index + 2;
            let end = nameStart;
            while (end < length && pattern[end] !== "]") {
              end++;
            }
            if (end === length) {
              return null;
            }
            if (end > nameStart && pattern[end - 1] === ":") {
              const name = pattern.slice(nameStart, end - 1);
              if (!Object.prototype.hasOwnProperty.call(POSIX_CLASSES, name)) {
                return null;
              }
              body += POSIX_CLASSES[name];
              prev = EMPTY;
              index = end;
            } else {
              body += escapeMember("[");
              prev = "[";
              index = nameStart - 2;
            }
          } else {
            body += escapeMember(char);
            prev = char;
          }
          index++;
          if (pattern[index] === "]") {
            return {
              end: index,
              source: classSource(negated, body)
            };
          }
        }
      };
      var NEVER_MATCH = "[]";
      var PLACEHOLDER = "\0";
      var REGEX_RESTORE_PLACEHOLDER = new RegExp(
        `${PLACEHOLDER}(\\d+)${PLACEHOLDER}`,
        "g"
      );
      var TRAILING_WILDCARD = "\uE000";
      var TRAILING_DOUBLESTAR = "\uE001";
      var isReserved = (char) => char === PLACEHOLDER || char === TRAILING_WILDCARD || char === TRAILING_DOUBLESTAR;
      var extractBrackets = (pattern) => {
        const sources = [];
        const hold = (source) => `${PLACEHOLDER}${sources.push(source) - 1}${PLACEHOLDER}`;
        const { length } = pattern;
        let out = EMPTY;
        let index = 0;
        while (index < length) {
          const char = pattern[index];
          if (char === ESCAPE) {
            const escaped = pattern[index + 1];
            if (escaped === UNDEFINED || escaped === SLASH && index + 2 === length) {
              out += hold(NEVER_MATCH);
            } else if (escaped === "*" || escaped === "[" || escaped === SPACE) {
              out += pattern.slice(index, index + 2);
            } else {
              out += hold(
                REGEX_LITERAL_SPECIAL.test(escaped) ? ESCAPE + escaped : isReserved(escaped) ? `[${escaped}]` : escaped
              );
            }
            index += 2;
          } else if (isReserved(char)) {
            out += hold(`[${char}]`);
            index++;
          } else if (char === "[") {
            const scanned = scanBracket(pattern, index);
            if (scanned === null) {
              out += hold(NEVER_MATCH);
              index = length;
            } else {
              out += hold(scanned.source);
              index = scanned.end + 1;
            }
          } else {
            out += char;
            index++;
          }
        }
        return {
          source: out,
          sources
        };
      };
      var DIRECT = null;
      var REGEX_INNER_SLASH = /\/(?!$)/;
      var REPLACERS = [
        // Replace (\ ) with ' '
        // Only a space: an escaped tab or other whitespace is already a literal by
        //   the time it reaches here, and a bare tab must be left as one, not turned
        //   into a space.
        // (\ ) -> ' '
        // (\\ ) -> '\\ '
        // (\\\ ) -> '\\ '
        [
          // A run of backslashes is taken whole, from its first one, so no match
          //   ever starts again inside it -- `(\\+?) ` did, which made a long run
          //   quadratic.
          /(\\+)( ?)/g,
          (_, run, space) => space ? run.slice(0, run.length - run.length % 2) + SPACE : run,
          ESCAPE + SPACE
        ],
        // git's wildmatch() reads a run of two or more asterisks as one globstar
        //   whenever the run fills a path segment: it starts the pattern or follows
        //   a `/`, and it ends the pattern or comes before a `/`. A run of two is
        //   already `**`; a longer one is folded into `**` here, so the steps
        //   below only ever have to know `**`.
        // `***/foo` -> `**/foo`, `a/***/b` -> `a/**/b`, `a/***` -> `a/**`
        // git also takes a run beside a literal prefix (`a***/b`) or beside an
        //   escaped slash (`***\/b`) as a globstar, and this does not; the README
        //   lists both, under "A run of asterisks".
        [
          /(^|\/)\*{3,}(?=\/|$)/g,
          (_, start) => `${start}**`,
          "*"
        ],
        // Escape metacharacters
        // which is written down by users but means special for regular expressions.
        // > There are 12 characters with special meanings:
        // > - the backslash \,
        // > - the caret ^,
        // > - the dollar sign $,
        // > - the period or dot .,
        // > - the vertical bar or pipe symbol |,
        // > - the question mark ?,
        // > - the asterisk or star *,
        // > - the plus sign +,
        // > - the opening parenthesis (,
        // > - the closing parenthesis ),
        // > - and the opening square bracket [,
        // > - the opening curly brace {,
        // > These special characters are often called "metacharacters".
        [
          /[\\$.|*+(){^]/g,
          (match) => `\\${match}`
        ],
        [
          // > a question mark (?) matches a single character
          /(?!\\)\?/g,
          () => "[^/]",
          "?"
        ],
        // leading slash
        [
          // > A leading slash matches the beginning of the pathname.
          // > For example, "/*.c" matches "cat-file.c" but not "mozilla-sha1/sha1.c".
          // A leading slash matches the beginning of the pathname
          /^\//,
          () => "^",
          SLASH
        ],
        // replace special metacharacter slash after the leading slash
        [
          /\//g,
          () => "\\/",
          SLASH
        ],
        [
          // > A leading "**" followed by a slash means match in all directories.
          // > For example, "**/foo" matches file or directory "foo" anywhere,
          // > the same as pattern "foo".
          // > "**/foo/bar" matches file or directory "bar" anywhere that is directly
          // >   under directory "foo".
          // Notice that the '*'s have been replaced as '\\*'
          /^\^*(?:\\\*\\\*\\\/)+/,
          // '**/foo' <-> 'foo'
          () => "^(?:.*\\/)?",
          "*"
        ],
        // starting
        [
          // there will be no leading '/'
          //   (which has been replaced by section "leading slash")
          // If starts with '**', adding a '^' to the regular expression also works
          DIRECT,
          (source, pattern) => {
            if (!source || source[0] === "^") {
              return source;
            }
            const anchor = !REGEX_INNER_SLASH.test(pattern) ? "(?:^|\\/)" : "^";
            return anchor + source;
          }
        ],
        // two globstars
        [
          // Use lookahead assertions so that we could match more than one `'/**'`
          /\\\/\\\*\\\*(?=\\\/|$)/g,
          // Zero, one or several directories
          // should not use '*', or it will be replaced by the next replacer
          // Check if it is not the last `'/**'`
          (_, index, str) => index + 6 < str.length ? str.slice(index + 6) === "\\/" ? "(?:\\/[^\\/]+)+" : "(?:\\/[^\\/]+)*" : `\\/${TRAILING_DOUBLESTAR}`,
          "*"
        ],
        // normal intermediate wildcards
        [
          // Never replace escaped '*'
          // ignore rule '\*' will match the path '*'
          // 'abc.*/' -> go
          // 'abc.*'  -> skip this rule,
          //    coz trailing single wildcard will be handed by [trailing wildcard]
          /(^|[^\\]+)(\\\*)+(?=.+)/g,
          // '*.js' matches '.js'
          // '*.js' doesn't match 'abc'
          (_, p1, p2) => {
            const unescaped = p2.replace(/\\\*/g, "[^\\/]*");
            return p1 + unescaped;
          },
          "*"
        ],
        // trailing wildcard, held apart from a literal star
        [
          // The step above leaves a trailing `*` alone, so a single `\*` is all that
          //   can be left at the end here, and what stands in front of it says which
          //   kind it is. A wildcard arrives as the escaper wrote it, `\*` with
          //   nothing before it; a literal arrives as the user's own escape, which
          //   the escaper doubled, and then the star's own -- `\\` and then `\*`.
          //   There is no third case: every backslash still reaching the chain is
          //   one `\*`, `\[` or `\ ` carries itself, and each is followed by its
          //   own character, so a longer run can never form. This runs while the
          //   two are still distinct, before the unescape steps below collapse the
          //   literal onto the very `\*` a wildcard leaves behind.
          /(^|[^\\])((?:\\\\)*)\\\*$/,
          (match, p1, p2) => p2 === EMPTY ? p1 + TRAILING_WILDCARD : match,
          "*"
        ],
        [
          // unescape, revert step 3 except for back slash
          // For example, if a user escape a '\\*',
          // after step 3, the result will be '\\\\\\*'
          /\\\\\\(?=[$.|*+(){^])/g,
          () => ESCAPE,
          ESCAPE + ESCAPE
        ],
        [
          // '\\\\' -> '\\'
          /\\\\/g,
          () => ESCAPE,
          ESCAPE + ESCAPE
        ],
        [
          // Every real bracket expression -- POSIX classes included -- has already
          //   been held aside by `extractBrackets`, so the only `[` left in the
          //   pattern is an escaped, literal one.
          // A backslash could only stand at the end of the range if it quoted the
          //   `]`, and `\]` is held aside long before this.
          /\\\[([^\]/]*?)($|\])/g,
          // '\\[bar]' -> '\\\\[bar]'
          (match, range, close) => `\\[${range}${close}`,
          "["
        ],
        // ending
        [
          // 'js' will not match 'js.'
          // 'ab' will not match 'abc'
          DIRECT,
          // WTF!
          // https://git-scm.com/docs/gitignore
          // changes in [2.22.1](https://git-scm.com/docs/gitignore/2.22.1)
          // which re-fixes #24, #38
          // > If there is a separator at the end of the pattern then the pattern
          // > will only match directories, otherwise the pattern can match both
          // > files and directories.
          // 'js*' will not match 'a.js'
          // 'js/' will not match 'a.js'
          // 'js' will match 'a.js' and 'a.js/'
          (source) => {
            const last = source[source.length - 1];
            if (!last || last === TRAILING_WILDCARD || last === TRAILING_DOUBLESTAR) {
              return source;
            }
            return last === SLASH ? `${source}$` : `${source}(?=$|\\/$)`;
          }
        ]
      ];
      var REGEX_REPLACE_TRAILING_WILDCARD = /(^|\\\/)?\uE000$/;
      var MODE_IGNORE = "regex";
      var MODE_CHECK_IGNORE = "checkRegex";
      var UNDERSCORE = "_";
      var replaceTrailingWildcard = (_, p1) => {
        const prefix = p1 ? `${p1}[^/]+` : "[^/]*";
        return `${prefix}(?=$|\\/$)`;
      };
      var REGEX_REPLACE_TRAILING_DOUBLESTAR = /\uE001$/;
      var replaceTrailingDoublestar = () => ".+(?=$|\\/$)";
      var WILDCARD = "[^\\/]*";
      var separatorAfter = (run, at) => {
        let separator = EMPTY;
        for (let index = at + 1; index < run.length && !run[index].wildcard; index++) {
          separator += run[index].single;
        }
        return separator;
      };
      var pinWildcards = (source) => {
        if (source.indexOf(WILDCARD) < 0) {
          return source;
        }
        const tokens = [];
        const { length } = source;
        let index = 0;
        while (index < length) {
          const char = source[index];
          if (source.startsWith(WILDCARD, index)) {
            tokens.push({ wildcard: true });
            index += WILDCARD.length;
          } else if (char === "[") {
            let end = index + 1;
            if (source[end] === "^") {
              end++;
            }
            if (source[end] === "]") {
              end++;
            }
            while (end < length && source[end] !== "]") {
              end += source[end] === ESCAPE ? 2 : 1;
            }
            end++;
            tokens.push({ single: source.slice(index, end) });
            index = end;
          } else if (char === ESCAPE) {
            tokens.push({ single: source.slice(index, index + 2) });
            index += 2;
          } else if (char === "(") {
            let depth = 0;
            let end = index;
            do {
              if (source[end] === ESCAPE) {
                end++;
              } else if (source[end] === "(") {
                depth++;
              } else if (source[end] === ")") {
                depth--;
              }
              end++;
            } while (end < length && depth > 0);
            if ("*+?".indexOf(source[end]) >= 0) {
              end++;
            }
            tokens.push({ boundary: source.slice(index, end) });
            index = end;
          } else if (char === "^" || char === "$") {
            tokens.push({ boundary: char });
            index++;
          } else {
            tokens.push({ single: char });
            index++;
          }
        }
        let out = EMPTY;
        let run = [];
        const flush = () => {
          let lastWildcard;
          run.forEach((token, at) => {
            if (token.wildcard) {
              lastWildcard = at;
            }
          });
          run.forEach((token, at) => {
            if (!token.wildcard) {
              out += token.single;
              return;
            }
            out += at === lastWildcard ? WILDCARD : `(?:(?!${separatorAfter(run, at)})[^\\/])*`;
          });
          run = [];
        };
        tokens.forEach((token) => {
          if (token.boundary === void 0) {
            run.push(token);
            return;
          }
          flush();
          out += token.boundary;
        });
        flush();
        return out;
      };
      var makeRegexPrefix = (pattern) => {
        if (REGEX_ANCHORED_GLOBSTAR.test(pattern)) {
          pattern = "**";
        }
        const { source, sources } = extractBrackets(pattern);
        const replaced = REPLACERS.reduce(
          // A pass whose matcher finds nothing hands back the very string it was
          //   given, so asking first costs a search and saves a rewrite. Ten of the
          //   fifteen passes never fire for a typical .gitignore line, and between
          //   them they were 45% of this chain.
          (prev, [matcher, replacer, required]) => {
            if (matcher === DIRECT) {
              return replacer(prev, pattern);
            }
            if (required !== UNDEFINED && prev.indexOf(required) < 0) {
              return prev;
            }
            return matcher.test(prev) ? prev.replace(matcher, replacer.bind(pattern)) : prev;
          },
          source
        );
        return sources.length ? replaced.replace(
          REGEX_RESTORE_PLACEHOLDER,
          (match, index) => sources[index]
        ) : replaced;
      };
      var checkSourceOf = (body, prefix) => {
        if (body[body.length - 1] === SLASH) {
          prefix = makeRegexPrefix(body.slice(0, -1));
        }
        const head = prefix.slice(0, -1);
        const last = prefix[prefix.length - 1];
        return last === TRAILING_WILDCARD ? `${head}$` : last === TRAILING_DOUBLESTAR ? `${head}.*$` : NEVER_MATCH;
      };
      var matchesBasename = (body) => {
        const index = body.indexOf(SLASH);
        return index < 0 || index === body.length - 1;
      };
      var basenameOf = (path) => {
        const end = path.length - 1;
        const index = path.lastIndexOf(
          SLASH,
          path[end] === SLASH ? end - 1 : end
        );
        return index < 0 ? path : path.slice(index + 1);
      };
      var parentOf = (path) => {
        if (path.charCodeAt(0) === SLASH_CODE || path.indexOf(DOUBLE_SLASH) >= 0) {
          const slices = path.split(SLASH).filter(Boolean);
          slices.pop();
          return slices.length ? slices.join(SLASH) + SLASH : EMPTY;
        }
        const end = path.length - 1;
        const cut = path.lastIndexOf(
          SLASH,
          path.charCodeAt(end) === SLASH_CODE ? end - 1 : end
        );
        return cut < 0 ? EMPTY : path.slice(0, cut + 1);
      };
      var isString = (subject) => typeof subject === "string";
      var checkPattern = (pattern) => pattern && isString(pattern) && !REGEX_INVALID_TRAILING_BACKSLASH.test(pattern);
      var splitPattern = (pattern) => pattern.split(REGEX_SPLITALL_CRLF).filter(Boolean);
      var IgnoreRule = class {
        constructor(pattern, mark, body, ignoreCase, negative, prefix) {
          this.pattern = pattern;
          this.mark = mark;
          this.negative = negative;
          define(this, "body", body);
          define(this, "ignoreCase", ignoreCase);
          define(this, "regexPrefix", prefix);
        }
        // Worked out on first use and kept behind an own property, the way `regex`
        //   caches itself in `_regex`. Deciding it in the constructor instead would
        //   add a fourth `defineProperty` to every rule ever built, which cost 4% of
        //   every compile -- including the compiles of rules that are never matched
        //   against anything.
        get _basenameOnly() {
          return define(this, "_basenameOnly", matchesBasename(this.body));
        }
        get regex() {
          const key = UNDERSCORE + MODE_IGNORE;
          if (this[key]) {
            return this[key];
          }
          return this._make(MODE_IGNORE, key);
        }
        get checkRegex() {
          const key = UNDERSCORE + MODE_CHECK_IGNORE;
          if (this[key]) {
            return this[key];
          }
          return this._make(MODE_CHECK_IGNORE, key);
        }
        _make(mode, key) {
          const str = pinWildcards(
            mode === MODE_IGNORE ? this.regexPrefix.replace(REGEX_REPLACE_TRAILING_WILDCARD, replaceTrailingWildcard).replace(REGEX_REPLACE_TRAILING_DOUBLESTAR, replaceTrailingDoublestar) : checkSourceOf(this.body, this.regexPrefix)
          );
          const regex = this.ignoreCase ? new RegExp(str, "i") : new RegExp(str);
          return define(this, key, regex);
        }
      };
      var isLineEnd = (char) => char === "\r" || char === "\n";
      var trimEnd = (body) => {
        let end = body.length;
        while (end && isLineEnd(body[end - 1])) {
          end--;
        }
        const lineEnd = end;
        while (end && body[end - 1] === SPACE) {
          end--;
        }
        if (end === lineEnd) {
          return body.slice(0, end);
        }
        let backslashes = 0;
        while (backslashes < end && body[end - backslashes - 1] === ESCAPE) {
          backslashes++;
        }
        return backslashes % 2 ? body.slice(0, end - 1) + SPACE : body.slice(0, end);
      };
      var createRule = ({
        pattern,
        mark
      }, ignoreCase) => {
        let body = pattern[0] === BOM ? pattern.slice(1) : pattern;
        if (body[0] === "#") {
          return;
        }
        let negative = false;
        if (body[0] === "!") {
          negative = true;
          body = body.slice(1);
        }
        const last = body[body.length - 1];
        if (last === SPACE || last === "\r" || last === "\n") {
          body = trimEnd(body);
        }
        if (!body) {
          return;
        }
        body = body.replace(REGEX_REPLACE_LEADING_EXCAPED_EXCLAMATION, "!").replace(REGEX_REPLACE_LEADING_EXCAPED_HASH, "#");
        const regexPrefix = makeRegexPrefix(body);
        return new IgnoreRule(
          pattern,
          mark,
          body,
          ignoreCase,
          negative,
          regexPrefix
        );
      };
      var RuleManager = class {
        constructor(ignoreCase) {
          this._ignoreCase = ignoreCase;
          this._rules = [];
          this._basenameCount = 0;
        }
        _add(pattern) {
          if (pattern && pattern[KEY_IGNORE]) {
            this._rules = this._rules.concat(pattern._rules._rules);
            this._basenameCount += pattern._rules._basenameCount;
            this._added = true;
            return;
          }
          if (isString(pattern)) {
            pattern = {
              pattern
            };
          }
          const rule = checkPattern(pattern.pattern) && createRule(pattern, this._ignoreCase);
          if (rule) {
            this._added = true;
            this._rules.push(rule);
            if (matchesBasename(rule.body)) {
              this._basenameCount++;
            }
          }
        }
        // @param {Array<string> | string | Ignore} pattern
        add(pattern) {
          this._added = false;
          makeArray(
            isString(pattern) ? splitPattern(pattern) : pattern
          ).forEach(this._add, this);
          if (this._added) {
            this._literalRules = UNDEFINED;
          }
          return this._added;
        }
        // Match the literal 'abc/' for `checkIgnore`, last rule wins. Only a rule
        //   ending in a wildcard can match it (see `checkSourceOf`), so the rest
        //   are left out once, rather than tested or compiled for every path.
        testLiteral(path) {
          const rules = this._literalRules || (this._literalRules = this._rules.filter(
            ({ body }) => body[body.length - (body[body.length - 1] === SLASH ? 2 : 1)] === "*"
          ));
          let ignored = false;
          let unignored = false;
          let matchedRule;
          for (let index = rules.length - 1; index >= 0; index--) {
            const rule = rules[index];
            if (rule.checkRegex.test(path)) {
              ignored = !rule.negative;
              unignored = rule.negative;
              matchedRule = rule.negative ? UNDEFINED : rule;
              break;
            }
          }
          const ret = {
            ignored,
            unignored
          };
          if (matchedRule) {
            ret.rule = matchedRule;
          }
          return ret;
        }
        // Test one single path without recursively checking parent directories
        //
        // - mode `string` either `MODE_IGNORE` or `MODE_CHECK_IGNORE`
        // @returns {TestResult}
        test(path, mode) {
          const rules = this._rules;
          const { length } = rules;
          const shortcut = this._basenameCount * 2 >= length;
          const basename = shortcut ? basenameOf(path) : path;
          for (let index = length - 1; index >= 0; index--) {
            const rule = rules[index];
            if (rule[mode].test(
              shortcut && rule._basenameOnly ? basename : path
            )) {
              const { negative } = rule;
              const ret = {
                ignored: !negative,
                unignored: negative
              };
              if (!negative) {
                ret.rule = rule;
              }
              return ret;
            }
          }
          return {
            ignored: false,
            unignored: false
          };
        }
      };
      var throwError = (message, Ctor) => {
        throw new Ctor(message);
      };
      var checkPath = (path, originalPath, doThrow) => {
        if (!isString(path)) {
          return doThrow(
            `path must be a string, but got \`${originalPath}\``,
            TypeError
          );
        }
        if (!path) {
          return doThrow(`path must not be empty`, TypeError);
        }
        if (checkPath.isNotRelative(path)) {
          const r = "`path.relative()`d";
          return doThrow(
            `path should be a ${r} string, but got "${originalPath}"`,
            RangeError
          );
        }
        return true;
      };
      var isNotRelative = (path) => {
        const first = path.charCodeAt(0);
        if (first === SLASH_CODE) {
          return true;
        }
        if (first !== DOT_CODE) {
          return false;
        }
        if (path.length === 1) {
          return true;
        }
        const second = path.charCodeAt(1);
        if (second === SLASH_CODE) {
          return true;
        }
        if (second !== DOT_CODE) {
          return false;
        }
        return path.length === 2 || path.charCodeAt(2) === SLASH_CODE;
      };
      checkPath.isNotRelative = isNotRelative;
      checkPath.convert = (p) => p;
      var Ignore = class {
        constructor({
          ignorecase = true,
          ignoreCase = ignorecase,
          allowRelativePaths = false
        } = {}) {
          define(this, KEY_IGNORE, true);
          this._rules = new RuleManager(ignoreCase);
          this._strictPathCheck = !allowRelativePaths;
          this._initCache();
        }
        _initCache() {
          this._ignoreCache = /* @__PURE__ */ Object.create(null);
          this._testCache = /* @__PURE__ */ Object.create(null);
        }
        add(pattern) {
          if (this._rules.add(pattern)) {
            this._initCache();
          }
          return this;
        }
        // legacy
        addPattern(pattern) {
          return this.add(pattern);
        }
        // @returns {TestResult}
        _test(originalPath, cache) {
          const path = originalPath && checkPath.convert(originalPath);
          checkPath(
            path,
            originalPath,
            this._strictPathCheck ? throwError : RETURN_FALSE
          );
          return this._t(path, cache);
        }
        checkIgnore(path) {
          if (path.charCodeAt(path.length - 1) !== SLASH_CODE) {
            return this.test(path);
          }
          const dir = this._t(path, this._testCache);
          if (dir.ignored) {
            return dir;
          }
          const literal = this._rules.testLiteral(path);
          return literal.ignored || literal.unignored ? literal : dir;
        }
        _t(path, cache) {
          if (path in cache) {
            return cache[path];
          }
          const parentPath = parentOf(path);
          const parent = parentPath ? this._t(parentPath, cache) : UNDEFINED;
          return cache[path] = parent && parent.ignored ? parent : this._rules.test(path, MODE_IGNORE);
        }
        ignores(path) {
          return this._test(path, this._ignoreCache).ignored;
        }
        createFilter() {
          return (path) => !this.ignores(path);
        }
        filter(paths) {
          return makeArray(paths).filter(this.createFilter());
        }
        // @returns {TestResult}
        test(path) {
          return this._test(path, this._testCache);
        }
      };
      var factory = (options) => new Ignore(options);
      var isPathValid = (path) => checkPath(path && checkPath.convert(path), path, RETURN_FALSE);
      var setupWindows = () => {
        const makePosix = (str) => /^\\\\\?\\/.test(str) || /["<>|\u0000-\u001F]+/u.test(str) ? str : str.replace(/\\/g, "/");
        checkPath.convert = makePosix;
        const REGEX_TEST_WINDOWS_PATH_ABSOLUTE = /^[a-z]:\//i;
        checkPath.isNotRelative = (path) => REGEX_TEST_WINDOWS_PATH_ABSOLUTE.test(path) || isNotRelative(path);
      };
      if (
        // Detect `process` so that it can run in browsers.
        typeof process !== "undefined" && process.platform === "win32"
      ) {
        setupWindows();
      }
      module.exports = factory;
      factory.default = factory;
      module.exports.isPathValid = isPathValid;
      define(module.exports, /* @__PURE__ */ Symbol.for("setupWindows"), setupWindows);
    }
  });
  return require_index();
})();
