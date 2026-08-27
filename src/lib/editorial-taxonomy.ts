export const editorialVerticals = [
  'work',
  'technology',
  'money',
  'wellbeing',
  'home',
  'relationships',
] as const;

export type EditorialVertical =
  (typeof editorialVerticals)[number];
