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

export interface ArticleSectionMeta {
  title: string;
  eyebrow: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export const articleSectionMeta = {
  guide: {
    title: 'Guides',
    eyebrow: 'Practical guidance',
    description:
      'Clear steps, useful frameworks and realistic ways to handle everyday decisions.',
    emptyTitle: 'The first guides are being prepared.',
    emptyDescription:
      'New practical guides will appear here as they are published.',
  },

  explainer: {
    title: 'Explainers',
    eyebrow: 'Understand what matters',
    description:
      'Complex ideas, claims and digital changes explained in direct, useful language.',
    emptyTitle: 'The first explainers are being prepared.',
    emptyDescription:
      'New explanations will appear here as they are published.',
  },

  review: {
    title: 'Reviews',
    eyebrow: 'Products and services examined',
    description:
      'Practical assessments of usefulness, limitations, cost and suitability.',
    emptyTitle: 'The first reviews are being prepared.',
    emptyDescription:
      'New product and service reviews will appear here as they are published.',
  },

  comparison: {
    title: 'Comparisons',
    eyebrow: 'Options placed side by side',
    description:
      'Differences, trade-offs and practical criteria for choosing between alternatives.',
    emptyTitle: 'The first comparisons are being prepared.',
    emptyDescription:
      'New comparisons will appear here as they are published.',
  },

  resource: {
    title: 'Resources',
    eyebrow: 'Useful materials',
    description:
      'Tools, references, checklists and selected materials for practical use.',
    emptyTitle: 'The first resources are being prepared.',
    emptyDescription:
      'New tools and materials will appear here as they are published.',
  },
} as const satisfies Record<
  ArticleContentType,
  ArticleSectionMeta
>;

export function getArticleSectionPath(
  contentType: ArticleContentType,
): string {
  return `/${articleSectionByType[contentType]}/`;
}

export async function getArticleStaticPaths(
  contentType: ArticleContentType,
) {
  const articles =
    await getPublishedArticlesByType(contentType);

  return articles.map((article) => ({
    params: {
      slug: article.id,
    },

    props: {
      article,
    },
  }));
}
