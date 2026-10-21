import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (() => { throw new Error("JWT_SECRET env var is required"); })()
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these through without auth
  if (
    pathname.startsWith('/api/auth/') ||   // login flow
    pathname.startsWith('/_next') ||       // Next.js internals
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_vercel') ||
    pathname === '/' ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/robots')
  ) {
    return NextResponse.next();
  }

  // Protect ALL API routes
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('nurturee_partner_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    try {
      await jwtVerify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
