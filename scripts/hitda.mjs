#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const currentFile = fileURLToPath(import.meta.url);
const root = resolve(dirname(currentFile), '..');

function fail(message) {
  console.error(`\nERRO: ${message}`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    fail(`comando falhou: ${command} ${args.join(' ')}`);
  }
}

function listProjectTextFiles(directory) {
  const excludedDirectories = new Set([
    '.git',
    '.astro',
    'dist',
    'node_modules',
  ]);

  const permittedExtensions = new Set([
    '.astro',
    '.css',
    '.html',
    '.js',
    '.json',
    '.md',
    '.mjs',
    '.svg',
    '.ts',
    '.txt',
    '.yaml',
    '.yml',
  ]);

  const files = [];

  for (const entry of readdirSync(directory)) {
    if (excludedDirectories.has(entry)) continue;
    if (entry === 'package-lock.json') continue;

    const absolutePath = join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) {
      files.push(...listProjectTextFiles(absolutePath));
      continue;
    }

    if (permittedExtensions.has(extname(entry))) {
      files.push(absolutePath);
    }
  }

  return files;
}

function validateRequiredFiles() {
  const requiredFiles = [
    'astro.config.mjs',
    'package.json',
    'src/content.config.ts',
    'src/layouts/BaseLayout.astro',
    'src/pages/index.astro',
    'src/pages/404.astro',
    'src/components/seo/SeoHead.astro',
    'public/_headers',
    'public/_redirects',
    'public/robots.txt',
  ];

  const missing = requiredFiles.filter(
    (file) => !existsSync(join(root, file)),
  );

  if (missing.length > 0) {
    fail(`arquivos obrigatórios ausentes:\n${missing.join('\n')}`);
  }
}

function validateSanitization() {
  const forbiddenPatterns = [
    {
      label: 'domínio compacto do projeto de referência',
      regex: new RegExp(
        ['estudio', 'escrita', 'planejada'].join(''),
        'i',
      ),
    },
    {
      label: 'domínio hifenizado do projeto de referência',
      regex: new RegExp(
        ['estudio', '-', 'escrita', '-', 'planejada'].join(''),
        'i',
      ),
    },
    {
      label: 'marketplace comercial legado',
      regex: new RegExp(['hot', 'mart'].join(''), 'i'),
    },
    {
      label: 'atalho externo de mensagens',
      regex: new RegExp(['wa', '.me'].join(''), 'i'),
    },
    {
      label: 'endpoint externo de mensagens',
      regex: new RegExp(
        ['api', '.whats', 'app.com'].join(''),
        'i',
      ),
    },
    {
      label: 'Measurement ID incorporado',
      regex: /G-[A-Z0-9]{6,}/,
    },
  ];

  const findings = [];

  for (const file of listProjectTextFiles(root)) {
    const content = readFileSync(file, 'utf8');

    for (const pattern of forbiddenPatterns) {
      if (pattern.regex.test(content)) {
        findings.push(
          `${file.replace(`${root}/`, '')}: ${pattern.label}`,
        );
      }
    }
  }

  if (findings.length > 0) {
    fail(
      `referências não sanitizadas encontradas:\n${findings.join('\n')}`,
    );
  }
}

function check() {
  run('npm', ['run', 'check']);
  run('npm', ['run', 'build']);
}

async function audit() {
  console.log('\n=== AUDITORIA HITDA ===');

  validateRequiredFiles();
  validateSanitization();

  console.log('Estrutura obrigatória: OK');
  console.log('Sanitização de referências: OK');

  const {
    validateEditorialCatalog,
    validateBuiltEditorialOutput,
  } = await import('./editorial-inventory.mjs');

  const editorial =
    validateEditorialCatalog(root);

  if (editorial.errors.length > 0) {
    fail(
      'falhas editoriais estruturais:\n' +
      editorial.errors
        .map(
          (finding) =>
            `[${finding.slug}] ${finding.message}`,
        )
        .join('\n'),
    );
  }

  console.log(
    `Catálogo editorial: OK (${editorial.warnings.length} aviso(s))`,
  );

  for (const warning of editorial.warnings) {
    console.log(
      `AVISO [${warning.slug}] ${warning.message}`,
    );
  }

  check();

  const built =
    validateBuiltEditorialOutput(root);

  if (built.errors.length > 0) {
    fail(
      'falhas na saída gerada:\n' +
      built.errors
        .map(
          (finding) =>
            `[${finding.slug}] ${finding.message}`,
        )
        .join('\n'),
    );
  }

  console.log('Links internos gerados: OK');
  console.log('Sitemap editorial: OK');

  const {
    validateBuiltSeo,
  } = await import('./seo-audit.mjs');

  const seo =
    validateBuiltSeo(root);

  if (seo.errors.length > 0) {
    fail(
      'falhas de SEO semântico:\n' +
      seo.errors
        .map(
          (finding) =>
            `[${finding.slug}] ${finding.message}`,
        )
        .join('\n'),
    );
  }

  console.log(
    'SEO semântico e structured data: OK',
  );

  console.log('\nAuditoria HITDA concluída.');
}

