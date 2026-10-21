import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedPartner } from './auth';
import { db } from './db';

// Server-side verification gate.
// Checks JWT validity AND that the caregiver is still verified + not suspended.
// This prevents unverified caregivers from accessing /api/bookings, /api/earnings,
// etc. even if they have a valid JWT (e.g., verification was revoked after login).
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

  // Server-side gate: verify the caregiver is still verified + not suspended.
  try {
    const dbPartner = await db.caregiver.findUnique({
      where: { id: partner.id },
      select: { isVerified: true, isSuspended: true, suspensionReason: true },
    });

    if (!dbPartner) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Account not found. Please contact support.' },
          { status: 404 }
        ),
      };
    }

    if (dbPartner.isSuspended) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Account suspended', reason: dbPartner.suspensionReason || 'Contact support' },
          { status: 403 }
        ),
      };
    }

    if (!dbPartner.isVerified) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Verification pending. Please complete your verification to access the dashboard.', code: 'PENDING_VERIFICATION' },
          { status: 403 }
        ),
      };
    }
  } catch (error) {
    console.error('[api-auth] verification check failed:', error);
    // Fail open for DB errors to avoid locking out all partners on DB issues
  }

  return { authorized: true, partner };
}
