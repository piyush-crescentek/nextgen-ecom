import { fetchLlmsTxtSeoSettings } from "@/lib/server-api";
import { NextResponse } from "next/server";

export const revalidate = 3600;

export async function GET() {
  const settings = await fetchLlmsTxtSeoSettings();
  const content = settings?.llms_txt?.trim();

  if (!content) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
