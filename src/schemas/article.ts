import { z } from 'astro/zod';

import { contentTypes } from '../lib/commercial';
import { articleHeroSchema } from './media';
import {
  commercialArticleSchema,
  reviewSchema,
  sourceSchema,
} from './shared';

export const articleSchema = z.object({
  title: z.string().min(10).max(110),
  description: z.string().min(40).max(180),
  answerSummary: z.string().min(40).max(600),

  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),

  contentType: z.enum(contentTypes),
  vertical: z.string().min(2).max(80),
  category: z.string().min(2).max(80),
  topic: z.string().min(2).max(100).optional(),
  tags: z.array(z.string().min(2).max(60)).default([]),

  primaryIntent: z.string().min(5).max(180).optional(),
  audience: z.array(z.string().min(5).max(180)).default([]),

  authorId: z
    .string()
    .min(2)
    .max(100)
    .default('hitda-editorial-team'),

  draft: z.boolean().default(true),
  featured: z.boolean().default(false),

  hero: articleHeroSchema.optional(),

  seoTitle: z.string().max(70).optional(),
  socialTitle: z.string().max(90).optional(),
  socialDescription: z.string().max(200).optional(),

  keyTakeaways: z
    .array(z.string().min(10).max(280))
    .max(10)
    .default([]),

  faq: z
    .array(
      z.object({
        question: z.string().min(8).max(200),
        answer: z.string().min(20).max(1400),
      }),
    )
    .max(12)
    .default([]),

  sources: z.array(sourceSchema).default([]),

  contentRisk: z
    .enum(['low', 'moderate', 'high'])
    .default('low'),

  review: reviewSchema.default({
    status: 'not-required',
    evidenceLevel: 'not-applicable',
    medicalDisclaimer: false,
    claimsReviewed: false,
  }),

  commercial: commercialArticleSchema.default({
    relatedProductIds: [],
    campaignIds: [],
    allowGlobalCampaigns: true,
    placements: [
      'article-masthead',
      'article-inline-text',
      'article-visual-card',
      'article-final-banner',
    ],
  }),
}).superRefine((article, context) => {
  if (!article.draft && !article.hero) {
    context.addIssue({
      code: 'custom',
      path: ['hero'],
      message:
        'Published articles require desktop and mobile hero images.',
    });
  }
});
