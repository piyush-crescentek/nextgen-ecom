import { permanentRedirect } from "next/navigation";
import { getCategoryUrl } from "@/lib/blogs";

const CATEGORY_SLUG = "blood-testing-blogs";

export default function BloodTestingBlogsRedirect() {
    permanentRedirect(getCategoryUrl(CATEGORY_SLUG));
}
