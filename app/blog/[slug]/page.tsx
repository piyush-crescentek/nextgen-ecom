import { permanentRedirect } from "next/navigation";
import { getPostBySlug, getPostUrl } from "@/lib/blogs";

export default async function LegacyBlogSlugRedirect({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getPostBySlug(slug);
    if (!post) permanentRedirect("/blog");
    permanentRedirect(getPostUrl(post));
}
