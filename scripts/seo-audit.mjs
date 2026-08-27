import {
  existsSync,
  readFileSync,
} from 'node:fs';

import {
  join,
} from 'node:path';

import {
  collectEditorialInventory,
} from './editorial-inventory.mjs';

const siteName =
  'Happiness in the Digital Age';

const baseUrl =
  'https://www.happinessinthedigitalage.digital';

const sectionByType = {
  guide: 'guides',
  explainer: 'explainers',
  review: 'reviews',
  comparison: 'comparisons',
  resource: 'resources',
};

function decodeHtmlEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function getAttribute(
  tag,
  attributeName,
) {
  const expression =
    new RegExp(
      `\\b${attributeName}\\s*=\\s*` +
      `(?:"([^"]*)"|'([^']*)')`,
      'i',
    );

  const match =
    tag.match(expression);

  return match
    ? decodeHtmlEntities(
        match[1] ??
        match[2] ??
        '',
      )
    : undefined;
}

function getMetaContent(
  html,
  attributeName,
  attributeValue,
) {
  const tags =
    html.match(
      /<meta\b[^>]*>/gi,
    ) ?? [];

  for (const tag of tags) {
    const value =
      getAttribute(
        tag,
        attributeName,
      );

    if (
      value?.toLowerCase() ===
      attributeValue.toLowerCase()
    ) {
      return getAttribute(
        tag,
        'content',
      );
    }
  }

  return undefined;
}

function getCanonical(html) {
  const tags =
    html.match(
      /<link\b[^>]*>/gi,
    ) ?? [];

  for (const tag of tags) {
    const rel =
      getAttribute(
        tag,
        'rel',
      );

    if (
      rel
        ?.toLowerCase()
        .split(/\s+/)
        .includes('canonical')
    ) {
      return getAttribute(
        tag,
        'href',
      );
    }
  }

  return undefined;
}

