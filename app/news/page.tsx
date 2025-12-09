import { redirect } from "next/navigation";

export default function NewsPage() {
  // Legacy page: redirect to homepage to avoid dead route and inconsistent API
  redirect("/");
}
