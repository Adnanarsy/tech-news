export interface Article {
  id: string;
  title: string;
  image: string; // URL or path
  content: string;
  category: string;
  createdAt: string; // ISO date
  // Optional author of the article (for CMS uploads)
  author?: string;
  // Optional list of tags (IDs or names) associated with the article
  tags?: string[];
  // Orientation of the primary image to drive card aspect in Deep Dives
  orientation?: "portrait" | "landscape";
  // Optional short descriptor provided at posting time to help determine layout sizing
  cardDesc?: string;
}

export interface Paginated<T> {
  items: T[];
  nextCursor?: string | null;
}
