import type { ReactNode } from 'react';

export const BOX =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-card)]';

/** Sidebar box with a narrow "→ Title" header bar, shared by every page's right column. */
export function SideCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className={BOX}>
      <h2 className="border-b border-[var(--color-border)] px-3 py-1.5 text-sm font-semibold">
        <span aria-hidden className="mr-1.5 text-[var(--color-accent)]">
          →
        </span>
        {title}
      </h2>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}
