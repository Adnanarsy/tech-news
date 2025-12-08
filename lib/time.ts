export function timeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.max(0, now.getTime() - then.getTime());
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes || 1} hours`.replace("hours", minutes === 1 ? "hour ago" : "hours ago");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour ago" : "hours ago"}`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day ago" : "days ago"}`;
}
