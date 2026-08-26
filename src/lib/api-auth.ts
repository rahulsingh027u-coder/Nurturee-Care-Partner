import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedPartner } from './auth';

export async function requirePartnerAuth(req: NextRequest) {
  const partner = await getAuthenticatedPartner();

  if (!partner) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required. Please login again.' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, partner };
}
