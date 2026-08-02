interface ArticleBodySegments {
  beforeInline: string;
  betweenAds: string;
  afterVisual: string;
  insertInline: boolean;
  insertVisual: boolean;
}

const eligibleTopLevelTags = new Set([
  'p',
  'ul',
  'ol',
  'blockquote',
  'table',
  'figure',
  'pre',
  'section',
  'div',
]);

const voidTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

function findTopLevelBoundaries(
  html: string,
): number[] {
  const boundaries: number[] = [];
  const stack: string[] = [];

  const tagPattern =
    /<!--[\s\S]*?-->|<![^>]*>|<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?\/?>/g;

  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(html)) !== null) {
    const token = match[0];
    const tagName = match[1]?.toLowerCase();

    if (!tagName) {
      continue;
    }

    const isClosing = token.startsWith('</');
    const isSelfClosing =
      token.endsWith('/>') ||
      voidTags.has(tagName);

    if (isClosing) {
      if (stack.length > 0) {
        stack.pop();
      }

      if (
        stack.length === 0 &&
        eligibleTopLevelTags.has(tagName)
      ) {
        boundaries.push(tagPattern.lastIndex);
      }

      continue;
    }

    if (isSelfClosing) {
      if (
        stack.length === 0 &&
        eligibleTopLevelTags.has(tagName)
      ) {
        boundaries.push(tagPattern.lastIndex);
      }

      continue;
    }

    stack.push(tagName);
  }

  return [...new Set(boundaries)]
    .filter(
      (boundary) =>
        boundary > 0 &&
        boundary < html.length,
    )
    .sort((first, second) => first - second);
}

function findNearestBoundaryIndex(
  boundaries: number[],
  target: number,
  minimumIndex: number,
  maximumIndex: number,
): number {
  let selectedIndex = minimumIndex;
  let selectedDistance = Number.POSITIVE_INFINITY;

  for (
    let index = minimumIndex;
    index <= maximumIndex;
    index += 1
  ) {
    const distance = Math.abs(
      boundaries[index] - target,
    );

    if (distance < selectedDistance) {
      selectedIndex = index;
      selectedDistance = distance;
    }
  }

  return selectedIndex;
}

export function splitArticleBodyHtml(
  html: string,
): ArticleBodySegments {
  const boundaries =
    findTopLevelBoundaries(html);

  if (boundaries.length < 2) {
    return {
      beforeInline: html,
      betweenAds: '',
      afterVisual: '',
      insertInline: false,
      insertVisual: false,
    };
  }

  if (boundaries.length === 2) {
    const inlineBoundary = boundaries[0];

    return {
      beforeInline: html.slice(0, inlineBoundary),
      betweenAds: html.slice(inlineBoundary),
      afterVisual: '',
      insertInline: true,
      insertVisual: false,
    };
  }

  const inlineIndex =
    findNearestBoundaryIndex(
      boundaries,
      html.length * 0.33,
      0,
      boundaries.length - 3,
    );

  const visualIndex =
    findNearestBoundaryIndex(
      boundaries,
      html.length * 0.62,
      inlineIndex + 1,
      boundaries.length - 2,
    );

  const inlineBoundary =
    boundaries[inlineIndex];

  const visualBoundary =
    boundaries[visualIndex];

  return {
    beforeInline:
      html.slice(0, inlineBoundary),

    betweenAds:
      html.slice(
        inlineBoundary,
        visualBoundary,
      ),

    afterVisual:
      html.slice(visualBoundary),

    insertInline: true,
    insertVisual: true,
  };
}
