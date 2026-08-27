export const authorIds = [
  'rob-franco',
  'claire-bennett',
  'emily-carter',
  'hitda-editorial-team',
] as const;

export type AuthorId = (typeof authorIds)[number];

export const authors: Record<
  AuthorId,
  {
    name: string;
    beats: readonly string[];
  }
> = {
  'rob-franco': {
    name: 'Rob Franco',
    beats: [
      'reviews',
      'comparisons',
      'products',
      'affiliate products',
      'editorial direction',
    ],
  },

  'claire-bennett': {
    name: 'Claire Bennett',
    beats: [
      'work',
      'money',
      'technology',
      'digital life',
      'practical guides',
    ],
  },

  'emily-carter': {
    name: 'Emily Carter',
    beats: [
      'wellbeing',
      'health',
      'relationships',
      'home',
      'lifestyle',
    ],
  },

  'hitda-editorial-team': {
    name: 'HITDA Editorial Team',
    beats: [
      'institutional coverage',
      'cross-vertical explainers',
      'resources',
      'editorial operations',
    ],
  },
};

export function getAuthorName(authorId: AuthorId): string {
  return authors[authorId].name;
}
