import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const partnerId = req.nextUrl.searchParams.get('partnerId');
    if (!partnerId) {
      return NextResponse.json({ success: false, error: 'Partner ID required' }, { status: 400 });
    }

    const verifications = await db.verification.findMany({
      where: { entityType: 'caregiver', entityId: partnerId },
      orderBy: { createdAt: 'desc' },
    });

    const partner = await db.caregiver.findUnique({
      where: { id: partnerId },
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
      partner,
    });
  } catch (error) {
    console.error('Verification status error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch verification status' }, { status: 500 });
  }
}
