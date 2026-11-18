import { useLocale } from '../hooks/useLocale';
import { HOME_SIDEBAR } from '../core/siteSidebar';
import { PostMarkdown } from './PostMarkdown';
import { SideCard } from './SideCard';

interface SiteSidebarProps {
  articleCount: number;
  wordCount: number;
  /** Clicking the words figure; omit on the words page itself. */
  onOpenWords?: () => void;
}

/**
 * The site-level right column shared by the home page and the words table:
 * the owner's cards from src/core/siteSidebar.ts plus a small stats card.
 */
export function SiteSidebar({
  articleCount,
  wordCount,
  onOpenWords,
}: SiteSidebarProps) {
  const { t, locale } = useLocale();
  const wordsFigure = (
    <>
      <dt className="text-xs text-[var(--color-muted)] underline-offset-2 hover:underline">
        {t('words')}
      </dt>
      <dd className="font-mono text-lg font-bold">{wordCount}</dd>
    </>
  );
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-[var(--header-offset)]">
      {HOME_SIDEBAR.map((card) => (
        <SideCard
          key={card.zh}
          title={locale === 'zh' ? card.zh : (card.en ?? card.zh)}
        >
          <PostMarkdown compact>{card.markdown}</PostMarkdown>
        </SideCard>
      ))}
      <SideCard title={t('stats')}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-[var(--color-muted)]">
              {t('articles')}
            </dt>
            <dd className="font-mono text-lg font-bold">{articleCount}</dd>
          </div>
          {onOpenWords ? (
            <button onClick={onOpenWords} className="text-left">
              {wordsFigure}
            </button>
          ) : (
            <div>{wordsFigure}</div>
          )}
        </dl>
      </SideCard>
    </div>
  );
}
