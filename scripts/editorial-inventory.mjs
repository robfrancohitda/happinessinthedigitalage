import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';

import {
  basename,
  join,
} from 'node:path';

const officialVerticals = new Set([
  'work',
  'technology',
  'money',
  'wellbeing',
  'home',
  'relationships',
]);

const officialContentTypes = new Set([
  'guide',
  'explainer',
  'review',
  'comparison',
  'resource',
]);

function splitFrontmatter(content) {
  const match = content.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n/,
  );

  if (!match) {
    return {
      frontmatter: '',
      body: content,
    };
  }

  return {
    frontmatter: match[1],
    body: content.slice(match[0].length),
  };
}

function getTopLevelField(
  frontmatter,
  field,
) {
  const pattern = new RegExp(
    `^${field}:\\s*(.+?)\\s*$`,
    'm',
  );

  return frontmatter.match(pattern)?.[1];
}

function parseYamlScalar(value) {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') &&
      trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") &&
      trimmed.endsWith("'"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }

  return trimmed;
}

function getYamlBlock(
  frontmatter,
  field,
) {
  const lines = frontmatter.split(/\r?\n/);

  const startIndex = lines.findIndex(
    (line) =>
      new RegExp(`^${field}:\\s*$`).test(line),
  );

  if (startIndex < 0) {
    return '';
  }

  const block = [];

  for (
    let index = startIndex + 1;
    index < lines.length;
    index += 1
  ) {
    const line = lines[index];

    if (
      line.length > 0 &&
      !/^\s/.test(line)
    ) {
      break;
    }

    block.push(line);
  }

  return block.join('\n');
}

function countSimpleListItems(block) {
  if (!block) {
    return 0;
  }

  return (
    block.match(/^\s+-\s+/gm) ?? []
  ).length;
}

function countStructuredListItems(
  block,
  firstField,
) {
  if (!block) {
    return 0;
  }

  const pattern = new RegExp(
    `^\\s+-\\s+${firstField}:`,
    'gm',
  );

  return (
    block.match(pattern) ?? []
  ).length;
}

function getHeroSources(frontmatter) {
  const heroBlock =
    getYamlBlock(frontmatter, 'hero');

  if (!heroBlock) {
    return [];
  }

  return [
    ...heroBlock.matchAll(
      /^\s+src:\s*(.+?)\s*$/gm,
    ),
  ].map((match) =>
    parseYamlScalar(match[1]),
  ).filter(Boolean);
}

function getMarkdownLinks(body) {
  const links = [];

  for (const match of body.matchAll(
    /\[[^\]]+\]\(([^)]+)\)/g,
  )) {
    const raw = match[1].trim();

    if (raw) {
      links.push(raw);
    }
  }

  return links;
}

