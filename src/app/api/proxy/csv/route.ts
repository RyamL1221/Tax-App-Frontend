import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_BASE_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL ?? '';

/**
 * GET /api/proxy/csv?url=<cloudfront-csv-url>
 *
 * Proxies CSV fetches through the server to avoid CORS issues.
 * Only allows fetching from the configured CloudFront base URL.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow fetching from our CloudFront distribution
  if (!ALLOWED_BASE_URL || !url.startsWith(ALLOWED_BASE_URL)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      );
    }

    const text = await response.text();

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch CSV' }, { status: 502 });
  }
}
