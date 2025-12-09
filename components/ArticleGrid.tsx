"use client";
import ArticleCard from "./ArticleCard";
import type { Article } from "@/types/article";

export default function ArticleGrid({
  items,
  trendingColor = false,
  hideTime = false,
  sizes,
  overlay = false,
  firstLarge = false,
}: {
  items: Article[];
  trendingColor?: boolean;
  hideTime?: boolean;
  sizes?: string;
  overlay?: boolean;
  firstLarge?: boolean;
}) {
  return (
    <div className="divide-y" style={{ borderColor: "var(--divider-color)" }}>
      {items.map((a, i) => (
        <div key={a.id} className="py-4">
          <ArticleCard
            article={a}
            trendingColor={trendingColor}
            hideTime={hideTime}
            sizes={sizes}
            overlay={overlay}
            size={firstLarge && i === 0 ? "lg" : "md"}
          />
        </div>
      ))}
    </div>
  );
}
