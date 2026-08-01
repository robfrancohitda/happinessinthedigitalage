import { z } from 'astro/zod';

import { productStatuses } from '../lib/commercial';

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  status: z.enum(productStatuses),

  network: z.string().min(2).max(80),
  vendor: z.string().min(2).max(120).optional(),

  publicSummary: z.string().min(30).max(500),
  destinationUrl: z.url(),

  verticals: z.array(z.string().min(2).max(80)).default([]),
  categories: z.array(z.string().min(2).max(80)).default([]),
  topics: z.array(z.string().min(2).max(100)).default([]),

  audience: z.array(z.string().min(5).max(180)).default([]),
  benefits: z.array(z.string().min(5).max(220)).default([]),
  cautions: z.array(z.string().min(5).max(220)).default([]),

  disclosureText: z.string().max(240).optional(),
  trackingParameter: z.string().min(1).max(40).optional(),

  creativeIds: z.array(z.string().min(2).max(120)).default([]),
});
