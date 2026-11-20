import { useLocale } from '../hooks/useLocale';
import { pageNumbers } from '../core/pager';

interface PagerProps {
  /** 0-based */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

const BTN =
  'tag-chip min-w-7 rounded border px-1.5 py-0.5 font-mono text-xs leading-tight';
const ON = `${BTN} border-transparent bg-[var(--color-accent)] text-[var(--color-on-accent)]`;
const OFF = `${BTN} border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]`;
const DISABLED = `${BTN} border-[var(--color-border)] text-[var(--color-border)]`;

/** Numbered pager: ‹ 1 2 3 … 15 ›. Renders nothing for a single page. */
export function Pager({ page, totalPages, onChange }: PagerProps) {
  const { t } = useLocale();
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={t('pagination')} className="flex items-center gap-1">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label={t('prevPage')}
        className={page === 0 ? DISABLED : OFF}
      >
        ‹
      </button>
      {pageNumbers(page, totalPages).map((n, i, all) =>
        n === null ? (
          // a gap sits between two known pages; key it by its left neighbour
          <span
            key={`gap-after-${all[i - 1]}`}
            aria-hidden
            className="px-0.5 text-xs text-[var(--color-muted)]"
          >
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            className={n === page ? ON : OFF}
          >
            {n + 1}
          </button>
        )
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label={t('nextPage')}
        className={page >= totalPages - 1 ? DISABLED : OFF}
      >
        ›
      </button>
    </nav>
  );
}