const siteName =
  'Happiness in the Digital Age';

function decodeHtmlEntities(value) {
  return value
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, code) =>
        String.fromCodePoint(
          Number.parseInt(code, 16),
        ),
    )
    .replace(
      /&#([0-9]+);/g,
      (_, code) =>
        String.fromCodePoint(
          Number.parseInt(code, 10),
        ),
    )
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function normalizeHtmlText(value) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAttribute(tag, attributeName) {
  const expression = new RegExp(
    `\\b${attributeName}\\s*=\\s*` +
    `(?:"([^"]*)"|'([^']*)')`,
    'i',
  );

  const match = tag.match(expression);

  return match
    ? decodeHtmlEntities(
        match[1] ?? match[2] ?? '',
      )
    : undefined;
}

function getElementText(html, tagName) {
  const expression = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    'i',
  );

  const match = html.match(expression);

  return match
    ? normalizeHtmlText(match[1])
    : undefined;
}

function getMetaContent(
  html,
  attributeName,
  attributeValue,
) {
  const tags =
    html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const value =
      getAttribute(tag, attributeName);

    if (
      value?.toLowerCase() ===
      attributeValue.toLowerCase()
    ) {
      return getAttribute(tag, 'content');
    }
  }

  return undefined;
}

function getCanonical(html) {
  const tags =
    html.match(/<link\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const rel =
      getAttribute(tag, 'rel');

    if (
      rel
        ?.toLowerCase()
        .split(/\s+/)
        .includes('canonical')
    ) {
      return getAttribute(tag, 'href');
    }
  }

  return undefined;
}

function normalizePublicUrl(value) {
  const url = new URL(value);

  url.search = '';
  url.hash = '';

  return url.toString();
}

