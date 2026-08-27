import {
  articleSectionByType,
  articleTypeLabel,
  getArticlePath,
  type ArticleEntry,
} from './articles';

const siteName =
  'Happiness in the Digital Age';

interface BuildArticleStructuredDataOptions {
  article: ArticleEntry;
  authorName: string;
  baseUrl: URL;
}

export function buildArticleStructuredData({
  article,
  authorName,
  baseUrl,
}: BuildArticleStructuredDataOptions):
Record<string, unknown> {
  const {
    data,
  } = article;

  const articlePath =
    getArticlePath(article);

  const canonicalUrl =
    new URL(
      articlePath,
      baseUrl,
    ).toString();

  const section =
    articleSectionByType[
      data.contentType
    ];

  const sectionUrl =
    new URL(
      `/${section}/`,
      baseUrl,
    ).toString();

  const homeUrl =
    new URL(
      '/',
      baseUrl,
    ).toString();

  const imageUrl =
    data.hero
      ? new URL(
          data.hero.desktop.src,
          baseUrl,
        ).toString()
      : undefined;

  const publishedAt =
    data.publishedAt.toISOString();

  const modifiedAt =
    (
      data.updatedAt ??
      data.publishedAt
    ).toISOString();

  const organizationId =
    `${homeUrl}#organization`;

  const webSiteId =
    `${homeUrl}#website`;

  const pageId =
    `${canonicalUrl}#webpage`;

  const breadcrumbId =
    `${canonicalUrl}#breadcrumb`;

  const articleId =
    `${canonicalUrl}#article`;

  const authorType =
    data.authorId ===
    'hitda-editorial-team'
      ? 'Organization'
      : 'Person';

  const graph:
  Record<string, unknown>[] = [
    {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteName,
      url: homeUrl,
    },

    {
      '@type': 'WebSite',
      '@id': webSiteId,
      url: homeUrl,
      name: siteName,
      publisher: {
        '@id': organizationId,
      },
      inLanguage: 'en',
    },

    {
      '@type': 'WebPage',
      '@id': pageId,
      url: canonicalUrl,
      name: data.title,
      description:
        data.description,
      isPartOf: {
        '@id': webSiteId,
      },
      breadcrumb: {
        '@id': breadcrumbId,
      },
      ...(imageUrl
        ? {
            primaryImageOfPage: {
              '@type':
                'ImageObject',
              url: imageUrl,
            },
          }
        : {}),
      inLanguage: 'en',
    },

    {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: homeUrl,
        },

        {
          '@type': 'ListItem',
          position: 2,
          name:
            articleTypeLabel[
              data.contentType
            ],
          item: sectionUrl,
        },

        {
          '@type': 'ListItem',
          position: 3,
          name: data.title,
          item: canonicalUrl,
        },
      ],
    },

    {
      '@type': 'Article',
      '@id': articleId,
      headline: data.title,
      description:
        data.description,
      url: canonicalUrl,
      mainEntityOfPage: {
        '@id': pageId,
      },
      ...(imageUrl
        ? {
            image: [
              imageUrl,
            ],
          }
        : {}),
      datePublished:
        publishedAt,
      dateModified:
        modifiedAt,
      author: {
        '@type':
          authorType,
        name: authorName,
      },
      publisher: {
        '@id': organizationId,
      },
      articleSection:
        data.vertical,
      keywords:
        data.tags.join(', '),
      about: [
        data.vertical,
        data.category,
        ...(data.topic
          ? [data.topic]
          : []),
      ],
      inLanguage: 'en',
    },
  ];

  if (data.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id':
        `${canonicalUrl}#faq`,
      mainEntity:
        data.faq.map(
          (item) => ({
            '@type':
              'Question',
            name:
              item.question,
            acceptedAnswer: {
              '@type':
                'Answer',
              text:
                item.answer,
            },
          }),
        ),
    });
  }

  return {
    '@context':
      'https://schema.org',
    '@graph': graph,
  };
}
