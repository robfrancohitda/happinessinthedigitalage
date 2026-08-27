import {
  existsSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  basename,
  join,
} from 'node:path';

import {
  spawnSync,
} from 'node:child_process';

import {
  prepareBatchRelease,
  releaseBatch,
} from './editorial-batch-release.mjs';

const articleSectionByType = {
  guide: 'guides',
  explainer: 'explainers',
  review: 'reviews',
  comparison: 'comparisons',
  resource: 'resources',
};

function run(command, args, root) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(
      `comando falhou: ${command} ${args.join(' ')}`,
    );
  }
}

function normalizeSlug(rawValue) {
  const slug = basename(rawValue)
    .replace(/\.md$/i, '')
    .trim();

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    throw new Error(
      'use somente slugs em minúsculas, números e hífens.',
    );
  }

  if (slug.startsWith('_')) {
    throw new Error(
      'arquivos técnicos não podem ser publicados.',
    );
  }

  return slug;
}

function splitFrontmatter(content) {
  const match = content.match(
    /^---\r?\n([\s\S]*?)\r?\n---\r?\n/,
  );

  if (!match) {
    throw new Error(
      'frontmatter YAML não encontrado.',
    );
  }

  return {
    frontmatter: match[1],
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

function parseYamlScalar(value) {
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

function validateNoPlaceholders(content) {
  const forbiddenPatterns = [
    /Draft description/i,
    /Draft broad context/i,
    /Draft direct answer/i,
    /Replace this (?:text|placeholder)/i,
    /draft-category/i,
    /^\s*-\s+draft\s*$/im,
    /Explain the broader subject and why it matters\./i,
    /Develop the central answer with enough context/i,
    /Present the relevant factors, limits, trade-offs/i,
    /Translate the explanation into concrete actions/i,
    /Close the article without repeating the introduction\./i,
  ];

  const found = forbiddenPatterns.filter(
    (pattern) => pattern.test(content),
  );

  if (found.length > 0) {
    throw new Error(
      'o artigo ainda contém textos ou classificações do template.',
    );
  }
}

function validateHeroAssets(
  frontmatter,
  root,
) {
  const heroBlock =
    getYamlBlock(frontmatter, 'hero');

  if (!heroBlock) {
    return [];
  }

  const sources = [
    ...heroBlock.matchAll(
      /^\s+src:\s*(.+?)\s*$/gm,
    ),
  ].map((match) =>
    parseYamlScalar(match[1]),
  );

  if (sources.length < 2) {
    throw new Error(
      'o hero precisa de imagens desktop e mobile.',
    );
  }

  const assetPaths = [];

  for (const source of sources) {
    if (!source.startsWith('/assets/')) {
      throw new Error(
        `asset do hero deve estar em /assets/: ${source}`,
      );
    }

    const localPath = join(
      root,
      'public',
      source.slice(1),
    );

    if (!existsSync(localPath)) {
      throw new Error(
        `asset do hero não encontrado: ${source}`,
      );
    }

    assetPaths.push(localPath);
  }

  return assetPaths;
}

function prepareItem(slug, root) {
  const articlePath = join(
    root,
    'src',
    'content',
    'articles',
    `${slug}.md`,
  );

  if (!existsSync(articlePath)) {
    throw new Error(
      `artigo não encontrado: src/content/articles/${slug}.md`,
    );
  }

  const originalContent =
    readFileSync(articlePath, 'utf8');

  const {
    frontmatter,
  } = splitFrontmatter(originalContent);

  const draftValue =
    getTopLevelField(
      frontmatter,
      'draft',
    );

  if (draftValue !== 'true') {
    throw new Error(
      `o artigo não está em draft: true: ${slug}`,
    );
  }

  const contentType =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'contentType',
      ) ?? '',
    );

  const section =
    articleSectionByType[contentType];

  if (!section) {
    throw new Error(
      `contentType inválido em ${slug}: ${contentType}`,
    );
  }

  validateNoPlaceholders(originalContent);

  const assetPaths =
    validateHeroAssets(
      frontmatter,
      root,
    );

  const title =
    parseYamlScalar(
      getTopLevelField(
        frontmatter,
        'title',
      ) ?? '',
    );

  if (!title) {
    throw new Error(
      `título do artigo não encontrado: ${slug}`,
    );
  }

  return {
    slug,
    title,
    section,
    articlePath,
    assetPaths,
    originalContent,
  };
}

export async function publishArticleBatch(
  args,
  root,
) {
  const localOnly =
    args.includes('--local');

  const unknownFlags =
    args.filter(
      (argument) =>
        argument.startsWith('--') &&
        argument !== '--local',
    );

  const positionalArgs =
    args.filter(
      (argument) => !argument.startsWith('--'),
    );

  if (
    positionalArgs.length === 0 ||
    unknownFlags.length > 0
  ) {
    throw new Error(
      'uso: ./scripts/hitda publish-batch <slug> <slug>... [--local]',
    );
  }

  const slugs =
    positionalArgs.map(normalizeSlug);

  if (new Set(slugs).size !== slugs.length) {
    throw new Error(
      'o lote contém slugs duplicados.',
    );
  }

  const items =
    slugs.map(
      (slug) => prepareItem(slug, root),
    );

  if (!localOnly) {
    prepareBatchRelease({
      root,
      items,
    });
  }

  for (const item of items) {
    const publishedContent =
      item.originalContent.replace(
        /^draft:\s*true\s*$/m,
        'draft: false',
      );

    if (
      publishedContent === item.originalContent
    ) {
      throw new Error(
        `não foi possível alterar draft para false: ${item.slug}`,
      );
    }

    writeFileSync(
      item.articlePath,
      publishedContent,
      'utf8',
    );
  }

  try {
    run(
      'npm',
      ['run', 'hitda:audit'],
      root,
    );

    for (const item of items) {
      const routePath = join(
        root,
        'dist',
        item.section,
        item.slug,
        'index.html',
      );

      if (!existsSync(routePath)) {
        throw new Error(
          `rota não gerada: /${item.section}/${item.slug}/`,
        );
      }
    }
  } catch (error) {
    for (const item of items) {
      writeFileSync(
        item.articlePath,
        item.originalContent,
        'utf8',
      );
    }

    throw new Error(
      `${
        error instanceof Error
          ? error.message
          : String(error)
      }\nTodos os artigos do lote foram restaurados para draft: true.`,
    );
  }

  console.log('');
  console.log('Lote aprovado localmente.');

  for (const item of items) {
    console.log(
      `- ${item.slug}: /${item.section}/${item.slug}/`,
    );
  }

  console.log(`Total: ${items.length}`);

  if (localOnly) {
    console.log('');
    console.log(
      'Modo local: nenhum commit ou push foi executado.',
    );

    return {
      items,
      localOnly: true,
    };
  }

  console.log('');
  console.log('Preparando publicação remota do lote...');

  const release =
    await releaseBatch({
      root,
      items,
    });

  console.log('');
  console.log('Publicação do lote concluída.');
  console.log(`Commit: ${release.commit}`);

  for (const page of release.published) {
    console.log(
      `- ${page.slug}: ${page.publicUrl}`,
    );
  }

  return {
    items,
    localOnly: false,
    ...release,
  };
}
