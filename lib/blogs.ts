import blogsJson from "@/gethealthcare-blogs.json";

export interface BlogCategory {
    slug: string;
    name: string;
}

export interface BlogTag {
    slug: string;
    name: string;
}

export interface BlogPost {
    id: number;
    title: string;
    slug: string;
    category: BlogCategory;
    categories: BlogCategory[];
    date: string;
    dateDisplay: string;
    modified: string;
    author: string;
    excerpt: string;
    content: string;
    image: string;
    tags: BlogTag[];
}

interface RawCategoryGroup {
    category: BlogCategory;
    items: RawPost[];
    count: number;
}

interface RawPost {
    id: number;
    title: string;
    slug: string;
    link: string;
    date: string;
    modified: string;
    pubDate: string;
    author: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    categories: BlogCategory[];
    tags: BlogTag[];
}

const FALLBACK_IMAGE = "/images/photo-kits4.jpg";

function normalizeFeaturedImage(rawImage?: string | null): string {
    const image = (rawImage || "").trim();
    if (!image) return FALLBACK_IMAGE;

    // Legacy WordPress media URLs frequently return 404 on the current stack.
    // Replace them with a stable fallback so crawlers don't report broken assets.
    if (image.includes("/wp-content/uploads/")) {
        return FALLBACK_IMAGE;
    }

    return image;
}

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function formatDateDisplay(isoLike: string): string {
    const d = new Date(isoLike.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return isoLike;
    return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, "0")}, ${d.getFullYear()}`;
}

function toIsoDate(raw: string): string {
    const d = new Date(raw.replace(" ", "T"));
    return Number.isNaN(d.getTime()) ? raw : d.toISOString();
}

function transformPost(raw: RawPost): BlogPost {
    const primary = raw.categories[0] ?? { slug: "blog", name: "Blog" };
    return {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        category: primary,
        categories: raw.categories,
        date: toIsoDate(raw.date),
        dateDisplay: formatDateDisplay(raw.date),
        modified: toIsoDate(raw.modified),
        author: raw.author,
        excerpt: raw.excerpt,
        content: raw.content,
        image: normalizeFeaturedImage(raw.featuredImage),
        tags: raw.tags ?? [],
    };
}

const ALL_POSTS: BlogPost[] = (blogsJson as { categoriesWithBlogs: RawCategoryGroup[] }).categoriesWithBlogs
    .flatMap((group) => group.items.map(transformPost))
    .sort((a, b) => (a.date < b.date ? 1 : -1));

const POSTS_BY_SLUG = new Map(ALL_POSTS.map((p) => [p.slug, p]));

export function getAllPosts(): BlogPost[] {
    return ALL_POSTS;
}

export function getPostBySlug(slug: string): BlogPost | null {
    return POSTS_BY_SLUG.get(slug) ?? null;
}

export function getPostsByCategory(categorySlug: string): BlogPost[] {
    return ALL_POSTS.filter((p) =>
        p.categories.some((c) => c.slug === categorySlug),
    );
}

export function getPostsByTag(tagSlug: string): BlogPost[] {
    return ALL_POSTS.filter((p) => p.tags.some((t) => t.slug === tagSlug));
}

export function getCategoriesWithCount(): {
    category: BlogCategory;
    count: number;
}[] {
    const groups = (blogsJson as { categoriesWithBlogs: RawCategoryGroup[] })
        .categoriesWithBlogs;
    return groups.map((g) => ({ category: g.category, count: g.count }));
}

export function getCategoryBySlug(slug: string): BlogCategory | null {
    const groups = (blogsJson as { categoriesWithBlogs: RawCategoryGroup[] })
        .categoriesWithBlogs;
    const group = groups.find((g) => g.category.slug === slug);
    return group?.category ?? null;
}

export function getAllTags(): { tag: BlogTag; count: number }[] {
    const counts = new Map<string, { tag: BlogTag; count: number }>();
    for (const post of ALL_POSTS) {
        for (const tag of post.tags) {
            const existing = counts.get(tag.slug);
            if (existing) {
                existing.count += 1;
            } else {
                counts.set(tag.slug, { tag, count: 1 });
            }
        }
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

export function getTagBySlug(slug: string): BlogTag | null {
    for (const post of ALL_POSTS) {
        const found = post.tags.find((t) => t.slug === slug);
        if (found) return found;
    }
    return null;
}

export function getRelatedPosts(post: BlogPost, limit = 2): BlogPost[] {
    return ALL_POSTS.filter(
        (p) => p.slug !== post.slug && p.category.slug === post.category.slug,
    ).slice(0, limit);
}

export function getAdjacentPosts(post: BlogPost): {
    prev: BlogPost | null;
    next: BlogPost | null;
} {
    const sameCategory = ALL_POSTS.filter(
        (p) => p.category.slug === post.category.slug,
    );
    const idx = sameCategory.findIndex((p) => p.slug === post.slug);
    if (idx === -1) return { prev: null, next: null };
    return {
        prev: sameCategory[idx - 1] ?? null,
        next: sameCategory[idx + 1] ?? null,
    };
}

export function getPostUrl(post: Pick<BlogPost, "slug" | "category">): string {
    return `/${post.category.slug}/${post.slug}`;
}

export function getCategoryUrl(slug: string): string {
    return `/category/${slug}`;
}

export function getCategoryPageUrl(slug: string, page: number): string {
    if (page <= 1) return getCategoryUrl(slug);
    return `${getCategoryUrl(slug)}/page/${page}`;
}

export function getTagUrl(slug: string): string {
    return `/tag/${slug}`;
}

export function getTagPageUrl(slug: string, page: number): string {
    if (page <= 1) return getTagUrl(slug);
    return `${getTagUrl(slug)}/page/${page}`;
}

export const POSTS_PER_PAGE = 6;

export interface Paginated<T> {
    items: T[];
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

export function paginate<T>(
    items: T[],
    page: number,
    perPage = POSTS_PER_PAGE,
): Paginated<T> {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;
    return {
        items: items.slice(start, start + perPage),
        currentPage: safePage,
        totalPages,
        totalItems,
    };
}

export function parsePageParam(raw: string | undefined): number {
    if (!raw) return 1;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
}