function parseArticleFile(
  path,
  root,
) {
  const content =
    readFileSync(path, 'utf8');

  const {
    frontmatter,
    body,
  } = splitFrontmatter(content);

  const fileName = basename(path);
  const slug =
    fileName.replace(/\.md$/i, '');

  const title =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'title',
      ),
    );

  const description =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'description',
      ),
    );

  const contentType =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'contentType',
      ),
    );

  const vertical =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'vertical',
      ),
    );

  const category =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'category',
      ),
    );

  const topic =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'topic',
      ),
    );

  const authorId =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'authorId',
      ),
    );

  const publishedAt =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'publishedAt',
      ),
    );

  const updatedAt =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'updatedAt',
      ),
    );

  const draftRaw =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'draft',
      ),
    );

  const draft =
    draftRaw !== 'false';

  const heroSources =
    getHeroSources(frontmatter);

  const tagsCount =
    countSimpleListItems(
      getYamlBlock(frontmatter, 'tags'),
    );

  const audienceCount =
    countSimpleListItems(
      getYamlBlock(frontmatter, 'audience'),
    );

  const takeawaysCount =
    countSimpleListItems(
      getYamlBlock(frontmatter, 'keyTakeaways'),
    );

  const faqCount =
    countStructuredListItems(
      getYamlBlock(frontmatter, 'faq'),
      'question',
    );

  const sourcesCount =
    countStructuredListItems(
      getYamlBlock(frontmatter, 'sources'),
      'title',
    );

  const openingContextCount =
    countSimpleListItems(
      getYamlBlock(frontmatter, 'openingContext'),
    );

  const bodyWordCount =
    body
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#>*_`~\[\]()!-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .length;

  const internalLinks =
    getMarkdownLinks(body)
      .filter((link) =>
        link.startsWith('/') &&
        !link.startsWith('//'),
      );

  const externalLinks =
    getMarkdownLinks(body)
      .filter((link) =>
        /^https?:\/\//i.test(link),
      );

  const hasManualSourcesHeading =
    /^##\s+(?:Sources|Sources reviewed|References)\s*$/im
      .test(body);

  const heroAssets =
    heroSources.map((source) => ({
      source,
      localPath:
        source?.startsWith('/assets/')
          ? join(
              root,
              'public',
              source.slice(1),
            )
          : undefined,
    }));

  return {
    fileName,
    slug,
    technical:
      slug.startsWith('_'),
    title,
    description,
    contentType,
    vertical,
    category,
    topic,
    authorId,
    publishedAt,
    updatedAt,
    draft,
    openingContextCount,
    tagsCount,
    audienceCount,
    takeawaysCount,
    faqCount,
    sourcesCount,
    bodyWordCount,
    internalLinks,
    externalLinks,
    heroSources,
    heroAssets,
    hasManualSourcesHeading,
  };
}

export function collectEditorialInventory(
  root,
) {
  const articlesDirectory =
    join(
      root,
      'src',
      'content',
      'articles',
    );

  const paths =
    readdirSync(
      articlesDirectory,
      {
        withFileTypes: true,
      },
    )
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.md'),
      )
      .map((entry) =>
        join(
          articlesDirectory,
          entry.name,
        ),
      )
      .sort();

  const articles =
    paths.map(
      (path) =>
        parseArticleFile(
          path,
          root,
        ),
    );

  const publicArticles =
    articles.filter(
      (article) =>
        !article.technical &&
        !article.draft,
    );

  const drafts =
    articles.filter(
      (article) =>
        !article.technical &&
        article.draft,
    );

  const technical =
    articles.filter(
      (article) =>
        article.technical,
    );

  const byVertical = {};
  const byContentType = {};

  for (const article of publicArticles) {
    byVertical[article.vertical] =
      (byVertical[article.vertical] ?? 0) + 1;

    byContentType[article.contentType] =
      (byContentType[article.contentType] ?? 0) + 1;
  }

  return {
    generatedAt:
      new Date().toISOString(),

    totals: {
      markdownFiles: articles.length,
      published: publicArticles.length,
      drafts: drafts.length,
      technical: technical.length,
    },

    byVertical,
    byContentType,
    articles,
  };
}

function addFinding(
  findings,
  severity,
  slug,
  message,
) {
  findings.push({
    severity,
    slug,
    message,
  });
}

