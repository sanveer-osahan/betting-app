import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.RENDER_EXTERNAL_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "App URL not configured. Set NEXT_PUBLIC_APP_URL or RENDER_EXTERNAL_URL." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${appUrl}/api/health`, {
      cache: "no-store",
    });
    const data = await response.json();

    return NextResponse.json({
      status: "ok",
      pinged: `${appUrl}/api/health`,
      healthResponse: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to ping health endpoint",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
