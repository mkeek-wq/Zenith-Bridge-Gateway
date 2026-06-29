export type Article = {
  id: number;

  title: string;
  excerpt?: string;
  content: string;

  coverImage?: string;

  published: boolean;
  publishedAt?: string;

  author: string;

  country?: string;   // NEW
  category?: string;  // NEW (tax, grants, etc.)

  createdAt?: string;
  updatedAt?: string;
};
