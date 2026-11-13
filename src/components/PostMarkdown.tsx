import { type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Element styles for the rendered post. Tailwind v4 has no typography plugin
 * in this project, so each element is mapped explicitly; the markdown is our
 * own posts (no raw HTML is rendered by react-markdown by default).
 */
const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-6 mb-2 text-base font-bold first:mt-0">{children}</h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="mt-4 mb-1.5 text-sm font-bold">{children}</h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="my-2 text-sm leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-[var(--color-text)]">
      {children}
    </strong>
  ),
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 px-3 py-1 text-sm leading-relaxed">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-2 list-disc space-y-0.5 pl-5 text-sm">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-2 list-decimal space-y-0.5 pl-5 text-sm">{children}</ol>
  ),
  code: ({ children }: { children?: ReactNode }) => (
    <code className="rounded-full border border-[var(--color-border)] px-2 py-0.5 font-sans text-xs text-[var(--color-muted)]">
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
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className="my-3 max-h-80 rounded-lg border border-[var(--color-border)]"
    />
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)]">
      {children}
    </thead>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="py-1.5 pr-3 font-medium">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border-b border-[var(--color-border)]/30 py-1.5 pr-3 align-top">
      {children}
    </td>
  ),
};

/** Renders a post's markdown (GFM tables included) with the site's styling. */
export function PostMarkdown({ children }: { children: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {children}
    </Markdown>
  );
}
