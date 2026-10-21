import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // ─── BLOCK IN PRODUCTION ───
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Demo setup is disabled in production' },
      { status: 403 }
    );
  }

  // Development-only: you can keep the original logic here if needed for local dev
  // But for production safety, even in dev we should require a dev secret
  const devSecret = req.headers.get('x-dev-secret');
  if (devSecret !== process.env.DEV_SETUP_SECRET) {
    return NextResponse.json(
      { success: false, error: 'Invalid dev secret' },
      { status: 403 }
    );
  }

  // If you still want local demo functionality, import and call it here
  // import { db } from '@/lib/db';  // uncomment for local dev
  return NextResponse.json({
    success: false,
    error: 'Demo setup is disabled. Use send-otp with demo phone instead.',
  }, { status: 403 });
}
