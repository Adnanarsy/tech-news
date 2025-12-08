import Image from "next/image";

type NewsPost = {
  id: string;
  title: string;
  content: string;
  imageUrls: string[];
  tags: string[];
  createdAt: string;
};

async function fetchNews(tag?: string): Promise<NewsPost[]> {
  const url = tag ? `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/news?tag=${encodeURIComponent(tag)}` : `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/news`;
  // On the server, fetch relative works; prepend base if provided for SSG compatibility
  const res = await fetch(tag ? `/api/news?tag=${encodeURIComponent(tag)}` : `/api/news`, { next: { revalidate: 30 } });
  if (!res.ok) return [];
  return res.json();
}

export default async function NewsPage({ searchParams }: { searchParams: { tag?: string } }) {
  const tag = searchParams?.tag;
  const news = await fetchNews(tag);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Latest Tech News {tag ? `(tag: ${tag})` : ""}</h1>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {news.map((n) => (
          <li key={n.id} className="rounded border bg-white p-4 shadow-sm">
            {n.imageUrls?.[0] && (
              <div className="mb-3 relative w-full h-48">
                <Image src={n.imageUrls[0]} alt={n.title} fill className="object-cover rounded" />
              </div>
            )}
            <a href={`/news/${n.id}`} className="text-lg font-medium hover:underline">
              {n.title}
            </a>
            <div className="mt-2 line-clamp-3 text-sm text-zinc-600" dangerouslySetInnerHTML={{ __html: n.content }} />
            <div className="mt-3 flex flex-wrap gap-2">
              {n.tags?.map((t) => (
                <a
                  key={t}
                  href={`/news?tag=${encodeURIComponent(t)}`}
                  className="text-xs rounded-full bg-zinc-100 px-2 py-1 hover:bg-zinc-200"
                >
                  #{t}
                </a>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {news.length === 0 && (
        <p className="text-sm text-zinc-600">No news found{tag ? ` for tag "${tag}"` : ""}.</p>
      )}
    </div>
  );
}
