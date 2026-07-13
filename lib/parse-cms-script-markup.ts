import type { ScriptProps } from "next/script";

export type CmsParsedScript = {
  id: string;
  strategy: ScriptProps["strategy"];
  /** External script URL. Mutually exclusive with `content`. */
  src?: string;
  /** Inline script body. Empty string when `src` is set. */
  content: string;
};

const ALLOWED_STRATEGIES = new Set<NonNullable<ScriptProps["strategy"]>>([
  "beforeInteractive",
  "afterInteractive",
  "lazyOnload",
  "worker",
]);

// Script tag `type` values that should NOT be executed as JS. Pasted
// JSON-LD or template blobs are skipped so we don't surface them as
// runtime scripts and break the page.
const NON_EXECUTABLE_SCRIPT_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "text/template",
  "text/x-template",
  "text/x-handlebars-template",
]);

/** Parses `key="value"`, `key='value'`, `key=value` and bare boolean attrs. */
function parseTagAttributes(attrSource: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re =
    /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrSource)) !== null) {
    const key = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    attrs[key] = value;
  }
  return attrs;
}

function normalizeStrategy(raw?: string): ScriptProps["strategy"] {
  const s = (raw || "afterInteractive").trim() as NonNullable<
    ScriptProps["strategy"]
  >;
  return ALLOWED_STRATEGIES.has(s) ? s : "afterInteractive";
}

function normalizeContent(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Tiny stable hash for deriving deterministic ids from script bodies. */
function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function deriveScriptId(
  attrs: Record<string, string>,
  content: string,
): string {
  const explicit = attrs.id?.trim();
  if (explicit) return explicit;
  if (attrs.src) {
    try {
      const u = new URL(attrs.src);
      const slug = `${u.hostname}${u.pathname}`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `cms-${slug || hashString(attrs.src)}`;
    } catch {
      return `cms-${hashString(attrs.src)}`;
    }
  }
  return `cms-inline-${hashString(content)}`;
}

/**
 * Parses CMS HTML blobs containing one or more raw `<script>` tags into
 * structured records suitable for `next/script` rendering.
 *
 * Supports both:
 *   - External scripts: `<script src="..." async></script>`
 *   - Inline scripts:   `<script>... JS body ...</script>`
 *
 * HTML event-handler attributes (`onload`, `onerror`, etc.) are dropped
 * because `next/script` only accepts React function handlers — preserving
 * them as strings would either be ignored or require an `eval` shim. The
 * underlying script body still loads and runs.
 *
 * Within a single markup string, blocks with a duplicate id, duplicate
 * `src`, or duplicate (whitespace-normalised) inline content are dropped —
 * keeping the first occurrence — so an author accidentally pasting the
 * same snippet twice can't emit duplicate `<script>` tags.
 */
export function parseCmsNextScriptMarkup(
  markup: string | null | undefined,
): CmsParsedScript[] {
  if (!markup?.trim()) return [];

  const blocks: CmsParsedScript[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markup)) !== null) {
    const attrString = m[1];
    const content = m[2].trim();
    const attrs = parseTagAttributes(attrString);

    const type = attrs.type?.trim().toLowerCase();
    if (type && NON_EXECUTABLE_SCRIPT_TYPES.has(type)) continue;

    const src = attrs.src?.trim() || undefined;
    if (!src && !content) continue;

    const id = deriveScriptId(attrs, content);
    if (seenIds.has(id)) continue;

    const key = src ? `src:${src}` : `inline:${normalizeContent(content)}`;
    if (seenKeys.has(key)) continue;

    seenIds.add(id);
    seenKeys.add(key);

    blocks.push({
      id,
      strategy: normalizeStrategy(attrs["data-strategy"]),
      src,
      content: src ? "" : content,
    });
  }
  return blocks;
}

/**
 * Removes blocks whose id, src, or whitespace-normalised inline content has
 * already appeared in earlier groups. Useful when the same tracking snippet
 * has been pasted into both header_scripts and footer_scripts — without
 * this, the head and pre-body renderers would each emit it once.
 */
export function dedupeCmsScriptGroups(
  ...groups: CmsParsedScript[][]
): CmsParsedScript[][] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  return groups.map((group) => {
    const out: CmsParsedScript[] = [];
    for (const s of group) {
      const key = s.src
        ? `src:${s.src}`
        : `inline:${normalizeContent(s.content)}`;
      if (seenIds.has(s.id)) continue;
      if (seenKeys.has(key)) continue;
      seenIds.add(s.id);
      seenKeys.add(key);
      out.push(s);
    }
    return out;
  });
}
