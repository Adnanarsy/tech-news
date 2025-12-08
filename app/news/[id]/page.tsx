import Image from "next/image";
import type { Article } from "@/types/article";
import { timeAgo } from "@/lib/time";

async function fetchArticleById(id: string): Promise<Article | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/articles/${id}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function NewsDetail({ params }: { params: { id: string } }) {
  const article = await fetchArticleById(params.id);
  if (!article) {
    return <div className="text-sm text-red-600">Article not found.</div>;
  }
  return (
    <article className="max-w-3xl">
      <h1 className="text-3xl font-extrabold uppercase tracking-tight">{article.title}</h1>
      <p className="mt-2 text-xs text-zinc-500">{timeAgo(article.createdAt)} — {article.category}</p>
      {article.image && (
        <div className="relative w-full aspect-[16/9] my-6 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <Image src={article.image} alt={article.title} fill className="object-cover" />
        </div>
      )}
      <div className="prose prose-zinc dark:prose-invert">
        <p>{article.content}</p>
      </div>
    </article>
  );
}
