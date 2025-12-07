export type Role = "admin" | "trainer" | "user";

export interface BaseDoc {
  id: string;
  pk: string; // partition key
  createdAt: string; // ISO
  updatedAt: string; // ISO
  type: string; // discriminator
}

export interface User extends BaseDoc {
  type: "user";
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  avatarUrl?: string;
}

export interface NewsPost extends BaseDoc {
  type: "news";
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
  authorId: string;
}

export interface Comment extends BaseDoc {
  type: "comment";
  newsId: string;
  authorId: string;
  content: string;
}

export interface Course extends BaseDoc {
  type: "course";
  title: string;
  description: string;
}

export interface Module extends BaseDoc {
  type: "module";
  courseId: string;
  title: string;
  content: string;
}

export interface InterestScore extends BaseDoc {
  type: "interest";
  userId: string;
  tag: string;
  // store encrypted score as base64 string (paillier-bigint ciphertext is bigint)
  encryptedScore: string;
}
