import { z } from 'astro/zod';

const desktopHeroSchema = z.object({
  src: z.string().min(1),
  width: z.literal(1600),
  height: z.literal(900),
});

const mobileHeroSchema = z.object({
  src: z.string().min(1),
  width: z.literal(1080),
  height: z.literal(1350),
});

export const articleHeroSchema = z.object({
  desktop: desktopHeroSchema,
  mobile: mobileHeroSchema,
  alt: z.string().min(10).max(220),
  caption: z.string().max(300).optional(),
  credit: z.string().max(160).optional(),
});
