import type { CollectionEntry } from 'astro:content';

import type { commercialPlacements } from './commercial';

type CampaignEntry = CollectionEntry<'campaigns'>;
type Placement = (typeof commercialPlacements)[number];

interface CampaignContext {
  placement: Placement;
  articleId?: string;
  vertical?: string;
  category?: string;
  topic?: string;
  preferredCampaignIds?: string[];
  allowGlobalCampaigns?: boolean;
}

function isCampaignCurrentlyActive(
  campaign: CampaignEntry,
  currentDate: Date,
): boolean {
  const { status, startsAt, endsAt } = campaign.data;

  if (status !== 'active') return false;
  if (startsAt && startsAt > currentDate) return false;
  if (endsAt && endsAt < currentDate) return false;

  return true;
}

function calculateCampaignScore(
  campaign: CampaignEntry,
  context: CampaignContext,
): number {
  const { data, id } = campaign;
  const { targeting } = data;

  let score = data.priority;

  if (context.preferredCampaignIds?.includes(id)) {
    score += 10_000;
  }

  if (
    context.vertical &&
    targeting.verticals.includes(context.vertical)
  ) {
    score += 300;
  }

  if (
    context.category &&
    targeting.categories.includes(context.category)
  ) {
    score += 200;
  }

  if (
    context.topic &&
    targeting.topics.includes(context.topic)
  ) {
    score += 100;
  }

  const relationshipScores = {
    contextual: 50,
    vertical: 40,
    adjacent: 30,
    global: 10,
    house: 5,
  } as const;

  score += relationshipScores[data.relationship];

  return score;
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
    targeting.excludedArticleIds.includes(context.articleId)
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
    targeting.verticals.length > 0 ||
    targeting.categories.length > 0 ||
    targeting.topics.length > 0;

  if (!hasTargeting) {
    return true;
  }

  const matchesVertical =
    Boolean(context.vertical) &&
    targeting.verticals.includes(context.vertical!);

  const matchesCategory =
    Boolean(context.category) &&
    targeting.categories.includes(context.category!);

  const matchesTopic =
    Boolean(context.topic) &&
    targeting.topics.includes(context.topic!);

  return matchesVertical || matchesCategory || matchesTopic;
}

export function selectCampaign(
  campaigns: CampaignEntry[],
  context: CampaignContext,
  currentDate = new Date(),
): CampaignEntry | undefined {
  return campaigns
    .filter((campaign) =>
      isCampaignCurrentlyActive(campaign, currentDate),
    )
    .filter((campaign) =>
      matchesCampaignContext(campaign, context),
    )
    .sort((first, second) => {
      const scoreDifference =
        calculateCampaignScore(second, context) -
        calculateCampaignScore(first, context);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      return first.id.localeCompare(second.id);
    })[0];
}
