// Kleine allowlist-sanitizer voor HTML uit de TipTap-editor.
// We accepteren alleen een nauwe set tags en attributen en strippen de rest.

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "h1",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
};

const VOID_TAGS = new Set(["br"]);

type Token =
  | { kind: "text"; value: string }
  | { kind: "open"; tag: string; attrs: Record<string, string>; selfClosing: boolean }
  | { kind: "close"; tag: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const lt = input.indexOf("<", i);
    if (lt === -1) {
      tokens.push({ kind: "text", value: input.slice(i) });
      break;
    }
    if (lt > i) {
      tokens.push({ kind: "text", value: input.slice(i, lt) });
    }
    const gt = input.indexOf(">", lt);
    if (gt === -1) {
      tokens.push({ kind: "text", value: input.slice(lt) });
      break;
    }
    const raw = input.slice(lt + 1, gt);
    if (raw.startsWith("!--")) {
      i = gt + 1;
      continue;
    }
    if (raw.startsWith("/")) {
      const tag = raw.slice(1).trim().toLowerCase();
      tokens.push({ kind: "close", tag });
    } else {
      const selfClosing = raw.endsWith("/");
      const body = selfClosing ? raw.slice(0, -1).trim() : raw.trim();
      const spaceIdx = body.search(/\s/);
      const tag = (spaceIdx === -1 ? body : body.slice(0, spaceIdx)).toLowerCase();
      const attrs: Record<string, string> = {};
      if (spaceIdx !== -1) {
        const attrPart = body.slice(spaceIdx + 1);
        const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let m: RegExpExecArray | null;
        while ((m = attrRe.exec(attrPart)) !== null) {
          const name = m[1].toLowerCase();
          const value = m[2] ?? m[3] ?? m[4] ?? "";
          attrs[name] = value;
        }
      }
      tokens.push({ kind: "open", tag, attrs, selfClosing });
    }
    i = gt + 1;
  }
  return tokens;
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim().toLowerCase();
  if (trimmed.startsWith("javascript:")) return false;
  if (trimmed.startsWith("data:")) return false;
  if (trimmed.startsWith("vbscript:")) return false;
  return true;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function sanitizeArticleHtml(input: string): string {
  if (!input) return "";
  const tokens = tokenize(input);
  const stack: string[] = [];
  let out = "";

  for (const token of tokens) {
    if (token.kind === "text") {
      out += escapeText(token.value);
      continue;
    }
    if (token.kind === "open") {
      if (!ALLOWED_TAGS.has(token.tag)) continue;

      const safeAttrs: Record<string, string> = {};
      const allowed = ALLOWED_ATTRS[token.tag];
      if (allowed) {
        for (const [name, value] of Object.entries(token.attrs)) {
          if (!allowed.has(name)) continue;
          if (name === "href" && !isSafeHref(value)) continue;
          safeAttrs[name] = value;
        }
        if (token.tag === "a" && safeAttrs.href) {
          safeAttrs.rel = "noopener noreferrer";
          if (!safeAttrs.target) safeAttrs.target = "_blank";
        }
      }

      const attrString = Object.entries(safeAttrs)
        .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
        .join("");

      if (VOID_TAGS.has(token.tag) || token.selfClosing) {
        out += `<${token.tag}${attrString} />`;
      } else {
        stack.push(token.tag);
        out += `<${token.tag}${attrString}>`;
      }
      continue;
    }
    if (token.kind === "close") {
      if (!ALLOWED_TAGS.has(token.tag)) continue;
      const idx = stack.lastIndexOf(token.tag);
      if (idx === -1) continue;
      while (stack.length - 1 > idx) {
        out += `</${stack.pop()}>`;
      }
      out += `</${stack.pop()}>`;
    }
  }

  while (stack.length > 0) {
    out += `</${stack.pop()}>`;
  }

  return out;
}

export function htmlToPlainText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
