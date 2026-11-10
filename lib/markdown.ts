import "server-only";
import { marked, Renderer, type Tokens } from "marked";

/**
 * Markdown → HTML for post bodies, rendered server-side only.
 * Headings get stable ids (mirrors slugify) so the table of contents and
 * IntersectionObserver can link them; images stay lazy; links that leave
 * the journal open safely in a new tab.
 */

export type Heading = { id: string; text: string; level: 2 | 3 };

function headingId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

class AtelierRenderer extends Renderer {
  override heading({ tokens, depth }: Tokens.Heading): string {
    const text = this.parser.parseInline(tokens);
    if (depth < 2 || depth > 3) {
      return `<h${depth}>${text}</h${depth}>`;
    }
    // Duplicate ids are de-duped below with a counter pass.
    return `<h${depth} id="${headingId(text.replace(/<[^>]*>/g, ""))}">${text}</h${depth}>`;
  }

  override link({ href, title, tokens }: Tokens.Link): string {
    const text = this.parser.parseInline(tokens);
    const external = /^https?:\/\//i.test(href ?? "");
    const attrs = [
      `href="${href}"`,
      title ? `title="${escapeHtml(title)}"` : "",
      external ? 'target="_blank" rel="noopener noreferrer"' : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `<a ${attrs}>${text}</a>`;
  }

  override image({ href, title, text }: Tokens.Image): string {
    const alt = escapeHtml(text);
    return `<img src="${href}" alt="${alt}"${title ? ` title="${escapeHtml(title)}"` : ""} loading="lazy" decoding="async" />`;
  }
}

marked.use({ renderer: new AtelierRenderer(), gfm: true, breaks: false });

/** Pull the h2/h3 outline (in document order) from rendered HTML. */
function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  const re = /<h([23]) id="([^"]*)">(.*?)<\/h\1>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const level = Number(match[1]) as 2 | 3;
    const text = match[3].replace(/<[^>]*>/g, "").trim();
    let id = match[2];
    const n = seen.get(id) ?? 0;
    seen.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    headings.push({ id, text, level });
  }
  return headings;
}

export function renderMarkdown(markdown: string): {
  html: string;
  headings: Heading[];
} {
  const html = marked.parse(markdown, { async: false });
  // Rewrite duplicate heading ids to match extractHeadings' dedupe.
  const seen = new Map<string, number>();
  const htmlWithIds = html.replace(
    /<h([23]) id="([^"]*)">/g,
    (_full, level: string, id: string) => {
      const n = seen.get(id) ?? 0;
      seen.set(id, n + 1);
      return `<h${level} id="${n > 0 ? `${id}-${n}` : id}">`;
    }
  );
  return { html: htmlWithIds, headings: extractHeadings(htmlWithIds) };
}
