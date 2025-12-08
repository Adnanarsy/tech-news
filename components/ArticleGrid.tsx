"use client";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/types/article";

export default function ArticleGrid({ items, trendingColor = false }: { items: Article[]; trendingColor?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {items.map((a) => (
        <ArticleCard key={a.id} article={a} trendingColor={trendingColor} />
      ))}
    </div>
  );
}
