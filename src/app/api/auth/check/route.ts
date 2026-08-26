import { NextResponse } from 'next/server';
import { getAuthenticatedPartner } from '@/lib/auth';

export async function GET() {
  const partner = await getAuthenticatedPartner();

  if (!partner) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true, partner });
}
