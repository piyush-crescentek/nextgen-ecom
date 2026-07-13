import { permanentRedirect } from "next/navigation";
import { getCategoryPageUrl, parsePageParam } from "@/lib/blogs";

const CATEGORY_SLUG = "blood-testing-blogs";

export default async function BloodTestingBlogsPagedRedirect({
    params,
}: {
    params: Promise<{ num: string }>;
}) {
    const { num } = await params;
    const page = parsePageParam(num);
    permanentRedirect(getCategoryPageUrl(CATEGORY_SLUG, page));
}