async function verify() {
  const rawUrl =
    process.argv[3];

  const expectedTitle =
    process.argv
      .slice(4)
      .join(' ')
      .trim();

  if (!rawUrl) {
    fail(
      'informe a URL: ' +
      './scripts/hitda verify <url> [expected title] [expected title]',
    );
  }

  let requestedUrl;

  try {
    requestedUrl =
      new URL(rawUrl);
  } catch {
    fail(`URL inválida: ${rawUrl}`);
  }

  const response =
    await fetch(requestedUrl, {
      redirect: 'follow',

      headers: {
        'cache-control': 'no-cache',
      },

      signal:
        AbortSignal.timeout(20000),
    });

  if (!response.ok) {
    fail(
      `resposta HTTP inesperada: ${response.status}`,
    );
  }

  const html =
    await response.text();

  const finalUrl =
    normalizePublicUrl(response.url);

  if (
    !/<html\b[^>]*\blang=["']en["']/i.test(
      html,
    )
  ) {
    fail(
      'atributo lang="en" não encontrado.',
    );
  }

  if (!html.includes(siteName)) {
    fail(
      'nome do projeto não encontrado no HTML.',
    );
  }

  const documentTitle =
    getElementText(html, 'title');

  if (!documentTitle) {
    fail('elemento <title> não encontrado.');
  }

  if (!documentTitle.includes(siteName)) {
    fail(
      'o título SEO não contém o nome do site.',
    );
  }

  const canonical =
    getCanonical(html);

  if (!canonical) {
    fail('canonical não encontrado.');
  }

  const normalizedCanonical =
    normalizePublicUrl(canonical);

  if (normalizedCanonical !== finalUrl) {
    fail(
      'canonical divergente:\n' +
      `Esperado: ${finalUrl}\n` +
      `Encontrado: ${normalizedCanonical}`,
    );
  }

  const ogTitle =
    getMetaContent(
      html,
      'property',
      'og:title',
    );

  if (!ogTitle) {
    fail(
      'og:title não encontrado.',
    );
  }

  const twitterTitle =
    getMetaContent(
      html,
      'name',
      'twitter:title',
    );

  if (!twitterTitle) {
    fail(
      'twitter:title não encontrado.',
    );
  }

  if (
    twitterTitle !== ogTitle
  ) {
    fail(
      'twitter:title não corresponde ao og:title.',
    );
  }

  const ogDescription =
    getMetaContent(
      html,
      'property',
      'og:description',
    );

  const twitterDescription =
    getMetaContent(
      html,
      'name',
      'twitter:description',
    );

  if (
    !ogDescription ||
    !twitterDescription ||
    ogDescription !==
      twitterDescription
  ) {
    fail(
      'descrições sociais ausentes ou divergentes.',
    );
  }

  const ogUrl =
    getMetaContent(
      html,
      'property',
      'og:url',
    );

  if (
    !ogUrl ||
    normalizePublicUrl(ogUrl) !==
      normalizedCanonical
  ) {
    fail(
      'og:url não corresponde ao canonical.',
    );
  }

  const robots =
    getMetaContent(
      html,
      'name',
      'robots',
    );

  if (
    robots
      ?.toLowerCase()
      .includes('noindex')
  ) {
    fail(
      'a página publicada contém noindex.',
    );
  }

  const ogType =
    getMetaContent(
      html,
      'property',
      'og:type',
    );

  if (
    ogType === 'article'
  ) {
    const hasJsonLd =
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i
        .test(html);

    const hasArticleNode =
      html.includes(
        '"@type":"Article"',
      );

    if (
      !hasJsonLd ||
      !hasArticleNode
    ) {
      fail(
        'structured data Article não encontrado na página publicada.',
      );
    }
  }

  let heading;

  if (expectedTitle) {
    heading =
      getElementText(html, 'h1');

    if (!heading) {
      fail('elemento <h1> não encontrado.');
    }

    if (heading !== expectedTitle) {
      fail(
        'título público divergente:\n' +
        `Esperado: ${expectedTitle}\n` +
        `Encontrado: ${heading}`,
      );
    }
  }

  console.log('');
  console.log('Verificação remota aprovada.');
  console.log(`URL: ${finalUrl}`);
  console.log(`HTTP: ${response.status}`);
  console.log('Idioma: en');
  console.log(`Título SEO: ${documentTitle}`);

  if (heading) {
    console.log(`Título público: ${heading}`);
  }

  console.log(
    `Canonical: ${normalizedCanonical}`,
  );

  console.log(
    'Metadados sociais: OK',
  );

  if (ogType === 'article') {
    console.log(
      'Structured data Article: OK',
    );
  }

  console.log(
    'Indexação permitida: OK',
  );
}

async function main() {
  const command = process.argv[2] ?? 'help';

  switch (command) {
    case 'check':
      check();
      return;

    case 'audit':
      await audit();
      return;

    case 'inventory': {
      const {
        printEditorialInventory,
      } = await import('./editorial-inventory.mjs');

      printEditorialInventory(root);
      return;
    }

    case 'new': {
      const {
        createArticleDraft,
      } = await import('./editorial-new.mjs');

      try {
        createArticleDraft(
          process.argv.slice(3),
          root,
        );
      } catch (error) {
        fail(
          error instanceof Error
            ? error.message
            : String(error),
        );
      }

      return;
    }

    case 'publish': {
      const {
        publishArticle,
      } = await import('./editorial-publish.mjs');

      try {
        await publishArticle(
          process.argv.slice(3),
          root,
        );
      } catch (error) {
        fail(
          error instanceof Error
            ? error.message
            : String(error),
        );
      }

      return;
    }

    case 'publish-batch': {
      const {
        publishArticleBatch,
      } = await import('./editorial-publish-batch.mjs');

      try {
        await publishArticleBatch(
          process.argv.slice(3),
          root,
        );
      } catch (error) {
        fail(
          error instanceof Error
            ? error.message
            : String(error),
        );
      }

      return;
    }

    case 'verify':
      await verify();
      return;

    case 'help':
      console.log(`
HITDA operational interface

Available:
  ./scripts/hitda check
  ./scripts/hitda audit
  ./scripts/hitda inventory
  ./scripts/hitda new <type> <slug or subject>
  ./scripts/hitda publish <slug> [--local]
  ./scripts/hitda publish-batch <slug> <slug>... [--local]
  ./scripts/hitda verify <url> [expected title]
`);
      return;

    default:
      fail(`comando desconhecido: ${command}`);
  }
}

await main();
