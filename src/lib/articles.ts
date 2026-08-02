import {
  getCollection,
  type CollectionEntry,
} from 'astro:content';

export type ArticleEntry = CollectionEntry<'articles'>;
export type ArticleContentType =
  ArticleEntry['data']['contentType'];

export const articleSectionByType = {
  guide: 'guides',
  explainer: 'explainers',
  review: 'reviews',
  comparison: 'comparisons',
  resource: 'resources',
} as const satisfies Record<ArticleContentType, string>;

export const articleTypeLabel = {
  guide: 'Guide',
  explainer: 'Explainer',
  review: 'Review',
  comparison: 'Comparison',
  resource: 'Resource',
} as const satisfies Record<ArticleContentType, string>;

export function getArticlePath(
  article: ArticleEntry,
): string {
  const section =
    articleSectionByType[article.data.contentType];

  return `/${section}/${article.id}/`;
}

export function getArticleSortDate(
  article: ArticleEntry,
): Date {
  return article.data.updatedAt ??
    article.data.publishedAt;
}

export function sortArticlesNewestFirst(
  articles: ArticleEntry[],
): ArticleEntry[] {
  return [...articles].sort(
    (first, second) =>
      getArticleSortDate(second).getTime() -
      getArticleSortDate(first).getTime(),
  );
}

export async function getPublishedArticles():
Promise<ArticleEntry[]> {
  const articles = await getCollection(
    'articles',
    ({ data }) => !data.draft,
  );

  return sortArticlesNewestFirst(articles);
}

export async function getPublishedArticlesByType(
  contentType: ArticleContentType,
): Promise<ArticleEntry[]> {
  const articles = await getCollection(
    'articles',
    ({ data }) =>
      !data.draft &&
      data.contentType === contentType,
  );

  return sortArticlesNewestFirst(articles);
}

export async function getRelatedArticles(
  currentArticle: ArticleEntry,
  limit = 3,
): Promise<ArticleEntry[]> {
  const articles = await getCollection(
    'articles',
    ({ data }) => !data.draft,
  );

  return articles
    .filter((article) => article.id !== currentArticle.id)
    .map((article) => {
      let score = 0;

      if (
        currentArticle.data.topic &&
        article.data.topic === currentArticle.data.topic
      ) {
        score += 80;
      }

      if (article.data.category === currentArticle.data.category) {
        score += 50;
      }

      if (article.data.vertical === currentArticle.data.vertical) {
        score += 30;
      }

      if (
        article.data.contentType === currentArticle.data.contentType
      ) {
        score += 10;
      }

      const sharedTags = article.data.tags.filter((tag) =>
        currentArticle.data.tags.includes(tag),
      );

      score += sharedTags.length * 5;

      return { article, score };
    })
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return (
        getArticleSortDate(second.article).getTime() -
        getArticleSortDate(first.article).getTime()
      );
    })
    .slice(0, limit)
    .map(({ article }) => article);
}
