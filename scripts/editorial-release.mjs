import {
  relative,
  sep,
} from 'node:path';

import {
  spawnSync,
} from 'node:child_process';

const productionBaseUrl =
  'https://www.happinessinthedigitalage.digital';

function normalizePath(path) {
  return path.split(sep).join('/');
}

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

function capture(command, args, root) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    shell: false,
  });

  if (result.status !== 0) {
    throw new Error(
      result.stderr.trim() ||
      `comando falhou: ${command} ${args.join(' ')}`,
    );
  }

  return result.stdout.trim();
}

function hasStagedChanges(root) {
  const result = spawnSync(
    'git',
    ['diff', '--cached', '--quiet'],
    {
      cwd: root,
      stdio: 'ignore',
      shell: false,
    },
  );

  if (result.status === 0) {
    return false;
  }

  if (result.status === 1) {
    return true;
  }

  throw new Error(
    'não foi possível verificar o índice do Git.',
  );
}

function getChangedPaths(root) {
  const output = capture(
    'git',
    [
      '-c',
      'core.quotepath=false',
      'status',
      '--porcelain=v1',
      '--untracked-files=all',
    ],
    root,
  );

  if (!output) {
    return [];
  }

  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const path = line.slice(3).trim();

      if (path.includes(' -> ')) {
        return path.split(' -> ').at(-1);
      }

      return path;
    });
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export function prepareArticleRelease({
  root,
  articlePath,
  assetPaths,
}) {
  const branch = capture(
    'git',
    ['branch', '--show-current'],
    root,
  );

  if (branch !== 'main') {
    throw new Error(
      `a publicação exige a branch main. Branch atual: ${branch}`,
    );
  }

  if (hasStagedChanges(root)) {
    throw new Error(
      'existem alterações já adicionadas ao índice do Git.',
    );
  }

  run(
    'git',
    ['fetch', 'origin', 'main'],
    root,
  );

  const localCommit = capture(
    'git',
    ['rev-parse', 'HEAD'],
    root,
  );

  const remoteCommit = capture(
    'git',
    ['rev-parse', 'origin/main'],
    root,
  );

  if (localCommit !== remoteCommit) {
    throw new Error(
      'a branch local não está sincronizada com origin/main.',
    );
  }

  const allowedPaths = new Set(
    [
      articlePath,
      ...assetPaths,
    ].map((absolutePath) =>
      normalizePath(
        relative(root, absolutePath),
      ),
    ),
  );

  const changedPaths =
    getChangedPaths(root);

  const unexpectedPaths =
    changedPaths.filter(
      (path) => !allowedPaths.has(path),
    );

  if (unexpectedPaths.length > 0) {
    throw new Error(
      'existem alterações fora do artigo e de seus assets:\n' +
      unexpectedPaths.join('\n'),
    );
  }

  const articleRelativePath =
    normalizePath(
      relative(root, articlePath),
    );

  if (!changedPaths.includes(articleRelativePath)) {
    throw new Error(
      'o artigo não possui alterações para publicar.',
    );
  }
}

async function verifyPublishedArticle({
  section,
  slug,
  title,
  commit,
}) {
  const publicUrl = new URL(
    `/${section}/${slug}/`,
    productionBaseUrl,
  );

  const expectedTitles = [
    title,
    escapeHtml(title),
  ];

  const attempts = 30;

  for (
    let attempt = 1;
    attempt <= attempts;
    attempt += 1
  ) {
    const verificationUrl =
      new URL(publicUrl);

    verificationUrl.searchParams.set(
      'deploy',
      commit,
    );

    verificationUrl.searchParams.set(
      'attempt',
      String(attempt),
    );

    try {
      const response = await fetch(
        verificationUrl,
        {
          redirect: 'follow',

          headers: {
            'cache-control': 'no-cache',
          },

          signal:
            AbortSignal.timeout(20000),
        },
      );

      if (response.ok) {
        const html =
          await response.text();

        const titleFound =
          expectedTitles.some(
            (expectedTitle) =>
              html.includes(expectedTitle),
          );

        if (titleFound) {
          return publicUrl.toString();
        }
      }
    } catch {
      // O deploy pode estar temporariamente indisponível.
    }

    if (attempt < attempts) {
      console.log(
        `Deploy ainda não confirmado (${attempt}/${attempts}).`,
      );

      await wait(10000);
    }
  }

  throw new Error(
    'o commit foi enviado, mas a página não foi confirmada no domínio ' +
    `dentro do prazo. Verifique: ${publicUrl}`,
  );
}

export async function releaseArticle({
  root,
  slug,
  title,
  section,
  articlePath,
  assetPaths,
}) {
  const files = [
    articlePath,
    ...assetPaths,
  ].map((absolutePath) =>
    normalizePath(
      relative(root, absolutePath),
    ),
  );

  run(
    'git',
    [
      'add',
      '--',
      ...files,
    ],
    root,
  );

  run(
    'git',
    [
      'diff',
      '--cached',
      '--check',
    ],
    root,
  );

  if (!hasStagedChanges(root)) {
    throw new Error(
      'nenhuma alteração foi preparada para o commit.',
    );
  }

  run(
    'git',
    [
      'commit',
      '-m',
      `feat: publish ${slug}`,
    ],
    root,
  );

  const commit = capture(
    'git',
    [
      'rev-parse',
      '--short',
      'HEAD',
    ],
    root,
  );

  run(
    'git',
    [
      'push',
      'origin',
      'main',
    ],
    root,
  );

  console.log('');
  console.log(
    `Commit enviado: ${commit}`,
  );

  const publicUrl =
    await verifyPublishedArticle({
      section,
      slug,
      title,
      commit,
    });

  return {
    commit,
    publicUrl,
  };
}