export function validateEditorialCatalog(
  root,
) {
  const inventory =
    collectEditorialInventory(root);

  const findings = [];
  const titleOwners = new Map();
  const topicOwners = new Map();

  for (const article of inventory.articles) {
    if (!article.title) {
      addFinding(
        findings,
        'error',
        article.slug,
        'title ausente.',
      );
    }

    if (
      article.contentType &&
      !officialContentTypes.has(
        article.contentType,
      )
    ) {
      addFinding(
        findings,
        'error',
        article.slug,
        `contentType não oficial: ${article.contentType}`,
      );
    }

    if (
      article.vertical &&
      !officialVerticals.has(
        article.vertical,
      )
    ) {
      addFinding(
        findings,
        'error',
        article.slug,
        `vertical não oficial: ${article.vertical}`,
      );
    }

    if (
      article.title &&
      !article.technical
    ) {
      const key =
        article.title
          .toLowerCase()
          .trim();

      const owner =
        titleOwners.get(key);

      if (owner) {
        addFinding(
          findings,
          'error',
          article.slug,
          `título duplicado com ${owner}.`,
        );
      } else {
        titleOwners.set(
          key,
          article.slug,
        );
      }
    }

    if (
      article.topic &&
      !article.technical
    ) {
      const owner =
        topicOwners.get(
          article.topic,
        );

      if (
        owner &&
        !article.draft
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          `topic também usado por ${owner}; revisar possível sobreposição.`,
        );
      } else if (!owner) {
        topicOwners.set(
          article.topic,
          article.slug,
        );
      }
    }

    if (
      !article.technical &&
      !article.draft
    ) {
      if (
        article.openingContextCount < 1
      ) {
        addFinding(
          findings,
          'error',
          article.slug,
          'artigo publicado sem openingContext.',
        );
      }

      if (
        article.takeawaysCount < 1
      ) {
        addFinding(
          findings,
          'error',
          article.slug,
          'artigo publicado sem keyTakeaways.',
        );
      }

      if (
        article.bodyWordCount < 500
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          `corpo editorial curto (${article.bodyWordCount} palavras); revisar profundidade.`,
        );
      }

      if (
        article.heroSources.length < 2
      ) {
        addFinding(
          findings,
          'error',
          article.slug,
          'artigo publicado sem os dois heroes.',
        );
      }

      for (
        const asset of article.heroAssets
      ) {
        if (
          !asset.localPath ||
          !existsSync(asset.localPath)
        ) {
          addFinding(
            findings,
            'error',
            article.slug,
            `hero inexistente: ${asset.source}`,
          );
        }
      }

      if (
        article.sourcesCount === 0
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          'sources[] estruturado está vazio.',
        );
      }

      if (
        article.hasManualSourcesHeading &&
        article.sourcesCount === 0
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          'há seção manual de fontes no corpo, mas sources[] está vazio.',
        );
      }

      if (
        article.faqCount === 0
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          'FAQ estruturada vazia; confirmar se é decisão editorial.',
        );
      }

      if (
        !article.topic
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          'topic ausente; Related Articles perde precisão.',
        );
      }

      if (
        article.tagsCount === 0
      ) {
        addFinding(
          findings,
          'warning',
          article.slug,
          'tags vazias; revisar arquitetura semântica.',
        );
      }
    }
  }

  const errors =
    findings.filter(
      (finding) =>
        finding.severity === 'error',
    );

  const warnings =
    findings.filter(
      (finding) =>
        finding.severity === 'warning',
    );

  return {
    inventory,
    findings,
    errors,
    warnings,
  };
}

function routeToBuiltPath(
  root,
  href,
) {
  let path = href
    .split('#')[0]
    .split('?')[0];

  try {
    path =
      decodeURIComponent(path);
  } catch {
    // Mantém o valor original se não puder decodificar.
  }

  if (
    !path ||
    path === '/'
  ) {
    return join(
      root,
      'dist',
      'index.html',
    );
  }

  if (
    path.startsWith('/assets/')
  ) {
    return join(
      root,
      'dist',
      path.slice(1),
    );
  }

  if (
    /\.[a-z0-9]{2,8}$/i.test(path)
  ) {
    return join(
      root,
      'dist',
      path.slice(1),
    );
  }

  return join(
    root,
    'dist',
    path.replace(/^\/+/, ''),
    'index.html',
  );
}

function collectHtmlFiles(
  directory,
) {
  const files = [];

  for (
    const entry of readdirSync(
      directory,
      {
        withFileTypes: true,
      },
    )
  ) {
    const path =
      join(
        directory,
        entry.name,
      );

    if (entry.isDirectory()) {
      files.push(
        ...collectHtmlFiles(path),
      );
    } else if (
      entry.isFile() &&
      entry.name.endsWith('.html')
    ) {
      files.push(path);
    }
  }

  return files;
}

