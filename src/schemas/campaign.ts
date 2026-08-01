import { z } from 'astro/zod';

import {
  campaignKinds,
  campaignStatuses,
  commercialPlacements,
  offerRelationships,
} from '../lib/commercial';

export const campaignSchema = z.object({
  name: z.string().min(2).max(160),
  status: z.enum(campaignStatuses),
  kind: z.enum(campaignKinds),

  productId: z.string().min(2).max(120).optional(),
  destinationUrl: z.url(),

  priority: z.number().int().min(0).max(1000).default(100),
  relationship: z.enum(offerRelationships),

  placements: z.array(z.enum(commercialPlacements)).min(1),

  targeting: z
    .object({
      verticals: z.array(z.string().min(2).max(80)).default([]),
      categories: z.array(z.string().min(2).max(80)).default([]),
      topics: z.array(z.string().min(2).max(100)).default([]),
      excludedArticleIds: z
        .array(z.string().min(2).max(160))
        .default([]),
    })
    .default({
      verticals: [],
      categories: [],
      topics: [],
      excludedArticleIds: [],
    }),

  creative: z.object({
    headline: z.string().min(5).max(140),
    body: z.string().min(10).max(500),
    cta: z.string().min(2).max(60),
    image: z.string().optional(),
    alt: z.string().min(5).max(220).optional(),
  }),

  disclosureLabel: z
    .string()
    .min(2)
    .max(40)
    .default('Advertisement'),

  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});