function getTitle(html) {
  const match =
    html.match(
      /<title\b[^>]*>([\s\S]*?)<\/title>/i,
    );

  if (!match) {
    return undefined;
  }

  return decodeHtmlEntities(
    match[1]
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function getStructuredData(
  html,
) {
  const documents = [];

  const expression =
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;

  while (
    (match =
      expression.exec(html)) !== null
  ) {
    try {
      documents.push(
        JSON.parse(
          match[1].trim(),
        ),
      );
    } catch {
      documents.push({
        __parseError: true,
      });
    }
  }

  return documents;
}

function flattenStructuredNodes(
  documents,
) {
  const nodes = [];

  for (const document of documents) {
    if (
      Array.isArray(
        document?.['@graph'],
      )
    ) {
      nodes.push(
        ...document['@graph'],
      );
    } else {
      nodes.push(document);
    }
  }

  return nodes;
}

function hasType(
  nodes,
  type,
) {
  return nodes.some(
    (node) => {
      const value =
        node?.['@type'];

      if (
        Array.isArray(value)
      ) {
        return value.includes(type);
      }

      return value === type;
    },
  );
}

function addError(
  errors,
  slug,
  message,
) {
  errors.push({
    severity: 'error',
    slug,
    message,
  });
}

export function validateBuiltSeo(
  root,
) {
  const inventory =
    collectEditorialInventory(root);

  const published =
    inventory.articles.filter(
      (article) =>
        !article.technical &&
        !article.draft,
    );

  const errors = [];
  const warnings = [];

  for (const article of published) {
    const section =
      sectionByType[
        article.contentType
      ];

    const htmlPath =
      join(
        root,
        'dist',
        section,
        article.slug,
        'index.html',
      );

    if (!existsSync(htmlPath)) {
      addError(
        errors,
        article.slug,
        'HTML publicado não encontrado para auditoria SEO.',
      );

      continue;
    }

    const html =
      readFileSync(
        htmlPath,
        'utf8',
      );

    const canonical =
      `${baseUrl}/${section}/${article.slug}/`;

    const expectedTitleBase =
      article.seoTitle ??
      article.title;

    const expectedDocumentTitle =
      expectedTitleBase === siteName
        ? expectedTitleBase
        : `${expectedTitleBase} | ${siteName}`;

    const expectedSocialTitle =
      article.socialTitle ??
      expectedDocumentTitle;

    const expectedSocialDescription =
      article.socialDescription ??
      article.description;

    if (
      getTitle(html) !==
      expectedDocumentTitle
    ) {
      addError(
        errors,
        article.slug,
        'document title divergente do frontmatter.',
      );
    }

    if (
      getCanonical(html) !==
      canonical
    ) {
      addError(
        errors,
        article.slug,
        'canonical divergente da rota pública.',
      );
    }

    if (
      getMetaContent(
        html,
        'name',
        'description',
      ) !==
      article.description
    ) {
      addError(
        errors,
        article.slug,
        'meta description divergente.',
      );
    }

    if (
      getMetaContent(
        html,
        'property',
        'og:type',
      ) !== 'article'
    ) {
      addError(
        errors,
        article.slug,
        'og:type não é article.',
      );
    }

    if (
      getMetaContent(
        html,
        'property',
        'og:title',
      ) !==
      expectedSocialTitle
    ) {
      addError(
        errors,
        article.slug,
        'og:title não usa o título social esperado.',
      );
    }

    if (
      getMetaContent(
        html,
        'name',
        'twitter:title',
      ) !==
      expectedSocialTitle
    ) {
      addError(
        errors,
        article.slug,
        'twitter:title não usa o título social esperado.',
      );
    }

    if (
      getMetaContent(
        html,
        'property',
        'og:description',
      ) !==
      expectedSocialDescription
    ) {
      addError(
        errors,
        article.slug,
        'og:description divergente.',
      );
    }

    if (
      getMetaContent(
        html,
        'name',
        'twitter:description',
      ) !==
      expectedSocialDescription
    ) {
      addError(
        errors,
        article.slug,
        'twitter:description divergente.',
      );
    }

    if (
      article.heroSources.length > 0 &&
      !getMetaContent(
        html,
        'property',
        'og:image',
      )
    ) {
      addError(
        errors,
        article.slug,
        'og:image ausente para artigo que possui hero.',
      );
    }

    if (
      !getMetaContent(
        html,
        'property',
        'article:published_time',
      )
    ) {
      addError(
        errors,
        article.slug,
        'article:published_time ausente.',
      );
    }

    if (
      !getMetaContent(
        html,
        'property',
        'article:modified_time',
      )
    ) {
      addError(
        errors,
        article.slug,
        'article:modified_time ausente.',
      );
    }

    const documents =
      getStructuredData(html);

    if (documents.length === 0) {
      addError(
        errors,
        article.slug,
        'JSON-LD ausente.',
      );

      continue;
    }

    if (
      documents.some(
        (document) =>
          document?.__parseError,
      )
    ) {
      addError(
        errors,
        article.slug,
        'JSON-LD inválido.',
      );

      continue;
    }

    const nodes =
      flattenStructuredNodes(
        documents,
      );

    if (
      !hasType(
        nodes,
        'Article',
      )
    ) {
      addError(
        errors,
        article.slug,
        'JSON-LD sem nó Article.',
      );
    }

    if (
      !hasType(
        nodes,
        'WebPage',
      )
    ) {
      addError(
        errors,
        article.slug,
        'JSON-LD sem nó WebPage.',
      );
    }

    if (
      !hasType(
        nodes,
        'BreadcrumbList',
      )
    ) {
      addError(
        errors,
        article.slug,
        'JSON-LD sem BreadcrumbList.',
      );
    }

    if (
      article.faqCount > 0 &&
      !hasType(
        nodes,
        'FAQPage',
      )
    ) {
      addError(
        errors,
        article.slug,
        'artigo com FAQ não gerou FAQPage no JSON-LD.',
      );
    }

    const articleNode =
      nodes.find(
        (node) =>
          node?.['@type'] ===
          'Article',
      );

    if (
      articleNode?.headline !==
      article.title
    ) {
      addError(
        errors,
        article.slug,
        'headline do Article JSON-LD divergente do H1 editorial.',
      );
    }

    if (
      articleNode?.url !==
      canonical
    ) {
      addError(
        errors,
        article.slug,
        'URL do Article JSON-LD divergente do canonical.',
      );
    }
  }

  return {
    errors,
    warnings,
  };
}
