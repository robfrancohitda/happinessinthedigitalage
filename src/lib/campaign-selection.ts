import type { CollectionEntry } from 'astro:content';

import {
  commercialPlacements,
  contentTypes,
} from './commercial';

import type {
  EditorialVertical,
} from './editorial-taxonomy';

export type CampaignEntry = CollectionEntry<'campaigns'>;
export type Placement =
  (typeof commercialPlacements)[number];
export type ContentType =
  (typeof contentTypes)[number];
export type CampaignCreative =
  CampaignEntry['data']['creatives'][number];

export interface CampaignContext {
  placement: Placement;
  articleId?: string;
  contentType?: ContentType;
  vertical?: EditorialVertical;
  category?: string;
  topic?: string;
  tags?: string[];
  preferredCampaignIds?: string[];
  allowGlobalCampaigns?: boolean;
}

interface CampaignRank {
  preferred: number;
  relationship: number;
  article: number;
  topic: number;
  category: number;
  vertical: number;
  sharedTags: number;
  contentType: number;
  priority: number;
}

const relationshipRank = {
  exact: 6,
  contextual: 5,
  vertical: 4,
  adjacent: 3,
  global: 2,
  house: 1,
} as const;

function isCampaignCurrentlyActive(
  campaign: CampaignEntry,
  currentDate: Date,
): boolean {
  const {
    status,
    startsAt,
    endsAt,
  } = campaign.data;

  if (status !== 'active') {
    return false;
  }

  if (startsAt && startsAt > currentDate) {
    return false;
  }

  if (endsAt && endsAt < currentDate) {
    return false;
  }

  return true;
}

function countSharedTags(
  campaign: CampaignEntry,
  context: CampaignContext,
): number {
  if (!context.tags?.length) {
    return 0;
  }

  return campaign.data.targeting.tags.filter((tag) =>
    context.tags?.includes(tag),
  ).length;
}

function matchesCampaignContext(
  campaign: CampaignEntry,
  context: CampaignContext,
): boolean {
  const { data } = campaign;
  const { targeting } = data;

  if (!data.placements.includes(context.placement)) {
    return false;
  }

  if (
    context.articleId &&
    targeting.excludedArticleIds.includes(
      context.articleId,
    )
  ) {
    return false;
  }

  if (
    data.relationship === 'global' &&
    context.allowGlobalCampaigns === false
  ) {
    return false;
  }

  const hasTargeting =
    targeting.articleIds.length > 0 ||
    targeting.contentTypes.length > 0 ||
    targeting.verticals.length > 0 ||
    targeting.categories.length > 0 ||
    targeting.topics.length > 0 ||
    targeting.tags.length > 0;

  if (!hasTargeting) {
    return true;
  }

  const matchesArticle =
    Boolean(context.articleId) &&
    targeting.articleIds.includes(
      context.articleId!,
    );

  const matchesContentType =
    Boolean(context.contentType) &&
    targeting.contentTypes.includes(
      context.contentType!,
    );

  const matchesVertical =
    Boolean(context.vertical) &&
    targeting.verticals.includes(
      context.vertical!,
    );

  const matchesCategory =
    Boolean(context.category) &&
    targeting.categories.includes(
      context.category!,
    );

  const matchesTopic =
    Boolean(context.topic) &&
    targeting.topics.includes(
      context.topic!,
    );

  const matchesTags =
    countSharedTags(campaign, context) > 0;

  return (
    matchesArticle ||
    matchesContentType ||
    matchesVertical ||
    matchesCategory ||
    matchesTopic ||
    matchesTags
  );
}

