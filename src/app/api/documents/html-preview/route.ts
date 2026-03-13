import { NextRequest, NextResponse } from "next/server";

function isAllowedPreviewUrl(url: URL): boolean {
  const isSupabaseHost = url.hostname.endsWith(".supabase.co");
  const isStoragePath = url.pathname.includes("/storage/v1/object/");
  return isSupabaseHost && isStoragePath;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get("url");

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: "Missing url query param" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid preview URL" },
        { status: 400 }
      );
    }

    if (!isAllowedPreviewUrl(parsedUrl)) {
      return NextResponse.json(
        { success: false, error: "Preview URL is not allowed" },
        { status: 403 }
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch preview document: HTTP ${response.status}`,
        },
        { status: 502 }
      );
    }

    const html = await response.text();

    return NextResponse.json(
      {
        success: true,
        data: {
          html,
          contentType: response.headers.get("content-type") || null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[HTML Preview API Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
