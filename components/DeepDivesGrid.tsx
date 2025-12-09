"use client";
import type { Article } from "@/types/article";
import ArticleCard from "./ArticleCard";

// Masonry via CSS columns: eliminates vertical gaps while preserving asymmetry
export default function DeepDivesGrid({ items }: { items: Article[] }) {
  return (
    <div className="md:columns-2 md:gap-x-6">
      {items.map((a) => {
        const aspect = a.orientation === "portrait" ? "portrait" : "landscape";
        return (
          <div
            key={a.id}
            className="mb-6 break-inside-avoid pb-4 border-b"
            style={{ borderColor: "var(--divider-color)" }}
          >
            <ArticleCard
              article={a}
              aspect={aspect as any}
              sizes="(min-width: 1024px) 20vw, (min-width: 768px) 40vw, 100vw"
            />
          </div>
        );
      })}
    </div>
  );
}
