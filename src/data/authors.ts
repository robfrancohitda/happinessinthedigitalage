export const authors = {
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
} as const;

export type AuthorId = keyof typeof authors;

export function getAuthorName(authorId: string): string {
  return authors[authorId as AuthorId]?.name ?? 'Rob Franco';
}
