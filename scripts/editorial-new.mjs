import {
  existsSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';

import {
  join,
} from 'node:path';

const allowedContentTypes = new Set([
  'guide',
  'explainer',
  'review',
  'comparison',
  'resource',
]);

function createSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTitle(slug) {
  return slug
    .split('-')
    .map((word) =>
      word.length > 0
        ? word[0].toUpperCase() + word.slice(1)
        : word,
    )
    .join(' ');
}

function quoteYaml(value) {
  return JSON.stringify(value);
}

export function createArticleDraft(args, root) {
  const [
    rawContentType,
    ...rawSubjectParts
  ] = args;

  if (!rawContentType || rawSubjectParts.length === 0) {
    throw new Error(
      'uso: ./scripts/hitda new <tipo> <slug ou tema>',
    );
  }

  const contentType =
    rawContentType.toLowerCase().trim();

  if (!allowedContentTypes.has(contentType)) {
    throw new Error(
      `tipo editorial inválido: ${rawContentType}\n` +
      'Use guide, explainer, review, comparison ou resource.',
    );
  }

  const rawSubject =
    rawSubjectParts.join(' ');

  const slug =
    createSlug(rawSubject);

  if (!slug) {
    throw new Error(
      'não foi possível gerar um slug válido.',
    );
  }

  const title =
    createTitle(slug);

  const articlesDirectory =
    join(
      root,
      'src',
      'content',
      'articles',
    );

  const articlePath =
    join(
      articlesDirectory,
      `${slug}.md`,
    );

  if (existsSync(articlePath)) {
    throw new Error(
      `o artigo já existe: src/content/articles/${slug}.md`,
    );
  }

  mkdirSync(
    articlesDirectory,
    {
      recursive: true,
    },
  );

  const publishedAt =
    new Date()
      .toISOString()
      .slice(0, 10);

  const description =
    `Draft description for ${title}. Replace this text with a clear search-oriented summary before publication.`;

  const openingContext =
    `Draft broad context for ${title}. Explain the larger situation before moving to the specific question addressed by the article.`;

  const answerSummary =
    `Draft direct answer for ${title}. Replace this text with the article's useful conclusion before publication.`;

  const primaryIntent =
    `Provide practical and trustworthy guidance about ${title}`;

  const article = `---
title: ${quoteYaml(title)}
description: ${quoteYaml(description)}

openingContext:
  - ${quoteYaml(openingContext)}

answerSummary: ${quoteYaml(answerSummary)}

publishedAt: ${publishedAt}

contentType: ${contentType}
vertical: digital-life
category: draft-category
topic: ${slug}

tags:
  - draft

primaryIntent: ${quoteYaml(primaryIntent)}

audience:
  - "Readers seeking practical guidance on this subject"

authorId: rob-franco

draft: true
featured: false

keyTakeaways:
  - "Replace this placeholder with the first practical takeaway."
  - "Replace this placeholder with the second practical takeaway."

faq: []
sources: []

contentRisk: low

review:
  status: not-required
  evidenceLevel: general
  medicalDisclaimer: false
  claimsReviewed: false

commercial:
  relatedProductIds: []
  campaignIds: []
  allowGlobalCampaigns: true
  placements:
    - article-masthead
    - article-inline-text
    - article-visual-card
    - article-final-banner
---

## Root context

Explain the broader subject and why it matters.

## The direct answer in practice

Develop the central answer with enough context to make it useful.

## What to consider

Present the relevant factors, limits, trade-offs and practical criteria.

## How to apply this

Translate the explanation into concrete actions or decisions.

## Final perspective

Close the article without repeating the introduction.
`;

  writeFileSync(
    articlePath,
    article,
    {
      encoding: 'utf8',
      flag: 'wx',
    },
  );

  console.log('');
  console.log('Novo artigo criado:');
  console.log(
    `src/content/articles/${slug}.md`,
  );

  console.log('');
  console.log('Estado: draft');
  console.log(`Tipo: ${contentType}`);
  console.log(`Slug: ${slug}`);
}
