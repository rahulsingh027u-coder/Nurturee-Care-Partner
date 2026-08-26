import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerAuth } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  try {
    // ─── AUTH GATE ───
    const auth = await requirePartnerAuth(req);
    if (!auth.authorized) return auth.response;
    const { partner } = auth;

    // Use partner.id from JWT — ignore any partnerId in query params
    const verifications = await db.verification.findMany({
      where: { entityType: 'caregiver', entityId: partner.id },
      orderBy: { createdAt: 'desc' },
    });

    const dbPartner = await db.caregiver.findUnique({
      where: { id: partner.id },
      select: { isVerified: true, aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true },
    });

    return NextResponse.json({
      success: true,
      verifications: verifications.map((v) => ({
        id: v.id,
        status: v.status,
        package: v.package,
        documents: JSON.parse(v.documents || '[]'),
        reviewNotes: v.reviewNotes,
        attemptCount: v.attemptCount,
        isSuspended: v.isSuspended,
        suspensionReason: v.suspensionReason,
        submittedAt: v.createdAt,
        reviewedAt: v.reviewedAt,
      })),
      partner: dbPartner,
    });
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch verification status' }, { status: 500 });
  }
}
