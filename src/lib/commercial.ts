export const contentTypes = [
  'guide',
  'explainer',
  'review',
  'comparison',
  'resource',
] as const;

export const offerRelationships = [
  'exact',
  'contextual',
  'vertical',
  'adjacent',
  'global',
  'house',
] as const;

export const campaignKinds = [
  'affiliate',
  'house',
  'direct-sponsor',
  'programmatic',
] as const;

export const campaignCreativeFormats = [
  'text',
  'structured',
  'image',
] as const;

export const commercialPlacements = [
  'article-masthead',
  'article-inline-text',
  'article-visual-card',
  'article-final-banner',
  'article-after-intro',
  'article-inline',
  'article-midpoint',
  'article-after-content',
  'article-sidebar',
  'article-footer',
  'home-hero',
  'home-inline',
  'category-inline',
  'category-sidebar',
] as const;

export const campaignStatuses = [
  'draft',
  'active',
  'paused',
  'expired',
  'archived',
  'retired',
] as const;

export const productStatuses = [
  'draft',
  'active',
  'paused',
  'retired',
] as const;
