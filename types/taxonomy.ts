export interface Tag {
  id: string; // stable identifier, e.g., "ID_01"
  index: number; // fixed slot index in the interest vector (0-based)
  name: string; // human-readable tag name
  active: boolean;
}

export type Confidence = "mention" | "related" | "primary";

export interface ArticleTag {
  id: string;
  articleId: string;
  tagId: string;
  confidence: Confidence;
}
