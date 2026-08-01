import { z } from 'astro/zod';

import { commercialPlacements } from '../lib/commercial';

export const sourceSchema = z.object({
  title: z.string().min(2).max(220),
  url: z.url(),
  publisher: z.string().min(2).max(160).optional(),
  publishedAt: z.coerce.date().optional(),
  accessedAt: z.coerce.date().optional(),
});

export const reviewSchema = z.object({
  status: z
    .enum(['not-required', 'pending', 'reviewed'])
    .default('not-required'),
  reviewedBy: z.string().min(2).max(160).optional(),
  reviewedAt: z.coerce.date().optional(),
  lastFactChecked: z.coerce.date().optional(),
  evidenceLevel: z
    .enum(['not-applicable', 'general', 'supported', 'strong'])
    .default('not-applicable'),
  medicalDisclaimer: z.boolean().default(false),
  claimsReviewed: z.boolean().default(false),
});

export const commercialArticleSchema = z.object({
  primaryProductId: z.string().min(2).max(120).optional(),
  relatedProductIds: z.array(z.string().min(2).max(120)).default([]),
  campaignIds: z.array(z.string().min(2).max(120)).default([]),
  allowGlobalCampaigns: z.boolean().default(true),
  placements: z
    .array(z.enum(commercialPlacements))
    .default([
      'article-after-intro',
      'article-midpoint',
      'article-after-content',
    ]),
});