export function validateBuiltEditorialOutput(
  root,
) {
  const dist =
    join(root, 'dist');

  if (!existsSync(dist)) {
    return {
      errors: [
        {
          severity: 'error',
          slug: 'build',
          message:
            'dist não existe para auditoria de saída.',
        },
      ],
      warnings: [],
    };
  }

  const errors = [];
  const warnings = [];
  const htmlFiles =
    collectHtmlFiles(dist);

  for (const file of htmlFiles) {
    const html =
      readFileSync(
        file,
        'utf8',
      );

    const hrefs = [
      ...html.matchAll(
        /\bhref=["']([^"']+)["']/gi,
      ),
    ].map(
      (match) => match[1],
    );

    for (const href of hrefs) {
      if (
        !href.startsWith('/') ||
        href.startsWith('//')
      ) {
        continue;
      }

      const target =
        routeToBuiltPath(
          root,
          href,
        );

      if (!existsSync(target)) {
        errors.push({
          severity: 'error',
          slug: 'build',
          message:
            `link interno quebrado: ${href}`,
        });
      }
    }
  }

  const inventory =
    collectEditorialInventory(root);

  const sitemapPath =
    join(
      root,
      'dist',
      'sitemap-0.xml',
    );

  if (!existsSync(sitemapPath)) {
    errors.push({
      severity: 'error',
      slug: 'sitemap',
      message:
        'dist/sitemap-0.xml não encontrado.',
    });
  } else {
    const sitemap =
      readFileSync(
        sitemapPath,
        'utf8',
      );

    const sectionByType = {
      guide: 'guides',
      explainer: 'explainers',
      review: 'reviews',
      comparison: 'comparisons',
      resource: 'resources',
    };

    for (
      const article of
      inventory.articles.filter(
        (item) =>
          !item.technical &&
          !item.draft,
      )
    ) {
      const section =
        sectionByType[
          article.contentType
        ];

      const url =
        `https://www.happinessinthedigitalage.digital/${section}/${article.slug}/`;

      if (!sitemap.includes(url)) {
        errors.push({
          severity: 'error',
          slug: article.slug,
          message:
            'URL publicada ausente do sitemap.',
        });
      }
    }
  }

  return {
    errors,
    warnings,
  };
}

function printMap(
  title,
  map,
) {
  console.log('');
  console.log(title);

  const entries =
    Object.entries(map);

  if (entries.length === 0) {
    console.log('  (nenhum)');
    return;
  }

  for (
    const [key, value] of entries
  ) {
    console.log(
      `  ${key}: ${value}`,
    );
  }
}

export function printEditorialInventory(
  root,
) {
  const result =
    validateEditorialCatalog(root);

  const outputPath =
    '/tmp/hitda-editorial-inventory.json';

  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        ...result.inventory,
        findings: result.findings,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  const {
    totals,
  } = result.inventory;

  console.log('');
  console.log(
    '=== INVENTÁRIO EDITORIAL HITDA ===',
  );

  console.log(
    `Markdown: ${totals.markdownFiles}`,
  );

  console.log(
    `Publicados: ${totals.published}`,
  );

  console.log(
    `Drafts editoriais: ${totals.drafts}`,
  );

  console.log(
    `Técnicos: ${totals.technical}`,
  );

  printMap(
    'Publicados por território:',
    result.inventory.byVertical,
  );

  printMap(
    'Publicados por formato:',
    result.inventory.byContentType,
  );

  console.log('');
  console.log('CATÁLOGO');

  for (
    const article of
    result.inventory.articles
  ) {
    console.log(
      [
        `- ${article.slug}`,
        article.draft
          ? 'draft'
          : 'published',
        article.contentType ?? '?',
        article.vertical ?? '?',
        `${article.bodyWordCount} words`,
        `${article.sourcesCount} sources`,
      ].join(' | '),
    );
  }

  console.log('');
  console.log(
    `Erros: ${result.errors.length}`,
  );

  console.log(
    `Avisos: ${result.warnings.length}`,
  );

  for (
    const finding of result.findings
  ) {
    console.log(
      `${finding.severity.toUpperCase()} [${finding.slug}] ${finding.message}`,
    );
  }

  console.log('');
  console.log(
    `JSON: ${outputPath}`,
  );

  return result;
}
