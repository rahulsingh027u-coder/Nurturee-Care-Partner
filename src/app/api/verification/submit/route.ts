import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const MAX_DOC_SIZE = 150 * 1024; // 150KB per document

export async function POST(req: NextRequest) {
  try {
    const { partnerId, package: pkg, documents } = await req.json();

    if (!partnerId || !pkg || !documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { success: false, error: 'Partner ID, package type, and documents are required' },
        { status: 400 }
      );
    }

    // Validate document sizes
    for (const doc of documents) {
      const size = doc.size || 0;
      if (size > MAX_DOC_SIZE) {
        return NextResponse.json(
          { success: false, error: `Document "${doc.name || 'Unknown'}" (${Math.round(size / 1024)}KB) exceeds the 150KB limit. Please compress or upload a smaller file.` },
          { status: 400 }
        );
      }
    }

    const existing = await db.verification.findFirst({
      where: { entityType: 'caregiver', entityId: partnerId, package: pkg },
    });

    if (existing) {
      if (existing.isSuspended) {
        return NextResponse.json(
          { success: false, error: 'Account suspended due to multiple rejections', reason: existing.suspensionReason },
          { status: 403 }
        );
      }

      const updated = await db.verification.update({
        where: { id: existing.id },
        data: {
          status: 'resubmitted',
          documents: JSON.stringify(documents),
          attemptCount: existing.attemptCount + 1,
          reviewNotes: null,
          reviewedAt: null,
        },
      });

      return NextResponse.json({ success: true, verification: updated, message: 'Documents resubmitted for review' });
    }

    const verification = await db.verification.create({
      data: {
        entityType: 'caregiver',
        entityId: partnerId,
        status: 'pending',
        package: pkg,
        documents: JSON.stringify(documents),
        attemptCount: 1,
      },
    });

    return NextResponse.json({ success: true, verification, message: 'Documents submitted for review' });
  } catch (error) {
    console.error('Verification submit error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit verification' }, { status: 500 });
  }
}
