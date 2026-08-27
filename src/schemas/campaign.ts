import { z } from 'astro/zod';

import {
  campaignCreativeFormats,
  campaignKinds,
  campaignStatuses,
  commercialPlacements,
  contentTypes,
  offerRelationships,
} from '../lib/commercial';
import { editorialVerticals } from '../lib/editorial-taxonomy';

const creativeImageSchema = z.object({
  src: z.string().min(1).max(300),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

const responsiveImagesSchema = z.object({
  desktop: creativeImageSchema,
  mobile: creativeImageSchema,
  alt: z.string().min(5).max(220),
});

const campaignCreativeSchema = z
  .object({
    id: z.string().min(2).max(140),

    placement: z.enum(commercialPlacements),
    format: z.enum(campaignCreativeFormats),

    variant: z
      .string()
      .min(1)
      .max(20)
      .default('a'),

    headline: z.string().min(5).max(140).optional(),
    body: z.string().min(10).max(500).optional(),
    cta: z.string().min(2).max(60).optional(),

    images: responsiveImagesSchema.optional(),
  })
  .superRefine((creative, context) => {
    if (
      creative.format === 'text' &&
      (!creative.headline || !creative.body || !creative.cta)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Text creatives require headline, body and CTA.',
      });
    }

    if (
      creative.format === 'structured' &&
      (!creative.headline || !creative.body || !creative.cta)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Structured creatives require headline, body and CTA.',
      });
    }

    if (
      creative.format === 'image' &&
      !creative.images
    ) {
      context.addIssue({
        code: 'custom',
        path: ['images'],
        message:
          'Image creatives require desktop and mobile images.',
      });
    }
  });

const legacyCreativeSchema = z.object({
  headline: z.string().min(5).max(140),
  body: z.string().min(10).max(500),
  cta: z.string().min(2).max(60),
  image: z.string().optional(),
  alt: z.string().min(5).max(220).optional(),
});

const campaignTargetingSchema = z
  .object({
    articleIds: z
      .array(z.string().min(2).max(160))
      .default([]),

    contentTypes: z
      .array(z.enum(contentTypes))
      .default([]),

    verticals: z
      .array(z.enum(editorialVerticals))
      .default([]),

    categories: z
      .array(z.string().min(2).max(80))
      .default([]),

    topics: z
      .array(z.string().min(2).max(100))
      .default([]),

    tags: z
      .array(z.string().min(2).max(100))
      .default([]),

    excludedArticleIds: z
      .array(z.string().min(2).max(160))
      .default([]),
  })
  .default({
    articleIds: [],
    contentTypes: [],
    verticals: [],
    categories: [],
    topics: [],
    tags: [],
    excludedArticleIds: [],
  });

const campaignTrackingSchema = z
  .object({
    subIdParameter: z
      .string()
      .min(1)
      .max(40)
      .optional(),

    campaignParameter: z
      .string()
      .min(1)
      .max(40)
      .optional(),

    appendArticleId: z.boolean().default(true),
    appendPlacement: z.boolean().default(true),
  })
  .default({
    appendArticleId: true,
    appendPlacement: true,
  });

export const campaignSchema = z
  .object({
    name: z.string().min(2).max(160),
    status: z.enum(campaignStatuses),
    kind: z.enum(campaignKinds),

    network: z
      .string()
      .min(2)
      .max(80)
      .optional(),

    productId: z
      .string()
      .min(2)
      .max(120)
      .optional(),

    destinationUrl: z.url(),

    priority: z
      .number()
      .int()
      .min(0)
      .max(1000)
      .default(100),

    weight: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .default(100),

    relationship: z.enum(offerRelationships),

    placements: z
      .array(z.enum(commercialPlacements))
      .min(1),

    targeting: campaignTargetingSchema,

    creatives: z
      .array(campaignCreativeSchema)
      .default([]),

    /*
     * Compatibilidade temporária.
     * Será removida após a migração do AdSlot.
     */
    creative: legacyCreativeSchema,

    disclosureLabel: z
      .string()
      .min(2)
      .max(40)
      .default('Ad'),

    tracking: campaignTrackingSchema,

    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
  })
  .superRefine((campaign, context) => {
    const creativeIds = new Set<string>();

    campaign.creatives.forEach((creative, index) => {
      if (creativeIds.has(creative.id)) {
        context.addIssue({
          code: 'custom',
          path: ['creatives', index, 'id'],
          message: 'Creative IDs must be unique.',
        });
      }

      creativeIds.add(creative.id);

      if (
        !campaign.placements.includes(creative.placement)
      ) {
        context.addIssue({
          code: 'custom',
          path: ['creatives', index, 'placement'],
          message:
            'Creative placement must be listed in campaign placements.',
        });
      }
    });
  });
