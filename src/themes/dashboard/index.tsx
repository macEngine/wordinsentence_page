import './index.css';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { Activity } from '@/types';
import { getActivityData } from '@/hooks/useActivities';
import { useTheme } from '@/hooks/useTheme';
import { useLocale } from '@/hooks/useLocale';
import { Header } from '@/components/Header';
import type { WordPost } from '@/core/wordPost';
import { findBySlug, postSlug } from '@/core/articles';
import { sortWordsByDate } from '@/core/words';
import wordsData from '@/static/words.json';
import lexiconData from '@/static/lexicon.json';
import { isWordTag, type LexiconEntry } from '@/core/lexicon';

const words = wordsData as WordPost[];
const sortedWords = sortWordsByDate(words);
const lexicon = lexiconData as LexiconEntry[];

const TracksPage = lazy(() =>
  import('@/components/TracksPage').then((module) => ({
    default: module.TracksPage,
  }))
);
const ArticleDetail = lazy(() =>
  import('@/components/ArticleDetail').then((module) => ({
    default: module.ArticleDetail,
  }))
);
const TagPage = lazy(() =>
  import('@/components/TagPage').then((module) => ({
    default: module.TagPage,
  }))
);
const ArticlesPage = lazy(() =>
  import('@/components/ArticlesPage').then((module) => ({
    default: module.ArticlesPage,
  }))
);
const WordPage = lazy(() =>
  import('@/components/WordPage').then((module) => ({
    default: module.WordPage,
  }))
);
const WordsPage = lazy(() =>
  import('@/components/WordsPage').then((module) => ({
    default: module.WordsPage,
  }))
);
const SummaryPage = lazy(() =>
  import('@/components/SummaryPage').then((module) => ({
    default: module.SummaryPage,
  }))
);

type Page = 'home' | 'articles' | 'tag' | 'word' | 'tracks' | 'summary';
const PAGES: Page[] = ['home', 'articles', 'tag', 'word', 'tracks', 'summary'];
interface Route {
  page: Page;
  /** `articles/<slug>` opens one article; `tag/<tag>` lists posts with that tag; `word/<word>` is the word page. */
  slug: string | null;
}
const routeFromPath = (pathname: string): Route => {
  const path = pathname
    .slice(import.meta.env.BASE_URL.length)
    .replace(/\/$/, '');
  const [head, ...rest] = path.split('/');
  const page = PAGES.find((p) => p === head) ?? 'home';
  const slug =
    (page === 'articles' || page === 'tag' || page === 'word') && rest.length
      ? decodeURIComponent(rest.join('/'))
      : null;
  return { page, slug };
};
const routeToPath = ({ page, slug }: Route): string =>
  `${import.meta.env.BASE_URL}${page === 'home' ? '' : page}${slug ? `/${encodeURIComponent(slug)}` : ''}`;
/** public/404.html stores the deep-linked path (GitHub Pages) before bouncing to index. */
const initialRoute = (): Route => {
  const redirect = sessionStorage.getItem('redirect');
  if (redirect) {
    sessionStorage.removeItem('redirect');
    const route = routeFromPath(redirect);
    window.history.replaceState(null, '', routeToPath(route));
    return route;
  }
  return routeFromPath(window.location.pathname);
};

function Dashboard() {
  const activities = getActivityData() as Activity[];
  const { dark, toggle } = useTheme();
  const { t } = useLocale();
  const [filter] = useState('all' as const);
  const [year, setYear] = useState<number | null>(null);
  const [route, setRoute] = useState<Route>(initialRoute);
  const page = route.page;

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = (next: Page, slug: string | null = null) => {
    const target = { page: next, slug };
    window.history.pushState(null, '', routeToPath(target));
    setRoute(target);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const openPost = (post: WordPost) => navigate('articles', postSlug(post));
  const openWord = (word: string) => navigate('word', word.toLowerCase());
  // A Latin-letter tag is a word: it opens the word page, not the tag list.
  const openTag = (tag: string) =>
    isWordTag(tag) ? openWord(tag) : navigate('tag', tag);
  const article = route.slug ? findBySlug(words, route.slug) : undefined;

  const [currentYear] = useState(() => new Date().getFullYear());

  // Tracks / Summary still pick activities; keep the year in step with the pick.
  const selectActivity = useCallback(
    (activity: Activity | null) => {
      if (
        activity &&
        year !== null &&
        new Date(activity.start_date_local).getFullYear() !== year
      ) {
        setYear(new Date(activity.start_date_local).getFullYear());
      }
    },
    [year]
  );

  return (
    <div
      className="dashboard min-h-screen bg-[var(--color-bg)]"
      data-filter={filter}
    >
      <Header
        dark={dark}
        toggleTheme={toggle}
        activities={activities}
        page={page}
        onNavigate={navigate}
      />

      <Suspense
        fallback={
          <main
            className="mx-auto flex min-h-[60vh] max-w-[1400px] items-center justify-center p-6 text-sm text-[var(--color-muted)]"
            role="status"
          >
            {t('loading')}
          </main>
        }
      >
        {page === 'articles' && article ? (
          <ArticleDetail
            post={article}
            posts={sortedWords}
            onBack={() => navigate('home')}
            onOpen={openPost}
            onOpenTag={openTag}
          />
        ) : page === 'tag' && route.slug ? (
          <TagPage
            tag={route.slug}
            posts={words}
            onBack={() => navigate('home')}
            onOpen={openPost}
          />
        ) : page === 'word' && route.slug ? (
          <WordPage
            word={route.slug}
            posts={words}
            lexicon={lexicon}
            onBack={() => navigate('word')}
            onOpen={openPost}
            onOpenTag={openTag}
            onOpenWord={openWord}
          />
        ) : page === 'word' ? (
          <WordsPage
            posts={words}
            lexicon={lexicon}
            onOpenWord={openWord}
            onOpenTag={openTag}
          />
        ) : page === 'articles' || page === 'tag' ? (
          <ArticlesPage
            posts={words}
            lexicon={lexicon}
            onOpen={openPost}
            onOpenWords={() => navigate('word')}
          />
        ) : page === 'summary' ? (
          <SummaryPage
            activities={activities}
            onSelectActivity={(activity) => {
              navigate('home');
              setYear(null);
              selectActivity(activity);
            }}
          />
        ) : page === 'tracks' ? (
          <TracksPage
            activities={activities}
            dark={dark}
            filter={filter}
            onSelectActivity={selectActivity}
            onBack={() => {
              navigate('home');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }}
          />
        ) : (
          <ArticlesPage
            posts={words}
            lexicon={lexicon}
            onOpen={openPost}
            onOpenWords={() => navigate('word')}
          />
        )}
      </Suspense>

      <footer className="border-t border-[var(--color-border)] py-6 text-center text-sm text-[var(--color-muted)]">
        &copy; {currentYear} Word in Sentence
      </footer>
    </div>
  );
}

export default Dashboard;