function calculateCampaignRank(
  campaign: CampaignEntry,
  context: CampaignContext,
): CampaignRank {
  const { data, id } = campaign;
  const { targeting } = data;

  return {
    preferred:
      context.preferredCampaignIds?.includes(id)
        ? 1
        : 0,

    relationship:
      relationshipRank[data.relationship],

    article:
      context.articleId &&
      targeting.articleIds.includes(context.articleId)
        ? 1
        : 0,

    topic:
      context.topic &&
      targeting.topics.includes(context.topic)
        ? 1
        : 0,

    category:
      context.category &&
      targeting.categories.includes(
        context.category,
      )
        ? 1
        : 0,

    vertical:
      context.vertical &&
      targeting.verticals.includes(
        context.vertical,
      )
        ? 1
        : 0,

    sharedTags:
      countSharedTags(campaign, context),

    contentType:
      context.contentType &&
      targeting.contentTypes.includes(
        context.contentType,
      )
        ? 1
        : 0,

    priority:
      data.priority,
  };
}

function compareCampaignRanks(
  first: CampaignRank,
  second: CampaignRank,
): number {
  const keys: Array<keyof CampaignRank> = [
    'preferred',
    'relationship',
    'article',
    'topic',
    'category',
    'vertical',
    'sharedTags',
    'contentType',
    'priority',
  ];

  for (const key of keys) {
    const difference =
      second[key] - first[key];

    if (difference !== 0) {
      return difference;
    }
  }

  return 0;
}

function haveEqualRanks(
  first: CampaignRank,
  second: CampaignRank,
): boolean {
  return compareCampaignRanks(first, second) === 0;
}

function createDeterministicNumber(
  seed: string,
): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function selectWeightedCampaign(
  campaigns: CampaignEntry[],
  context: CampaignContext,
): CampaignEntry | undefined {
  if (campaigns.length === 0) {
    return undefined;
  }

  const orderedCampaigns = [...campaigns].sort(
    (first, second) =>
      first.id.localeCompare(second.id),
  );

  const totalWeight = orderedCampaigns.reduce(
    (total, campaign) =>
      total + campaign.data.weight,
    0,
  );

  const seed = [
    context.articleId ?? 'site',
    context.placement,
    context.contentType ?? 'content',
  ].join(':');

  let position =
    createDeterministicNumber(seed) %
    totalWeight;

  for (const campaign of orderedCampaigns) {
    if (position < campaign.data.weight) {
      return campaign;
    }

    position -= campaign.data.weight;
  }

  return orderedCampaigns[0];
}

export function selectCampaign(
  campaigns: CampaignEntry[],
  context: CampaignContext,
  currentDate = new Date(),
): CampaignEntry | undefined {
  const rankedCampaigns = campaigns
    .filter((campaign) =>
      isCampaignCurrentlyActive(
        campaign,
        currentDate,
      ),
    )
    .filter((campaign) =>
      matchesCampaignContext(
        campaign,
        context,
      ),
    )
    .map((campaign) => ({
      campaign,
      rank: calculateCampaignRank(
        campaign,
        context,
      ),
    }))
    .sort((first, second) => {
      const rankDifference =
        compareCampaignRanks(
          first.rank,
          second.rank,
        );

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return first.campaign.id.localeCompare(
        second.campaign.id,
      );
    });

  const highestRank =
    rankedCampaigns[0]?.rank;

  if (!highestRank) {
    return undefined;
  }

  const tiedCampaigns = rankedCampaigns
    .filter(({ rank }) =>
      haveEqualRanks(rank, highestRank),
    )
    .map(({ campaign }) => campaign);

  return selectWeightedCampaign(
    tiedCampaigns,
    context,
  );
}

export function selectCampaignCreative(
  campaign: CampaignEntry,
  placement: Placement,
  articleId?: string,
): CampaignCreative | undefined {
  const creatives = campaign.data.creatives
    .filter((creative) =>
      creative.placement === placement,
    )
    .sort((first, second) =>
      first.id.localeCompare(second.id),
    );

  if (creatives.length === 0) {
    return undefined;
  }

  const seed = [
    articleId ?? 'site',
    campaign.id,
    placement,
  ].join(':');

  const index =
    createDeterministicNumber(seed) %
    creatives.length;

  return creatives[index];
}
