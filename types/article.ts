export interface Article {
  id: string;
  title: string;
  image: string; // URL or path
  content: string;
  category: string;
  createdAt: string; // ISO date
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string | null;
}
