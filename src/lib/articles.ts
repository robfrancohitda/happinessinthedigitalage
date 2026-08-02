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
