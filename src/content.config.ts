import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';

import { articleSchema } from './schemas/article';
import { campaignSchema } from './schemas/campaign';
import { productSchema } from './schemas/product';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './src/content/articles',
  }),
  schema: articleSchema,
});

const products = defineCollection({
  loader: file('src/data/products.json'),
  schema: productSchema,
});

const campaigns = defineCollection({
  loader: file('src/data/campaigns.json'),
  schema: campaignSchema,
});

export const collections = {
  articles,
  products,
  campaigns,
};
