import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/*
 * Schema técnico inicial.
 *
 * Categorias, tipos editoriais e mecânica de inserção de ofertas
 * ainda serão consolidados no módulo editorial.
 */
const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
  }),
  schema: z.object({
    title: z.string().min(10).max(110),
    description: z.string().min(40).max(180),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),

    category: z.string().min(2).max(80),
    contentType: z.string().min(2).max(40),
    author: z.string().default('Happiness in the Digital Age'),

    tags: z.array(z.string().min(2).max(60)).default([]),
    draft: z.boolean().default(true),
    featured: z.boolean().default(false),

    image: z.string().optional(),
    imageAlt: z.string().optional(),

    seoTitle: z.string().max(70).optional(),
    socialTitle: z.string().max(90).optional(),
    socialDescription: z.string().max(200).optional(),

    affiliateProducts: z.array(z.string().min(2).max(100)).default([]),

    contentRisk: z.enum(['low', 'moderate', 'high']).default('low'),
    reviewStatus: z
      .enum(['not-required', 'pending', 'reviewed'])
      .default('not-required'),
    reviewedBy: z.string().optional(),
    medicalDisclaimer: z.boolean().default(false),
    evidenceLevel: z
      .enum(['not-applicable', 'general', 'supported', 'strong'])
      .default('not-applicable'),
    sources: z
      .array(
        z.object({
          title: z.string().min(2).max(200),
          url: z.string().url(),
        }),
      )
      .default([]),
    claimsReviewed: z.boolean().default(false),
    lastFactChecked: z.coerce.date().optional(),
  }),
});

export const collections = { articles };
