export const articleEditorialFlow = [
  'root-context',
  'direct-answer',
  'specific-development',
  'practical-application',
  'derived-questions',
  'references',
] as const;

export const articleHeroFormats = {
  desktop: {
    width: 1600,
    height: 900,
    aspectRatio: '16 / 9',
  },
  mobile: {
    width: 1080,
    height: 1350,
    aspectRatio: '4 / 5',
  },
} as const;

export const articleAdvertisingFormats = {
  masthead: {
    placement: 'article-masthead',
    desktop: {
      width: 1200,
      height: 150,
      aspectRatio: '8 / 1',
    },
    mobile: {
      width: 1080,
      height: 240,
      aspectRatio: '9 / 2',
    },
  },

  inlineText: {
    placement: 'article-inline-text',
    imageRequired: false,
  },

  visualCard: {
    placement: 'article-visual-card',
    desktop: {
      width: 1200,
      height: 675,
      aspectRatio: '16 / 9',
    },
    mobile: {
      width: 1080,
      height: 1350,
      aspectRatio: '4 / 5',
    },
  },

  finalBanner: {
    placement: 'article-final-banner',
    desktop: {
      width: 1200,
      height: 400,
      aspectRatio: '3 / 1',
    },
    mobile: {
      width: 1080,
      height: 540,
      aspectRatio: '2 / 1',
    },
  },
} as const;

export const defaultArticleCommercialPlacements = [
  'article-masthead',
  'article-inline-text',
  'article-visual-card',
  'article-final-banner',
] as const;
