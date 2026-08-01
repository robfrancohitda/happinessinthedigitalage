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

function audit() {
  console.log('\n=== AUDITORIA HITDA ===');

  validateRequiredFiles();
  validateSanitization();

  console.log('Estrutura obrigatória: OK');
  console.log('Sanitização de referências: OK');

  check();

  console.log('\nAuditoria HITDA concluída.');
}

async function verify() {
  const baseUrl = process.argv[3];

  if (!baseUrl) {
    fail('informe a URL: ./scripts/hitda verify https://exemplo.pages.dev');
  }

  const url = new URL('/', baseUrl);
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    fail(`resposta HTTP inesperada: ${response.status}`);
  }

  const html = await response.text();

  if (!html.includes('<html lang="en"')) {
    fail('atributo lang="en" não encontrado no HTML publicado');
  }

  if (!html.includes('Happiness in the Digital Age')) {
    fail('nome do projeto não encontrado no HTML publicado');
  }

  console.log(`Verificação remota aprovada: ${response.url}`);
}

async function main() {
  const command = process.argv[2] ?? 'help';

  switch (command) {
    case 'check':
      check();
      return;

    case 'audit':
      audit();
      return;

    case 'verify':
      await verify();
      return;

    case 'help':
      console.log(`
HITDA operational interface

Available:
  ./scripts/hitda check
  ./scripts/hitda audit
  ./scripts/hitda verify <url>

Reserved for the editorial module:
  ./scripts/hitda new
  ./scripts/hitda publish
`);
      return;

    default:
      fail(`comando desconhecido: ${command}`);
  }
}

await main();
