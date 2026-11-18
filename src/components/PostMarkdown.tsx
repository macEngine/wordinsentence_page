import { type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** `wechat-qr.png` -> `<base>/wechat-qr.png`; absolute and http(s) URLs pass through. */
function resolveSrc(src?: string): string | undefined {
  if (!src || /^(https?:)?\/\//.test(src) || src.startsWith('/')) return src;
  return `${import.meta.env.BASE_URL}${src}`;
}

/**
 * Element styles for the rendered post. Tailwind v4 has no typography plugin
 * in this project, so each element is mapped explicitly; the markdown is our
 * own posts (no raw HTML is rendered by react-markdown by default).
 */
/**
 * Body text follows the WeChat article reader (mp.weixin.qq.com): 17px,
 * line-height 1.8, a hair of letter-spacing, a blank-line-sized gap between
 * paragraphs. Quotes get a plain gray bar instead of a tinted box.
 */
const BODY = 'text-[17px] leading-[1.8] tracking-[0.02em]';

const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-9 mb-3 text-[19px] leading-snug font-bold first:mt-0">
      {children}
    </h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className={`mt-6 mb-2 ${BODY} font-bold`}>{children}</h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className={`my-5 ${BODY}`}>{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-bold text-[var(--color-text)]">{children}</strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote
      className={`my-5 border-l-4 border-[var(--color-border)] pl-5 ${BODY} [&>p]:my-3 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0`}
    >
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className={`my-5 list-disc space-y-2 pl-7 ${BODY}`}>{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className={`my-5 list-decimal space-y-2 pl-7 ${BODY}`}>{children}</ol>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-sans text-sm text-[var(--color-muted)]">
      {children}
    </code>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] underline underline-offset-2"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img
      src={resolveSrc(src)}
      alt={alt ?? ''}
      loading="lazy"
      className="my-5 max-h-80 rounded-lg border border-[var(--color-border)]"
    />
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse border border-[var(--color-border)] text-[15px] leading-relaxed">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-[var(--color-bg)] text-left text-sm text-[var(--color-muted)]">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border border-[var(--color-border)] px-3 py-2 font-medium">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border border-[var(--color-border)] px-3 py-2 align-top">
      {children}
    </td>
  ),
};

/**
 * The posts write `**解析：**` and start the text on the next line; markdown
 * folds that into one paragraph. The WeChat original shows the label on its
 * own line, so insert the paragraph break it implies.
 */
function labelOnOwnLine(markdown: string): string {
  return markdown.replace(
    /^(\*\*[^*\n]{1,12}[：:]\*\*)[ \t]*\r?\n(?!\r?\n)/gm,
    '$1\n\n'
  );
}

/** Renders a post's markdown (GFM tables included) with the site's styling. */
export function PostMarkdown({ children }: { children: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {labelOnOwnLine(children)}
    </Markdown>
  );
}
