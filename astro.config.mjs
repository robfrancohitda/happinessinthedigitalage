// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const site = 'https://www.happinessinthedigitalage.digital';

export default defineConfig({
  site,
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/404.html'),
    }),
  ],
});
